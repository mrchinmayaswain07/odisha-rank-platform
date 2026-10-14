import { createClient } from "./supabase/server";
import {
  Exam,
  Subject,
  Chapter,
  Topic,
  StudyMaterial,
  Question,
  MockTest,
  Profile,
  DashboardMetrics,
  StudentActivity
} from "./types";
import {
  SEED_EXAMS,
  SEED_SUBJECTS,
  SEED_CHAPTERS,
  SEED_TOPICS,
  SEED_MATERIALS,
  SEED_QUESTIONS,
  SEED_MOCK_TESTS
} from "./mock-data";

/**
 * Checks if Supabase URL and anon key are properly configured
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("placeholder"));
}

export async function getExams(): Promise<Exam[]> {
  if (!isSupabaseConfigured()) {
    return SEED_EXAMS;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return SEED_EXAMS;
    }
    return data as Exam[];
  } catch {
    return SEED_EXAMS;
  }
}

export async function getExamBySlug(slug: string): Promise<Exam | null> {
  const exams = await getExams();
  return exams.find((e) => e.slug === slug) || null;
}

export async function getSubjects(examId?: string): Promise<Subject[]> {
  if (!isSupabaseConfigured()) {
    if (examId) return SEED_SUBJECTS.filter((s) => s.exam_id === examId);
    return SEED_SUBJECTS;
  }

  try {
    const supabase = await createClient();
    let query = supabase.from("subjects").select("*").order("order_index", { ascending: true });
    if (examId) {
      query = query.eq("exam_id", examId);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return examId ? SEED_SUBJECTS.filter((s) => s.exam_id === examId) : SEED_SUBJECTS;
    }
    return data as Subject[];
  } catch {
    return examId ? SEED_SUBJECTS.filter((s) => s.exam_id === examId) : SEED_SUBJECTS;
  }
}

export async function getChapters(subjectId: string, userId?: string): Promise<Chapter[]> {
  if (!isSupabaseConfigured()) {
    return SEED_CHAPTERS.filter((c) => c.subject_id === subjectId);
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("chapters")
      .select("*, topics(*)")
      .eq("subject_id", subjectId)
      .order("order_index", { ascending: true });

    if (userId) {
      query = query.or(`is_official.eq.true,created_by.eq.${userId}`);
    } else {
      query = query.eq("is_official", true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return SEED_CHAPTERS.filter((c) => c.subject_id === subjectId);
    }
    return data as Chapter[];
  } catch {
    return SEED_CHAPTERS.filter((c) => c.subject_id === subjectId);
  }
}

export async function getTopics(chapterId: string, userId?: string): Promise<Topic[]> {
  if (!isSupabaseConfigured()) {
    return SEED_TOPICS.filter((t) => t.chapter_id === chapterId);
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("topics")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("order_index", { ascending: true });

    if (userId) {
      query = query.or(`is_official.eq.true,created_by.eq.${userId}`);
    } else {
      query = query.eq("is_official", true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return SEED_TOPICS.filter((t) => t.chapter_id === chapterId);
    }
    return data as Topic[];
  } catch {
    return SEED_TOPICS.filter((t) => t.chapter_id === chapterId);
  }
}

export async function getStudyMaterials(topicId: string): Promise<StudyMaterial[]> {
  if (!isSupabaseConfigured()) {
    return SEED_MATERIALS.filter((m) => m.topic_id === topicId);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_materials")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return SEED_MATERIALS.filter((m) => m.topic_id === topicId);
    }
    return data as StudyMaterial[];
  } catch {
    return SEED_MATERIALS.filter((m) => m.topic_id === topicId);
  }
}

export async function getQuestions(filters?: {
  examId?: string;
  subjectId?: string;
  difficulty?: string;
}): Promise<Question[]> {
  if (!isSupabaseConfigured()) {
    let result = SEED_QUESTIONS;
    if (filters?.subjectId) {
      result = result.filter((q) => q.subject_id === filters.subjectId);
    }
    if (filters?.difficulty) {
      result = result.filter((q) => q.difficulty === filters.difficulty);
    }
    return result;
  }

  try {
    const supabase = await createClient();
    let query = supabase.from("questions").select("*").order("created_at", { ascending: false });

    if (filters?.examId) query = query.eq("exam_id", filters.examId);
    if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
    if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let fallback = SEED_QUESTIONS;
      if (filters?.subjectId) fallback = fallback.filter((q) => q.subject_id === filters.subjectId);
      if (filters?.difficulty) fallback = fallback.filter((q) => q.difficulty === filters.difficulty);
      return fallback;
    }
    return data as Question[];
  } catch {
    return SEED_QUESTIONS;
  }
}

export async function getMockTests(examId?: string): Promise<MockTest[]> {
  if (!isSupabaseConfigured()) {
    if (examId) return SEED_MOCK_TESTS.filter((m) => m.exam_id === examId);
    return SEED_MOCK_TESTS;
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("mock_tests")
      .select("*, mock_test_questions(count)")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (examId) query = query.eq("exam_id", examId);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return examId ? SEED_MOCK_TESTS.filter((m) => m.exam_id === examId) : SEED_MOCK_TESTS;
    }
    return data.map((item: any) => ({
      ...item,
      questions_count: item.mock_test_questions?.[0]?.count ?? 0,
    })) as MockTest[];
  } catch {
    return examId ? SEED_MOCK_TESTS.filter((m) => m.exam_id === examId) : SEED_MOCK_TESTS;
  }
}

export async function getMockTestById(id: string): Promise<{ test: MockTest; questions: Question[] } | null> {
  if (!isSupabaseConfigured()) {
    const test = SEED_MOCK_TESTS.find((m) => m.id === id);
    if (!test) return null;
    return { test, questions: SEED_QUESTIONS };
  }

  try {
    const supabase = await createClient();
    const { data: test, error: testErr } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("id", id)
      .single();

    if (testErr || !test) {
      const fallback = SEED_MOCK_TESTS.find((m) => m.id === id);
      return fallback ? { test: fallback, questions: SEED_QUESTIONS } : null;
    }

    const { data: mtq, error: qErr } = await supabase
      .from("mock_test_questions")
      .select("question_id, order_index, questions(*)")
      .eq("mock_test_id", id)
      .order("order_index", { ascending: true });

    if (qErr || !mtq || mtq.length === 0) {
      return { test, questions: SEED_QUESTIONS };
    }

    const questions = mtq.map((row: any) => row.questions).filter(Boolean) as Question[];
    return { test, questions };
  } catch {
    const fallback = SEED_MOCK_TESTS.find((m) => m.id === id);
    return fallback ? { test: fallback, questions: SEED_QUESTIONS } : null;
  }
}

export async function getStudentProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    return {
      id: userId,
      email: "student@odisharank.in",
      full_name: "Aspirant Scholar",
      target_exam_id: SEED_EXAMS[0].id,
      target_year: 2026,
      district: "Khordha (Bhubaneswar)",
      phone: "9876543210",
      bio: "Preparing for Odisha Government Exams with dedication.",
      is_profile_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

/**
 * Calculates genuine student dashboard metrics directly from DB tables.
 * Never fabricates counts, streaks, or progress.
 */
export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  if (!isSupabaseConfigured()) {
    // Return honest zeroed / demonstration initial state for preview
    return {
      study_hours: 0,
      questions_practiced: 0,
      mock_tests_completed: 0,
      study_streak_days: 0,
      official_progress_percentage: 0,
      personal_progress_percentage: 0,
      total_official_topics: SEED_TOPICS.length,
      completed_official_topics: 0,
      total_personal_topics: 0,
      completed_personal_topics: 0,
      recent_activities: [],
      subject_progress: SEED_SUBJECTS.map((s) => ({
        subject_id: s.id,
        subject_name: s.name,
        total_topics: 1,
        completed_topics: 0,
        progress_percentage: 0,
      })),
    };
  }

  try {
    const supabase = await createClient();

    // 1. Study Hours from study_sessions
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("duration_minutes, session_date")
      .eq("user_id", userId);

    const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
    const studyHours = Math.round((totalMinutes / 60) * 10) / 10;

    // 2. Questions Practiced from question_attempts
    const { count: questionsCount } = await supabase
      .from("question_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // 3. Mock Tests Completed
    const { count: mocksCount } = await supabase
      .from("mock_test_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    // 4. Calculate Streak from session dates and activity dates
    const sessionDates = new Set(sessions?.map((s) => s.session_date) || []);
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (sessionDates.has(dateStr)) {
        streakDays++;
      } else if (i === 0) {
        // Today might not have session yet, check yesterday
        continue;
      } else {
        break;
      }
    }

    // 5. Official vs Personal Syllabus Progress
    // Fetch all topics and user progress
    const { data: allTopics } = await supabase
      .from("topics")
      .select("id, is_official, chapter_id, chapters(subject_id)");

    const { data: userProgress } = await supabase
      .from("student_topic_progress")
      .select("topic_id, status")
      .eq("user_id", userId)
      .eq("status", "completed");

    const completedTopicIds = new Set(userProgress?.map((p) => p.topic_id) || []);

    const officialTopics = allTopics?.filter((t) => t.is_official) || [];
    const personalTopics = allTopics?.filter((t) => !t.is_official) || [];

    const completedOfficial = officialTopics.filter((t) => completedTopicIds.has(t.id)).length;
    const completedPersonal = personalTopics.filter((t) => completedTopicIds.has(t.id)).length;

    const officialProgress =
      officialTopics.length > 0 ? Math.round((completedOfficial / officialTopics.length) * 100) : 0;
    const personalProgress =
      personalTopics.length > 0 ? Math.round((completedPersonal / personalTopics.length) * 100) : 0;

    // 6. Recent Activity
    const { data: activities } = await supabase
      .from("student_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6);

    // 7. Subject breakdown
    const subjects = await getSubjects();
    const subjectProgress = subjects.map((sub) => {
      const subTopics =
        allTopics?.filter((t: any) => t.chapters?.subject_id === sub.id && t.is_official) || [];
      const subCompleted = subTopics.filter((t) => completedTopicIds.has(t.id)).length;
      return {
        subject_id: sub.id,
        subject_name: sub.name,
        total_topics: subTopics.length,
        completed_topics: subCompleted,
        progress_percentage: subTopics.length > 0 ? Math.round((subCompleted / subTopics.length) * 100) : 0,
      };
    });

    return {
      study_hours: studyHours,
      questions_practiced: questionsCount || 0,
      mock_tests_completed: mocksCount || 0,
      study_streak_days: streakDays,
      official_progress_percentage: officialProgress,
      personal_progress_percentage: personalProgress,
      total_official_topics: officialTopics.length,
      completed_official_topics: completedOfficial,
      total_personal_topics: personalTopics.length,
      completed_personal_topics: completedPersonal,
      recent_activities: (activities || []) as StudentActivity[],
      subject_progress: subjectProgress,
    };
  } catch {
    return {
      study_hours: 0,
      questions_practiced: 0,
      mock_tests_completed: 0,
      study_streak_days: 0,
      official_progress_percentage: 0,
      personal_progress_percentage: 0,
      total_official_topics: 0,
      completed_official_topics: 0,
      total_personal_topics: 0,
      completed_personal_topics: 0,
      recent_activities: [],
      subject_progress: [],
    };
  }
}
