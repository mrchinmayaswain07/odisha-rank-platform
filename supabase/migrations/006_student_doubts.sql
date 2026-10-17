-- ==============================================================================
-- 006_STUDENT_DOUBTS.SQL: Student Doubts & Clarification System
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT,
    subject TEXT NOT NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by TEXT,
    answered_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pending', 'answered', 'resolved')) DEFAULT 'pending',
    is_private BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    is_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_doubts_user ON public.student_doubts(user_id);
CREATE INDEX IF NOT EXISTS idx_student_doubts_status ON public.student_doubts(status);
CREATE INDEX IF NOT EXISTS idx_student_doubts_privacy ON public.student_doubts(is_private);

ALTER TABLE public.student_doubts ENABLE ROW LEVEL SECURITY;

-- 1. Public answered doubts are visible to everyone
CREATE POLICY "Public answered doubts are viewable by all" ON public.student_doubts
    FOR SELECT USING (is_private = false AND status = 'answered');

-- 2. Students can view all their own submitted doubts (public and private)
CREATE POLICY "Students can view own submitted doubts" ON public.student_doubts
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Authenticated students can submit doubts
CREATE POLICY "Students can submit doubts" ON public.student_doubts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Authorized admins can view and manage all doubts
CREATE POLICY "Admins have full access to doubts" ON public.student_doubts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
