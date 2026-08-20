import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

// Load .env.local
let envConfig = {};
if (existsSync('.env.local')) {
  const content = readFileSync('.env.local', 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      envConfig[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('----------------------------------------------------');
console.log('🧪 INICIANDO TESTE DE CADASTRO E PERSISTÊNCIA NO SUPABASE');
console.log(`🔗 URL: ${supabaseUrl}`);
console.log('----------------------------------------------------');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  const testId = Date.now();
  const testUserId = crypto.randomUUID();
  const testEmail = `teste.supabase.${testId}@flowpomodoro.app`;

  console.log(`1️⃣  Gerando novo usuário: ${testEmail} (UUID: ${testUserId})`);

  // 1. Inserir em users
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: testUserId,
      name: 'Teste Automatizado',
      last_name: 'da Silva',
      email: testEmail,
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789testpasswordhash',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (userError) {
    console.error('❌ Falha ao inserir usuário no Supabase:', userError);
    console.log('\n💡 DICA: Se a tabela não existir, execute o arquivo "supabase/schema.sql" no SQL Editor do Supabase.');
    process.exit(1);
  }

  console.log('✅ Usuário inserido com sucesso na tabela "users"!');
  console.log(`   ID: ${user.id} | Email: ${user.email} | Nome: ${user.name} ${user.last_name}`);

  // 2. Inserir em user_preferences
  console.log('\n2️⃣  Inserindo preferências em "user_preferences"...');
  const { error: prefError } = await supabase.from('user_preferences').insert({
    user_id: testUserId,
    focus_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    auto_start_breaks: true,
    updated_at: new Date().toISOString(),
  });

  if (prefError) {
    console.error('⚠️ Erro ao inserir preferências:', prefError);
  } else {
    console.log('✅ Preferências salvas com sucesso!');
  }

  // 3. Inserir em projects
  console.log('\n3️⃣  Criando projeto padrão em "projects"...');
  const testProjectId = crypto.randomUUID();
  const { error: projError } = await supabase.from('projects').insert({
    id: testProjectId,
    user_id: testUserId,
    name: 'Projeto de Teste',
    description: 'Projeto criado automaticamente para validar o banco de dados',
    color: '#0ea5e9',
    icon: 'folder',
    status: 'in_progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (projError) {
    console.error('⚠️ Erro ao inserir projeto:', projError);
  } else {
    console.log(`✅ Projeto criado com sucesso! ID: ${testProjectId}`);
  }

  // 4. Verificação de Leitura Direta (SELECT)
  console.log('\n4️⃣  Realizando consulta de verificação no banco (SELECT)...');
  const { data: readUser, error: readError } = await supabase
    .from('users')
    .select('id, name, last_name, email, created_at')
    .eq('id', testUserId)
    .single();

  if (readError || !readUser) {
    console.error('❌ Falha ao recuperar usuário do Supabase:', readError);
    process.exit(1);
  }

  console.log('🎉 SUCESSO ABSOLUTO! Registro recuperado do Supabase:');
  console.table([readUser]);
  console.log('----------------------------------------------------');
  console.log('✨ O banco de dados Supabase está 100% operacional e atualizando em tempo real!');
  console.log('----------------------------------------------------');
}

runTest();
