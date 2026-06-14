import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { collapseThreadDecisionLog } from '@/services/EventDetectionService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const email = await prisma.email.findUnique({ where: { id } });
    if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const threadContent = `Subject: ${email.subject}\n\nBody:\n${email.body}`;
    const result = await collapseThreadDecisionLog(threadContent);
    
    if (!result) return NextResponse.json({ error: 'Failed to generate log' }, { status: 500 });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Decision log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
