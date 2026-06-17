import { NextResponse } from 'next/server';
import { setRefreshTokenCookie } from '@/lib/auth';

export async function POST() {
  await setRefreshTokenCookie('demo-token');
  return NextResponse.json({ success: true });
}
