import { NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendar.service';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;

    const events = await CalendarService.getEvents(payload.userId, limit);

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
