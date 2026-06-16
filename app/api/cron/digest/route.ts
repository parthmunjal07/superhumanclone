import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { generateText } from 'ai';
import { mistral } from '@/lib/ai';
import { waitUntil } from '@vercel/functions';

const CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret';

async function generateDigestForUser(userId: string) {
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
Include the following keys:
- "meetings": array of objects with "title" and "prepNotes"
- "actionItems": array of objects with "task", "type" (reply/decide/delegate), and "context"
- "waitingOn": array of strings
- "fyi": array of strings
- "focusSuggestion": string

Recent Emails:
${emailContext}

Output ONLY valid JSON with no markdown wrapping.`;

    const { text } = await generateText({
      model: mistral('mistral-small-latest'),
      prompt,
      maxTokens: 1500,
    } as any);

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `user:${userId}:digest:${today}`;

    // Validate if it's parseable JSON before caching
    try {
      JSON.parse(text);
      // Cache in Redis for quick retrieval (e.g. 48 hours)
      // await redis.set(cacheKey, text, 'EX', 86400 * 2);

      // Persist in Postgres
      await prisma.digestCache.create({
        data: {
          userId,
          date: new Date(),
          summary: text,
        },
      });
    } catch (parseError) {
      console.warn('Failed to parse Claude response as JSON', parseError);
    }
  } catch (error) {
    console.error(`Error generating digest for user ${userId}:`, error);
  }
}

async function processAllDigests() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await generateDigestForUser(user.id);
    }
  } catch (error) {
    console.error('Error fetching users for digest:', error);
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run generation in the background so Vercel Cron gets a 200 immediately
  waitUntil(processAllDigests());

  return NextResponse.json({ success: true, message: 'Digest generation started' });
}
