import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Optional: Protect route (in a real app, you'd extract the Access Token from headers
    // but since we're Server Side and our access token is in memory, we verify the refresh token cookie 
    // or rely on a standard session context).
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId;

    const emails = await prisma.email.findMany({
      where: { userId },
      take: limit + 1, // Fetch one extra to determine if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        subject: true,
        body: true,
        from: true,
        to: true,
        date: true,
        priorityLevel: true,
        isRead: true,
      }
    });

    let nextCursor: string | null = null;
    if (emails.length > limit) {
      const nextItem = emails.pop(); // Remove the extra item
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({
      emails,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
