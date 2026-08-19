import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { calculateUserStats } from '@/lib/db';
import { calculateSupabaseUserStats } from '@/lib/supabase-db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (isSupabaseConfigured()) {
      try {
        const stats = await calculateSupabaseUserStats(user.id);
        return NextResponse.json({ stats });
      } catch (err) {
        console.warn('Supabase stats calculation failed, fallback to local db:', err);
      }
    }

    const stats = calculateUserStats(user.id);
    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao calcular estatísticas' }, { status: 500 });
  }
}
