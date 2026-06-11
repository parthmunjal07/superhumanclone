import { NextRequest } from 'next/server';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';
import Redis from 'ioredis';

// Prevent Next.js from caching or buffering the SSE response
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const refreshToken = await getRefreshTokenCookie();
  if (!refreshToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = verifyToken(refreshToken);
  if (!payload) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = payload.userId;

  // Create a new Redis client specifically for this SSE subscriber
  const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue('event: connected\ndata: ok\n\n');

      const channel = `user:${userId}:emails`;
      subscriber.subscribe(channel, (err) => {
        if (err) {
          console.error('Failed to subscribe:', err);
          controller.error(err);
        }
      });

      subscriber.on('message', (chan, message) => {
        if (chan === channel) {
          // Send the new email data to the client
          controller.enqueue(`data: ${message}\n\n`);
        }
      });

      // Keepalive ping every 30 seconds
      const intervalId = setInterval(() => {
        try {
          controller.enqueue('event: ping\ndata: \n\n');
        } catch (e) {
          clearInterval(intervalId);
        }
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        subscriber.quit();
        controller.close();
      });
    },
    cancel() {
      subscriber.quit();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
