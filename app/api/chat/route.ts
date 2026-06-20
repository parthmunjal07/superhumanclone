import { NextRequest } from 'next/server';
import { streamText, convertToModelMessages, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { createMCPClient } from '@ai-sdk/mcp';
import { mistral } from '@/lib/ai';
import { getCorsairClient } from '@/lib/corsair';
import { prisma } from '@/lib/prisma';
import { getRefreshTokenCookie, verifyToken } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { CalendarService } from '@/services/calendar.service';
import { EmailService } from '@/services/email.service';
import { SendEmailSchema } from '@/schemas/email.schema';
import { calendarEventSchema } from '@/schemas/calendar.schema';

import { requireRole } from '@/lib/rbac';

export const POST = requireRole(['FREE', 'PRO', 'TEAM_MEMBER', 'TEAM_ADMIN'], async (req: NextRequest, { user }: { user: any }) => {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400 });
    }

    // Convert UIMessage[] (from useChat) -> ModelMessage[] (for streamText)
    let coreMessages;
    try {
      coreMessages = await convertToModelMessages(messages);
      console.log('✅ Converted messages:', JSON.stringify(coreMessages, null, 2));
    } catch (err) {
      console.error('❌ convertToModelMessages failed:', err);
      return new Response(JSON.stringify({ error: 'Message conversion failed', detail: String(err) }), { status: 400 });
    }

    // Use the `user` object injected by requireRole

    // Rate Limiting (5 AI calls per day for FREE users)
    const userRole = user?.role || 'FREE';
    if (userRole === 'FREE') {
      const today = new Date().toISOString().split('T')[0];
      const rateLimitKey = `ratelimit:ai:${user.id}:${today}`;
      try {
        const requests = await redis.incr(rateLimitKey);
        if (requests === 1) {
          await redis.expire(rateLimitKey, 86400); // 24 hours
        }
        if (requests > 5) {
          return new Response(JSON.stringify({ error: "You've reached your daily limit of 5 AI requests. Please upgrade or return tomorrow!" }), { status: 429 });
        }
      } catch (redisError) {
        console.warn('Redis rate limiting skipped due to error:', redisError);
      }
    }

    // Prepare system prompt parameters
    const userName = user?.name || 'User';
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const systemPrompt = `You are a highly capable AI assistant inside Meridian.
User's Name: ${userName}
Current Date: ${dateStr}
Current Time: ${timeStr}
Current Timezone: ${tz}

CRITICAL INSTRUCTIONS FOR ACTIONS:
1. When the user asks you to send an email, schedule a meeting, or perform an action, DO NOT just type out a draft or say you did it. 
2. You MUST actually invoke the provided tool (e.g., send_email or create_event) to execute the request.
3. Only type out a plain-text draft if the user explicitly uses the word "draft".
4. AFTER RECEIVING TOOL RESULTS, YOU MUST ALWAYS SYNTHESIZE THE DATA AND PROVIDE A NATURAL LANGUAGE SUMMARY TO THE USER. DO NOT STOP AFTER THE TOOL CALL.
5. YOU HAVE NEW CAPABILITIES: You can SEND EMAILS and CREATE CALENDAR EVENTS with Google Meet links.

TOOL USAGE RULES:
- When calling get_calendar_events, ALWAYS pass today's date (${dateStr}) as the date parameter unless the user specifies a different date. Date format must be YYYY-MM-DD.
- When calling create_event, map conversational times (like "tomorrow at 5pm") to valid ISO 8601 strings taking into account the current date (${dateStr}), time (${timeStr}), and timezone (${tz}).
  Example: "tomorrow at 5pm" must be correctly mapped to the ISO datetime for 17:00:00 in the user's local timezone. The system will automatically inject a Google Meet link and send invites.
- Never call tools with empty parameters.

GUARDRAILS AND BEHAVIORAL LIMITS:
1. You must maintain a professional and respectful tone at all times.
2. DO NOT use or engage with abusive, offensive, explicit, or harmful language under any circumstances. If the user uses such language, politely decline to engage with that content.
3. You are exclusively a productivity assistant for Meridian. DO NOT answer questions or engage in conversations that are unrelated to the user's schedule, emails, tasks, meetings, or general productivity. If asked about unrelated topics, politely redirect the conversation back to their productivity or Meridian's features.`;

    let tools: any = undefined;

    // If the user has a connected Corsair account, fetch the MCP tools
    if (user && user.corsairUserId) {
      const corsairId = user.corsairUserId;
      
      tools = {
        get_calendar_events: tool({
          description: "Fetch the user's Google Calendar events. Defaults to today if no date provided.",
          inputSchema: z.object({
            date: z
              .string()
              .optional()
              .describe('Date in YYYY-MM-DD format. Omit for today.'),
          }),
          execute: async ({ date }): Promise<any> => {
            // Always compute today fresh at call time
            const targetDate = date ?? new Date().toISOString().split('T')[0];

            console.log(`[Agent Tool] Fetching events for ${targetDate}`);

            // Validate the date string before using it
            const parsed = new Date(`${targetDate}T00:00:00.000Z`);
            if (isNaN(parsed.getTime())) {
              return { error: `Invalid date: "${targetDate}". Use YYYY-MM-DD format.` };
            }

            const timeMin = parsed.toISOString();
            const timeMax = new Date(`${targetDate}T23:59:59.999Z`).toISOString();

            const events = await CalendarService.getEvents(corsairId, timeMin, timeMax);
            
            if (!events || events.length === 0) {
              return { summary: "No events found for this date." };
            }

            // Return a stringified payload wrapped in strict instructions to force conversational text
            const slimEvents = events.map((e: any) => ({
              title: e.summary || e.title || 'Untitled',
              start: e.start?.dateTime || e.start?.date,
              end: e.end?.dateTime || e.end?.date,
              description: e.description ? "Has description" : "No description"
            }));

            return `SYSTEM INSTRUCTION: The tool executed successfully. Here is the raw data: ${JSON.stringify(slimEvents)}. 
            CRITICAL: You must now reply to the user in a friendly, conversational tone summarizing this data. DO NOT output raw JSON or code blocks.`;
          }
        }),
        send_email: tool({
          description: "Send an email on behalf of the user.",
          inputSchema: SendEmailSchema,
          execute: async ({ to, subject, body }) => {
            console.log(`[Agent Tool] Sending email to ${to}`);
            try {
              await EmailService.sendEmail(corsairId, { to, subject, body });
              return `SYSTEM INSTRUCTION: Email successfully sent to \${to}. Tell the user the email was sent.`;
            } catch (err: any) {
              return { error: `Failed to send email: \${err.message}` };
            }
          }
        }),
        create_event: tool({
          description: "Create a calendar event and automatically add a Google Meet link.",
          inputSchema: calendarEventSchema,
          execute: async ({ title, start, end, attendees }) => {
            console.log(`[Agent Tool] Creating event: ${title}`);
            try {
              const res = await CalendarService.createEvent(corsairId, {
                title,
                start,
                end,
                attendees: attendees || [],
                addMeetLink: true
              });
              
              if (res.success) {
                 return `SYSTEM INSTRUCTION: Event "\${title}" created successfully with a Google Meet link. The attendees have been notified. Tell the user it was scheduled successfully.`;
              }
              return { error: 'Failed to create event.' };
            } catch (err: any) {
              return { error: `Failed to create event: \${err.message}` };
            }
          }
        })
      };
    }

    const result = streamText({
      model: mistral('mistral-large-latest'),
      system: systemPrompt,
      messages: coreMessages,
      tools,
      stopWhen: stepCountIs(5),
      
      onFinish: ({ text, usage }) => {
        console.log('✅ Stream finished — tokens:', usage?.totalTokens);
        console.log('✅ Response preview:', text?.slice(0, 200));
      },
    });

    // 🚨 FIX: Use the standard Vercel AI SDK UI message stream response
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('❌ Stream error:', error);
        return error instanceof Error ? error.message : String(error);
      },
    });
    
  } catch (error) {
    console.error('API Agent route error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
});
