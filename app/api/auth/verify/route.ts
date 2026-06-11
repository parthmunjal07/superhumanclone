import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_verification_token', req.url));
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.redirect(new URL('/login?error=expired_token', req.url));
    }

    // Mark user as verified
    const user = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerifiedAt: new Date() },
    });

    // Delete the token
    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });

    // Log the user in
    const tokenPayload = { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      teamId: user.teamId
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await setRefreshTokenCookie(refreshToken);

    // Redirect to home/dashboard
    return NextResponse.redirect(new URL('/', req.url));

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', req.url));
  }
}
