import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url));
  }

  try {
    // 1. Exchange code for Corsair token
    // This is where you would make an API call to Corsair's token endpoint.
    // For now, we simulate extracting user data from the successful exchange.
    // const tokenResponse = await fetch(process.env.CORSAIR_TOKEN_URL, { ... })
    // const userData = await fetch(process.env.CORSAIR_USERINFO_URL, { ... })
    
    // Mock user data from Corsair (Replace with actual API call later)
    const mockCorsairUser = {
      email: `user_${code.substring(0,5)}@example.com`,
      name: 'Corsair User',
    };

    // 2. Find or Create User in DB
    let user = await prisma.user.findUnique({ where: { email: mockCorsairUser.email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: mockCorsairUser.email,
          name: mockCorsairUser.name,
          authProvider: 'corsair',
        },
      });
    }

    // 3. Issue Local JWT Tokens (Keeping frontend unified)
    const tokenPayload = { userId: user.id, email: user.email };
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Set secure cookie
    await setRefreshTokenCookie(refreshToken);

    // 4. Redirect to Frontend Home (The frontend will call /api/auth/me to get the access token)
    return NextResponse.redirect(new URL('/', req.url));

  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url));
  }
}
