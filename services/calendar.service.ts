import { getCorsairClient } from '@/lib/corsair';

export class CalendarService {
  static async getEvents(corsairUserId: string, timeMin?: string, timeMax?: string) {
    const t = await getCorsairClient(corsairUserId);
    try {
      const queryParamsBase = {
        singleEvents: true,
        orderBy: 'startTime' as const,
        maxResults: 250,
        timeMin: timeMin || new Date().toISOString(),
        ...(timeMax ? { timeMax } : {})
      };

      const data = await t.googlecalendar.api.events.getMany({
        calendarId: 'primary',
        ...queryParamsBase
      });

      const rawEvents = data.items || [];
      
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
        colorId: e.colorId || null,
        hangoutLink: e.hangoutLink || ''
      }));
    } catch (err: any) {
      console.error("[CalendarService] Failed to fetch events:", err.message);
      return [];
    }
  }

  static async createEvent(corsairUserId: string, data: any) {
    const t = await getCorsairClient(corsairUserId);
    try {
      const responseData = await t.googlecalendar.api.events.create({
        calendarId: 'primary',
        sendUpdates: 'all',
        ...(data.addMeetLink ? { conferenceDataVersion: 1 } : {}),
        event: {
          summary: data.title,
          description: data.description || '',
          location: data.location || '',
          start: { dateTime: data.start },
          end: { dateTime: data.end },
          attendees: data.attendees?.map((email: string) => ({ email })) || [],
          ...(data.colorId ? { colorId: data.colorId } : {}),
          ...(data.recurrence ? { recurrence: data.recurrence } : {}),
          ...(data.addMeetLink ? {
            conferenceData: {
              createRequest: {
                requestId: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            }
          } : {})
        }
      });
      return { success: true, event: responseData };
    } catch (err: any) {
      console.error("[CalendarService] Failed to create event:", err.message);
      throw new Error(err.message || 'Failed to create event');
    }
  }

  static async updateEvent(corsairUserId: string, eventId: string, data: any) {
    const t = await getCorsairClient(corsairUserId);
    try {
      const updateData = await t.googlecalendar.api.events.update({
        calendarId: 'primary',
        id: eventId,
        sendUpdates: 'all',
        ...(data.addMeetLink ? { conferenceDataVersion: 1 } : {}),
        event: {
          summary: data.title,
          description: data.description || '',
          location: data.location || '',
          start: { dateTime: data.start },
          end: { dateTime: data.end },
          attendees: data.attendees?.map((email: string) => ({ email })) || [],
          ...(data.colorId ? { colorId: data.colorId } : {}),
          ...(data.recurrence ? { recurrence: data.recurrence } : {}),
          ...(data.addMeetLink ? {
            conferenceData: {
              createRequest: {
                requestId: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            }
          } : {})
        }
      });
      return { success: true, event: updateData };
    } catch (err: any) {
      console.error("[CalendarService] Failed to update event:", err.message);
      throw new Error(err.message || 'Failed to update event');
    }
  }

  static async deleteEvent(corsairUserId: string, eventId: string) {
    const t = await getCorsairClient(corsairUserId);
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

  static async checkFreeBusy(corsairUserId: string, timeMin: string, timeMax: string, items: string[]) {
    return {};
  }
}
