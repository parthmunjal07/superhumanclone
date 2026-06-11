import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback` 
      : 'http://localhost:3000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth credentials');
    }

    // 1. Exchange code for Google access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Failed to exchange token:', errorData);
      throw new Error('Failed to exchange token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = await userResponse.json();
    const { email, name } = userData;

    if (!email) {
      throw new Error('No email found in user profile');
    }

    // 3. Find or Create User in DB
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          authProvider: 'google',
          emailVerifiedAt: new Date(),
        },
      });
    } else if (user.authProvider !== 'google') {
      // Optional: You might want to update the provider if they previously signed up locally
      // but now are logging in with Google. Or keep it as is. We'll leave it as is for now.
    }

    // 4. Issue Local JWT Tokens (Keeping frontend unified)
    const tokenPayload = { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      teamId: user.teamId
    };
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Set secure cookie
    await setRefreshTokenCookie(refreshToken);

    // 5. Redirect to Frontend (The frontend will call /api/auth/me to get the access token)
    const state = url.searchParams.get('state') || '/inbox';
    const redirectTarget = state.startsWith('/') && !state.startsWith('//') ? state : '/inbox';
    return NextResponse.redirect(new URL(redirectTarget, req.url));

  } catch (error) {
    console.error('OAuth Callback Error:', error);
    const state = url.searchParams.get('state');
    const redirectParam = state ? `&redirect=${encodeURIComponent(state)}` : '';
    return NextResponse.redirect(new URL(`/login?error=oauth_failed${redirectParam}`, req.url));
  }
}
