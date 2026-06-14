import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const integration = url.searchParams.get('integration');

    if (!userId || !integration) {
      return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing callback parameters' } }, { status: 400 });
    }

    // Since we use the internal DB userId as the tenantId in Corsair, they are the same
    const corsairUserId = userId;
    const now = new Date();

    let updateData: any = {
      corsairUserId,
    };

    if (integration === 'gmail') {
      updateData.gmailConnected = true;
      updateData.gmailConnectedAt = now;
    } else if (integration === 'googlecalendar') {
      updateData.calendarConnected = true;
      updateData.calendarConnectedAt = now;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (updatedUser.gmailConnected && updatedUser.calendarConnected) {
      return NextResponse.redirect(`${appUrl}/inbox`);
    } else {
      return NextResponse.redirect(`${appUrl}/onboarding`);
    }
  } catch (error: any) {
    console.error('Error handling Corsair callback:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Callback failed' } }, { status: 500 });
  }
}
