import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { generateEmbedding, openrouter, sanitizeLongText } from '@/lib/ai';
import { waitUntil } from '@vercel/functions';
import { generateText } from 'ai';

const WEBHOOK_SECRET = process.env.CORSAIR_WEBHOOK_SECRET || 'test-secret';

// The background job logic using waitUntil
async function processEmailBackground(emailId: string, userId: string, payload: any) {
  try {
    // 1. Sanitize text for priority prompt
    const snippet = sanitizeLongText(payload.body || payload.subject, 300);
    const prompt = `Analyze this incoming email. Is it URGENT, NORMAL, or FYI?
From: ${payload.from || 'Unknown'}
Subject: ${payload.subject || 'No Subject'}
Snippet: ${snippet}

Return ONLY valid JSON with no markdown formatting.
Format: {"priority": "URGENT" | "NORMAL" | "FYI"}`;

    // 2. Call Claude Haiku via OpenRouter
    const { text } = await generateText({
      model: openrouter('anthropic/claude-3-haiku'),
      prompt,
      maxTokens: 50,
    } as any);

    let priorityLevel = 'NORMAL';
    try {
      const parsed = JSON.parse(text);
      if (parsed.priority) priorityLevel = parsed.priority;
    } catch (e) {
      console.warn('Failed to parse Haiku priority response, defaulting to NORMAL');
    }

    // 3. Generate Embedding
    const embedding = await generateEmbedding(payload.body || payload.subject || '');
    const embeddingString = `[${embedding.join(',')}]`;

    const newId = crypto.randomUUID();

    // 4. Store in pgvector database
    await prisma.$executeRaw`
      INSERT INTO "Email" (id, "userId", "corsairId", subject, body, "from", "to", date, "priorityLevel", "isRead", "updatedAt", embedding)
      VALUES (
        ${newId}, 
        ${userId}, 
        ${emailId}, 
        ${payload.subject || 'No Subject'}, 
        ${payload.body || ''}, 
        ${payload.from || 'unknown@example.com'}, 
        ${payload.to || 'user@example.com'}, 
        NOW(), 
        ${priorityLevel}, 
        false, 
        NOW(), 
        ${embeddingString}::vector
      )
    `;

    // 5. SSE Push via Redis Pub/Sub
    const newEmail = await prisma.email.findUnique({ where: { id: newId } });
    if (newEmail) {
      await redis.publish(`user:${userId}:emails`, JSON.stringify(newEmail));
    }
  } catch (error) {
    console.error('Background processing error:', error);
  }
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-corsair-signature');
    const bodyText = await req.text();

    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(bodyText)
      .digest('hex');

    if (signature !== expectedSignature && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const emailId = payload.id || crypto.randomUUID();
    const userId = payload.userId;
    
    // Idempotency Check
    const idempotencyKey = `webhook:email:${emailId}`;
    const isNew = await redis.setnx(idempotencyKey, '1');
    if (!isNew) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    await redis.expire(idempotencyKey, 86400);

    // Pass the processing logic to Vercel's waitUntil to run after response
    waitUntil(processEmailBackground(emailId, userId, payload));

    // Immediately return 200 OK so Corsair doesn't time out
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
