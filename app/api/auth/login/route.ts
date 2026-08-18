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
        { error: 'Por favor, informe o seu e-mail e a senha para continuar.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user: any = null;
    let userFound = false;

    // 1. Check Supabase first if configured
    if (isSupabaseConfigured()) {
      console.log(`[Auth] Attempting Supabase login for: ${normalizedEmail}`);
      const sbUser = await getSupabaseUserByEmail(normalizedEmail);
      if (sbUser) {
        userFound = true;
        if (sbUser.passwordHash) {
          const isMatch = await bcrypt.compare(password, sbUser.passwordHash);
          if (isMatch) {
            user = await getSupabaseUserWithPreferences(sbUser.id);
            console.log(`[Auth] Supabase login successful for user ID: ${sbUser.id}`);
          } else {
            console.warn(`[Auth] Password mismatch for Supabase user: ${normalizedEmail}`);
          }
        }
      }
    }

    // 2. Check local database if not authenticated via Supabase
    if (!user) {
      const localUser = getUserByEmail(normalizedEmail);
      if (localUser) {
        userFound = true;
        const isMatch = await bcrypt.compare(password, localUser.passwordHash);
        if (isMatch) {
          user = localUser;
        }
      }
    }

    if (!user) {
      if (!userFound) {
        return NextResponse.json(
          {
            error: 'Nenhuma conta encontrada com este e-mail. Verifique a digitação ou crie uma nova conta.',
            code: 'USER_NOT_FOUND',
          },
          { status: 401 }
        );
      } else {
        return NextResponse.json(
          {
            error: 'Senha incorreta. Por favor, confira sua senha e tente novamente.',
            code: 'INVALID_PASSWORD',
          },
          { status: 401 }
        );
      }
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
