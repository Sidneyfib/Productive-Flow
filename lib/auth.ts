import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getUserById, getUserPreferences, getUserWithPreferences } from './db';
import { getSupabaseUserWithPreferences, isSupabaseConfigured } from './supabase-db';
import { User, UserWithPreferences } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'productive-flow-deep-work-secret-key-2026';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(user: User | UserWithPreferences): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function sanitizeUser(user: User | UserWithPreferences): Omit<UserWithPreferences, 'passwordHash'> {
  const { passwordHash, ...safeUser } = user as any;
  const pref = getUserPreferences(user.id);
  return {
    ...safeUser,
    focusDuration: pref.focusDuration,
    shortBreakDuration: pref.shortBreakDuration,
    longBreakDuration: pref.longBreakDuration,
    autoStartBreaks: pref.autoStartBreaks,
  };
}

export async function getAuthenticatedUser(req: NextRequest): Promise<UserWithPreferences | null> {
  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  let token: string | null = null;

  if (authHeader) {
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  // 2. Check x-access-token header
  if (!token) {
    token = req.headers.get('x-access-token') || null;
  }

  // 3. Check cookies
  if (!token) {
    token = req.cookies.get('flow_token')?.value || null;
  }

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  const localUser = getUserWithPreferences(payload.userId);
  if (localUser) {
    return localUser;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabaseUser = await getSupabaseUserWithPreferences(payload.userId);
      if (supabaseUser) {
        return supabaseUser;
      }
    } catch (err) {
      console.error('Error fetching Supabase user in getAuthenticatedUser:', err);
    }
  }

  return null;
}
