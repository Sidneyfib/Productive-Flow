import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { signToken, sanitizeUser } from '@/lib/auth';
import { isSupabaseConfigured, getSupabaseUserByEmail, createSupabaseUser } from '@/lib/supabase-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, lastName } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    if (isSupabaseConfigured()) {
      const supabaseUser = await getSupabaseUserByEmail(normalizedEmail);
      if (supabaseUser) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado no Supabase' },
          { status: 409 }
        );
      }
    }

    const existingLocalUser = getUserByEmail(normalizedEmail);
    if (existingLocalUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado' },
        { status: 409 }
      );
    }

    let user;

    // 1. If Supabase is configured, create directly in Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabaseResult = await createSupabaseUser({
          name: name.trim(),
          lastName: lastName?.trim() || '',
          email: normalizedEmail,
          password,
        });

        if (supabaseResult) {
          user = supabaseResult;
        }
      } catch (sbErr: any) {
        console.error('Failed to create user in Supabase, falling back to local:', sbErr);
      }
    }

    // 2. Fallback / Synchronize to local persistent database
    if (!user) {
      user = await createUser({
        name,
        lastName,
        email: normalizedEmail,
        password,
      });
    }

    const token = signToken(user);
    const safeUser = sanitizeUser(user);

    const response = NextResponse.json({ user: safeUser, token }, { status: 201 });
    response.cookies.set('flow_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
