import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { AppError, ErrorMessages } from './errors';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface JWTPayload { userId: string; email: string; role: string; plan: string; }

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
export function verifyToken(token: string): JWTPayload {
  try { return jwt.verify(token, JWT_SECRET) as JWTPayload; }
  catch { throw new AppError(ErrorMessages.TOKEN_EXPIRED, 401, 'TOKEN_EXPIRED'); }
}
export function getAuthUser(req: NextRequest): JWTPayload {
  const token = req.headers.get('authorization')?.slice(7) || req.cookies.get('nexus_token')?.value;
  if (!token) throw new AppError(ErrorMessages.UNAUTHORIZED, 401, 'UNAUTHORIZED');
  return verifyToken(token);
}
export function optionalAuth(req: NextRequest): JWTPayload | null {
  try { return getAuthUser(req); } catch { return null; }
}
