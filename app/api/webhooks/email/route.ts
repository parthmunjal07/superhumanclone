import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { generateEmbedding, mistral, sanitizeLongText } from '@/lib/ai';
import { waitUntil } from '@vercel/functions';
import { generateObject } from 'ai';
import { z } from 'zod';

const WEBHOOK_SECRET = process.env.CORSAIR_WEBHOOK_SECRET || 'test-secret';

async function processEmailBackground(emailId: string, userId: string, payload: any) {
  try {
    const snippet = sanitizeLongText(payload.body || payload.subject, 300);
    const prompt = `Analyze this incoming email. Is it URGENT, NORMAL, or FYI?
From: ${payload.from || 'Unknown'}
Subject: ${payload.subject || 'No Subject'}
Snippet: ${snippet}`;

    // 1. Use generateObject with Zod instead of generateText
    const { object } = await generateObject({
      model: mistral('mistral-small-latest'), // Fast and efficient for classification
      system: 'You are an email triage assistant.',
      prompt,
      schema: z.object({
        priority: z.enum(['URGENT', 'NORMAL', 'FYI']).describe('The priority level of the email.'),
      }),
    });

    const priorityLevel = object.priority;

    // 2. Generate Embedding
    const embedding = await generateEmbedding(payload.body || payload.subject || '');
    const embeddingString = `[${embedding.join(',')}]`;

    const newId = crypto.randomUUID();

    // 3. Store in pgvector database
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

    // 4. SSE Push via Redis Pub/Sub
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
    
    const idempotencyKey = `webhook:email:${emailId}`;
    const isNew = await redis.setnx(idempotencyKey, '1');
    if (!isNew) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    await redis.expire(idempotencyKey, 86400);

    waitUntil(processEmailBackground(emailId, userId, payload));

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}