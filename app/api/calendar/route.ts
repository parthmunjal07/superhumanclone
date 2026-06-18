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
      const allEvents: any[] = [];
      
      const generateEventsForDate = (baseDate: Date, dayOffset: number) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + dayOffset);
        
        const setTime = (hours: number, minutes: number = 0) => {
          const d = new Date(date);
          d.setHours(hours, minutes, 0, 0);
          return d.toISOString();
        };

        const prefix = `mock-evt-day${dayOffset}-`;
        
        return [
          {
            id: prefix + '1',
            summary: "Product Sync",
            description: "Sync on Q3 roadmap",
            start: setTime(10),
            end: setTime(11),
            status: "confirmed",
            colorId: "1",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: prefix + '2',
            summary: "Design Review",
            description: "Review latest mocks for landing page",
            start: setTime(11, 30),
            end: setTime(12, 30),
            status: "confirmed",
            colorId: "3",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: prefix + '3',
            summary: "Lunch Break",
            description: "Blocker",
            start: setTime(13),
            end: setTime(14),
            status: "confirmed",
            colorId: "8",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: prefix + '4',
            summary: "Interview with Alex",
            description: "Frontend role chat",
            start: setTime(14),
            end: setTime(14, 30),
            status: "confirmed",
            colorId: "2",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: prefix + '5',
            summary: "1:1 with Manager",
            description: "Weekly sync",
            start: setTime(15, 30),
            end: setTime(16),
            status: "confirmed",
            colorId: "5",
            htmlLink: "https://calendar.google.com"
          },
          {
            id: prefix + '6',
            summary: "Team All Hands",
            description: "Monthly all hands meeting",
            start: setTime(17),
            end: setTime(18),
            status: "confirmed",
            colorId: "4",
            htmlLink: "https://calendar.google.com"
          }
        ];
      };

      for (let i = -3; i <= 3; i++) {
        const tempDate = new Date(today);
        tempDate.setDate(tempDate.getDate() + i);
        
        if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) {
          allEvents.push(...generateEventsForDate(today, i));
        } else {
          const setTime = (hours: number, minutes: number = 0) => {
            const d = new Date(tempDate);
            d.setHours(hours, minutes, 0, 0);
            return d.toISOString();
          };
          allEvents.push({
            id: `mock-evt-day${i}-weekend`,
            summary: "Weekend Focus Time",
            description: "Catch up on some reading",
            start: setTime(10),
            end: setTime(12),
            status: "confirmed",
            colorId: "9",
            htmlLink: "https://calendar.google.com"
          });
        }
      }

      return NextResponse.json({ events: allEvents }, { status: 200 });
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
