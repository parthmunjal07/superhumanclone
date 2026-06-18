import { NextRequest, NextResponse } from 'next/server';
import { getRefreshTokenCookie, verifyToken } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { generateDigestForUser } from '@/lib/digest';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export const GET = requireRole([], async (req: NextRequest, { user }: { user: any }) => {
  try {
    const userId = user.id;

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `user:${userId}:digest:${today}`;

    if (userId === 'demo-user') {
      const demoDigest = {
        focusSuggestion: "Clear your blockers for the Q3 Roadmap and prepare for the Frontend Engineering interview.",
        actionItems: [
          { type: "reply", text: "Review the updated Q3 Product Roadmap.", from: "Elena at Orbit" },
          { type: "decide", text: "Approve the new UI mockups for the landing page.", from: "Design Team" },
          { type: "delegate", text: "Investigate High CPU utilization on production.", from: "AWS Alerts" }
        ],
        meetings: [
          { title: "Product Sync", time: "10:00 AM", attendees: ["Elena", "David", "You"], notes: ["Review roadmap timelines", "Address Q3 blockers"] },
          { title: "Interview with Alex", time: "2:00 PM", attendees: ["Alex Chen", "You"], notes: ["Senior Frontend Engineer candidate", "Focus on React expertise"] }
        ],
        waitingOn: [
          { name: "Sarah Jenkins", sent: "Yesterday", text: "Awaiting final confirmation on project kickoff resources." },
          { name: "Data Team", text: "Awaiting access to the new Metabase dashboards." }
        ],
        fyi: [
          { title: "Deployment Successful", text: "Your latest production deployment for meridian-app is live." },
          { title: "Flight Confirmation", text: "Your United Airlines flight to SFO is confirmed for 8:00 AM tomorrow." }
        ]
      };
      return NextResponse.json(demoDigest);
    }

    // 1. Check Redis
    // const cached = await redis.get(cacheKey);
    // if (cached && cached !== "null") {
    //   return NextResponse.json(JSON.parse(cached));
    // }

    // 2. Check Database
    const dbDigest = await prisma.digestCache.findFirst({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    if (dbDigest && dbDigest.date.toISOString().startsWith(today) && dbDigest.summary !== "null") {
      // Re-populate redis
      // await redis.set(cacheKey, dbDigest.summary, 'EX', 86400 * 2);
      return NextResponse.json(JSON.parse(dbDigest.summary));
    }

    // 3. Fallback: generate it right now
    const digest = await generateDigestForUser(userId);
    if (!digest) {
      return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 });
    }
    return NextResponse.json(digest);
  } catch (error) {
    console.error('API /digest GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = requireRole([], async (req: NextRequest, { user }: { user: any }) => {
  try {
    const userId = user.id;

    const today = new Date().toISOString().split('T')[0];
    
    if (userId === 'demo-user') {
      const demoDigest = {
        focusSuggestion: "Clear your blockers for the Q3 Roadmap and prepare for the Frontend Engineering interview.",
        actionItems: [
          { type: "reply", text: "Review the updated Q3 Product Roadmap.", from: "Elena at Orbit" },
          { type: "decide", text: "Approve the new UI mockups for the landing page.", from: "Design Team" },
          { type: "delegate", text: "Investigate High CPU utilization on production.", from: "AWS Alerts" }
        ],
        meetings: [
          { title: "Product Sync", time: "10:00 AM", attendees: ["Elena", "David", "You"], notes: ["Review roadmap timelines", "Address Q3 blockers"] },
          { title: "Interview with Alex", time: "2:00 PM", attendees: ["Alex Chen", "You"], notes: ["Senior Frontend Engineer candidate", "Focus on React expertise"] }
        ],
        waitingOn: [
          { name: "Sarah Jenkins", sent: "Yesterday", text: "Awaiting final confirmation on project kickoff resources." },
          { name: "Data Team", text: "Awaiting access to the new Metabase dashboards." }
        ],
        fyi: [
          { title: "Deployment Successful", text: "Your latest production deployment for meridian-app is live." },
          { title: "Flight Confirmation", text: "Your United Airlines flight to SFO is confirmed for 8:00 AM tomorrow." }
        ]
      };
      return NextResponse.json(demoDigest);
    }

    const rateLimitKey = `ratelimit:digest:${userId}:${today}`;
    const requests = await redis.incr(rateLimitKey);
    if (requests === 1) {
      await redis.expire(rateLimitKey, 86400);
    }
    if (requests > 1) {
      return NextResponse.json({ error: "You've reached your daily limit of 1 AI digest. Please upgrade or return tomorrow!" }, { status: 429 });
    }

    // Bust the cache and regenerate
    const cacheKey = `user:${userId}:digest:${today}`;
    await redis.del(cacheKey);

    const digest = await generateDigestForUser(userId);
    if (!digest) {
      return NextResponse.json({ error: 'Failed to regenerate digest' }, { status: 500 });
    }

    return NextResponse.json(digest);
  } catch (error: any) {
    console.error('API /digest POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
});
