import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { calculateUserStats } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const stats = calculateUserStats(user.id);
    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao calcular estatísticas' }, { status: 500 });
  }
}
