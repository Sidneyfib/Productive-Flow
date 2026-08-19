import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getProjectsByUserId, createProject } from '@/lib/db';
import { getSupabaseProjects, createSupabaseProject } from '@/lib/supabase-db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (isSupabaseConfigured()) {
      try {
        const projects = await getSupabaseProjects(user.id);
        return NextResponse.json({ projects });
      } catch (err) {
        console.warn('Supabase projects fetch failed, fallback to local db:', err);
      }
    }

    const projects = getProjectsByUserId(user.id);
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao listar projetos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, color, icon, status, deadline } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome do projeto é obrigatório' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const project = await createSupabaseProject(user.id, {
          name,
          description,
          color,
          icon,
          status,
          deadline,
        });
        if (project) {
          return NextResponse.json({ project }, { status: 201 });
        }
      } catch (err) {
        console.warn('Supabase create project failed, fallback to local db:', err);
      }
    }

    const project = await createProject(user.id, {
      name,
      description,
      color,
      icon,
      status,
      deadline,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar projeto' }, { status: 500 });
  }
}
