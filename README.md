# Flow — Aplicativo de Produtividade & Técnica Pomodoro (MVP)

> **Flow (Deep Work Mode)** é uma aplicação web full-stack desenvolvida para gerenciamento de tempo, organização de projetos e tarefas através da técnica Pomodoro, com persistência relacional de dados, banco de dados normalizado (3FN), integração com Supabase, sincronização em tempo real e visualização analítica de produtividade.

---

## 1. Justificativa das Decisões Técnicas

### 1.1. Arquitetura da Solução (Full-Stack Integrada)

A solução foi estruturada em 4 camadas bem delimitadas:
1. **Aplicativo Web (Frontend):** Construído com Next.js 15 (App Router), React 19, TypeScript e Tailwind CSS v4. A interface adota o tema *High Density*, priorizando alto contraste, hierarquia visual densa e refinada, foco cognitivo e resposta em tempo real.
2. **Backend:** Executado no runtime Node.js através dos manipuladores de rota do Next.js (`/app/api/*`), centralizando regras de negócio, cálculo dinâmico de métricas de produtividade, controle de sessões e autorização de acesso aos dados.
3. **API RESTful:** Conjunto completo de endpoints com validação de payload, autenticação por token JWT (com persistência via cookies HTTP-only e headers Bearer), além de endpoints otimizados de sincronização (`/api/sync`).
4. **Banco de Dados Persistente & Normalizado (3FN) / Supabase:** Mecanismo de persistência relacional com suporte nativo ao **Supabase (PostgreSQL)** e fallback local atômico no diretório `data/flow_database.json` (*write-through file locking* e troca de arquivos temporários). Todos os dados sobrevivem ao encerramento da aplicação, reinicialização de servidores, reloads de página e trocas de dispositivo.

---

### 1.2. Modelo de Dados Normalizado (3ª Forma Normal - 3FN)

O esquema de dados foi projetado e **normalizado (3FN)**, eliminando redundâncias e anomalias de atualização:

```
┌──────────────────┐         1:1         ┌────────────────────────┐
│       User       ├────────────────────►│     UserPreference     │
└────────┬─────────┘                     └────────────────────────┘
         │
         │ 1:N
         ├───────────────────────────────┐
         │                               │
         ▼ 1:N                           ▼ 1:N
┌──────────────────┐         1:N         ┌────────────────────────┐
│     Project      ├────────────────────►│          Task          │
└────────┬─────────┘                     └───────────┬────────────┘
         │                                           │
         │ 1:N (Opcional)                            │ 1:N (Opcional)
         ▼                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PomodoroSession                         │
└─────────────────────────────────────────────────────────────────┘
```

#### Entidades e Relacionamentos:

1. **`User` (Identidade e Autenticação)**:
   - `id` (PK UUID), `auth_id` (FK auth.users), `name`, `last_name`, `email` (único, normalizado), `password_hash`, `avatar`, `created_at`, `updated_at`.
2. **`UserPreference` (Configurações do Timer - Relação 1:1 com `User`)**:
   - `id` (PK UUID), `user_id` (FK única para `User`), `focus_duration` (padrão 25m), `short_break_duration` (5m), `long_break_duration` (15m), `auto_start_breaks` (booleano), `created_at`, `updated_at`.
3. **`Project` (Projetos / Iniciativas - Relação 1:N com `User`)**:
   - `id` (PK UUID), `user_id` (FK), `name`, `description`, `color`, `icon`, `status` (`in_progress`, `delayed`, `planning`, `completed`), `deadline`, `created_at`, `updated_at`.
4. **`Task` (Tarefas - Relação N:1 com `Project` e `User`)**:
   - `id` (PK UUID), `user_id` (FK), `project_id` (FK opcional), `title`, `description`, `priority` (`high`, `medium`, `low`), `status` (`todo`, `in_progress`, `completed`), `estimated_pomodoros`, `due_date`, `completed_at`, `created_at`, `updated_at`.
   - *Normalização do Contador*: `completedPomodoros` é calculado dinamicamente através de agregação relacional `COUNT(sessions WHERE task_id = task.id AND type = 'focus' AND completed = true)`.
5. **`PomodoroSession` (Histórico de Sessões Pomodoro)**:
   - `id` (PK UUID), `user_id` (FK), `project_id` (FK opcional), `task_id` (FK opcional), `type` (`focus`, `short_break`, `long_break`), `duration_minutes`, `completed`, `started_at`, `ended_at`, `notes`, `created_at`.
6. **`ActiveTimer` (Estado Ativo do Timer)**:
   - `user_id` (PK UUID), `task_id`, `project_id`, `type`, `total_seconds`, `remaining_seconds`, `is_running`, `started_at_timestamp`, `target_end_timestamp`, `updated_at`.

---

## 2. Telas e Funcionalidades Implementadas

1. **Cadastro (`/` - Modo Criar Conta):** Formulário completo com validação de senha e tema *High Density*.
2. **Login (`/` - Modo Entrar):** Autenticação com credenciais e atalho de login rápido de demonstração.
3. **Dashboard:** 4 Cartões KPI, Anel circular SVG de foco, Gráfico semanal, Lista rápida de tarefas com confetes e Progresso de Projetos.
4. **Projetos (`Projetos`):** Grade de cartões de projetos com badges de status, contagem de tarefas e modais de criação/edição.
5. **Tarefas (`Tarefas`):** Busca em tempo real, filtros combinados por Status/Prioridade/Projeto e botão "Focar Agora".
6. **Sessão Pomodoro (`Sessão Pomodoro`):** Display de 120px com anel animado, gerador de áudio Web Audio API (chuva/ruído rosa/ruído branco), bloco de notas e celebração de ciclos.
7. **Histórico (`Histórico`):** Cartões de resumo, filtros por período e linha do tempo com notas.
8. **Estatísticas (`Estatísticas`):** KPIs analíticos, gráfico de barras interativo semanal e distribuição de tempo por projeto.
9. **Perfil (`Perfil`):** Edição de perfil, seleção visual de avatar e configuração personalizada de durações Pomodoro.

---

## 3. Integração com Supabase & Migrations

A pasta `/supabase` contém as migrações completas com DDL, índices, gatilhos de `updated_at` e políticas de segurança RLS:

- `supabase/migrations/20260818000001_create_flow_schema.sql` — Criação das extensões, enums e tabelas em 3FN.
- `supabase/migrations/20260818000002_enable_rls_and_policies.sql` — Habilitação de Row Level Security (RLS) e triggers de onboarding.
- `supabase/migrations/20260818000003_seed_demo_data.sql` — Carga inicial opcional de dados.
- `supabase/schema.sql` — Script consolidado pronto para execução no **Supabase SQL Editor**.

### Como Executar as Migrações:
1. No Supabase Dashboard, abra o **SQL Editor**.
2. Cole o conteúdo de `supabase/schema.sql` e execute (**Run**).
3. Adicione suas credenciais no `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

---

## 4. Como Executar o Projeto Localmente

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acessar a aplicação em `http://localhost:3000`.

4. Conta de Demonstração pré-configurada:
   - **E-mail:** `lucas.mendes@example.com`
   - **Senha:** `flow123`
