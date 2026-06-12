import { corsair } from '../lib/corsair';

async function test() {
  const t = corsair;
  
  try {
    const events = await corsair.withTenant('dev').googlecalendar.api.events.getMany({});
    console.log('Successfully fetched events!');
    console.log(JSON.stringify(events, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching events:', err);
    process.exit(1);
  }
}

test().catch(console.error);
