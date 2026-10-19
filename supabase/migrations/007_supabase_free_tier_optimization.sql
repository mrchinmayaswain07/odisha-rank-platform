-- ==============================================================================
-- OdishaRank Supabase Free Plan Optimization Migration
-- Migration: 007_supabase_free_tier_optimization.sql
-- Description:
-- 1. Adds RPC functions to aggregate counts in a single round-trip instead of
--    fetching thousands of rows or executing multiple parallel HEAD queries.
-- 2. Adds composite indexes for hot query paths (filtering, sorting, pagination).
-- 3. Grants execute permissions for authenticated & service roles.
-- ==============================================================================

-- 1. AGGREGATE FUNCTION: Fast Exam Enrollment Counts
-- Replaces client-side 'SELECT target_exam_id FROM profiles' that dumped entire table.
CREATE OR REPLACE FUNCTION public.get_exam_enrollment_counts()
RETURNS TABLE (exam_id UUID, student_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    target_exam_id AS exam_id, 
    COUNT(*)::BIGINT AS student_count
  FROM public.profiles
  WHERE target_exam_id IS NOT NULL
  GROUP BY target_exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. AGGREGATE FUNCTION: Single-Query Admin Dashboard Counts
-- Replaces 8 separate HEAD count HTTP network round-trips with 1 single call.
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_counts()
RETURNS JSONB AS $$
DECLARE
  counts JSONB;
BEGIN
  SELECT json_build_object(
    'total_students', (SELECT COUNT(*) FROM public.profiles),
    'total_courses', (SELECT COUNT(*) FROM public.exams WHERE status != 'archived'),
    'total_subjects', (SELECT COUNT(*) FROM public.subjects WHERE status != 'archived'),
    'total_chapters', (SELECT COUNT(*) FROM public.chapters WHERE status != 'archived'),
    'total_topics', (SELECT COUNT(*) FROM public.topics WHERE status != 'archived'),
    'total_materials', (SELECT COUNT(*) FROM public.study_materials WHERE status != 'archived'),
    'total_questions', (SELECT COUNT(*) FROM public.questions WHERE status != 'archived'),
    'total_mock_tests', (SELECT COUNT(*) FROM public.mock_tests WHERE status != 'archived')
  ) INTO counts;
  RETURN counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. COMPOSITE INDEXES FOR HOT QUERY PATHS & ZERO DISK THRASHING
-- Questions Bank: sorting and filtering by exam & difficulty
CREATE INDEX IF NOT EXISTS idx_questions_created_at_desc ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_exam_diff ON public.questions(exam_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions(chapter_id) WHERE chapter_id IS NOT NULL;

-- Study Materials: topic list and exam filter
CREATE INDEX IF NOT EXISTS idx_study_materials_topic_created ON public.study_materials(topic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_materials_exam ON public.study_materials(exam_id) WHERE exam_id IS NOT NULL;

-- Student Topic Progress: user status lookups
CREATE INDEX IF NOT EXISTS idx_student_topic_prog_user_stat ON public.student_topic_progress(user_id, status);

-- Question Attempts: user activity and performance lookups
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_created ON public.question_attempts(user_id, created_at DESC);

-- Mock Test Attempts: user completed tests
CREATE INDEX IF NOT EXISTS idx_mock_attempts_user_status ON public.mock_test_attempts(user_id, status, completed_at DESC);

-- 4. GRANTS FOR RPC ACCESS
GRANT EXECUTE ON FUNCTION public.get_exam_enrollment_counts() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_counts() TO authenticated, service_role;
