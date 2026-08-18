import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db';
import { signToken, sanitizeUser } from '@/lib/auth';
import { isSupabaseConfigured, getSupabaseUserByEmail, getSupabaseUserWithPreferences } from '@/lib/supabase-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user: any = null;

    // 1. Check Supabase first if configured
    if (isSupabaseConfigured()) {
      const sbUser = await getSupabaseUserByEmail(normalizedEmail);
      if (sbUser && sbUser.passwordHash) {
        const isMatch = await bcrypt.compare(password, sbUser.passwordHash);
        if (isMatch) {
          user = await getSupabaseUserWithPreferences(sbUser.id);
        }
      }
    }

    // 2. Check local database if not authenticated via Supabase
    if (!user) {
      const localUser = getUserByEmail(normalizedEmail);
      if (localUser) {
        const isMatch = await bcrypt.compare(password, localUser.passwordHash);
        if (isMatch) {
          user = localUser;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const token = signToken(user);
    const safeUser = sanitizeUser(user);

    const response = NextResponse.json({ user: safeUser, token }, { status: 200 });
    response.cookies.set('flow_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao realizar login' },
      { status: 500 }
    );
  }
}
