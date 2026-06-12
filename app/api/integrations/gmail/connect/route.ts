import { NextResponse } from 'next/server';
import { getTenant } from '@/lib/corsair';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // connectLink.create is not available in the current Corsair setup.
    // Please authenticate plugins using the Corsair CLI for local development:
    // npx corsair auth --plugin=gmail --tenant=[userId]
    return NextResponse.json({ error: 'OAuth connect links are not configured. Please use the Corsair CLI to authenticate.' }, { status: 501 });
  } catch (error: any) {
    console.error('Error creating connect link:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
