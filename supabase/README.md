# 🚀 Guia de Integração e Migrações Supabase — Flow (Deep Work Mode)

Este diretório contém a estrutura completa de banco de dados relacional normalizado (**3ª Forma Normal - 3FN**) pronta para execução no **Supabase** (PostgreSQL).

---

## 📁 Estrutura de Arquivos

```
supabase/
├── migrations/
│   ├── 20260818000001_create_flow_schema.sql       # Extensões, Enums, Tabelas e Índices (3FN)
│   ├── 20260818000002_enable_rls_and_policies.sql   # Row Level Security (RLS) e Triggers de Onboarding
│   └── 20260818000003_seed_demo_data.sql           # Dados de demonstração opcionais (Lucas Mendes)
├── schema.sql                                       # Script consolidado em arquivo único para execução direta no SQL Editor
└── README.md                                        # Este guia de configuração
```

---

## 🛠️ Como Executar as Migrações no Supabase

### Opção 1: Via Painel do Supabase (Mais Rápido / 1 Clique)

1. Acesse o seu projeto em [supabase.com](https://supabase.com/dashboard).
2. No menu lateral esquerdo, clique no ícone **SQL Editor** (`>_`).
3. Clique em **New Query**.
4. Copie todo o conteúdo do arquivo [`supabase/schema.sql`](./schema.sql) e cole no editor.
5. Clique no botão verde **Run** (ou pressione `Ctrl + Enter` / `Cmd + Enter`).
6. Todas as tabelas, índices, enums e políticas de segurança RLS serão criadas instantaneamente.

---

### Opção 2: Via Supabase CLI

Caso você utilize o Supabase CLI localmente:

1. Faça o link com o seu projeto:
   ```bash
   npx supabase link --project-ref seu-project-id
   ```

2. Aplique as migrações:
   ```bash
   npx supabase db push
   ```

---

## 🔑 Configuração das Variáveis de Ambiente

No seu painel do Supabase, acesse **Project Settings** > **API** e obtenha as credenciais. Em seguida, configure-as nas variáveis de ambiente do seu projeto:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

---

## 🛡️ Segurança e Row Level Security (RLS)

- Todas as tabelas (`users`, `user_preferences`, `projects`, `tasks`, `pomodoro_sessions`, `active_timers`) possuem **RLS ativado**.
- Cada usuário autenticado só possui acesso aos seus próprios registros (`user_id = auth.uid()`).
- O trigger `on_auth_user_created` inicializa automaticamente as preferências e o projeto padrão do usuário logo após o cadastro no Supabase Auth.
