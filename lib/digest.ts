import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { generateText } from 'ai';
import { openrouter } from '@/lib/ai';

export async function generateDigestForUser(userId: string) {
  try {
    const recentEmails = await prisma.email.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 20, // Limit for prompt size
    });

    const emailContext = recentEmails
      .map((e) => `From: ${e.from}\nSubject: ${e.subject}\nBody Snippet: ${e.body.substring(0, 150)}`)
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

    const { text } = await generateText({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      prompt,
      maxTokens: 1500,
    } as any);

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `user:${userId}:digest:${today}`;

    try {
      const parsed = JSON.parse(text);
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
    } catch (parseError) {
      console.warn('Failed to parse Claude response as JSON', parseError);
      return null;
    }
  } catch (error) {
    console.error(`Error generating digest for user ${userId}:`, error);
    return null;
  }
}
