import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // In a real application, verify Corsair HMAC signature using CORSAIR_WEBHOOK_SECRET
    // const signature = req.headers.get('x-corsair-signature');
    
    const eventType = payload.event_type || payload.type || 'unknown.event';
    const provider = 'corsair';
    const tenantId = payload.tenant_id;
    const eventId = payload.id || `evt_${Date.now()}`;

    // Log the webhook in the database
    await prisma.webhookLog.create({
      data: {
        provider,
        eventType,
        payload: payload,
      },
    });

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 });
    }

    // Idempotency check: 24-hour TTL (86400 seconds)
    // Ensures if the webhook is delivered twice, we only process it once
    const isNewEvent = await redis.set(`webhook:corsair:${eventId}`, '1', 'EX', 86400, 'NX');
    if (!isNewEvent) {
      return NextResponse.json({ message: 'Duplicate event ignored' }, { status: 200 });
    }

    // Process event: e.g. "gmail.message.received"
    if (eventType === 'gmail.message.received' || eventType === 'gmail.message.created') {
      const emailData = payload.data;
      
      // We push the new email out to the client via SSE instantly
      if (emailData) {
        
        const headers = emailData.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;
        
        // Map to UI representation
        const newEmail = {
          id: emailData.id,
          subject: emailData.subject || getHeader('subject') || emailData.snippet?.substring(0, 50) || '(No Subject)',
          body: emailData.snippet || emailData.body || '',
          from: emailData.from || getHeader('from') || 'Unknown',
          to: emailData.to || getHeader('to') || 'Me',
          date: emailData.date || emailData.internalDate ? new Date(parseInt(emailData.internalDate)) : new Date().toISOString(),
          isRead: !((emailData.labelIds || []).includes('UNREAD')),
          priorityLevel: 'Normal'
        };

        const channel = `user:${tenantId}:emails`;
        await redis.publish(channel, JSON.stringify(newEmail));
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
