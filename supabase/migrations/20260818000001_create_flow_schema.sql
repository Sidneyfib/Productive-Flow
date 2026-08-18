-- ==============================================================================
-- Flow - Migration 001: 3FN Normalized Relational Schema
-- Description: Creates extensions, custom enums, tables, triggers, and indexes
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE project_status_enum AS ENUM ('in_progress', 'delayed', 'planning', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority_enum AS ENUM ('high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status_enum AS ENUM ('todo', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_type_enum AS ENUM ('focus', 'short_break', 'long_break');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Automatic Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. User Profiles Table (Mirrors auth.users or standalone users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) DEFAULT '',
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. User Preferences Table (3FN Normalized 1:1 with User)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    focus_duration INTEGER NOT NULL DEFAULT 25 CHECK (focus_duration >= 1 AND focus_duration <= 120),
    short_break_duration INTEGER NOT NULL DEFAULT 5 CHECK (short_break_duration >= 1 AND short_break_duration <= 60),
    long_break_duration INTEGER NOT NULL DEFAULT 15 CHECK (long_break_duration >= 1 AND long_break_duration <= 90),
    auto_start_breaks BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Projects Table (1:N with User)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT DEFAULT '',
    color VARCHAR(30) NOT NULL DEFAULT '#0f172a',
    icon VARCHAR(50) NOT NULL DEFAULT 'folder',
    status project_status_enum NOT NULL DEFAULT 'in_progress',
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Tasks Table (N:1 with Project and User)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    priority task_priority_enum NOT NULL DEFAULT 'medium',
    status task_status_enum NOT NULL DEFAULT 'todo',
    estimated_pomodoros INTEGER NOT NULL DEFAULT 1 CHECK (estimated_pomodoros >= 1),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 8. Pomodoro Sessions Table (Normalized: foreign keys only, no string snapshots)
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    type session_type_enum NOT NULL DEFAULT 'focus',
    duration_minutes INTEGER NOT NULL DEFAULT 25 CHECK (duration_minutes >= 1),
    completed BOOLEAN NOT NULL DEFAULT true,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Active Timers State (1:1 with User for atomic multi-device sync)
CREATE TABLE IF NOT EXISTS public.active_timers (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    type session_type_enum NOT NULL DEFAULT 'focus',
    total_seconds INTEGER NOT NULL DEFAULT 1500,
    remaining_seconds INTEGER NOT NULL DEFAULT 1500,
    is_running BOOLEAN NOT NULL DEFAULT false,
    started_at_timestamp BIGINT,
    target_end_timestamp BIGINT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_active_timers_updated_at
BEFORE UPDATE ON public.active_timers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user ON public.pomodoro_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task ON public.pomodoro_sessions (task_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_project ON public.pomodoro_sessions (project_id);
