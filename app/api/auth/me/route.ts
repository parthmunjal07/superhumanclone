import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRefreshTokenCookie, verifyToken, generateAccessToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, authProvider: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Issue a new short-lived access token
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      user,
      accessToken,
    });

  } catch (error) {
    console.error('Session Rehydration Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
