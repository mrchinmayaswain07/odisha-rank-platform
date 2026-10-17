import { supabase } from "./supabase";
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
  evaluateMockTestScoring,
  calculateProgress,
  calculateStudyStreak,
  SITE_CONFIG,
} from "@odisha-rank/shared";

/**
 * Fetch all active courses / examinations from shared Supabase catalog
 */
export async function getExams(): Promise<Exam[]> {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("is_active", true)
      .neq("status", "archived")
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as Exam[];
  } catch {
    return [];
  }
}

/**
 * Fetch subjects filtered by selected examId
 */
export async function getSubjects(examId?: string): Promise<Subject[]> {
  try {
    let query = supabase
      .from("subjects")
      .select("*")
      .neq("status", "archived")
      .order("order_index", { ascending: true });

    if (examId) query = query.eq("exam_id", examId);

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Subject[];
  } catch {
    return [];
  }
}

/**
 * Fetch chapters for a given subject
 */
export async function getChapters(subjectId: string, userId?: string): Promise<Chapter[]> {
  try {
    let query = supabase
      .from("chapters")
      .select("*, topics(*)")
      .eq("subject_id", subjectId)
      .neq("status", "archived")
      .order("order_index", { ascending: true });

    if (userId) {
      query = query.or(`is_official.eq.true,created_by.eq.${userId}`);
    } else {
      query = query.eq("is_official", true);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Chapter[];
  } catch {
    return [];
  }
}

/**
 * Fetch topics for a chapter
 */
export async function getTopics(chapterId: string, userId?: string): Promise<Topic[]> {
  try {
    let query = supabase
      .from("topics")
      .select("*")
      .eq("chapter_id", chapterId)
      .neq("status", "archived")
      .order("order_index", { ascending: true });

    if (userId) {
      query = query.or(`is_official.eq.true,created_by.eq.${userId}`);
    } else {
      query = query.eq("is_official", true);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Topic[];
  } catch {
    return [];
  }
}

/**
 * Fetch study materials filtered by topic, subject, or exam
 */
export async function getStudyMaterials(filters?: {
  topicId?: string;
  subjectId?: string;
  examId?: string;
  search?: string;
}): Promise<StudyMaterial[]> {
  try {
    let query = supabase
      .from("study_materials")
      .select("*")
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (filters?.topicId) query = query.eq("topic_id", filters.topicId);
    if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
    if (filters?.examId) query = query.eq("exam_id", filters.examId);
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as StudyMaterial[];
  } catch {
    return [];
  }
}

/**
 * Fetch questions matching exam and subject filters
 */
export async function getQuestions(filters?: {
  examId?: string;
  subjectId?: string;
  difficulty?: string;
  search?: string;
}): Promise<Question[]> {
  try {
    let query = supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.examId) query = query.eq("exam_id", filters.examId);
    if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
    if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);
    if (filters?.search) query = query.ilike("question_text", `%${filters.search}%`);

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Question[];
  } catch {
    return [];
  }
}

/**
 * Record a student MCQ attempt for instant evaluation and progress tracking
 */
export async function recordQuestionAttempt(
  questionId: string,
  selectedOptionIndex: number,
  isCorrect: boolean,
  userId: string,
  timeTakenSeconds: number = 0
) {
  try {
    await supabase.from("question_attempts").insert({
      user_id: userId,
      question_id: questionId,
      selected_option_index: selectedOptionIndex,
      is_correct: isCorrect,
      time_taken_seconds: timeTakenSeconds,
    });
  } catch (err) {
    console.warn("Failed to record question attempt:", err);
  }
}

/**
 * Fetch published mock tests for selected course
 */
export async function getMockTests(examId?: string): Promise<MockTest[]> {
  try {
    let query = supabase
      .from("mock_tests")
      .select("*, mock_test_questions(count)")
      .eq("is_published", true)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (examId) query = query.eq("exam_id", examId);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((item: any) => ({
      ...item,
      questions_count: item.mock_test_questions?.[0]?.count ?? 0,
    })) as MockTest[];
  } catch {
    return [];
  }
}

/**
 * Fetch a mock test with its questions in sequence
 */
export async function getMockTestById(
  id: string
): Promise<{ test: MockTest; questions: Question[] } | null> {
  try {
    const { data: test, error: testErr } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("id", id)
      .single();

    if (testErr || !test) return null;

    const { data: mtq, error: qErr } = await supabase
      .from("mock_test_questions")
      .select("question_id, order_index, questions(*)")
      .eq("mock_test_id", id)
      .order("order_index", { ascending: true });

    if (qErr || !mtq) return { test, questions: [] };

    const questions = mtq.map((row: any) => row.questions).filter(Boolean) as Question[];
    return { test, questions };
  } catch {
    return null;
  }
}

/**
 * Mobile Mock Test Submission:
 * Uses shared evaluateMockTestScoring business logic to evaluate marks with negative marking,
 * writes the attempt and activity record to Supabase, and returns the full evaluation summary.
 */
export async function submitMockTest(
  testId: string,
  answers: Record<string, number | null | undefined>,
  timeSpentSeconds: number,
  userId: string
) {
  const testData = await getMockTestById(testId);
  if (!testData) throw new Error("Mock test not found");

  const { test, questions } = testData;
  const evaluation = evaluateMockTestScoring(test, questions, answers, timeSpentSeconds);

  try {
    const { data: attempt } = await supabase
      .from("mock_test_attempts")
      .insert({
        mock_test_id: test.id,
        user_id: userId,
        status: "completed",
        score: evaluation.score,
        correct_count: evaluation.correct_count,
        incorrect_count: evaluation.incorrect_count,
        unanswered_count: evaluation.unanswered_count,
        accuracy: evaluation.accuracy,
        time_spent_seconds: timeSpentSeconds,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attempt) {
      await supabase.from("student_activity").insert({
        user_id: userId,
        activity_type: "mock_test_completed",
        title: `Completed ${test.title}`,
        description: `Scored ${evaluation.score}/${test.total_marks} (${evaluation.accuracy}% accuracy)`,
        metadata: { attempt_id: attempt.id, score: evaluation.score },
      });
    }
  } catch (err) {
    console.warn("Could not persist mock test attempt:", err);
  }

  return evaluation;
}

/**
 * Fetch Student Profile
 */
export async function getStudentProfile(userId: string): Promise<Profile | null> {
  try {
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
 * Update Student Target Course in Supabase
 */
export async function updateStudentCourse(userId: string, targetExamId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ target_exam_id: targetExamId, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Update Student Profile in Supabase
 */
export async function updateStudentProfile(
  userId: string,
  updates: {
    full_name?: string;
    phone?: string | null;
    district?: string | null;
    target_year?: number;
    bio?: string | null;
  }
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Fetch Mission Control Administration Catalog Statistics
 */
export async function getAdminOverviewStats() {
  try {
    const [
      studentsRes,
      coursesRes,
      chaptersRes,
      topicsRes,
      questionsRes,
      materialsRes,
      mocksRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("exams").select("*", { count: "exact", head: true }),
      supabase.from("chapters").select("*", { count: "exact", head: true }),
      supabase.from("topics").select("*", { count: "exact", head: true }),
      supabase.from("questions").select("*", { count: "exact", head: true }),
      supabase.from("study_materials").select("*", { count: "exact", head: true }),
      supabase.from("mock_tests").select("*", { count: "exact", head: true }),
    ]);

    return {
      studentsCount: studentsRes.count || 0,
      activeCoursesCount: coursesRes.count || 0,
      chaptersCount: chaptersRes.count || 0,
      topicsCount: topicsRes.count || 0,
      questionsCount: questionsRes.count || 0,
      materialsCount: materialsRes.count || 0,
      mockTestsCount: mocksRes.count || 0,
    };
  } catch {
    return {
      studentsCount: 0,
      activeCoursesCount: 0,
      chaptersCount: 0,
      topicsCount: 0,
      questionsCount: 0,
      materialsCount: 0,
      mockTestsCount: 0,
    };
  }
}

/**
 * Fetch Questions for Admin Management
 */
export async function getAdminQuestionsList(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("id, question_text, options, correct_option_index, difficulty, explanation, exam_id, created_at, exams(title)")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Create a new question in the Question Bank
 */
export async function createAdminQuestion(payload: {
  exam_id?: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}) {
  const { data, error } = await supabase
    .from("questions")
    .insert([
      {
        question_text: payload.question_text,
        options: payload.options,
        correct_option_index: payload.correct_option_index,
        explanation: payload.explanation || null,
        difficulty: payload.difficulty || "medium",
        exam_id: payload.exam_id || null,
        is_sample: true,
        status: "published",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a question from the question bank
 */
export async function deleteAdminQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Fetch Courses for Admin Management
 */
export async function getAdminCoursesList(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Create a new examination / course
 */
export async function createAdminCourse(payload: {
  title: string;
  conducting_body: string;
  slug: string;
  description: string;
}) {
  const { data, error } = await supabase
    .from("exams")
    .insert([
      {
        title: payload.title,
        conducting_body: payload.conducting_body,
        slug: payload.slug,
        description: payload.description,
        is_active: true,
        status: "published",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch Mock Tests for Admin Management
 */
export async function getAdminMockTestsList(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("mock_tests")
      .select("*, exams(title)")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Create a new Mock Test simulation
 */
export async function createAdminMockTest(payload: {
  exam_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  negative_marking: number;
  pass_percentage: number;
}) {
  const { data, error } = await supabase
    .from("mock_tests")
    .insert([
      {
        exam_id: payload.exam_id,
        title: payload.title,
        description: payload.description,
        duration_minutes: payload.duration_minutes,
        total_marks: payload.total_marks,
        negative_marking: payload.negative_marking,
        pass_percentage: payload.pass_percentage,
        is_published: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch Study Materials for Admin Management
 */
export async function getAdminMaterialsList(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("study_materials")
      .select("*, topics(title)")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Create a new Study Material / Notes / PDF
 */
export async function createAdminMaterial(payload: {
  topic_id: string;
  title: string;
  material_type: string;
  content: string;
  url?: string;
}) {
  const { data, error } = await supabase
    .from("study_materials")
    .insert([
      {
        topic_id: payload.topic_id,
        title: payload.title,
        material_type: payload.material_type,
        content: payload.content,
        url: payload.url || null,
        is_official: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch Students and their Administrative Roles
 */
export async function getAdminStudentsList(): Promise<any[]> {
  try {
    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("id, email, full_name, district, phone, target_year, created_at")
      .order("created_at", { ascending: false });
    if (profErr || !profs) return [];

    const rootEmail = SITE_CONFIG.admin.rootEmail.toLowerCase();
    return profs.map((p) => ({
      ...p,
      role: p.email?.toLowerCase() === rootEmail ? "admin" : "student",
    }));
  } catch {
    return [];
  }
}

/**
 * Update Student Role (Promote / Demote)
 */
export async function updateAdminStudentRole(userId: string, newRole: "admin" | "student") {
  // Guard: Root platform administrator cannot be demoted or removed
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (
    profile?.email?.toLowerCase() === SITE_CONFIG.admin.rootEmail.toLowerCase() &&
    newRole !== "admin"
  ) {
    throw new Error("Root platform administrator profile is permanent and cannot be demoted or removed.");
  }

  const { error } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role: newRole,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

/**
 * Fetch Dashboard Metrics for Student, scoped strictly to targetExamId
 */
export async function getDashboardMetrics(
  userId: string,
  targetExamId?: string | null
): Promise<DashboardMetrics> {
  try {
    const [
      sessionsRes,
      questionsCountRes,
      mocksCountRes,
      userProgressRes,
      activitiesRes,
      courseSubjectsRes,
      personalTopicsRes,
    ] = await Promise.all([
      supabase.from("study_sessions").select("duration_minutes, session_date").eq("user_id", userId),
      supabase.from("question_attempts").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("mock_test_attempts").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
      supabase.from("student_topic_progress").select("topic_id").eq("user_id", userId).eq("status", "completed"),
      supabase.from("student_activity").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(6),
      targetExamId
        ? supabase.from("subjects").select("id, name, order_index, chapters(id, is_official, topics(id, is_official, title))").eq("exam_id", targetExamId).order("order_index", { ascending: true })
        : supabase.from("subjects").select("id, name, order_index, chapters(id, is_official, topics(id, is_official, title))").order("order_index", { ascending: true }),
      supabase.from("topics").select("id").eq("is_official", false).eq("created_by", userId),
    ]);

    const sessions = sessionsRes.data || [];
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const studyHours = Math.round((totalMinutes / 60) * 10) / 10;
    const studyStreakDays = calculateStudyStreak(sessions.map((s) => s.session_date));

    const completedTopicIds = new Set((userProgressRes.data || []).map((p) => p.topic_id));
    const subjects = courseSubjectsRes.data || [];

    let totalOfficialTopics = 0;
    let completedOfficialTopics = 0;

    const subjectProgress = subjects.map((sub: any) => {
      let subTotal = 0;
      let subCompleted = 0;

      (sub.chapters || []).forEach((ch: any) => {
        (ch.topics || []).forEach((t: any) => {
          if (ch.is_official && t.is_official) {
            subTotal++;
            totalOfficialTopics++;
            if (completedTopicIds.has(t.id)) {
              subCompleted++;
              completedOfficialTopics++;
            }
          }
        });
      });

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        total_topics: subTotal,
        completed_topics: subCompleted,
        progress_percentage: calculateProgress(subCompleted, subTotal),
      };
    });

    const officialProgressPercentage = calculateProgress(completedOfficialTopics, totalOfficialTopics);

    const personalTopics = personalTopicsRes.data || [];
    const totalPersonalTopics = personalTopics.length;
    const completedPersonalTopics = personalTopics.filter((t) => completedTopicIds.has(t.id)).length;
    const personalProgressPercentage = calculateProgress(completedPersonalTopics, totalPersonalTopics);

    return {
      study_hours: studyHours,
      questions_practiced: questionsCountRes.count ?? 0,
      mock_tests_completed: mocksCountRes.count ?? 0,
      study_streak_days: studyStreakDays,
      official_progress_percentage: officialProgressPercentage,
      personal_progress_percentage: personalProgressPercentage,
      total_official_topics: totalOfficialTopics,
      completed_official_topics: completedOfficialTopics,
      total_personal_topics: totalPersonalTopics,
      completed_personal_topics: completedPersonalTopics,
      recent_activities: (activitiesRes.data as any) || [],
      subject_progress: subjectProgress,
    };
  } catch (err) {
    console.warn("Failed to load dashboard metrics:", err);
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
