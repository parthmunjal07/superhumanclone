import { NextResponse } from 'next/server';
import { getCorsairClient } from '@/lib/corsair';

export async function GET() {
  try {
    const tenantId = "cmqdzxyju000004jrnqii62zy";
    const tenant = await getCorsairClient(tenantId);
    
    await tenant.gmail.keys.set_access_token(null);
    await tenant.gmail.keys.set_refresh_token(null);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
