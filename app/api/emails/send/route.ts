import { NextResponse } from 'next/server';
import { EmailService } from '@/services/email.service';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';
import { SendEmailSchema } from '@/schemas/email.schema';

export async function POST(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validationResult = SendEmailSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const email = await EmailService.sendEmail(payload.userId, validationResult.data);

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
