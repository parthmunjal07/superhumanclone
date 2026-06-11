import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenFromHeader, verifyToken, TokenPayload } from '@/lib/auth';
import { Role } from '@prisma/client';

export type RoleCheckResult = 
  | { authorized: true; payload: TokenPayload }
  | { authorized: false; response: NextResponse };

export function requireRole(req: NextRequest, ...allowedRoles: (Role | string)[]): RoleCheckResult {
  const token = getAccessTokenFromHeader(req);
  
  if (!token) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 }) 
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 }) 
    };
  }

  if (!allowedRoles.includes(payload.role as Role)) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 }) 
    };
  }

  return { authorized: true, payload };
}
