import { getTenant } from '@/lib/corsair';

export class CalendarService {
  static async getEvents(userId: string, timeMin?: string, timeMax?: string) {
    const t = await getTenant(userId);
    
    try {
      const queryParams = {
        calendarId: 'primary',
        singleEvents: true,
        orderBy: 'startTime' as const,
        maxResults: 250,
        ...(timeMin ? { timeMin } : { timeMin: new Date().toISOString() }),
        ...(timeMax ? { timeMax } : {})
      };

      console.log('[CalendarService] Fetching events with params:', queryParams);
      
      const res = await t.googlecalendar.api.events.getMany(queryParams) as any;
      
      console.log('[CalendarService] Response type:', typeof res, Array.isArray(res) ? `array(${res.length})` : 'not-array');
      
      // The SDK may return { items: [...] } or the array directly
      const rawEvents = Array.isArray(res) ? res : (res?.items || []);
      console.log('[CalendarService] Raw events count:', rawEvents.length);
      
      return rawEvents.map((e: any) => ({
        id: e.id,
        title: e.summary || '(No Title)',
        start: e.start?.dateTime || e.start?.date || new Date().toISOString(),
        end: e.end?.dateTime || e.end?.date,
        description: e.description || '',
        location: e.location || '',
        status: e.status || 'confirmed',
        attendees: e.attendees || [],
        htmlLink: e.htmlLink || '',
        colorId: e.colorId || null
      }));
    } catch (err: any) {
      console.error("[CalendarService] Failed to fetch events:", err.message, err.stack);
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
          attendees: data.attendees?.map((email: string) => ({ email })) || [],
          ...(data.colorId ? { colorId: data.colorId } : {}),
          ...(data.recurrence ? { recurrence: data.recurrence } : {})
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
          attendees: data.attendees?.map((email: string) => ({ email })) || [],
          ...(data.colorId ? { colorId: data.colorId } : {}),
          ...(data.recurrence ? { recurrence: data.recurrence } : {})
        }
      });
      return { success: true, event: res };
    } catch (err: any) {
      console.error("[CalendarService] Failed to update event:", err.message);
      throw new Error(err.message || 'Failed to update event');
    }
  }

  static async deleteEvent(userId: string, eventId: string) {
    const t = await getTenant(userId);
    try {
      await t.googlecalendar.api.events.delete({
        calendarId: 'primary',
        id: eventId,
        sendUpdates: 'all'
      });
      return { success: true };
    } catch (err: any) {
      console.error("[CalendarService] Failed to delete event:", err.message);
      throw new Error(err.message || 'Failed to delete event');
    }
  }

  static async checkFreeBusy(userId: string, timeMin: string, timeMax: string, items: string[]) {
    // Note: Corsair's Google Calendar SDK currently only exposes 'events' and 'calendar'.
    // The 'freebusy' endpoint is not yet supported in the SDK types.
    // Stubbing this out to return empty data so the UI doesn't crash.
    return {};
  }
}
