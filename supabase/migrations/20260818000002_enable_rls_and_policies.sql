-- ==============================================================================
-- Flow - Migration 002: Row Level Security (RLS) & Security Policies
-- Description: Enforces multi-tenant data isolation and automatic user onboarding
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to get the current profile id from auth.uid()
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT id FROM public.users WHERE auth_id = (SELECT auth.uid()) OR id = (SELECT auth.uid()) LIMIT 1;
$$;

-- 3. Users Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth_id = (SELECT auth.uid()) OR id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth_id = (SELECT auth.uid()) OR id = (SELECT auth.uid()))
    WITH CHECK (auth_id = (SELECT auth.uid()) OR id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (auth_id = (SELECT auth.uid()) OR id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profile"
    ON public.users FOR DELETE
    TO authenticated
    USING (auth_id = (SELECT auth.uid()) OR id = (SELECT auth.uid()));

-- 4. User Preferences Policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences"
    ON public.user_preferences FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id())
    WITH CHECK (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id());

-- 5. Projects Policies
DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
CREATE POLICY "Users can manage own projects"
    ON public.projects FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id())
    WITH CHECK (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id());

-- 6. Tasks Policies
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks"
    ON public.tasks FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id())
    WITH CHECK (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id());

-- 7. Pomodoro Sessions Policies
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can manage own sessions"
    ON public.pomodoro_sessions FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id())
    WITH CHECK (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id());

-- 8. Active Timers Policies
DROP POLICY IF EXISTS "Users can manage own active timer" ON public.active_timers;
CREATE POLICY "Users can manage own active timer"
    ON public.active_timers FOR ALL
    TO authenticated
    USING (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id())
    WITH CHECK (user_id = (SELECT auth.uid()) OR user_id = public.current_profile_id());

-- 9. Automatic Onboarding Trigger for Supabase Auth (auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_user_id UUID;
    user_full_name TEXT;
BEGIN
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

    -- 1. Create Public User Profile
    INSERT INTO public.users (auth_id, email, name, last_name, avatar)
    VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
    )
    RETURNING id INTO new_user_id;

    -- 2. Create Default User Preferences (3FN 1:1)
    INSERT INTO public.user_preferences (user_id, focus_duration, short_break_duration, long_break_duration, auto_start_breaks)
    VALUES (new_user_id, 25, 5, 15, true);

    -- 3. Create Default Project
    INSERT INTO public.projects (user_id, name, description, color, icon, status)
    VALUES (new_user_id, 'Geral', 'Projeto padrão para organização de tarefas gerais', '#0f172a', 'folder', 'in_progress');

    -- 4. Initialize Active Timer
    INSERT INTO public.active_timers (user_id, type, total_seconds, remaining_seconds, is_running)
    VALUES (new_user_id, 'focus', 1500, 1500, false);

    RETURN NEW;
END;
$$;

-- Attach trigger to auth.users if auth schema exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- 10. Function Access & Security Hardening
-- Revoke public execution on internal and trigger functions to prevent unauthorized RPC calls
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.current_profile_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated, service_role;
