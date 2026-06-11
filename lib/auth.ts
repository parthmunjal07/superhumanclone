import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-for-dev-only';
const JWT_EXPIRES_IN = '15m'; // Access token lifetime
const REFRESH_EXPIRES_IN = '7d'; // Refresh token lifetime
const REFRESH_COOKIE_NAME = 'corsair_refresh_token';

export type TokenPayload = {
  userId: string;
  email: string;
  role: string;
  teamId?: string | null;
};

// ----------------------------------------
// Token Generation & Verification
// ----------------------------------------

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

// ----------------------------------------
// Cookie Management (App Router)
// ----------------------------------------

export async function setRefreshTokenCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(REFRESH_COOKIE_NAME);
  return cookie?.value;
}

export async function clearRefreshTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

// ----------------------------------------
// Password Hashing
// ----------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ----------------------------------------
// API Middleware Helper
// ----------------------------------------

export function getAccessTokenFromHeader(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}
