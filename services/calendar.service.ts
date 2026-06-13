import { getTenant } from '@/lib/corsair';

export class CalendarService {
  static async getEvents(userId: string, timeMin?: string, timeMax?: string) {
    const t = await getTenant(userId);
    
    try {
      // First try to fetch from Corsair local DB
      // If timeMin and timeMax are provided, we should filter events.
      // But the generic DB search might not support complex time filtering easily,
      // so we will query live API directly for a specific week view to be safe
      // and ensure we get accurate occurrences.
      
      const liveEventsRes = await t.googlecalendar.api.events.getMany({
        calendarId: 'primary',
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
        ...(timeMin ? { timeMin } : { timeMin: new Date().toISOString() }),
        ...(timeMax ? { timeMax } : {})
      }) as any;
      
      const rawEvents = liveEventsRes.items || liveEventsRes || [];
      
      return rawEvents.map((e: any) => ({
        id: e.id,
        title: e.summary || '(No Title)',
        start: e.start?.dateTime || e.start?.date || new Date().toISOString(),
        end: e.end?.dateTime || e.end?.date,
        description: e.description || '',
        location: e.location || '',
        status: e.status || 'confirmed',
        attendees: e.attendees || [],
        htmlLink: e.htmlLink || ''
      }));
    } catch (err: any) {
      console.error("[CalendarService] Failed to fetch events:", err.message);
      return [];
    }
  }

  static async createEvent(userId: string, data: any) {
    const t = await getTenant(userId);
    try {
      const res = await t.googlecalendar.api.events.create({
        calendarId: 'primary',
        sendUpdates: 'all',
        event: {
          summary: data.title,
          description: data.description || '',
          location: data.location || '',
          start: { dateTime: data.start },
          end: { dateTime: data.end },
          attendees: data.attendees?.map((email: string) => ({ email })) || []
        }
      });
      return { success: true, event: res };
    } catch (err: any) {
      console.error("[CalendarService] Failed to create event:", err.message);
      throw new Error(err.message || 'Failed to create event');
    }
  }

  static async updateEvent(userId: string, eventId: string, data: any) {
    const t = await getTenant(userId);
    try {
      const res = await t.googlecalendar.api.events.update({
        calendarId: 'primary',
        id: eventId,
        sendUpdates: 'all',
        event: {
          summary: data.title,
          description: data.description || '',
          location: data.location || '',
          start: { dateTime: data.start },
          end: { dateTime: data.end },
          attendees: data.attendees?.map((email: string) => ({ email })) || []
        }
      });
      return { success: true, event: res };
    } catch (err: any) {
      console.error("[CalendarService] Failed to update event:", err.message);
      throw new Error(err.message || 'Failed to update event');
    }
  }

  static async checkFreeBusy(userId: string, timeMin: string, timeMax: string, items: string[]) {
    // Note: Corsair's Google Calendar SDK currently only exposes 'events' and 'calendar'.
    // The 'freebusy' endpoint is not yet supported in the SDK types.
    // Stubbing this out to return empty data so the UI doesn't crash.
    return {};
  }
}
