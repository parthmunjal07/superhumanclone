import { NextResponse } from 'next/server';
import { EmailService } from '@/services/email.service';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await EmailService.archiveEmail(payload.userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
