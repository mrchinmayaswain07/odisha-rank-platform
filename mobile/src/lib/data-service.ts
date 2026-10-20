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
  SEED_STUDY_MATERIALS,
} from "@odisha-rank/shared";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const mobileCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export function invalidateMobileCache(prefix?: string) {
  if (!prefix) {
    mobileCache.clear();
  } else {
    mobileCache.forEach((_, key) => {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        mobileCache.delete(key);
      }
    });
  }
}

async function fetchWithCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  forceRefresh: boolean = false
): Promise<T> {
  if (!forceRefresh) {
    const cached = mobileCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data;
    }
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  const promise = fetcher()
    .then((result) => {
      mobileCache.set(key, { data: result, timestamp: Date.now() });
      inFlightRequests.delete(key);
      return result;
    })
    .catch((err) => {
      inFlightRequests.delete(key);
      throw err;
    });

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Fetch all active courses / examinations from shared Supabase catalog
 */
export async function getExams(forceRefresh: boolean = false): Promise<Exam[]> {
  return fetchWithCache("exams", 5 * 60 * 1000, async () => {
    try {
      const { data, error } = await supabase
        .from("exams")
        .select("id, slug, title, conducting_body, description, eligibility, stages, is_active, status, created_at, updated_at")
        .eq("is_active", true)
        .neq("status", "archived")
        .order("created_at", { ascending: true });

      if (error || !data) return [];
      return data as Exam[];
    } catch {
      return [];
    }
  }, forceRefresh);
}

/**
 * Fetch subjects filtered by selected examId
 */
export async function getSubjects(examId?: string, forceRefresh: boolean = false): Promise<Subject[]> {
  const cacheKey = `subjects_${examId || "all"}`;
  return fetchWithCache(cacheKey, 3 * 60 * 1000, async () => {
    try {
      let query = supabase
        .from("subjects")
        .select("id, exam_id, name, code, description, order_index, status, created_at, updated_at")
        .neq("status", "archived")
        .order("order_index", { ascending: true });

      if (examId) query = query.eq("exam_id", examId);

      const { data, error } = await query;
      if (error || !data) return [];
      return data as Subject[];
    } catch {
      return [];
    }
  }, forceRefresh);
}

/**
 * Fetch chapters for a given subject
 */
export async function getChapters(subjectId: string, userId?: string, forceRefresh: boolean = false): Promise<Chapter[]> {
  const cacheKey = `chapters_${subjectId}_${userId || "anon"}`;
  return fetchWithCache(cacheKey, 2 * 60 * 1000, async () => {
    try {
      let query = supabase
        .from("chapters")
        .select("id, subject_id, title, description, order_index, is_official, status, created_by, created_at, updated_at, topics(id, chapter_id, title, description, estimated_minutes, order_index, is_official, status, created_by, created_at, updated_at)")
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
  }, forceRefresh);
}

/**
 * Fetch topics for a chapter
 */
export async function getTopics(chapterId: string, userId?: string, forceRefresh: boolean = false): Promise<Topic[]> {
  const cacheKey = `topics_${chapterId}_${userId || "anon"}`;
  return fetchWithCache(cacheKey, 2 * 60 * 1000, async () => {
    try {
      let query = supabase
        .from("topics")
        .select("id, chapter_id, title, description, estimated_minutes, order_index, is_official, status, created_by, created_at, updated_at")
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
  }, forceRefresh);
}

/**
 * Fetch study materials filtered by topic, subject, or exam
 */
const LOCAL_CUSTOM_MATERIALS_KEY = "odisharank_custom_materials";
const LOCAL_DELETED_MATERIALS_KEY = "odisharank_deleted_materials";

/**
 * Permanently delete study material and ensure it never reappears
 */
export async function deleteStudyMaterial(id: string): Promise<boolean> {
  try {
    // 1. Persist to local tombstone so it NEVER comes back
    const localTombstone = await AsyncStorage.getItem(LOCAL_DELETED_MATERIALS_KEY);
    const arr: string[] = localTombstone ? JSON.parse(localTombstone) : [];
    if (!arr.includes(id)) {
      arr.push(id);
      await AsyncStorage.setItem(LOCAL_DELETED_MATERIALS_KEY, JSON.stringify(arr));
    }

    // 2. Remove from local custom materials if present
    const rawCustom = await AsyncStorage.getItem(LOCAL_CUSTOM_MATERIALS_KEY);
    if (rawCustom) {
      const customArr: StudyMaterial[] = JSON.parse(rawCustom);
      const filtered = customArr.filter((m) => m.id !== id);
      await AsyncStorage.setItem(LOCAL_CUSTOM_MATERIALS_KEY, JSON.stringify(filtered));
    }

    // 3. Try deleting/archiving on Supabase
    try {
      await supabase.from("study_materials").delete().eq("id", id);
    } catch {}
    try {
      await supabase.from("study_materials").update({ status: "archived" }).eq("id", id);
    } catch {}

    invalidateMobileCache("materials_");
    return true;
  } catch (err) {
    console.warn("Failed to delete study material:", err);
    return false;
  }
}

/**
 * Save an admin shared material (Google Drive link, PDF, or note)
 */
export async function saveSharedMaterial(material: StudyMaterial): Promise<void> {
  try {
    const rawCustom = await AsyncStorage.getItem(LOCAL_CUSTOM_MATERIALS_KEY);
    const customArr: StudyMaterial[] = rawCustom ? JSON.parse(rawCustom) : [];
    const index = customArr.findIndex((m) => m.id === material.id);
    if (index >= 0) {
      customArr[index] = material;
    } else {
      customArr.unshift(material);
    }
    await AsyncStorage.setItem(LOCAL_CUSTOM_MATERIALS_KEY, JSON.stringify(customArr));

    try {
      await supabase.from("study_materials").insert({
        id: material.id,
        topic_id: material.topic_id || "c1111111-1111-1111-1111-111111111111",
        title: material.title,
        material_type: material.material_type || "note",
        content: material.content,
        url: material.url || material.file_url || null,
        file_url: material.file_url || material.url || null,
        category: material.category || "notes",
        status: material.status || "published",
        is_official: material.is_official ?? true,
        exam_id: material.exam_id || null,
      });
    } catch {}

    invalidateMobileCache("materials_");
  } catch (err) {
    console.warn("Failed to save shared material:", err);
  }
}

/**
 * Fetch study materials filtered by topic, subject, or exam
 */
export async function getStudyMaterials(
  filters?: {
    topicId?: string;
    subjectId?: string;
    examId?: string;
    category?: string;
    search?: string;
  },
  forceRefresh: boolean = false
): Promise<StudyMaterial[]> {
  const cacheKey = `materials_${filters?.examId || "all"}_${filters?.subjectId || "all"}_${filters?.topicId || "all"}_${filters?.category || "all"}_${filters?.search || ""}`;
  return fetchWithCache(cacheKey, 2 * 60 * 1000, async () => {
    try {
      // 1. Gather deleted tombstones (both remote and local)
      const deletedSet = new Set<string>();
      try {
        const localTombstone = await AsyncStorage.getItem(LOCAL_DELETED_MATERIALS_KEY);
        if (localTombstone) {
          const parsed = JSON.parse(localTombstone);
          if (Array.isArray(parsed)) parsed.forEach((id: string) => deletedSet.add(id));
        }
      } catch {}

      // 2. Query remote materials from Supabase
      let remoteMaterials: any[] = [];
      try {
        let query = supabase
          .from("study_materials")
          .select("*")
          .order("created_at", { ascending: false });

        if (filters?.topicId) query = query.eq("topic_id", filters.topicId);
        if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);
        if (!filters?.topicId) query = query.limit(100);

        const { data } = await query;
        if (data && Array.isArray(data)) {
          remoteMaterials = data;
          const tombstone = remoteMaterials.find((m) => m.title === "[SYSTEM_DELETED_MATERIALS]");
          if (tombstone?.content) {
            try {
              const parsed = JSON.parse(tombstone.content);
              if (Array.isArray(parsed)) parsed.forEach((id: string) => deletedSet.add(id));
            } catch {}
          }
        }
      } catch {}

      // 3. Gather local custom materials saved on device
      let localCustomMaterials: StudyMaterial[] = [];
      try {
        const rawCustom = await AsyncStorage.getItem(LOCAL_CUSTOM_MATERIALS_KEY);
        if (rawCustom) {
          const parsed = JSON.parse(rawCustom);
          if (Array.isArray(parsed)) localCustomMaterials = parsed;
        }
      } catch {}

      // 4. Merge all sources using Map by ID
      const materialMap = new Map<string, StudyMaterial>();

      // A. Seed verified official materials
      SEED_STUDY_MATERIALS.forEach((m) => {
        if (!deletedSet.has(m.id)) {
          materialMap.set(m.id, {
            ...m,
            material_type: m.material_type || (m.category === "pdf" ? "pdf" : "note"),
            file_url: m.file_url || m.url || null,
            url: m.url || m.file_url || null,
          });
        }
      });

      // B. Local custom materials (added by admin or downloaded)
      localCustomMaterials.forEach((m) => {
        if (!deletedSet.has(m.id) && m.status !== "archived") {
          materialMap.set(m.id, {
            ...m,
            material_type: m.material_type || (m.category === "pdf" ? "pdf" : "note"),
            file_url: m.file_url || m.url || null,
            url: m.url || m.file_url || null,
          });
        }
      });

      // C. Remote Supabase materials
      remoteMaterials.forEach((m) => {
        if (
          !m.title?.startsWith("[SYSTEM_") &&
          !m.title?.startsWith("[STUDENT_") &&
          m.category !== "doubt" &&
          !deletedSet.has(m.id) &&
          m.status !== "archived"
        ) {
          materialMap.set(m.id, {
            ...m,
            material_type: m.material_type || (m.category === "pdf" ? "pdf" : "note"),
            file_url: m.file_url || m.url || null,
            url: m.url || m.file_url || null,
          });
        }
      });

      let list = Array.from(materialMap.values());

      // Filter by exam if specified (allow universal materials where exam_id is null/all)
      if (filters?.examId && filters.examId !== "all") {
        list = list.filter((m) => !m.exam_id || m.exam_id === filters.examId);
      }

      // Filter by category if specified
      if (filters?.category && filters.category !== "all") {
        list = list.filter((m) => m.category === filters.category);
      }

      // Client-side search for maximum responsiveness & robust text matching
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(
          (m) =>
            m.title?.toLowerCase().includes(q) ||
            m.content?.toLowerCase().includes(q) ||
            m.category?.toLowerCase().includes(q)
        );
      }

      // Sort by newest first
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return list;
    } catch {
      return [];
    }
  }, forceRefresh);
}

/**
 * Fetch questions matching exam and subject filters
 */
export async function getQuestions(
  filters?: {
    examId?: string;
    subjectId?: string;
    difficulty?: string;
    search?: string;
  },
  forceRefresh: boolean = false
): Promise<Question[]> {
  const cacheKey = `questions_${filters?.examId || "all"}_${filters?.subjectId || "all"}_${filters?.difficulty || "all"}_${filters?.search || ""}`;
  return fetchWithCache(cacheKey, 60 * 1000, async () => {
    try {
      let query = supabase
        .from("questions")
        .select("id, subject_id, topic_id, exam_id, chapter_id, question_text, options, correct_option_index, explanation, difficulty, is_sample, status, marks, negative_marks, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

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
  }, forceRefresh);
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
export async function getMockTests(examId?: string, forceRefresh: boolean = false): Promise<MockTest[]> {
  const cacheKey = `mocktests_${examId || "all"}`;
  return fetchWithCache(cacheKey, 2 * 60 * 1000, async () => {
    try {
      let query = supabase
        .from("mock_tests")
        .select("id, exam_id, title, description, duration_minutes, total_marks, negative_marking, pass_percentage, is_published, status, created_at, updated_at, mock_test_questions(count)")
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
  }, forceRefresh);
}

/**
 * Fetch a mock test with its questions in sequence
 */
export async function getMockTestById(
  id: string,
  forceRefresh: boolean = false
): Promise<{ test: MockTest; questions: Question[] } | null> {
  return fetchWithCache(`mocktest_${id}`, 5 * 60 * 1000, async () => {
    try {
      const { data: test, error: testErr } = await supabase
        .from("mock_tests")
        .select("id, exam_id, title, description, duration_minutes, total_marks, negative_marking, pass_percentage, is_published, status, created_at, updated_at")
        .eq("id", id)
        .single();

      if (testErr || !test) return null;

      const { data: mtq, error: qErr } = await supabase
        .from("mock_test_questions")
        .select("question_id, order_index, questions(id, subject_id, topic_id, exam_id, chapter_id, question_text, options, correct_option_index, explanation, difficulty, marks, negative_marks)")
        .eq("mock_test_id", id)
        .order("order_index", { ascending: true });

      if (qErr || !mtq) return { test, questions: [] };

      const questions = mtq.map((row: any) => row.questions).filter(Boolean) as Question[];
      return { test, questions };
    } catch {
      return null;
    }
  }, forceRefresh);
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
export async function getStudentProfile(userId: string, forceRefresh: boolean = false): Promise<Profile | null> {
  return fetchWithCache(`profile_${userId}`, 60 * 1000, async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, target_exam_id, target_year, district, phone, bio, is_profile_completed, created_at, updated_at")
        .eq("id", userId)
        .single();

      if (error || !data) return null;
      return data as Profile;
    } catch {
      return null;
    }
  }, forceRefresh);
}

/**
 * Update Student Target Course in Supabase
 */
export async function updateStudentCourse(userId: string, targetExamId: string) {
  invalidateMobileCache("profile");
  invalidateMobileCache("metrics");
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
  invalidateMobileCache("profile");
  invalidateMobileCache("metrics");
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, email, full_name, target_exam_id, target_year, district, phone, bio, is_profile_completed, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Fetch Mission Control Administration Catalog Statistics
 */
export async function getAdminOverviewStats(forceRefresh: boolean = false) {
  return fetchWithCache("admin_overview_stats", 60 * 1000, async () => {
    try {
      // 1. Try single-roundtrip RPC first!
      const { data: rpcCounts, error: rpcErr } = await supabase.rpc("get_admin_dashboard_counts");
      if (!rpcErr && rpcCounts) {
        return {
          studentsCount: Number(rpcCounts.total_students || 0),
          activeCoursesCount: Number(rpcCounts.total_courses || 0),
          chaptersCount: Number(rpcCounts.total_chapters || 0),
          topicsCount: Number(rpcCounts.total_topics || 0),
          questionsCount: Number(rpcCounts.total_questions || 0),
          materialsCount: Number(rpcCounts.total_materials || 0),
          mockTestsCount: Number(rpcCounts.total_mock_tests || 0),
        };
      }
    } catch {
      // Fallback
    }

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
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("exams").select("id", { count: "exact", head: true }),
        supabase.from("chapters").select("id", { count: "exact", head: true }),
        supabase.from("topics").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("study_materials").select("id", { count: "exact", head: true }),
        supabase.from("mock_tests").select("id", { count: "exact", head: true }),
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
  }, forceRefresh);
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
      .select("*, exams(title), mock_test_questions(count)")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((item: any) => ({
      ...item,
      questions_count: item.mock_test_questions?.[0]?.count ?? 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch Questions Belonging to a Specific Mock Test
 */
export async function getMockTestQuestions(mockTestId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("mock_test_questions")
      .select("id, mock_test_id, question_id, marks, order_index, questions(*)")
      .eq("mock_test_id", mockTestId)
      .order("order_index", { ascending: true });

    if (error || !data) return [];

    return (data as any[])
      .map((row: any) => {
        if (!row.questions) return null;
        return {
          ...row.questions,
          mtq_id: row.id,
          mtq_marks: row.marks ?? 1.0,
          mtq_order: row.order_index ?? 0,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Add Single Question Directly to a Mock Test
 */
export async function addQuestionToMockTest(payload: {
  mock_test_id: string;
  exam_id?: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
  negative_marks?: number;
}) {
  // 1. Insert question into questions table
  const qPayload = {
    exam_id: payload.exam_id || null,
    question_text: payload.question_text.trim(),
    options: payload.options,
    correct_option_index: payload.correct_option_index,
    explanation: payload.explanation?.trim() || null,
    difficulty: payload.difficulty || "medium",
    marks: payload.marks || 1.0,
    negative_marks: payload.negative_marks || 0.25,
    is_sample: false,
    status: "published",
  };

  const { data: createdQ, error: qErr } = await supabase
    .from("questions")
    .insert([qPayload])
    .select()
    .single();

  if (qErr || !createdQ) throw qErr || new Error("Failed to create question");

  // 2. Determine highest order_index
  const { data: maxOrderRow } = await supabase
    .from("mock_test_questions")
    .select("order_index")
    .eq("mock_test_id", payload.mock_test_id)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrder = (maxOrderRow?.[0]?.order_index ?? 0) + 1;

  // 3. Link to mock_test_questions
  const { data: linkData, error: linkErr } = await supabase
    .from("mock_test_questions")
    .insert([
      {
        mock_test_id: payload.mock_test_id,
        question_id: createdQ.id,
        marks: qPayload.marks,
        order_index: nextOrder,
      },
    ])
    .select()
    .single();

  if (linkErr) throw linkErr;

  // Invalidate caches so student sees fresh test immediately
  invalidateMobileCache(`mocktest_${payload.mock_test_id}`);
  invalidateMobileCache("mock_test");

  return { ...createdQ, mtq_id: linkData.id, mtq_order: nextOrder };
}

/**
 * Bulk Add Questions to a Mock Test
 */
export async function bulkAddQuestionsToMockTest(
  mockTestId: string,
  questionsList: {
    question_text: string;
    options: string[];
    correct_option_index: number;
    explanation?: string;
    difficulty?: "easy" | "medium" | "hard";
    marks?: number;
    negative_marks?: number;
  }[],
  examId?: string
): Promise<{ successCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];

  // Determine starting order index
  const { data: maxOrderRow } = await supabase
    .from("mock_test_questions")
    .select("order_index")
    .eq("mock_test_id", mockTestId)
    .order("order_index", { ascending: false })
    .limit(1);

  let currentOrder = (maxOrderRow?.[0]?.order_index ?? 0) + 1;

  for (let i = 0; i < questionsList.length; i++) {
    const q = questionsList[i];
    try {
      const qPayload = {
        exam_id: examId || null,
        question_text: q.question_text.trim(),
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : [q.options?.[0] || "Option A", q.options?.[1] || "Option B", q.options?.[2] || "Option C", q.options?.[3] || "Option D"],
        correct_option_index: Number(q.correct_option_index ?? 0),
        explanation: q.explanation?.trim() || null,
        difficulty: q.difficulty || "medium",
        marks: q.marks || 1.0,
        negative_marks: q.negative_marks || 0.25,
        is_sample: false,
        status: "published",
      };

      const { data: createdQ, error: qErr } = await supabase
        .from("questions")
        .insert([qPayload])
        .select()
        .single();

      if (qErr || !createdQ) {
        errors.push(`Q #${i + 1}: ${qErr?.message || "Failed to create"}`);
        continue;
      }

      const { error: linkErr } = await supabase
        .from("mock_test_questions")
        .insert([
          {
            mock_test_id: mockTestId,
            question_id: createdQ.id,
            marks: qPayload.marks,
            order_index: currentOrder++,
          },
        ]);

      if (linkErr) {
        errors.push(`Q #${i + 1} link: ${linkErr.message}`);
      } else {
        successCount++;
      }
    } catch (err: any) {
      errors.push(`Q #${i + 1}: ${err.message}`);
    }
  }

  invalidateMobileCache(`mocktest_${mockTestId}`);
  invalidateMobileCache("mock_test");

  return { successCount, errors };
}

/**
 * Remove a question from a mock test
 */
export async function removeQuestionFromMockTest(
  mockTestId: string,
  questionId: string
) {
  const { error } = await supabase
    .from("mock_test_questions")
    .delete()
    .eq("mock_test_id", mockTestId)
    .eq("question_id", questionId);

  if (error) throw error;

  invalidateMobileCache(`mocktest_${mockTestId}`);
  invalidateMobileCache("mock_test");
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
  invalidateMobileCache("mock_test");
  return data;
}

/**
 * Fetch Study Materials for Admin Management
 */
export async function getAdminMaterialsList(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("study_materials")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    
    // Extract tombstone deleted IDs if present
    const tombstone = (data as any[]).find((m) => m.title === "[SYSTEM_DELETED_MATERIALS]");
    const deletedSet = new Set<string>();
    if (tombstone?.content) {
      try {
        const parsed = JSON.parse(tombstone.content);
        if (Array.isArray(parsed)) parsed.forEach((id: string) => deletedSet.add(id));
      } catch {}
    }

    return (data as any[])
      .filter((m) => !m.title?.startsWith("[SYSTEM_") && !deletedSet.has(m.id))
      .map((m) => ({
        ...m,
        file_url: m.file_url || m.url || null,
        url: m.url || m.file_url || null,
      }));
  } catch {
    return [];
  }
}

/**
 * Create a new Study Material / Notes / PDF
 */
export async function createAdminMaterial(payload: {
  topic_id?: string;
  exam_id?: string;
  subject_id?: string;
  title: string;
  material_type?: string;
  category?: string;
  content?: string;
  url?: string;
  file_url?: string;
}) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const cleanTopicId = (payload.topic_id && uuidRegex.test(payload.topic_id))
    ? payload.topic_id
    : "c1111111-1111-1111-1111-111111111111";

  const targetUrl = payload.file_url || payload.url || null;
  let mType = (payload.material_type || "").toLowerCase();
  if (mType === "pdf" || payload.category === "pdf" || targetUrl) {
    mType = "link";
  } else if (mType !== "link" && mType !== "note") {
    mType = "note";
  }

  const newRow: any = {
    topic_id: cleanTopicId,
    title: payload.title.trim(),
    material_type: mType,
    content: payload.content || payload.title.trim(),
    url: targetUrl,
    file_url: targetUrl,
    is_official: true,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (payload.category) newRow.category = payload.category;
  if (payload.exam_id && uuidRegex.test(payload.exam_id)) newRow.exam_id = payload.exam_id;
  if (payload.subject_id && uuidRegex.test(payload.subject_id)) newRow.subject_id = payload.subject_id;

  try {
    const { data, error } = await supabase
      .from("study_materials")
      .insert([newRow])
      .select()
      .single();

    if (!error && data) {
      invalidateMobileCache("materials");
      return data;
    }
  } catch (err) {
    console.warn("Direct insert failed in createAdminMaterial, falling back:", err);
  }

  invalidateMobileCache("materials");
  return { id: Math.random().toString(36).substring(2), ...newRow };
}

/**
 * Delete a Study Material / Notes / PDF permanently with tombstone persistence
 */
export async function deleteAdminMaterial(id: string): Promise<boolean> {
  try {
    // 1. Delete physical row from database if present
    await supabase.from("study_materials").delete().eq("id", id);

    // 2. Persist tombstone into [SYSTEM_DELETED_MATERIALS] so it NEVER comes back
    try {
      const { data } = await supabase
        .from("study_materials")
        .select("content")
        .eq("title", "[SYSTEM_DELETED_MATERIALS]")
        .maybeSingle();

      const existingSet = new Set<string>();
      if (data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed)) parsed.forEach((d: string) => existingSet.add(d));
        } catch {}
      }
      existingSet.add(id);

      await supabase.from("study_materials").upsert(
        {
          id: "00000000-0000-0000-0000-000000000001",
          topic_id: "c1111111-1111-1111-1111-111111111111",
          title: "[SYSTEM_DELETED_MATERIALS]",
          content: JSON.stringify(Array.from(existingSet)),
          material_type: "link",
          category: "system",
          status: "archived",
          is_official: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (tombErr) {
      console.warn("Failed to persist tombstone in mobile deleteAdminMaterial:", tombErr);
    }

    invalidateMobileCache("materials");
    return true;
  } catch (e) {
    console.warn("deleteAdminMaterial exception:", e);
    return false;
  }
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
  targetExamId?: string | null,
  forceRefresh: boolean = false
): Promise<DashboardMetrics> {
  const cacheKey = `metrics_${userId}_${targetExamId || "all"}`;
  return fetchWithCache(cacheKey, 2 * 60 * 1000, async () => {
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
        supabase.from("student_activity").select("id, user_id, activity_type, title, description, created_at, metadata").eq("user_id", userId).order("created_at", { ascending: false }).limit(6),
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
  }, forceRefresh);
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


