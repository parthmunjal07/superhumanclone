import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { generateObject } from 'ai';
import { z } from 'zod';
import { openrouter, sanitizeLongText } from '@/lib/ai';
import { EmailService } from '@/services/email.service';

export async function generateDigestForUser(userId: string) {
  try {
    const listResult = await EmailService.getEmails(userId, 20);
    const recentEmails = listResult.emails || [];

    const emailContext = recentEmails
      .map((e: any) => `From: ${e.from}\nSubject: ${e.subject}\nBody Snippet: ${sanitizeLongText(e.body || e.snippet || '', 150)}`)
      .join('\n\n');

    const prompt = `Analyze the following recent emails for the user's upcoming day.
Generate a structured JSON output representing the Morning Digest.
Include the following keys exactly as specified to match the UI:
- "meetings": array of objects with "id" (number), "title", "time", "attendees" (array of short initials), "color" ("cyan" or "amber"), "notes" (array of strings)
- "actionItems": array of objects with "id" (number), "text", "type" (exactly "reply", "decide", or "delegate"), "from"
- "waitingOn": array of objects with "id" (number), "initials" (2 letters), "name", "text", "sent" (e.g. "2H AGO")
- "fyi": array of objects with "id" (number), "title", "text"
- "focusSuggestion": string

Recent Emails:
${emailContext}

Output ONLY valid JSON with no markdown wrapping. Do not include markdown code block syntax like \`\`\`json.`;

    const { object: parsed } = await generateObject({
      model: openrouter('openrouter/free'),
      prompt,
      schema: z.object({
        meetings: z.array(z.object({
          id: z.number(),
          title: z.string(),
          time: z.string(),
          attendees: z.array(z.string()),
          color: z.enum(['cyan', 'amber', 'purple', 'blue', 'green', 'rose', 'blue', 'pink', 'orange', 'teal', 'emerald', 'fuchsia', 'slate']).optional().default('cyan'),
          notes: z.array(z.string())
        })).optional().default([]),
        actionItems: z.array(z.object({
          id: z.number(),
          text: z.string(),
          type: z.enum(['reply', 'decide', 'delegate']),
          from: z.string()
        })).optional().default([]),
        waitingOn: z.array(z.object({
          id: z.number(),
          initials: z.string(),
          name: z.string(),
          text: z.string(),
          sent: z.string()
        })).optional().default([]),
        fyi: z.array(z.object({
          id: z.number(),
          title: z.string(),
          text: z.string()
        })).optional().default([]),
        focusSuggestion: z.string().optional().default("Focus on clearing your inbox today.")
      })
    });

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `user:${userId}:digest:${today}`;

    // Cache in Redis for quick retrieval (48 hours)
    await redis.set(cacheKey, JSON.stringify(parsed), 'EX', 86400 * 2);

    // Persist in Postgres
    await prisma.digestCache.create({
      data: {
        userId,
        date: new Date(),
        summary: JSON.stringify(parsed),
      },
    });
    return parsed;
  } catch (error) {
    console.error(`Error generating digest for user ${userId}:`, error);
    return null;
  }
}
