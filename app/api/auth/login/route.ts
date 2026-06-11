import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePasswords, generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || user.authProvider !== 'local') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json({ 
        error: 'Email not verified',
        needsVerification: true 
      }, { status: 403 });
    }

    const isValidPassword = await comparePasswords(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const tokenPayload = { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      teamId: user.teamId
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await setRefreshTokenCookie(refreshToken);

    return NextResponse.json({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        teamId: user.teamId
      },
      accessToken,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
