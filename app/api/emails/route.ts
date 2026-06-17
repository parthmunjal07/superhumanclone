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
            date: new Date().toISOString(),
            from: "Elena at Orbit",
            to: "demo@meridian.com",
            subject: "Q3 Product Roadmap Sync",
            snippet: "Hey! Just wanted to share the updated roadmap before our sync tomorrow...",
            body: "Hey! Just wanted to share the updated roadmap before our sync tomorrow...",
            labels: ["INBOX"],
            isRead: false
          },
          {
            id: 'mock-2',
            threadId: 'mock-2',
            historyId: '101',
            internalDate: (Date.now() - 3600000).toString(),
            date: new Date(Date.now() - 3600000).toISOString(),
            from: "Vercel",
            to: "demo@meridian.com",
            subject: "Deployment successful",
            snippet: "Your deployment for meridian-app has completed successfully.",
            body: "Your deployment for meridian-app has completed successfully.",
            labels: ["INBOX", "UPDATES"],
            isRead: true
          },
          {
            id: 'mock-3',
            threadId: 'mock-3',
            historyId: '102',
            internalDate: (Date.now() - 7200000).toString(),
            date: new Date(Date.now() - 7200000).toISOString(),
            from: "Alex Chen",
            to: "demo@meridian.com",
            subject: "Frontend engineering role",
            snippet: "Hi there, I saw the open role for Senior Frontend Engineer and wanted to...",
            body: "Hi there, I saw the open role for Senior Frontend Engineer and wanted to submit my application. I have 6 years of experience building React applications...",
            labels: ["INBOX"],
            isRead: false
          },
          {
            id: 'mock-4',
            threadId: 'mock-4',
            historyId: '103',
            internalDate: (Date.now() - 14400000).toString(),
            date: new Date(Date.now() - 14400000).toISOString(),
            from: "Figma Updates",
            to: "demo@meridian.com",
            subject: "New features in Dev Mode",
            snippet: "See what's new in Dev Mode this month...",
            body: "We've added new annotations, better code generation, and direct GitHub integrations to Dev Mode. Check out the release notes.",
            labels: ["INBOX", "UPDATES"],
            isRead: true
          },
          {
            id: 'mock-5',
            threadId: 'mock-5',
            historyId: '104',
            internalDate: (Date.now() - 28800000).toString(),
            date: new Date(Date.now() - 28800000).toISOString(),
            from: "Sarah Jenkins",
            to: "demo@meridian.com",
            subject: "Invitation: Project Kickoff @ Thu",
            snippet: "You have been invited to Project Kickoff...",
            body: "Please join us for the official kickoff of the new mobile app redesign. We will be discussing timelines and resource allocation.",
            labels: ["INBOX"],
            isRead: false
          },
          {
            id: 'mock-6',
            threadId: 'mock-6',
            historyId: '105',
            internalDate: (Date.now() - 86400000).toString(),
            date: new Date(Date.now() - 86400000).toISOString(),
            from: "AWS Alerts",
            to: "demo@meridian.com",
            subject: "URGENT: High CPU utilization on production",
            snippet: "Alarm: CPUUtilization > 80% for 5 minutes...",
            body: "ALARM STATE: Your production database instance is experiencing high CPU utilization. Please investigate immediately.",
            labels: ["INBOX", "URGENT"],
            isRead: false
          },
          {
            id: 'mock-7',
            threadId: 'mock-7',
            historyId: '106',
            internalDate: (Date.now() - 172800000).toString(),
            date: new Date(Date.now() - 172800000).toISOString(),
            from: "United Airlines",
            to: "demo@meridian.com",
            subject: "Your flight to San Francisco (SFO) is confirmed",
            snippet: "Confirmation number: X7BY9Z. Flight departs at 8:00 AM...",
            body: "Your flight to SFO is confirmed. Check-in opens 24 hours before departure. Don't forget your ID.",
            labels: ["INBOX"],
            isRead: true
          },
          {
            id: 'mock-8',
            threadId: 'mock-8',
            historyId: '107',
            internalDate: (Date.now() - 259200000).toString(),
            date: new Date(Date.now() - 259200000).toISOString(),
            from: "Data Team",
            to: "demo@meridian.com",
            subject: "Weekly Metrics Report",
            snippet: "Active users up 12% week over week. See full dashboard...",
            body: "Great week! Active users grew by 12% and churn decreased by 2%. View the full Metabase dashboard for more details.",
            labels: ["INBOX"],
            isRead: true
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
