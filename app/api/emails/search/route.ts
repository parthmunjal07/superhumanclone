import { NextResponse } from 'next/server';
import { EmailService } from '@/services/EmailService';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');

    if (!query) {
      return NextResponse.json({ emails: [] });
    }

    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const emails = await EmailService.searchEmails(payload.userId, query);

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error searching emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
