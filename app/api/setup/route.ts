import { NextResponse } from 'next/server';
import { getCorsairClient } from '@/lib/corsair';

export async function GET() {
  try {
    const tenant = await getCorsairClient('test-user-id');
    const { authorizeUrl } = await tenant.plugins.oauth.authorizeUrl('gmail', 'http://localhost:3000/callback');
    return NextResponse.json({ authorizeUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
