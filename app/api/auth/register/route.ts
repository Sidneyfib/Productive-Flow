import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { signToken, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password, lastName } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: 'Por favor, informe seu nome para o cadastro.', code: 'MISSING_NAME', field: 'name' },
        { status: 400 }
      );
    }

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { error: 'Por favor, informe seu endereço de e-mail.', code: 'MISSING_EMAIL', field: 'email' },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Por favor, insira um e-mail válido (exemplo: seu.nome@email.com).', code: 'INVALID_EMAIL', field: 'email' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Por favor, defina uma senha de acesso.', code: 'MISSING_PASSWORD', field: 'password' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 6 caracteres para garantir sua segurança.', code: 'WEAK_PASSWORD', field: 'password' },
        { status: 400 }
      );
    }

    const existingUser = getUserByEmail(trimmedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado no sistema.', code: 'EMAIL_ALREADY_EXISTS', field: 'email' },
        { status: 409 }
      );
    }

    const user = await createUser({
      name: String(name).trim(),
      lastName: lastName ? String(lastName).trim() : undefined,
      email: trimmedEmail,
      password: String(password),
    });

    const token = signToken(user);
    const safeUser = sanitizeUser(user);

    const response = NextResponse.json(
      { user: safeUser, token, message: 'Conta criada com sucesso!' },
      { status: 201 }
    );
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
      { error: 'Não foi possível criar sua conta no momento. Tente novamente mais tarde.', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
