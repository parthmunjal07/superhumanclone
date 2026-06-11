import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { generateEmbedding } from '@/lib/ai';

const WEBHOOK_SECRET = process.env.CORSAIR_WEBHOOK_SECRET || 'test-secret';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-corsair-signature');
    const bodyText = await req.text();

    // 1. Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(bodyText)
      .digest('hex');

    if (signature !== expectedSignature && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const emailId = payload.id || crypto.randomUUID();
    
    // 2. Idempotency Check (Redis, 24h TTL)
    const idempotencyKey = `webhook:email:${emailId}`;
    const isNew = await redis.setnx(idempotencyKey, '1');
    if (!isNew) {
      console.log(`[Webhook] Duplicate delivery for ${emailId}, ignoring silently.`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    await redis.expire(idempotencyKey, 86400);

    // 3. Classify Priority (Mock)
    const priorities = ['High', 'Normal', 'Low'];
    const priorityLevel = priorities[Math.floor(Math.random() * priorities.length)];

    // 4. Embed Email Body
    const embedding = await generateEmbedding(payload.body || payload.subject || '');
    const embeddingString = `[${embedding.join(',')}]`;

    const userId = payload.userId; // We assume Corsair sends the associated user's ID
    const newId = crypto.randomUUID();

    // 5. Store in pgvector column
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

    // Fetch the newly created email so we can push it to SSE
    const newEmail = await prisma.email.findUnique({ where: { id: newId } });

    // 6. SSE Push via Redis Pub/Sub
    if (newEmail) {
      await redis.publish(`user:${userId}:emails`, JSON.stringify(newEmail));
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
