import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getRefreshTokenCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export function requireRole(allowedRoles: (Role | string)[], handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    // 1. Read user from session
    const token = await getRefreshTokenCookie();
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let user;
    if (payload.userId === 'demo-user') {
       user = { id: 'demo-user', role: 'FREE', email: 'demo@meridian.com' };
    } else {
       user = await prisma.user.findUnique({ where: { id: payload.userId } });
    }

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

    // Assuming user table has a 'role' field. 
    // Fallback to 'FREE' if your DB doesn't have the column yet.
    const userRole = (user as any).role || 'FREE'; 

    // 2. Gate access (Return 403 if they don't have access)
    // If allowedRoles is empty, we just enforce authentication
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have the required role to perform this action.' }, 
        { status: 403 }
      );
    }

    // 3. Pass execution to the route handler, injecting the authorized user
    return handler(req, { ...args[0], user });
  };
}
