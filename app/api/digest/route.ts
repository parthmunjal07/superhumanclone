import { NextRequest, NextResponse } from 'next/server';
import { getRefreshTokenCookie, verifyToken } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { generateDigestForUser } from '@/lib/digest';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const token = await getRefreshTokenCookie();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `user:${payload.userId}:digest:${today}`;

    // 1. Check Redis
    // const cached = await redis.get(cacheKey);
    // if (cached && cached !== "null") {
    //   return NextResponse.json(JSON.parse(cached));
    // }

    // 2. Check Database
    const dbDigest = await prisma.digestCache.findFirst({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (dbDigest && dbDigest.date.toISOString().startsWith(today) && dbDigest.summary !== "null") {
      // Re-populate redis
      // await redis.set(cacheKey, dbDigest.summary, 'EX', 86400 * 2);
      return NextResponse.json(JSON.parse(dbDigest.summary));
    }

    // 3. Fallback: generate it right now
    const digest = await generateDigestForUser(payload.userId);
    if (!digest) {
      return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 });
    }
    return NextResponse.json(digest);
  } catch (error) {
    console.error('API /digest GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getRefreshTokenCookie();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Bust the cache and regenerate
    // const today = new Date().toISOString().split('T')[0];
    // const cacheKey = `user:${payload.userId}:digest:${today}`;
    // await redis.del(cacheKey);

    // const digest = await generateDigestForUser(payload.userId);
    // if (!digest) {
    //   return NextResponse.json({ error: 'Failed to regenerate digest' }, { status: 500 });
    // }

    return NextResponse.json(digest);
  } catch (error: any) {
    console.error('API /digest POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
