import { NextResponse } from 'next/server';
import { EmailService } from '@/services/EmailService';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.to || !body.subject || !body.body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const email = await EmailService.sendEmail(payload.userId, body);

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
