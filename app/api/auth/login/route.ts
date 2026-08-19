import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db';
import { signToken, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      const missingField = !email ? 'email' : 'password';
      return NextResponse.json(
        { 
          error: 'E-mail e senha são obrigatórios para entrar.', 
          code: 'MISSING_FIELDS',
          field: missingField 
        },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = getUserByEmail(trimmedEmail);
    if (!user) {
      return NextResponse.json(
        { 
          error: 'E-mail ou senha incorretos. Verifique seus dados ou crie uma conta.', 
          code: 'INVALID_CREDENTIALS',
          field: 'password'
        },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { 
          error: 'E-mail ou senha incorretos. Verifique suas credenciais.', 
          code: 'INVALID_CREDENTIALS',
          field: 'password'
        },
        { status: 401 }
      );
    }

    const token = signToken(user);
    const safeUser = sanitizeUser(user);

    const response = NextResponse.json(
      { user: safeUser, token, message: 'Login realizado com sucesso!' },
      { status: 200 }
    );

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
      { 
        error: 'Ocorreu uma falha no servidor ao tentar realizar o login. Tente novamente mais tarde.', 
        code: 'SERVER_ERROR' 
      },
      { status: 500 }
    );
  }
}
