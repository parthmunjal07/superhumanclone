import { getTenant } from './lib/corsair';

async function main() {
  try {
    const t = await getTenant('cmqbfevnw0000mc3a77ejmkbp');
    const res = await t.googlecalendar.api.events.create({
      calendarId: 'primary',
      sendUpdates: 'all',
      event: {
        summary: 'Test Empty Attendees',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString()
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString()
        },
        attendees: [] // Empty attendees array
      }
    });
    console.log('Created event:', res.id);
  } catch (err: any) {
    console.error('Error:', err.message, err.response?.data);
  }
}

main();
