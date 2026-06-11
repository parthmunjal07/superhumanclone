import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const redirect = searchParams.get('redirect') || '/inbox';
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback` 
    : 'http://localhost:3000/api/auth/google/callback';

  if (!clientId) {
    return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID environment variable' }, { status: 500 });
  }

  // Build the authorization URL
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', redirect);

  return NextResponse.redirect(url.toString());
}
