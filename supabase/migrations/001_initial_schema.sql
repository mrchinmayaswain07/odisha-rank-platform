-- ==============================================================================
-- OdishaRank Production Database Schema Migration
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTION: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. USER ROLES (Isolated from public profile for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('student', 'admin', 'moderator')) DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXAMS CATALOG
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    conducting_body TEXT NOT NULL, -- OSSC, OSSSC, OPSC, etc.
    description TEXT NOT NULL,
    eligibility TEXT,
    stages JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL,
    target_exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    target_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::integer,
    district TEXT,
    phone TEXT,
    bio TEXT,
    is_profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHAPTERS (Supports official syllabus & student custom chapters)
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_official BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TOPICS (Supports official syllabus & student custom topics)
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    estimated_minutes INTEGER DEFAULT 45,
    order_index INTEGER DEFAULT 0,
    is_official BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. STUDY MATERIALS
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    material_type TEXT NOT NULL CHECK (material_type IN ('text', 'link', 'summary', 'note')),
    content TEXT NOT NULL,
    url TEXT,
    is_official BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STUDENT TOPIC PROGRESS
CREATE TABLE IF NOT EXISTS public.student_topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    completed_at TIMESTAMPTZ,
    last_studied_at TIMESTAMPTZ DEFAULT NOW(),
    confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- 11. STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    notes TEXT,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. QUESTION BANK
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of 4 string options
    correct_option_index INTEGER NOT NULL CHECK (correct_option_index BETWEEN 0 AND 3),
    explanation TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    is_sample BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. QUESTION ATTEMPTS
CREATE TABLE IF NOT EXISTS public.question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    selected_option_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MOCK TESTS
CREATE TABLE IF NOT EXISTS public.mock_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    total_marks NUMERIC(6, 2) NOT NULL,
    negative_marking NUMERIC(4, 2) DEFAULT 0.25,
    pass_percentage NUMERIC(5, 2) DEFAULT 40.0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. MOCK TEST QUESTIONS (M2M)
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    marks NUMERIC(4, 2) DEFAULT 1.0,
    order_index INTEGER DEFAULT 0,
    UNIQUE(mock_test_id, question_id)
);

-- 16. MOCK TEST ATTEMPTS
CREATE TABLE IF NOT EXISTS public.mock_test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
    score NUMERIC(6, 2) DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    unanswered_count INTEGER DEFAULT 0,
    accuracy NUMERIC(5, 2) DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. MOCK TEST ANSWERS
CREATE TABLE IF NOT EXISTS public.mock_test_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.mock_test_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    selected_option_index INTEGER, -- NULL if unanswered
    is_correct BOOLEAN,
    marks_awarded NUMERIC(4, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 18. STUDENT ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.student_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('topic_completed', 'question_attempted', 'mock_test_completed', 'study_session_logged', 'profile_updated')),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PRODUCTION QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_subjects_exam_id ON public.subjects(exam_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON public.topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_topic_id ON public.study_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_student_topic_progress_user ON public.student_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_topic_progress_status ON public.student_topic_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_exam ON public.mock_tests(exam_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_user ON public.mock_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_user ON public.student_activity(user_id, created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Only admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated USING (public.is_admin());

-- profiles
CREATE POLICY "Profiles are viewable by owner and admins" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- exams (Public catalog viewable by anyone, managed by admins)
CREATE POLICY "Exams viewable by all" ON public.exams
    FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can manage exams" ON public.exams
    FOR ALL TO authenticated USING (public.is_admin());

-- subjects (Viewable by all, managed by admins)
CREATE POLICY "Subjects viewable by all" ON public.subjects
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects
    FOR ALL TO authenticated USING (public.is_admin());

-- chapters (Official viewable by all; custom viewable by creator)
CREATE POLICY "Chapters viewable if official or owned" ON public.chapters
    FOR SELECT TO anon, authenticated USING (is_official = true OR auth.uid() = created_by OR public.is_admin());
CREATE POLICY "Students can insert custom chapters" ON public.chapters
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Students can update own chapters" ON public.chapters
    FOR UPDATE TO authenticated USING (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Students can delete own chapters" ON public.chapters
    FOR DELETE TO authenticated USING (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Admins can manage all chapters" ON public.chapters
    FOR ALL TO authenticated USING (public.is_admin());

-- topics (Official viewable by all; custom viewable by creator)
CREATE POLICY "Topics viewable if official or owned" ON public.topics
    FOR SELECT TO anon, authenticated USING (is_official = true OR auth.uid() = created_by OR public.is_admin());
CREATE POLICY "Students can insert custom topics" ON public.topics
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Students can update own topics" ON public.topics
    FOR UPDATE TO authenticated USING (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Students can delete own topics" ON public.topics
    FOR DELETE TO authenticated USING (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Admins can manage all topics" ON public.topics
    FOR ALL TO authenticated USING (public.is_admin());

-- study_materials (Official viewable by all; custom viewable by creator)
CREATE POLICY "Study materials viewable if official or owned" ON public.study_materials
    FOR SELECT TO anon, authenticated USING (is_official = true OR auth.uid() = created_by OR public.is_admin());
CREATE POLICY "Students can insert custom study materials" ON public.study_materials
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Students can update own study materials" ON public.study_materials
    FOR UPDATE TO authenticated USING (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Students can delete own study materials" ON public.study_materials
    FOR DELETE TO authenticated USING (auth.uid() = created_by AND is_official = false);
CREATE POLICY "Admins can manage all study materials" ON public.study_materials
    FOR ALL TO authenticated USING (public.is_admin());

-- student_topic_progress (Strictly owner-only)
CREATE POLICY "Users can manage own topic progress" ON public.student_topic_progress
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- study_sessions (Strictly owner-only)
CREATE POLICY "Users can manage own study sessions" ON public.study_sessions
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- questions (Questions viewable by authenticated users & sample by anon)
CREATE POLICY "Questions viewable by all" ON public.questions
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage questions" ON public.questions
    FOR ALL TO authenticated USING (public.is_admin());

-- question_attempts (Strictly owner-only)
CREATE POLICY "Users can manage own question attempts" ON public.question_attempts
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- mock_tests (Viewable by all if published; managed by admins)
CREATE POLICY "Mock tests viewable by all" ON public.mock_tests
    FOR SELECT TO anon, authenticated USING (is_published = true OR public.is_admin());
CREATE POLICY "Admins can manage mock tests" ON public.mock_tests
    FOR ALL TO authenticated USING (public.is_admin());

-- mock_test_questions (Viewable by authenticated users)
CREATE POLICY "Mock test questions viewable" ON public.mock_test_questions
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage mock test questions" ON public.mock_test_questions
    FOR ALL TO authenticated USING (public.is_admin());

-- mock_test_attempts (Strictly owner-only)
CREATE POLICY "Users can manage own mock attempts" ON public.mock_test_attempts
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- mock_test_answers (Strictly owner-only via attempt)
CREATE POLICY "Users can manage own mock test answers" ON public.mock_test_answers
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.mock_test_attempts a
            WHERE a.id = mock_test_answers.attempt_id AND a.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.mock_test_attempts a
            WHERE a.id = mock_test_answers.attempt_id AND a.user_id = auth.uid()
        )
    );

-- student_activity (Strictly owner-only)
CREATE POLICY "Users can manage own activity log" ON public.student_activity
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- TRIGGER FOR AUTO-CREATING USER PROFILE & STUDENT ROLE ON REGISTRATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.profiles
  INSERT INTO public.profiles (id, email, full_name, is_profile_completed)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
