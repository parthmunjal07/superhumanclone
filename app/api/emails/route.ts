import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';

import { EmailService } from '@/services/EmailService';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId;

    const { emails, nextCursor } = await EmailService.getEmails(userId, limit, cursor);

    return NextResponse.json({
      emails,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
