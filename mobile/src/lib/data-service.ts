import AsyncStorage from "@react-native-async-storage/async-storage";
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
  StudentDoubt,
  DoubtStatus,
  evaluateMockTestScoring,
  calculateProgress,
  calculateStudyStreak,
  SITE_CONFIG,
  SEED_DOUBTS,
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
 * Bulk Import Questions for Admin
 */
export async function bulkCreateAdminQuestions(questionsList: {
  exam_id?: string;
  subject_id?: string;
  chapter_id?: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
  negative_marks?: number;
}[]): Promise<{ successCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < questionsList.length; i++) {
    const q = questionsList[i];
    try {
      const payload = {
        exam_id: q.exam_id || null,
        subject_id: q.subject_id || null,
        chapter_id: q.chapter_id || null,
        question_text: q.question_text.trim(),
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : [q.options?.[0] || "Option A", q.options?.[1] || "Option B", q.options?.[2] || "Option C", q.options?.[3] || "Option D"],
        correct_option_index: Number(q.correct_option_index ?? 0),
        explanation: q.explanation?.trim() || null,
        difficulty: q.difficulty || "medium",
        marks: q.marks || 1,
        negative_marks: q.negative_marks || 0.25,
        is_sample: true,
        status: "published",
      };

      const { error } = await supabase.from("questions").insert([payload]);
      if (error) {
        errors.push(`Q#${i + 1}: ${error.message}`);
      } else {
        successCount++;
      }
    } catch (err: any) {
      errors.push(`Q#${i + 1}: ${err.message || "Failed"}`);
    }
  }

  return { successCount, errors };
}

/**
 * Fetch Full Syllabus (Subjects -> Chapters -> Topics) for Admin
 */
export async function getAdminSyllabusList(examId?: string): Promise<any[]> {
  try {
    let query = supabase
      .from("subjects")
      .select("id, name, code, order_index, exam_id, chapters(id, title, description, order_index, is_official, topics(id, title, description, estimated_minutes, order_index, is_official))")
      .order("order_index", { ascending: true });

    if (examId) query = query.eq("exam_id", examId);

    const { data, error } = await query;
    if (!error && data && data.length > 0) return data;
  } catch {}

  // Resilient fallback
  const subs = await getSubjects(examId);
  const result: any[] = [];
  for (const s of subs) {
    const chaps = await getChapters(s.id);
    result.push({ ...s, chapters: chaps });
  }
  return result;
}

/**
 * Create a new Chapter in Syllabus as Admin
 */
export async function createAdminChapter(payload: {
  subject_id: string;
  title: string;
  description?: string;
  order_index?: number;
}) {
  const newChap = {
    subject_id: payload.subject_id,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    order_index: payload.order_index || 1,
    is_official: true,
    status: "published",
  };

  const { data, error } = await supabase
    .from("chapters")
    .insert([newChap])
    .select()
    .single();

  if (error) {
    // If is_official true was blocked by RLS, retry with is_official false
    const retryRes = await supabase
      .from("chapters")
      .insert([{ ...newChap, is_official: false }])
      .select()
      .single();
    if (retryRes.error) throw new Error(retryRes.error.message || error.message);
    return retryRes.data;
  }
  return data;
}

/**
 * Delete a Chapter from Syllabus
 */
export async function deleteAdminChapter(chapterId: string) {
  const { error } = await supabase.from("chapters").delete().eq("id", chapterId);
  if (error) throw error;
}

/**
 * Create a new Topic in Syllabus as Admin
 */
export async function createAdminTopic(payload: {
  chapter_id: string;
  title: string;
  description?: string;
  estimated_minutes?: number;
  order_index?: number;
}) {
  const newTopic = {
    chapter_id: payload.chapter_id,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    estimated_minutes: payload.estimated_minutes || 45,
    order_index: payload.order_index || 1,
    is_official: true,
    status: "published",
  };

  const { data, error } = await supabase
    .from("topics")
    .insert([newTopic])
    .select()
    .single();

  if (error) {
    const retryRes = await supabase
      .from("topics")
      .insert([{ ...newTopic, is_official: false }])
      .select()
      .single();
    if (retryRes.error) throw new Error(retryRes.error.message || error.message);
    return retryRes.data;
  }
  return data;
}

/**
 * Delete a Topic from Syllabus
 */
export async function deleteAdminTopic(topicId: string) {
  const { error } = await supabase.from("topics").delete().eq("id", topicId);
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

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));
    const rootEmail = SITE_CONFIG.admin.rootEmail.toLowerCase();
    return profs.map((p) => {
      const isRoot = p.email?.toLowerCase() === rootEmail;
      return {
        ...p,
        role: isRoot ? "admin" : (roleMap.get(p.id) || "student"),
      };
    });
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
    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);

    const [
      sessionsRes,
      questionsRes,
      mocksRes,
      userProgressRes,
      activitiesRes,
      courseSubjectsRes,
      personalTopicsRes,
    ] = await Promise.all([
      supabase.from("study_sessions").select("duration_minutes, session_date").eq("user_id", userId),
      supabase.from("question_attempts").select("id, is_correct, created_at").eq("user_id", userId),
      supabase.from("mock_test_attempts").select("id, score, accuracy, completed_at, created_at").eq("user_id", userId).eq("status", "completed"),
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

    const sessionsToday = sessions.filter((s: any) => s.session_date === todayStr);
    const studyHoursToday = Math.round((sessionsToday.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) / 60) * 10) / 10;

    const attempts = questionsRes.data || [];
    const questionsPracticed = attempts.length;
    const questionsToday = attempts.filter((a: any) => a.created_at?.startsWith(todayStr)).length;
    const correctCount = attempts.filter((a: any) => a.is_correct).length;
    const accuracyPercentage = questionsPracticed > 0 ? Math.round((correctCount / questionsPracticed) * 100) : 0;

    const mockAttempts = mocksRes.data || [];
    const mockTestsCompleted = mockAttempts.length;
    const mockTestsThisMonth = mockAttempts.filter((m: any) => (m.completed_at || m.created_at)?.startsWith(currentMonthPrefix)).length;

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
      study_hours_today: studyHoursToday,
      questions_practiced: questionsPracticed,
      questions_practiced_today: questionsToday,
      accuracy_percentage: accuracyPercentage,
      mock_tests_completed: mockTestsCompleted,
      mock_tests_this_month: mockTestsThisMonth,
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
      study_hours_today: 0,
      questions_practiced: 0,
      questions_practiced_today: 0,
      accuracy_percentage: 0,
      mock_tests_completed: 0,
      mock_tests_this_month: 0,
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

const DOUBTS_STORAGE_KEY = "@odisha_rank_student_doubts";
let MOBILE_RUNTIME_DOUBTS: StudentDoubt[] = [...SEED_DOUBTS];

async function syncLocalDoubts(): Promise<StudentDoubt[]> {
  try {
    const raw = await AsyncStorage.getItem(DOUBTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const idSet = new Set(MOBILE_RUNTIME_DOUBTS.map((d) => d.id));
        parsed.forEach((d: StudentDoubt) => {
          if (!idSet.has(d.id)) {
            MOBILE_RUNTIME_DOUBTS.push(d);
          } else {
            const idx = MOBILE_RUNTIME_DOUBTS.findIndex((x) => x.id === d.id);
            if (
              idx >= 0 &&
              (d.answer !== MOBILE_RUNTIME_DOUBTS[idx].answer ||
                d.status !== MOBILE_RUNTIME_DOUBTS[idx].status)
            ) {
              MOBILE_RUNTIME_DOUBTS[idx] = d;
            }
          }
        });
      }
    }
  } catch {}
  return MOBILE_RUNTIME_DOUBTS;
}

async function persistLocalDoubts(doubts: StudentDoubt[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DOUBTS_STORAGE_KEY, JSON.stringify(doubts.slice(0, 100)));
  } catch {}
}

/**
 * Fetch student doubts & questions (Student Doubts Center)
 */
export async function getStudentDoubts(userId: string): Promise<StudentDoubt[]> {
  await syncLocalDoubts();
  const remoteDoubts: StudentDoubt[] = [];

  // 1. Fetch from study_materials
  try {
    const { data: mats } = await supabase
      .from("study_materials")
      .select("id, content")
      .ilike("title", "[STUDENT_DOUBT]%");
    if (mats && Array.isArray(mats)) {
      mats.forEach((m) => {
        try {
          const parsed = JSON.parse(m.content);
          if (parsed && parsed.id) remoteDoubts.push(parsed as StudentDoubt);
        } catch {}
      });
    }
  } catch {}

  // 2. Fetch from study_sessions
  try {
    const { data: rows } = await supabase
      .from("study_sessions")
      .select("id, notes")
      .eq("duration_minutes", 99999);
    if (rows && Array.isArray(rows)) {
      rows.forEach((r) => {
        try {
          const parsed = JSON.parse(r.notes);
          if (parsed?.type === "student_doubt" && parsed.id) remoteDoubts.push(parsed as StudentDoubt);
        } catch {}
      });
    }
  } catch {}

  // 3. Merge with SEED_DOUBTS, runtime and AsyncStorage
  const idMap = new Map<string, StudentDoubt>();
  [...SEED_DOUBTS, ...MOBILE_RUNTIME_DOUBTS, ...remoteDoubts].forEach((d) => {
    const existing = idMap.get(d.id);
    if (!existing || (d.answer && !existing.answer)) {
      idMap.set(d.id, d);
    }
  });

  const merged = Array.from(idMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  MOBILE_RUNTIME_DOUBTS = merged;
  await persistLocalDoubts(merged);

  return merged.filter((d) => d.user_id === userId || (!d.is_private && d.status === "answered"));
}

/**
 * Create a new student question / doubt
 */
export async function createStudentDoubt(payload: {
  user_id: string;
  student_name: string;
  student_email?: string;
  subject: string;
  exam_id?: string | null;
  question: string;
  is_private?: boolean;
}): Promise<StudentDoubt> {
  await syncLocalDoubts();
  const newDoubt: StudentDoubt = {
    id: `doubt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: payload.user_id,
    student_name: payload.student_name,
    student_email: payload.student_email,
    subject: payload.subject,
    exam_id: payload.exam_id,
    question: payload.question,
    status: "pending",
    is_private: !!payload.is_private,
    upvotes: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  MOBILE_RUNTIME_DOUBTS.unshift(newDoubt);
  await persistLocalDoubts(MOBILE_RUNTIME_DOUBTS);

  // Try Supabase study_materials with prefix [STUDENT_DOUBT]
  try {
    const { data: top } = await supabase.from("topics").select("id").limit(1).maybeSingle();
    const topicId = top?.id || "c1111111-1111-1111-1111-111111111111";
    await supabase.from("study_materials").insert({
      topic_id: topicId,
      title: `[STUDENT_DOUBT] ${newDoubt.id}`,
      material_type: "note",
      content: JSON.stringify({ type: "student_doubt", ...newDoubt }),
      category: "doubt",
      is_official: false,
      created_by: payload.user_id && payload.user_id.length > 20 ? payload.user_id : null,
    });
  } catch {}

  // Fallback persistence via study_sessions (duration 99999)
  try {
    await supabase.from("study_sessions").insert({
      user_id: payload.user_id,
      session_date: new Date().toISOString().split("T")[0],
      duration_minutes: 99999,
      notes: JSON.stringify({ type: "student_doubt", ...newDoubt }),
    });
  } catch {}

  return newDoubt;
}

/**
 * Log a study session
 */
export async function logStudySession(payload: {
  userId: string;
  durationMinutes: number;
  notes?: string;
  sessionDate?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("study_sessions").insert({
      user_id: payload.userId,
      duration_minutes: payload.durationMinutes,
      notes: payload.notes || "Mobile study revision",
      session_date: payload.sessionDate || new Date().toISOString().split("T")[0],
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetch all student questions / doubts for Admin Review across all students
 */
export async function getAdminDoubtsList(): Promise<StudentDoubt[]> {
  await syncLocalDoubts();
  const remoteDoubts: StudentDoubt[] = [];

  // 1. Fetch from study_materials
  try {
    const { data: mats } = await supabase
      .from("study_materials")
      .select("id, content")
      .ilike("title", "[STUDENT_DOUBT]%");
    if (mats && Array.isArray(mats)) {
      mats.forEach((m) => {
        try {
          const parsed = JSON.parse(m.content);
          if (parsed && parsed.id) remoteDoubts.push(parsed as StudentDoubt);
        } catch {}
      });
    }
  } catch {}

  // 2. Fetch from study_sessions
  try {
    const { data: rows } = await supabase
      .from("study_sessions")
      .select("id, notes")
      .eq("duration_minutes", 99999);
    if (rows && Array.isArray(rows)) {
      rows.forEach((r) => {
        try {
          const parsed = JSON.parse(r.notes);
          if (parsed?.type === "student_doubt" && parsed.id) remoteDoubts.push(parsed as StudentDoubt);
        } catch {}
      });
    }
  } catch {}

  // 3. Merge with SEED_DOUBTS and MOBILE_RUNTIME_DOUBTS
  const idMap = new Map<string, StudentDoubt>();
  [...SEED_DOUBTS, ...MOBILE_RUNTIME_DOUBTS, ...remoteDoubts].forEach((d) => {
    const existing = idMap.get(d.id);
    if (!existing || (d.answer && !existing.answer)) {
      idMap.set(d.id, d);
    }
  });

  const merged = Array.from(idMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  MOBILE_RUNTIME_DOUBTS = merged;
  await persistLocalDoubts(merged);

  return merged;
}

/**
 * Answer a student doubt / question as Faculty / Administrator
 */
export async function updateStudentDoubtAnswer(
  id: string,
  payload: {
    answer: string;
    answered_by: string;
    status: DoubtStatus;
  }
): Promise<StudentDoubt | null> {
  const now = new Date().toISOString();
  await syncLocalDoubts();
  let updatedDoubt: StudentDoubt | null = null;

  // Update in runtime array
  const idx = MOBILE_RUNTIME_DOUBTS.findIndex((d) => d.id === id);
  if (idx >= 0) {
    MOBILE_RUNTIME_DOUBTS[idx] = {
      ...MOBILE_RUNTIME_DOUBTS[idx],
      answer: payload.answer,
      answered_by: payload.answered_by,
      answered_at: now,
      status: payload.status,
      updated_at: now,
      is_notified: false,
    };
    updatedDoubt = MOBILE_RUNTIME_DOUBTS[idx];
  } else {
    const seed = SEED_DOUBTS.find((d) => d.id === id);
    if (seed) {
      updatedDoubt = {
        ...seed,
        answer: payload.answer,
        answered_by: payload.answered_by,
        answered_at: now,
        status: payload.status,
        updated_at: now,
        is_notified: false,
      };
      MOBILE_RUNTIME_DOUBTS.unshift(updatedDoubt);
    }
  }

  await persistLocalDoubts(MOBILE_RUNTIME_DOUBTS);

  // Update in study_materials
  try {
    const { data: mats } = await supabase
      .from("study_materials")
      .select("id, content")
      .eq("title", `[STUDENT_DOUBT] ${id}`);
    if (mats && mats.length > 0) {
      const existing = mats[0];
      let parsed: any = {};
      try {
        parsed = JSON.parse(existing.content);
      } catch {}
      const updatedObj = {
        ...parsed,
        answer: payload.answer,
        answered_by: payload.answered_by,
        answered_at: now,
        status: payload.status,
        updated_at: now,
        is_notified: false,
      };
      await supabase
        .from("study_materials")
        .update({
          content: JSON.stringify(updatedObj),
          is_official: !updatedObj.is_private,
          updated_at: now,
        })
        .eq("id", existing.id);
    }
  } catch {}

  // Update in study_sessions
  try {
    const { data: rows } = await supabase
      .from("study_sessions")
      .select("id, notes")
      .eq("duration_minutes", 99999);
    if (rows && Array.isArray(rows)) {
      for (const row of rows) {
        try {
          if (row.notes) {
            const parsed = JSON.parse(row.notes);
            if (parsed.type === "student_doubt" && parsed.id === id) {
              const updatedObj = {
                ...parsed,
                answer: payload.answer,
                answered_by: payload.answered_by,
                answered_at: now,
                status: payload.status,
                updated_at: now,
                is_notified: false,
              };
              await supabase
                .from("study_sessions")
                .update({ notes: JSON.stringify(updatedObj) })
                .eq("id", row.id);
              break;
            }
          }
        } catch {}
      }
    }
  } catch {}

  return updatedDoubt;
}


