import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';

import { EmailService } from '@/services/email.service';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const view = url.searchParams.get('view') || 'INBOX';

    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId;

    if (userId === 'demo-user') {
      return NextResponse.json({
        emails: [
          {
            id: 'mock-1',
            threadId: 'mock-1',
            historyId: '100',
            internalDate: Date.now().toString(),
            from: "Elena at Orbit",
            to: "demo@meridian.com",
            subject: "Q3 Product Roadmap Sync",
            snippet: "Hey! Just wanted to share the updated roadmap before our sync tomorrow...",
            bodyText: "Hey! Just wanted to share the updated roadmap before our sync tomorrow...",
            bodyHtml: "<p>Hey! Just wanted to share the updated roadmap before our sync tomorrow...</p>",
            labels: ["INBOX"],
            isRead: false
          },
          {
            id: 'mock-2',
            threadId: 'mock-2',
            historyId: '101',
            internalDate: (Date.now() - 3600000).toString(),
            from: "Vercel",
            to: "demo@meridian.com",
            subject: "Deployment successful",
            snippet: "Your production deployment for meridian-app is ready.",
            bodyText: "Your production deployment for meridian-app is ready.",
            bodyHtml: "<p>Your production deployment for meridian-app is ready.</p>",
            labels: ["INBOX"],
            isRead: true
          },
          {
            id: 'mock-3',
            threadId: 'mock-3',
            historyId: '102',
            internalDate: (Date.now() - 7200000).toString(),
            from: "Alex Chen",
            to: "demo@meridian.com",
            subject: "Frontend engineering role",
            snippet: "Loved your portfolio. Do you have time for a quick chat this week?",
            bodyText: "Loved your portfolio. Do you have time for a quick chat this week?",
            bodyHtml: "<p>Loved your portfolio. Do you have time for a quick chat this week?</p>",
            labels: ["INBOX"],
            isRead: false
          }
        ],
        nextCursor: null,
      });
    }

    const { emails, nextCursor } = await EmailService.getEmails(userId, limit, cursor, view);

    return NextResponse.json({
      emails,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
