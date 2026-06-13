import { NextResponse } from 'next/server';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';
import { CalendarService } from '@/services/calendar.service';

export async function POST(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    
    // Minimal validation
    if (!data.title || !data.start || !data.end) {
      return NextResponse.json({ error: 'Missing required fields (title, start, end)' }, { status: 400 });
    }

    const result = await CalendarService.createEvent(payload.userId, data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Create event API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 });
  }
}
