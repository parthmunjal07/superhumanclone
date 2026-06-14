import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectSmartChips } from '@/services/EventDetectionService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const email = await prisma.email.findUnique({ where: { id } });
    if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const result = await detectSmartChips(email.subject, email.body, email.from, email.to);
    return NextResponse.json(result || { hasMeeting: false, hasBugOrFeature: false });
  } catch (error) {
    console.error('Smart chips error:', error);
    return NextResponse.json({ hasMeeting: false, hasBugOrFeature: false }, { status: 500 });
  }
}
