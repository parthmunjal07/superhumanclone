import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const corsairAuthUrl = process.env.CORSAIR_AUTH_URL || 'https://auth.corsair.dev/oauth/authorize';
  const clientId = process.env.CORSAIR_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback` : 'http://localhost:3000/api/auth/callback';

  if (!clientId) {
    return NextResponse.json({ error: 'Missing CORSAIR_CLIENT_ID environment variable' }, { status: 500 });
  }

  // Build the authorization URL
  const url = new URL(corsairAuthUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');

  return NextResponse.redirect(url.toString());
}
