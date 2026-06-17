import { NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendar.service';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';
import { calendarEventSchema } from '@/schemas/calendar.schema';

export async function GET(req: Request) {
  try {
    console.log('[/api/calendar] GET request received');
    const refreshToken = await getRefreshTokenCookie();
    console.log('[/api/calendar] refreshToken present:', !!refreshToken);
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(refreshToken);
    console.log('[/api/calendar] payload:', payload ? { userId: payload.userId, email: payload.email } : null);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get('timeMin') || undefined;
    const timeMax = searchParams.get('timeMax') || undefined;
    console.log('[/api/calendar] timeMin:', timeMin, 'timeMax:', timeMax);

    if (payload.userId === 'demo-user') {
      const today = new Date();
      const tenAM = new Date(today);
      tenAM.setHours(10, 0, 0, 0);
      const elevenAM = new Date(today);
      elevenAM.setHours(11, 0, 0, 0);
      
      const twoPM = new Date(today);
      twoPM.setHours(14, 0, 0, 0);
      const twoThirtyPM = new Date(today);
      twoThirtyPM.setHours(14, 30, 0, 0);

      return NextResponse.json({
        events: [
          {
            id: 'mock-evt-1',
            summary: "Product Sync",
            description: "Sync on Q3 roadmap",
            start: tenAM.toISOString(),
            end: elevenAM.toISOString(),
            status: "confirmed",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: 'mock-evt-2',
            summary: "Interview with Alex",
            description: "Frontend role chat",
            start: twoPM.toISOString(),
            end: twoThirtyPM.toISOString(),
            status: "confirmed",
            htmlLink: "https://calendar.google.com"
          }
        ]
      }, { status: 200 });
    }

    const events = await CalendarService.getEvents(payload.userId, timeMin, timeMax);
    console.log('[/api/calendar] fetched events count:', events.length);

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error('[/api/calendar] Error fetching calendar events:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = calendarEventSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const created = await CalendarService.createEvent(payload.userId, result.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { eventId, ...data } = body;
    
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const result = calendarEventSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const updated = await CalendarService.updateEvent(payload.userId, eventId, result.data);

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    await CalendarService.deleteEvent(payload.userId, eventId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
