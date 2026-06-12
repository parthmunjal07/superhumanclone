import { getTenant } from '@/lib/corsair';

export class CalendarService {
  static async getEvents(userId: string, limit: number = 50) {
    const t = await getTenant(userId);
    
    try {
      // Try to read from local cache
      const dbEvents = await t.googlecalendar.db.events.search({
        limit: limit
      }) as any[];

      let events = [];

      if (dbEvents.length > 0) {
        events = dbEvents.map((e: any) => ({
          id: e.id,
          title: e.data?.summary || '(No Title)',
          start: e.data?.start?.dateTime || e.data?.start?.date || e.created_at,
          end: e.data?.end?.dateTime || e.data?.end?.date,
          description: e.data?.description || '',
          location: e.data?.location || '',
          status: e.data?.status || 'confirmed'
        }));
      } else {
        // Fallback to live API if DB sync hasn't run
        const liveEventsRes = await t.googlecalendar.api.events.getMany({
          calendarId: 'primary',
          maxResults: limit,
          orderBy: 'startTime',
          singleEvents: true,
          timeMin: new Date().toISOString()
        }) as any;
        
        // Corsair might return { items: [...] } or just [...]
        const rawEvents = liveEventsRes.items || liveEventsRes || [];
        
        events = rawEvents.map((e: any) => ({
          id: e.id,
          title: e.summary || '(No Title)',
          start: e.start?.dateTime || e.start?.date || new Date().toISOString(),
          end: e.end?.dateTime || e.end?.date,
          description: e.description || '',
          location: e.location || '',
          status: e.status || 'confirmed'
        }));
      }

      return events;
    } catch (err: any) {
      console.error("[CalendarService] Failed to fetch events:", err.message);
      return [];
    }
  }
}
