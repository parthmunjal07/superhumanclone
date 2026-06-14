import { NextResponse } from 'next/server';
import { getCorsairClient } from '@/lib/corsair';

export async function GET() {
  try {
    const tenant = await getCorsairClient('cmqbfevnw0000mc3a77ejmkbp');
    const result = await tenant.run('googlecalendar.api.events.getMany', { calendarId: 'primary' }).catch(e => e.message);
    
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
