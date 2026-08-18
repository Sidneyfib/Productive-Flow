import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, sanitizeUser } from '@/lib/auth';
import { updateUser } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar usuário' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, lastName, avatar, focusDuration, shortBreakDuration, longBreakDuration, autoStartBreaks } = body;

    const updates: any = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof lastName === 'string') updates.lastName = lastName.trim();
    if (typeof avatar === 'string') updates.avatar = avatar;
    if (typeof focusDuration === 'number' && focusDuration > 0) updates.focusDuration = focusDuration;
    if (typeof shortBreakDuration === 'number' && shortBreakDuration > 0) updates.shortBreakDuration = shortBreakDuration;
    if (typeof longBreakDuration === 'number' && longBreakDuration > 0) updates.longBreakDuration = longBreakDuration;
    if (typeof autoStartBreaks === 'boolean') updates.autoStartBreaks = autoStartBreaks;

    const updatedUser = await updateUser(user.id, updates);
    return NextResponse.json({ user: sanitizeUser(updatedUser) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
