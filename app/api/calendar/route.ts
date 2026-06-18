import { NextRequest, NextResponse } from 'next/server';
import { CalendarService } from '@/services/calendar.service';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';
import { calendarEventSchema } from '@/schemas/calendar.schema';
import { requireRole } from '@/lib/rbac';

export const GET = requireRole([], async (req: NextRequest, { user }: { user: any }) => {
  try {
    console.log('[/api/calendar] GET request received');
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const timeMin = searchParams.get('timeMin') || undefined;
    const timeMax = searchParams.get('timeMax') || undefined;
    console.log('[/api/calendar] timeMin:', timeMin, 'timeMax:', timeMax);

    if (userId === 'demo-user') {
      const today = new Date();
      const tenAM = new Date(today);
      tenAM.setHours(10, 0, 0, 0);
      const elevenAM = new Date(today);
      elevenAM.setHours(11, 0, 0, 0);
      
      const twoPM = new Date(today);
      twoPM.setHours(14, 0, 0, 0);
      const twoThirtyPM = new Date(today);
      twoThirtyPM.setHours(14, 30, 0, 0);

      const elevenThirtyAM = new Date(today);
      elevenThirtyAM.setHours(11, 30, 0, 0);
      const twelveThirtyPM = new Date(today);
      twelveThirtyPM.setHours(12, 30, 0, 0);

      const onePM = new Date(today);
      onePM.setHours(13, 0, 0, 0);
      
      const threeThirtyPM = new Date(today);
      threeThirtyPM.setHours(15, 30, 0, 0);
      const fourPM = new Date(today);
      fourPM.setHours(16, 0, 0, 0);

      const fivePM = new Date(today);
      fivePM.setHours(17, 0, 0, 0);
      const sixPM = new Date(today);
      sixPM.setHours(18, 0, 0, 0);

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
          },
          {
            id: 'mock-evt-3',
            summary: "Design Review",
            description: "Review latest mocks for landing page",
            start: elevenThirtyAM.toISOString(),
            end: twelveThirtyPM.toISOString(),
            status: "confirmed",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: 'mock-evt-4',
            summary: "Lunch Break",
            description: "Blocker",
            start: onePM.toISOString(),
            end: twoPM.toISOString(),
            status: "confirmed",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: 'mock-evt-5',
            summary: "1:1 with Manager",
            description: "Weekly sync",
            start: threeThirtyPM.toISOString(),
            end: fourPM.toISOString(),
            status: "confirmed",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: 'mock-evt-6',
            summary: "Team All Hands",
            description: "Monthly all hands meeting",
            start: fivePM.toISOString(),
            end: sixPM.toISOString(),
            status: "confirmed",
            htmlLink: "https://calendar.google.com"
          }
        ]
      }, { status: 200 });
    }

    const events = await CalendarService.getEvents(userId, timeMin, timeMax);
    console.log('[/api/calendar] fetched events count:', events.length);

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error('[/api/calendar] Error fetching calendar events:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});

export const POST = requireRole([], async (req: NextRequest, { user }: { user: any }) => {
  try {
    const userId = user.id;

    const body = await req.json();
    const result = calendarEventSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const created = await CalendarService.createEvent(userId, result.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});

export const PUT = requireRole([], async (req: NextRequest, { user }: { user: any }) => {
  try {
    const userId = user.id;

    const body = await req.json();
    const { eventId, ...data } = body;
    
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const result = calendarEventSchema.safeParse(data);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.format() }, { status: 400 });
    }

    const updated = await CalendarService.updateEvent(userId, eventId, result.data);

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = requireRole([], async (req: NextRequest, { user }: { user: any }) => {
  try {
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    await CalendarService.deleteEvent(userId, eventId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});
