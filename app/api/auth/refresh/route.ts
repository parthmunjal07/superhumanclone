import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken, getRefreshTokenCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const refreshToken = await getRefreshTokenCookie();
  if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(refreshToken);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 403 });

  // Exclude 'exp' and 'iat' from the payload to avoid signing errors
  const { userId, email, role, teamId } = payload;
  const newAccessToken = generateAccessToken({ userId, email, role, teamId });
  
  return NextResponse.json({ accessToken: newAccessToken });
}
