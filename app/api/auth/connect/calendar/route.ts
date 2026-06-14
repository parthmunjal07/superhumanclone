import { NextResponse } from 'next/server';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';
import { getCorsairClient } from '@/lib/corsair';

export async function GET(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } }, { status: 401 });
    }
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
    }
    
    const userId = payload.userId;
    const tenant = await getCorsairClient(userId);
    
    // We pass integration and userId so we can identify them in the callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/corsair/callback?integration=googlecalendar&userId=${userId}`;
    const { authorizeUrl } = await tenant.plugins.oauth.authorizeUrl('googlecalendar', redirectUri);
    
    return NextResponse.redirect(authorizeUrl);
  } catch (error: any) {
    console.error('Error generating Google Calendar OAuth URL:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to generate OAuth URL' } }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } }, { status: 401 });
    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
    
    const userId = payload.userId;
    const tenant = await getCorsairClient(userId);

    // Revoke the integration by clearing the account credentials
    await tenant.plugins.credentials.clear('googlecalendar', 'access_token');
    await tenant.plugins.credentials.clear('googlecalendar', 'refresh_token');

    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({
      where: { id: userId },
      data: { calendarConnected: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error revoking Calendar integration:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to revoke integration' } }, { status: 500 });
  }
}
