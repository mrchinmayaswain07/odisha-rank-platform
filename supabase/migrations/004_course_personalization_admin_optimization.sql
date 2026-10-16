-- ==============================================================================
-- OdishaRank Course Personalization, Admin Panel & Performance Optimization
-- Migration: 004_course_personalization_admin_optimization.sql
-- ==============================================================================

-- 1. ADD CONTENT WORKFLOW STATUS & METADATA COLUMNS
ALTER TABLE public.exams 
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published';

ALTER TABLE public.subjects 
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published';

ALTER TABLE public.chapters 
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published';

ALTER TABLE public.topics 
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published';

ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS marks NUMERIC(4, 2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS negative_marks NUMERIC(4, 2) DEFAULT 0.25;

ALTER TABLE public.study_materials 
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'notes',
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.mock_tests 
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published';

-- 2. HIGH-PERFORMANCE DATABASE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_target_exam ON public.profiles(target_exam_id);
CREATE INDEX IF NOT EXISTS idx_subjects_exam_id ON public.subjects(exam_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON public.topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_topics_is_official ON public.topics(is_official);
CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON public.questions(exam_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_exam_id ON public.mock_tests(exam_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_topic_id ON public.study_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_student_topic_progress_user ON public.student_topic_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_user ON public.mock_test_attempts(user_id);

-- 3. ADMIN RLS POLICIES FOR SECURE CURATION
-- Exams
DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Subjects
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Chapters
DROP POLICY IF EXISTS "Admins can manage chapters" ON public.chapters;
CREATE POLICY "Admins can manage chapters" ON public.chapters
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Topics
DROP POLICY IF EXISTS "Admins can manage topics" ON public.topics;
CREATE POLICY "Admins can manage topics" ON public.topics
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Questions
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" ON public.questions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Study Materials
DROP POLICY IF EXISTS "Admins can manage study materials" ON public.study_materials;
CREATE POLICY "Admins can manage study materials" ON public.study_materials
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Mock Tests
DROP POLICY IF EXISTS "Admins can manage mock tests" ON public.mock_tests;
CREATE POLICY "Admins can manage mock tests" ON public.mock_tests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Mock Test Questions
DROP POLICY IF EXISTS "Admins can manage mock test questions" ON public.mock_test_questions;
CREATE POLICY "Admins can manage mock test questions" ON public.mock_test_questions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User Roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. GRANTS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO postgres, authenticated, service_role;
