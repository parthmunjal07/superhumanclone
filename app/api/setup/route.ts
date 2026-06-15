import { NextResponse } from 'next/server';
import { corsair } from '@/lib/corsair';
import { generateOAuthUrl } from 'corsair/oauth';

export async function GET() {
  try {
    const { url: authorizeUrl } = await generateOAuthUrl(corsair, 'gmail', { tenantId: 'test-user-id', redirectUri: 'http://localhost:3000/callback' });
    return NextResponse.json({ authorizeUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
