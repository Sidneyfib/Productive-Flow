-- ==============================================================================
-- Flow - Migration 003: Seed Demo Data (Lucas Mendes)
-- Description: Seeds demo user, projects, tasks, and initial pomodoro history
-- ==============================================================================

DO $$
DECLARE
    demo_user_id UUID;
    p1_id UUID;
    p2_id UUID;
    p3_id UUID;
    p4_id UUID;
    t1_id UUID;
    t2_id UUID;
    t3_id UUID;
    t4_id UUID;
    t5_id UUID;
    t6_id UUID;
BEGIN
    -- Only seed if the demo user does not exist yet
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'lucas.mendes@example.com') THEN

        -- 1. Insert User
        INSERT INTO public.users (id, name, last_name, email, password_hash, avatar)
        VALUES (
            'a0000000-0000-0000-0000-000000000001'::uuid,
            'Lucas',
            'Mendes',
            'lucas.mendes@example.com',
            '$2a$10$X8mR0iO8H1X5yvNcm8m8bOX7Wq6M.o6R0U9a3R1O9zL4gV8h7j3Ky', -- flow123
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        )
        RETURNING id INTO demo_user_id;

        -- 2. Insert User Preferences
        INSERT INTO public.user_preferences (user_id, focus_duration, short_break_duration, long_break_duration, auto_start_breaks)
        VALUES (demo_user_id, 25, 5, 15, true);

        -- 3. Insert Projects
        INSERT INTO public.projects (id, user_id, name, description, color, icon, status, deadline)
        VALUES 
            ('b0000000-0000-0000-0000-000000000001'::uuid, demo_user_id, 'Redesign Website', 'Reformulação completa do site institucional focando em conversão e nova identidade visual.', '#0f172a', 'language', 'in_progress', NOW() + INTERVAL '14 days')
            RETURNING id INTO p1_id;

        INSERT INTO public.projects (id, user_id, name, description, color, icon, status, deadline)
        VALUES 
            ('b0000000-0000-0000-0000-000000000002'::uuid, demo_user_id, 'App Mobile v2.0', 'Desenvolvimento das novas features de gamificação para o aplicativo iOS e Android.', '#f43f5e', 'smartphone', 'delayed', NOW() + INTERVAL '5 days')
            RETURNING id INTO p2_id;

        INSERT INTO public.projects (id, user_id, name, description, color, icon, status, deadline)
        VALUES 
            ('b0000000-0000-0000-0000-000000000003'::uuid, demo_user_id, 'Campanha Black Friday', 'Criação de assets, landing pages e configuração de anúncios para a campanha anual.', '#10b981', 'campaign', 'planning', NOW() + INTERVAL '30 days')
            RETURNING id INTO p3_id;

        INSERT INTO public.projects (id, user_id, name, description, color, icon, status)
        VALUES 
            ('b0000000-0000-0000-0000-000000000004'::uuid, demo_user_id, 'Rotina & Administração', 'Tarefas de rotina, e-mails, alinhamentos e planejamento diário.', '#64748b', 'mail', 'in_progress')
            RETURNING id INTO p4_id;

        -- 4. Insert Tasks
        INSERT INTO public.tasks (id, user_id, project_id, title, description, priority, status, estimated_pomodoros, due_date)
        VALUES 
            ('c0000000-0000-0000-0000-000000000001'::uuid, demo_user_id, p1_id, 'Redesign da Landing Page', 'Criar wireframes e protótipos em alta fidelidade da nova página inicial.', 'high', 'in_progress', 4, NOW() + INTERVAL '2 hours')
            RETURNING id INTO t1_id;

        INSERT INTO public.tasks (id, user_id, project_id, title, description, priority, status, estimated_pomodoros, due_date)
        VALUES 
            ('c0000000-0000-0000-0000-000000000002'::uuid, demo_user_id, p2_id, 'Revisar PR #42', 'Code review detalhado do módulo de autenticação e perfil do aplicativo.', 'medium', 'in_progress', 1, NOW() + INTERVAL '1 day')
            RETURNING id INTO t2_id;

        INSERT INTO public.tasks (id, user_id, project_id, title, description, priority, status, estimated_pomodoros, due_date)
        VALUES 
            ('c0000000-0000-0000-0000-000000000003'::uuid, demo_user_id, p1_id, 'Finalizar wireframes da tela inicial', 'Ajustar espaçamentos, tipografia e hierarquia visual conforme especificações.', 'high', 'todo', 3, NOW() + INTERVAL '6 hours')
            RETURNING id INTO t3_id;

        INSERT INTO public.tasks (id, user_id, project_id, title, description, priority, status, estimated_pomodoros, due_date)
        VALUES 
            ('c0000000-0000-0000-0000-000000000004'::uuid, demo_user_id, p3_id, 'Revisar copy da landing page', 'Revisão textual e gatilhos de conversão para a oferta promocional.', 'medium', 'todo', 2, NOW() + INTERVAL '1 day')
            RETURNING id INTO t4_id;

        INSERT INTO public.tasks (id, user_id, project_id, title, description, priority, status, estimated_pomodoros, completed_at)
        VALUES 
            ('c0000000-0000-0000-0000-000000000005'::uuid, demo_user_id, p4_id, 'Daily Standup & Alinhamento', 'Reunião diária de sincronização da equipe.', 'low', 'completed', 1, NOW() - INTERVAL '3 hours')
            RETURNING id INTO t5_id;

        INSERT INTO public.tasks (id, user_id, project_id, title, description, priority, status, estimated_pomodoros, completed_at)
        VALUES 
            ('c0000000-0000-0000-0000-000000000006'::uuid, demo_user_id, p4_id, 'Responder emails de suporte', 'Triagem de dúvidas técnicas de usuários.', 'low', 'completed', 1, NOW() - INTERVAL '2 hours')
            RETURNING id INTO t6_id;

        -- 5. Insert Pomodoro Sessions
        INSERT INTO public.pomodoro_sessions (user_id, project_id, task_id, type, duration_minutes, completed, started_at, ended_at, notes, created_at)
        VALUES
            (demo_user_id, p1_id, t1_id, 'focus', 25, true, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 35 minutes', 'Foco nos layouts de cabeçalho e herói da landing page.', NOW() - INTERVAL '5.5 hours'),
            (demo_user_id, p1_id, t1_id, 'focus', 25, true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 35 minutes', 'Grid responsivo e prototipação interativa.', NOW() - INTERVAL '4.5 hours'),
            (demo_user_id, p2_id, t2_id, 'focus', 25, true, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 35 minutes', 'Endpoints de autenticação e sanitização de dados.', NOW() - INTERVAL '3.5 hours'),
            (demo_user_id, p4_id, t5_id, 'focus', 25, true, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 35 minutes', 'Limpeza da caixa de entrada e planejamento do sprint.', NOW() - INTERVAL '2.5 hours');

        -- 6. Insert Active Timer
        INSERT INTO public.active_timers (user_id, task_id, project_id, type, total_seconds, remaining_seconds, is_running)
        VALUES (demo_user_id, t1_id, p1_id, 'focus', 1500, 1500, false);

    END IF;
END $$;
