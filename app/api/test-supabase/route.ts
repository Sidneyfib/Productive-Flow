import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Variáveis de ambiente do Supabase não configuradas no servidor.',
        config: { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey },
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const testId = `test-${Date.now()}`;
  const testUserUuid = crypto.randomUUID();
  const testEmail = `teste.${testId}@flowpomodoro.app`;

  const logs: string[] = [];

  try {
    logs.push(`1. Conectando ao Supabase: ${supabaseUrl}`);

    // Passo 1: Inserir usuário na tabela 'users'
    logs.push(`2. Inserindo usuário de teste na tabela 'users' (Email: ${testEmail}, ID: ${testUserUuid})`);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserUuid,
        name: 'Usuário Teste',
        last_name: 'Supabase',
        email: testEmail,
        password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789testpasswordhash',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      logs.push(`❌ Falha ao inserir na tabela 'users': ${userError.message}`);
      return NextResponse.json({
        success: false,
        step: 'insert_user',
        error: userError,
        logs,
        tip: 'Verifique se você já executou o arquivo supabase/schema.sql no SQL Editor do Supabase para criar as tabelas.',
      });
    }

    logs.push(`✅ Usuário inserido com sucesso no Supabase! ID: ${userData.id}`);

    // Passo 2: Inserir preferências
    logs.push(`3. Inserindo preferências padrão na tabela 'user_preferences'`);
    const { error: prefError } = await supabase.from('user_preferences').insert({
      user_id: testUserUuid,
      focus_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      auto_start_breaks: true,
      updated_at: new Date().toISOString(),
    });

    if (prefError) {
      logs.push(`⚠️ Aviso ao inserir preferências: ${prefError.message}`);
    } else {
      logs.push(`✅ Preferências registradas no Supabase!`);
    }

    // Passo 3: Inserir Projeto Padrão
    const projectId = crypto.randomUUID();
    logs.push(`4. Inserindo projeto padrão na tabela 'projects' (ID: ${projectId})`);
    const { error: projError } = await supabase.from('projects').insert({
      id: projectId,
      user_id: testUserUuid,
      name: 'Meu Primeiro Projeto',
      description: 'Projeto de boas-vindas do teste automatizado',
      color: '#3b82f6',
      icon: 'folder',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (projError) {
      logs.push(`⚠️ Aviso ao inserir projeto: ${projError.message}`);
    } else {
      logs.push(`✅ Projeto registrado no Supabase!`);
    }

    // Passo 4: Fazer query de leitura direta para confirmar persistência real
    logs.push(`5. Consultando o banco de dados Supabase para confirmar persistência...`);
    const { data: readBackUser, error: readError } = await supabase
      .from('users')
      .select('id, name, last_name, email, created_at')
      .eq('id', testUserUuid)
      .single();

    if (readError || !readBackUser) {
      logs.push(`❌ Não foi possível ler o usuário recém-criado: ${readError?.message}`);
      return NextResponse.json({
        success: false,
        step: 'verify_read',
        error: readError,
        logs,
      });
    }

    logs.push(`✅ Confirmação concluída! Registro encontrado diretamente no PostgreSQL do Supabase.`);

    return NextResponse.json({
      success: true,
      message: '🎉 Teste de cadastro no Supabase executado com 100% de sucesso!',
      userCreated: readBackUser,
      databaseUrl: supabaseUrl,
      timestamp: new Date().toISOString(),
      logs,
    });
  } catch (err: any) {
    logs.push(`❌ Exceção inesperada: ${err.message}`);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        logs,
      },
      { status: 500 }
    );
  }
}
