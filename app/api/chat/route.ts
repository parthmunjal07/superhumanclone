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

export async function POST(req: NextRequest) {
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

    // Try to get the current authenticated user
    let user = null;
    const token = await getRefreshTokenCookie();
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        user = await prisma.user.findUnique({ where: { id: payload.userId } });
      }
    }

    // Rate Limiting (10 requests per minute per user/IP)
    // const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    // const rateLimitKey = `ratelimit:chat:${user ? user.id : ip}`;
    // const requests = await redis.incr(rateLimitKey);
    // if (requests === 1) {
    //   await redis.expire(rateLimitKey, 60);
    // }
    // if (requests > 10) {
    //   return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
    // }

    // Prepare system prompt parameters
    const userName = user?.name || 'User';
    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const systemPrompt = `You are a highly capable AI assistant inside a Superhuman clone.
User's Name: ${userName}
Current Date: ${dateStr}
Current Time: ${timeStr}

CRITICAL INSTRUCTIONS FOR ACTIONS:
1. When the user asks you to send an email, schedule a meeting, or perform an action, DO NOT just type out a draft or say you did it. 
2. You MUST actually invoke the provided MCP tool (e.g., a send_email or create_event tool) to execute the request.
3. Only type out a plain-text draft if the user explicitly uses the word "draft".
4. AFTER RECEIVING TOOL RESULTS, YOU MUST ALWAYS SYNTHESIZE THE DATA AND PROVIDE A NATURAL LANGUAGE SUMMARY TO THE USER. DO NOT STOP AFTER THE TOOL CALL.

TOOL USAGE RULES:
- When calling get_calendar_events, ALWAYS pass today's date (${dateStr}) as the date parameter
  unless the user specifies a different date.
- Date format must be YYYY-MM-DD (e.g. ${new Date().toISOString().split('T')[0]}).
- Never call tools with empty parameters.`;

    let tools: any = undefined;

    // If the user has a connected Corsair account, fetch the MCP tools
    if (user && user.corsairUserId) {
      const corsairId = user.corsairUserId;
      
      tools = {
        get_calendar_events: tool({
          description: "Fetch the user's Google Calendar events. Defaults to today if no date provided.",
          parameters: z.object({
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

            // Return a slimmed down array of simplified objects so the LLM doesn't choke on huge Google API JSON payloads
            return events.map((e: any) => ({
              title: e.summary || e.title || 'Untitled',
              start: e.start?.dateTime || e.start?.date,
              end: e.end?.dateTime || e.end?.date,
              description: e.description ? "Has description" : "No description"
            }));
          }
        })
      };
    }

    const result = streamText({
      model: mistral('mistral-large-latest'),
      system: systemPrompt,
      messages: coreMessages,
      tools,
      maxSteps: 5, 
      
      onFinish: ({ text, usage }) => {
        console.log('✅ Stream finished — tokens:', usage?.totalTokens);
        console.log('✅ Response preview:', text?.slice(0, 200));
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        // This surfaces the REAL error text to the browser instead of "An error occurred"
        console.error('❌ Stream error:', error);
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (error) {
    console.error('API Agent route error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
