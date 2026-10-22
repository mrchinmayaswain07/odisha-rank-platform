-- ============================================================
-- ODISHA RANK - CUSTOMIZABLE STUDY PLANNER & EXAM PREPARATION SYSTEM
-- Migration: 008_study_planner_system.sql
-- Lightweight, RLS-enforced, Supabase Free-Tier Friendly.
-- ============================================================

-- 1. STUDENT STUDY GOALS (Customizable preparation hours, exam countdown, preferences)
CREATE TABLE IF NOT EXISTS public.student_study_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    target_total_hours NUMERIC NOT NULL DEFAULT 300 CHECK (target_total_hours > 0),
    daily_target_hours NUMERIC NOT NULL DEFAULT 3 CHECK (daily_target_hours > 0),
    weekly_target_hours NUMERIC NOT NULL DEFAULT 20 CHECK (weekly_target_hours > 0),
    daily_topics_target INTEGER NOT NULL DEFAULT 3 CHECK (daily_topics_target > 0),
    exam_date DATE,
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'reset')) DEFAULT 'active',
    timetable_config JSONB DEFAULT '{}'::jsonb,
    subject_priorities JSONB DEFAULT '[]'::jsonb,
    learning_preferences JSONB DEFAULT '{
        "language": "en",
        "revision_system": "spaced_repetition",
        "spaced_intervals": [1, 3, 7, 21],
        "daily_reminder_enabled": true,
        "reminder_time": "07:00",
        "quiet_hours": {"start": "23:00", "end": "06:00"}
    }'::jsonb,
    notification_settings JSONB DEFAULT '{
        "task_reminders": true,
        "revision_alerts": true,
        "daily_goal_prompt": true,
        "streak_warning": true,
        "sound_enabled": true,
        "reminder_time": "07:00",
        "quiet_hours_start": "23:00",
        "quiet_hours_end": "06:00"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDENT STUDY TASKS (Individual study, practice, mock, revision, and brain gym tasks)
CREATE TABLE IF NOT EXISTS public.student_study_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('study', 'practice', 'mock', 'revision', 'braingym', 'custom')) DEFAULT 'study',
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes >= 0),
    target_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (target_duration_minutes >= 0),
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    notes TEXT,
    deadline_time TEXT,
    order_index INTEGER DEFAULT 0,
    rescheduled_from DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENT TOPIC CUSTOMIZATIONS (Difficulty, Prelims/Mains stage, revision schedule, personal notes)
CREATE TABLE IF NOT EXISTS public.student_topic_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    stage TEXT CHECK (stage IN ('prelims', 'mains', 'both')) DEFAULT 'both',
    estimated_hours NUMERIC DEFAULT 1,
    personal_notes TEXT,
    needs_revision BOOLEAN DEFAULT FALSE,
    last_revised_at TIMESTAMPTZ,
    next_revision_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- ============================================================
-- PERFORMANCE INDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_student_study_goals_user ON public.student_study_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_student_study_tasks_user_date ON public.student_study_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_student_study_tasks_status ON public.student_study_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_student_topic_customizations_user ON public.student_topic_customizations(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_student_topic_customizations_rev ON public.student_topic_customizations(user_id, next_revision_date) WHERE needs_revision = TRUE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.student_study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_topic_customizations ENABLE ROW LEVEL SECURITY;

-- Goals Policies
CREATE POLICY "Users can manage own study goal"
    ON public.student_study_goals
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can manage own study tasks"
    ON public.student_study_tasks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Topic Customizations Policies
CREATE POLICY "Users can manage own topic customizations"
    ON public.student_topic_customizations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
