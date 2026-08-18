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
RETURNS UUID AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Users Policies
CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    USING (auth_id = auth.uid() OR id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth_id = auth.uid() OR id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Allow user registration"
    ON public.users FOR INSERT
    WITH CHECK (true);

-- 4. User Preferences Policies
CREATE POLICY "Users can manage own preferences"
    ON public.user_preferences FOR ALL
    USING (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role');

-- 5. Projects Policies
CREATE POLICY "Users can manage own projects"
    ON public.projects FOR ALL
    USING (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role');

-- 6. Tasks Policies
CREATE POLICY "Users can manage own tasks"
    ON public.tasks FOR ALL
    USING (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role');

-- 7. Pomodoro Sessions Policies
CREATE POLICY "Users can manage own sessions"
    ON public.pomodoro_sessions FOR ALL
    USING (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role');

-- 8. Active Timers Policies
CREATE POLICY "Users can manage own active timer"
    ON public.active_timers FOR ALL
    USING (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role')
    WITH CHECK (user_id = public.current_profile_id() OR user_id = auth.uid() OR auth.role() = 'service_role');

-- 9. Automatic Onboarding Trigger for Supabase Auth (auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users if auth schema exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;
