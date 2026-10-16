import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
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
  StudentActivity,
  AdminDashboardStats,
  PaginatedResult,
  StudentListItem,
} from "./types";
import {
  SEED_EXAMS,
  SEED_SUBJECTS,
  SEED_CHAPTERS,
  SEED_TOPICS,
  SEED_MATERIALS,
  SEED_QUESTIONS,
  SEED_MOCK_TESTS,
} from "./mock-data";

/**
 * Checks if Supabase URL and anon key are properly configured
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("placeholder"));
}

/**
 * Fetch all registered exams / competitive courses.
 * Optionally includes inactive/draft exams for admin views.
 */
export async function getExams(includeInactive: boolean = false): Promise<Exam[]> {
  if (!isSupabaseConfigured()) {
    return SEED_EXAMS;
  }

  try {
    const supabase = await createClient();
    let query = supabase.from("exams").select("*").order("created_at", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true).neq("status", "archived");
    }

    const { data: exams, error } = await query;
    if (error || !exams || exams.length === 0) {
      return SEED_EXAMS;
    }

    // Parallel fetch enrollment counts
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("target_exam_id");

      const countMap: Record<string, number> = {};
      profiles?.forEach((p) => {
        if (p.target_exam_id) {
          countMap[p.target_exam_id] = (countMap[p.target_exam_id] || 0) + 1;
        }
      });

      return exams.map((ex: any) => ({
        ...ex,
        status: ex.status || "published",
        students_count: countMap[ex.id] || 0,
      })) as Exam[];
    } catch {
      return exams as Exam[];
    }
  } catch {
    return SEED_EXAMS;
  }
}

export async function getExamBySlug(slug: string): Promise<Exam | null> {
  const exams = await getExams(true);
  return exams.find((e) => e.slug === slug) || null;
}

export async function getExamById(id: string): Promise<Exam | null> {
  const exams = await getExams(true);
  return exams.find((e) => e.id === id) || null;
}

/**
 * Fetch subjects filtered by course/exam with parallel counts.
 */
export async function getSubjects(examId?: string, includeAllStatus: boolean = false): Promise<Subject[]> {
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
    if (!includeAllStatus) {
      query = query.neq("status", "archived");
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

/**
 * Fetch chapters for a given subject.
 */
export async function getChapters(subjectId: string, userId?: string, includeAllStatus: boolean = false): Promise<Chapter[]> {
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

    if (!includeAllStatus) {
      query = query.neq("status", "archived");
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

/**
 * Fetch topics for a chapter.
 */
export async function getTopics(chapterId: string, userId?: string, includeAllStatus: boolean = false): Promise<Topic[]> {
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

    if (!includeAllStatus) {
      query = query.neq("status", "archived");
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

/**
 * Fetch study materials with search, course/topic/subject filtering, and status filter.
 */
export async function getStudyMaterials(filters?: {
  topicId?: string;
  subjectId?: string;
  examId?: string;
  status?: string;
  search?: string;
}): Promise<StudyMaterial[]> {
  if (!isSupabaseConfigured()) {
    let result = SEED_MATERIALS;
    if (filters?.topicId) result = result.filter((m) => m.topic_id === filters.topicId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q));
    }
    return result;
  }

  try {
    const supabase = await createClient();
    let query = supabase.from("study_materials").select("*").order("created_at", { ascending: false });

    if (filters?.topicId) query = query.eq("topic_id", filters.topicId);
    if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
    if (filters?.examId) query = query.eq("exam_id", filters.examId);
    if (filters?.status) {
      query = query.eq("status", filters.status);
    } else {
      query = query.neq("status", "archived");
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    let { data, error } = await query;
    if (error && (error.message.includes("status") || error.message.includes("description") || error.message.includes("exam_id") || error.message.includes("subject_id"))) {
      let fallbackQuery = supabase.from("study_materials").select("*").order("created_at", { ascending: false });
      if (filters?.topicId) fallbackQuery = fallbackQuery.eq("topic_id", filters.topicId);
      if (filters?.search) fallbackQuery = fallbackQuery.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      const fallbackRes = await fallbackQuery;
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error || !data || data.length === 0) {
      return filters?.topicId ? SEED_MATERIALS.filter((m) => m.topic_id === filters.topicId) : SEED_MATERIALS;
    }
    return data as StudyMaterial[];
  } catch {
    return filters?.topicId ? SEED_MATERIALS.filter((m) => m.topic_id === filters.topicId) : SEED_MATERIALS;
  }
}

/**
 * Fetch questions matching filters (backward-compatible).
 */
export async function getQuestions(filters?: {
  examId?: string;
  subjectId?: string;
  difficulty?: string;
  search?: string;
}): Promise<Question[]> {
  if (!isSupabaseConfigured()) {
    let result = SEED_QUESTIONS;
    if (filters?.examId) result = result.filter((q) => q.exam_id === filters.examId);
    if (filters?.subjectId) result = result.filter((q) => q.subject_id === filters.subjectId);
    if (filters?.difficulty) result = result.filter((q) => q.difficulty === filters.difficulty);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      result = result.filter((q) => q.question_text.toLowerCase().includes(s));
    }
    return result;
  }

  try {
    const supabase = await createClient();
    let query = supabase.from("questions").select("*").order("created_at", { ascending: false });

    if (filters?.examId) query = query.eq("exam_id", filters.examId);
    if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
    if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);
    if (filters?.search) query = query.ilike("question_text", `%${filters.search}%`);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let fallback = SEED_QUESTIONS;
      if (filters?.examId) fallback = fallback.filter((q) => q.exam_id === filters.examId);
      if (filters?.subjectId) fallback = fallback.filter((q) => q.subject_id === filters.subjectId);
      if (filters?.difficulty) fallback = fallback.filter((q) => q.difficulty === filters.difficulty);
      return fallback;
    }
    return data as Question[];
  } catch {
    return SEED_QUESTIONS;
  }
}

/**
 * Fetch paginated questions for Question Bank & Admin with total count and page metadata.
 */
export async function getPaginatedQuestions(filters?: {
  examId?: string;
  subjectId?: string;
  chapterId?: string;
  difficulty?: string;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<Question>> {
  const page = Math.max(1, filters?.page || 1);
  const pageSize = Math.max(1, Math.min(100, filters?.pageSize || 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!isSupabaseConfigured()) {
    let list = SEED_QUESTIONS;
    if (filters?.examId) list = list.filter((q) => q.exam_id === filters.examId);
    if (filters?.subjectId) list = list.filter((q) => q.subject_id === filters.subjectId);
    if (filters?.difficulty) list = list.filter((q) => q.difficulty === filters.difficulty);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter((q) => q.question_text.toLowerCase().includes(s));
    }
    const total = list.length;
    const paginated = list.slice(from, to + 1);
    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("questions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters?.examId) query = query.eq("exam_id", filters.examId);
    if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
    if (filters?.chapterId) query = query.eq("chapter_id", filters.chapterId);
    if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.search) query = query.ilike("question_text", `%${filters.search}%`);

    query = query.range(from, to);

    let { data, count, error } = await query;
    if (error && (error.message.includes("status") || error.message.includes("chapter_id"))) {
      let retryQuery = supabase
        .from("questions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (filters?.examId) retryQuery = retryQuery.eq("exam_id", filters.examId);
      if (filters?.subjectId) retryQuery = retryQuery.eq("subject_id", filters.subjectId);
      if (filters?.difficulty) retryQuery = retryQuery.eq("difficulty", filters.difficulty);
      if (filters?.search) retryQuery = retryQuery.ilike("question_text", `%${filters.search}%`);
      retryQuery = retryQuery.range(from, to);
      const res = await retryQuery;
      data = res.data;
      count = res.count;
      error = res.error;
    }

    if (error || !data) {
      return {
        data: SEED_QUESTIONS.slice(0, pageSize),
        total: SEED_QUESTIONS.length,
        page,
        pageSize,
        totalPages: Math.ceil(SEED_QUESTIONS.length / pageSize) || 1,
      };
    }

    const total = count ?? data.length;
    return {
      data: data as Question[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch {
    return {
      data: SEED_QUESTIONS.slice(0, pageSize),
      total: SEED_QUESTIONS.length,
      page,
      pageSize,
      totalPages: Math.ceil(SEED_QUESTIONS.length / pageSize) || 1,
    };
  }
}

/**
 * Fetch mock tests filtered by course/exam.
 */
export async function getMockTests(examId?: string, includeAllStatus: boolean = false): Promise<MockTest[]> {
  if (!isSupabaseConfigured()) {
    if (examId) return SEED_MOCK_TESTS.filter((m) => m.exam_id === examId);
    return SEED_MOCK_TESTS;
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("mock_tests")
      .select("*, mock_test_questions(count)")
      .order("created_at", { ascending: false });

    if (!includeAllStatus) {
      query = query.eq("is_published", true).neq("status", "archived");
    }
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
      updated_at: new Date().toISOString(),
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
 * HIGH-PERFORMANCE PERSONALIZED DASHBOARD METRICS:
 * 1. Parallelizes all database network calls with Promise.all (zero sequential waterfalls).
 * 2. Scopes official syllabus progress STRICTLY to the student's selected targetExamId.
 * 3. Never leaks or mixes up progress across different courses or custom topics.
 */
export async function getDashboardMetrics(userId: string, targetExamId?: string | null): Promise<DashboardMetrics> {
  if (!isSupabaseConfigured()) {
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

    // PARALLEL EXECUTION: Run all independent queries at once
    const [
      sessionsRes,
      questionsCountRes,
      mocksCountRes,
      userProgressRes,
      activitiesRes,
      courseSubjectsRes,
      personalTopicsRes,
    ] = await Promise.all([
      // 1. Study sessions
      supabase
        .from("study_sessions")
        .select("duration_minutes, session_date")
        .eq("user_id", userId),

      // 2. Questions practiced count
      supabase
        .from("question_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),

      // 3. Mock tests completed count
      supabase
        .from("mock_test_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),

      // 4. Student topic progress (completed topics)
      supabase
        .from("student_topic_progress")
        .select("topic_id")
        .eq("user_id", userId)
        .eq("status", "completed"),

      // 5. Recent activities
      supabase
        .from("student_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),

      // 6. Course-specific hierarchy: subjects -> chapters -> topics
      targetExamId
        ? supabase
            .from("subjects")
            .select("id, name, order_index, chapters(id, is_official, topics(id, is_official, title))")
            .eq("exam_id", targetExamId)
            .order("order_index", { ascending: true })
        : supabase
            .from("subjects")
            .select("id, name, order_index, chapters(id, is_official, topics(id, is_official, title))")
            .order("order_index", { ascending: true }),

      // 7. Student's own custom topics
      supabase
        .from("topics")
        .select("id")
        .eq("is_official", false)
        .eq("created_by", userId),
    ]);

    // Compute Study Hours
    const sessions = sessionsRes.data || [];
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const studyHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Compute Streak Days
    const sessionDates = new Set(sessions.map((s) => s.session_date));
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (sessionDates.has(dateStr)) {
        streakDays++;
      } else if (i === 0) {
        continue; // Today might not have a session yet
      } else {
        break;
      }
    }

    // Set of completed topic IDs
    const completedTopicIds = new Set((userProgressRes.data || []).map((p) => p.topic_id));

    // Calculate course-specific official syllabus progress
    const subjects = courseSubjectsRes.data || [];
    let courseOfficialTopicsCount = 0;
    let courseOfficialCompletedCount = 0;

    const subjectProgress = subjects.map((sub: any) => {
      let subTotalTopics = 0;
      let subCompletedTopics = 0;

      const chapters = sub.chapters || [];
      chapters.forEach((chap: any) => {
        const topics = chap.topics || [];
        topics.forEach((top: any) => {
          if (top.is_official) {
            subTotalTopics++;
            courseOfficialTopicsCount++;
            if (completedTopicIds.has(top.id)) {
              subCompletedTopics++;
              courseOfficialCompletedCount++;
            }
          }
        });
      });

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        total_topics: subTotalTopics,
        completed_topics: subCompletedTopics,
        progress_percentage: subTotalTopics > 0 ? Math.round((subCompletedTopics / subTotalTopics) * 100) : 0,
      };
    });

    const officialProgress =
      courseOfficialTopicsCount > 0
        ? Math.round((courseOfficialCompletedCount / courseOfficialTopicsCount) * 100)
        : 0;

    // Personal topics progress
    const personalTopics = personalTopicsRes.data || [];
    const completedPersonal = personalTopics.filter((t) => completedTopicIds.has(t.id)).length;
    const personalProgress =
      personalTopics.length > 0 ? Math.round((completedPersonal / personalTopics.length) * 100) : 0;

    return {
      study_hours: studyHours,
      questions_practiced: questionsCountRes.count || 0,
      mock_tests_completed: mocksCountRes.count || 0,
      study_streak_days: streakDays,
      official_progress_percentage: officialProgress,
      personal_progress_percentage: personalProgress,
      total_official_topics: courseOfficialTopicsCount,
      completed_official_topics: courseOfficialCompletedCount,
      total_personal_topics: personalTopics.length,
      completed_personal_topics: completedPersonal,
      recent_activities: (activitiesRes.data || []) as StudentActivity[],
      subject_progress: subjectProgress,
    };
  } catch (err) {
    console.error("getDashboardMetrics error:", err);
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

/**
 * Fetch genuine statistics for the Admin Panel Dashboard.
 * Parallelized for maximum speed.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!isSupabaseConfigured()) {
    return {
      total_students: 12,
      total_courses: SEED_EXAMS.length,
      total_subjects: SEED_SUBJECTS.length,
      total_chapters: SEED_CHAPTERS.length,
      total_topics: SEED_TOPICS.length,
      total_materials: SEED_MATERIALS.length,
      total_questions: SEED_QUESTIONS.length,
      total_mock_tests: SEED_MOCK_TESTS.length,
      recent_activities: [],
    };
  }

  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const [
      studentsRes,
      coursesRes,
      subjectsRes,
      chaptersRes,
      topicsRes,
      materialsRes,
      questionsRes,
      mockTestsRes,
      activitiesRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("exams").select("*", { count: "exact", head: true }),
      supabase.from("subjects").select("*", { count: "exact", head: true }),
      supabase.from("chapters").select("*", { count: "exact", head: true }),
      supabase.from("topics").select("*", { count: "exact", head: true }),
      supabase.from("study_materials").select("*", { count: "exact", head: true }),
      supabase.from("questions").select("*", { count: "exact", head: true }),
      supabase.from("mock_tests").select("*", { count: "exact", head: true }),
      supabase
        .from("student_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    return {
      total_students: studentsRes.count || 0,
      total_courses: coursesRes.count || 0,
      total_subjects: subjectsRes.count || 0,
      total_chapters: chaptersRes.count || 0,
      total_topics: topicsRes.count || 0,
      total_materials: materialsRes.count || 0,
      total_questions: questionsRes.count || 0,
      total_mock_tests: mockTestsRes.count || 0,
      recent_activities: (activitiesRes.data || []) as StudentActivity[],
    };
  } catch (err) {
    console.error("getAdminDashboardStats error:", err);
    return {
      total_students: 0,
      total_courses: 0,
      total_subjects: 0,
      total_chapters: 0,
      total_topics: 0,
      total_materials: 0,
      total_questions: 0,
      total_mock_tests: 0,
      recent_activities: [],
    };
  }
}

/**
 * Fetch student directory for Admin Panel.
 */
export async function getStudentsList(filters?: {
  search?: string;
  targetExamId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<StudentListItem>> {
  const page = Math.max(1, filters?.page || 1);
  const pageSize = Math.max(1, Math.min(100, filters?.pageSize || 15));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!isSupabaseConfigured()) {
    return {
      data: [
        {
          id: "demo-user-1",
          email: "student@odisharank.in",
          full_name: "Subrat Pattnaik",
          target_exam_id: SEED_EXAMS[0].id,
          target_exam_title: SEED_EXAMS[0].title,
          target_year: 2026,
          district: "Khordha (Bhubaneswar)",
          phone: "9876543210",
          role: "student",
          is_profile_completed: true,
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      pageSize,
      totalPages: 1,
    };
  }

  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    let query = supabase
      .from("profiles")
      .select("*, exams:target_exam_id(title)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters?.targetExamId) {
      query = query.eq("target_exam_id", filters.targetExamId);
    }
    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,district.ilike.%${filters.search}%`);
    }

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error || !data) {
      console.error("getStudentsList query error:", error);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    // Fetch corresponding roles for users
    const userIds = data.map((row: any) => row.id).filter(Boolean);
    let rolesMap: Record<string, string> = {};

    if (userIds.length > 0) {
      try {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        if (roleRows && Array.isArray(roleRows)) {
          rolesMap = Object.fromEntries(roleRows.map((r: any) => [r.user_id, r.role]));
        }
      } catch (roleErr) {
        console.warn("Could not query user roles, defaulting to student:", roleErr);
      }
    }

    const items: StudentListItem[] = data.map((row: any) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      target_exam_id: row.target_exam_id,
      target_exam_title: row.exams?.title || "Not selected",
      target_year: row.target_year,
      district: row.district,
      phone: row.phone,
      role: (rolesMap[row.id] as any) || "student",
      is_profile_completed: row.is_profile_completed,
      created_at: row.created_at,
    }));

    const total = count ?? data.length;
    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (err) {
    console.error("getStudentsList caught error:", err);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }
}
