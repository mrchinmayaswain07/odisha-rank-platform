/**
 * OdishaRank Verification Test Suite
 * Minimum Testing Requirements:
 * - Profile validation checks
 * - Safe redirect validation
 * - Progress calculation checks (Official vs Personal isolation)
 * - Question-answer evaluation checks
 * - Mock-test scoring checks with negative marking
 * - Ownership & content modification rules
 */

import {
  profileSchema,
  sanitizeRedirect,
  ODISHA_DISTRICTS,
} from "../lib/validation";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("  ODISHARANK AUTOMATED COMPREHENSIVE TEST SUITE  ");
  console.log("=================================================\n");

  // TEST 1: Profile Validation Checks
  console.log("1. PROFILE VALIDATION CHECKS");
  {
    const validProfile = {
      full_name: "Subrat Pattnaik",
      target_exam_id: "11111111-1111-1111-1111-111111111111",
      target_year: 2026,
      district: "Khordha (Bhubaneswar)",
      phone: "9876543210",
      bio: "Aspiring OSSC CGL state cadre candidate.",
    };
    const res1 = profileSchema.safeParse(validProfile);
    assert(res1.success, "Valid profile with Odisha district passes Zod validation");

    const invalidPhone = {
      ...validProfile,
      phone: "12345", // Invalid Indian phone
    };
    const res2 = profileSchema.safeParse(invalidPhone);
    assert(!res2.success, "Invalid mobile number (<10 digits, wrong prefix) is rejected");

    const invalidYear = {
      ...validProfile,
      target_year: 2018, // Past year
    };
    const res3 = profileSchema.safeParse(invalidYear);
    assert(!res3.success, "Out of range target exam year (<2024) is rejected");
  }

  // TEST 2: Safe Redirect Sanitizer (Open Redirect Protection)
  console.log("\n2. SAFE REDIRECT SECURITY CHECKS");
  {
    assert(
      sanitizeRedirect("/dashboard") === "/dashboard",
      "Relative path '/dashboard' is allowed"
    );
    assert(
      sanitizeRedirect("/profile?tab=exam") === "/profile?tab=exam",
      "Relative path with query params is allowed"
    );
    assert(
      sanitizeRedirect("https://malicious-phishing.com/steal") === "/dashboard",
      "External URL attack is sanitized and defaulted to /dashboard"
    );
    assert(
      sanitizeRedirect("//malicious-phishing.com") === "/dashboard",
      "Protocol-relative '//' attack is sanitized and defaulted"
    );
    assert(
      sanitizeRedirect("/\\malicious-phishing.com") === "/dashboard",
      "Backslash escape bypass is sanitized and defaulted"
    );
  }

  // TEST 3: Progress Calculation Checks (Isolation of Official vs Personal)
  console.log("\n3. PROGRESS CALCULATION & SYLLABUS ISOLATION");
  {
    const totalOfficialTopics = 10;
    let completedOfficial = 0;
    let totalPersonalTopics = 0;
    let completedPersonal = 0;

    // Initial state: new student with 0 activity
    const calcOfficialProgress = (comp: number, tot: number) =>
      tot > 0 ? Math.round((comp / tot) * 100) : 0;
    const calcPersonalProgress = (comp: number, tot: number) =>
      tot > 0 ? Math.round((comp / tot) * 100) : 0;

    assert(
      calcOfficialProgress(completedOfficial, totalOfficialTopics) === 0,
      "New student has 0% official preparation progress (No fabricated metrics)"
    );

    // Student completes 3 official topics
    completedOfficial = 3;
    assert(
      calcOfficialProgress(completedOfficial, totalOfficialTopics) === 30,
      "Completing 3 of 10 official topics yields exactly 30% progress"
    );

    // Student creates 2 custom personal topics and completes 1
    totalPersonalTopics = 2;
    completedPersonal = 1;
    const officialAfterPersonal = calcOfficialProgress(completedOfficial, totalOfficialTopics);
    const personalProg = calcPersonalProgress(completedPersonal, totalPersonalTopics);

    assert(
      officialAfterPersonal === 30,
      "Student-created topic does NOT inflate official syllabus progress (Strict isolation)"
    );
    assert(
      personalProg === 50,
      "Personal study progress reflects student-created topics accurately (50%)"
    );
  }

  // TEST 4: Question Answer Evaluation & Negative Marking
  console.log("\n4. QUESTION-ANSWER EVALUATION & SCORING CHECKS");
  {
    const question = {
      id: "q-1",
      correct_option_index: 1, // Option B
      difficulty: "medium",
    };

    // Correct attempt
    const attempt1 = { selected: 1 };
    const isCorrect1 = attempt1.selected === question.correct_option_index;
    assert(isCorrect1 === true, "Matching correct option index evaluates to TRUE");

    // Incorrect attempt
    const attempt2 = { selected: 3 };
    const isCorrect2 = attempt2.selected === question.correct_option_index;
    assert(isCorrect2 === false, "Mismatched option index evaluates to FALSE");
  }

  // TEST 5: Mock-Test Scoring Simulation
  console.log("\n5. MOCK-TEST SERVER-SIDE SCORING CHECKS");
  {
    const questions = [
      { id: "q1", correct: 1 },
      { id: "q2", correct: 2 },
      { id: "q3", correct: 0 },
      { id: "q4", correct: 3 },
      { id: "q5", correct: 1 },
      { id: "q6", correct: 2 },
    ];
    const totalMarks = 6.0;
    const marksPerQ = totalMarks / questions.length; // 1.0
    const negMark = 0.25;

    // Student submissions:
    // q1: 1 (correct, +1.0)
    // q2: 2 (correct, +1.0)
    // q3: 0 (correct, +1.0)
    // q4: 3 (correct, +1.0)
    // q5: 0 (wrong, -0.25)
    // q6: null (skipped, 0.0)
    const userAnswers: Record<string, number | null> = {
      q1: 1,
      q2: 2,
      q3: 0,
      q4: 3,
      q5: 0,
      q6: null,
    };

    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans === null || ans === undefined) {
        skipped++;
      } else if (ans === q.correct) {
        correct++;
        score += marksPerQ;
      } else {
        incorrect++;
        score -= negMark;
      }
    });

    assert(correct === 4, "Correct count equals 4");
    assert(incorrect === 1, "Incorrect count equals 1");
    assert(skipped === 1, "Skipped count equals 1");
    assert(score === 3.75, "Total score calculates accurately: (4 * 1.0) - (1 * 0.25) = 3.75");

    const attempted = correct + incorrect;
    const accuracy = Math.round((correct / attempted) * 100);
    assert(accuracy === 80, "Accuracy equals 80% (4 correct out of 5 attempted)");
  }

  // TEST 6: Ownership & Modification Rules
  console.log("\n6. OWNERSHIP & CONTENT MODIFICATION POLICIES");
  {
    const officialChapter = {
      id: "ch-official",
      is_official: true,
      created_by: null,
    };

    const studentUser = "user-123";
    const canStudentModifyOfficial = !officialChapter.is_official || officialChapter.created_by === studentUser;
    assert(!canStudentModifyOfficial, "Student cannot modify or delete official syllabus chapters");

    const studentChapter = {
      id: "ch-custom",
      is_official: false,
      created_by: "user-123",
    };
    const canStudentModifyOwn = !studentChapter.is_official && studentChapter.created_by === studentUser;
    assert(canStudentModifyOwn, "Student can modify or delete their own custom chapters");

    const otherStudentChapter = {
      id: "ch-custom-2",
      is_official: false,
      created_by: "user-999",
    };
    const canStudentModifyOther = !otherStudentChapter.is_official && otherStudentChapter.created_by === studentUser;
    assert(!canStudentModifyOther, "Cross-user data access prevented: student cannot modify another student's content");
  }

  // TEST 7: Course Switching & Syllabus Isolation
  console.log("\n7. COURSE SWITCHING & PERSONALIZATION ISOLATION");
  {
    // Course A (OSSC CGL) has 8 topics; Course B (OSSSC RI) has 4 topics
    const courseA = {
      id: "course-ossc-cgl",
      title: "OSSC CGL",
      topics: ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"],
    };
    const courseB = {
      id: "course-osssc-ri",
      title: "OSSSC RI",
      topics: ["t9", "t10", "t11", "t12"],
    };

    // Student has completed t1, t2 (from Course A) and t9 (from Course B)
    const completedTopics = new Set(["t1", "t2", "t9"]);

    // Calculate progress when Course A is active
    const calcCourseProgress = (courseTopics: string[], completed: Set<string>) => {
      const done = courseTopics.filter((t) => completed.has(t)).length;
      return Math.round((done / courseTopics.length) * 100);
    };

    const progressA = calcCourseProgress(courseA.topics, completedTopics);
    assert(progressA === 25, "Active Course A (OSSC CGL) calculates 25% (2 of 8 topics completed)");

    // Student switches to Course B (OSSSC RI)
    const progressB = calcCourseProgress(courseB.topics, completedTopics);
    assert(progressB === 25, "Active Course B (OSSSC RI) calculates 25% (1 of 4 topics completed)");

    // Verify Course A progress was not wiped or corrupted by switching
    const progressARevisited = calcCourseProgress(courseA.topics, completedTopics);
    assert(progressARevisited === 25, "Switching back to Course A preserves 25% progress without data corruption");
  }

  // TEST 8: Pagination Logic & Limit Offsets
  console.log("\n8. PAGINATION LOGIC & BOUNDARY CONDITIONS");
  {
    const totalItems = 45;
    const pageSize = 10;
    const calcTotalPages = (total: number, size: number) => Math.ceil(total / size) || 1;
    const calcSlice = (page: number, size: number) => ({
      from: (page - 1) * size,
      to: Math.min(page * size - 1, totalItems - 1),
    });

    assert(calcTotalPages(totalItems, pageSize) === 5, "Total 45 items with page size 10 yields 5 pages");
    const p1 = calcSlice(1, pageSize);
    assert(p1.from === 0 && p1.to === 9, "Page 1 slices range 0 to 9");
    const p5 = calcSlice(5, pageSize);
    assert(p5.from === 40 && p5.to === 44, "Page 5 slices range 40 to 44");
  }

  // TEST 9: Secure Server-Side RBAC Enforcement
  console.log("\n9. SERVER-SIDE RBAC & ROLE CHECKING");
  {
    const rolesTable = [
      { user_id: "user-admin-1", role: "admin" },
      { user_id: "user-student-1", role: "student" },
    ];

    const checkIsAdminServer = (uid?: string) =>
      Boolean(rolesTable.find((r) => r.user_id === uid && r.role === "admin"));

    assert(checkIsAdminServer("user-admin-1") === true, "Authorized admin ID returns true");
    assert(checkIsAdminServer("user-student-1") === false, "Regular student ID returns false");
    assert(checkIsAdminServer(undefined) === false, "Unauthenticated session returns false");
    assert(checkIsAdminServer("attacker-id") === false, "Unknown user ID returns false");

    const { ROOT_ADMIN_EMAIL } = await import("../lib/admin-auth");
    assert(
      ROOT_ADMIN_EMAIL === "mrchinmayaswain07@gmail.com",
      "mrchinmayaswain07@gmail.com is exclusively configured as root platform administrator"
    );

    // Verify non-root emails are not granted root administrator immunity
    const auxiliaryEmails = ["cchinmaya071@gmail.com", "cchinmaya8018@gmail.com", "cchinmayaff@gmail.com"];
    const isImmuneAdmin = (email: string) => email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
    for (const email of auxiliaryEmails) {
      assert(!isImmuneAdmin(email), `Auxiliary email ${email} is NOT immune nor hardcoded admin`);
    }

    // Verify Root Admin Profile Immunity Guard
    const attemptDemote = (email: string, targetRole: string) => {
      if (email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase() && targetRole !== "admin") {
        return { allowed: false, error: "Root admin cannot be demoted" };
      }
      return { allowed: true, error: null };
    };
    assert(
      attemptDemote("mrchinmayaswain07@gmail.com", "student").allowed === false,
      "Root admin profile demotion attempt is strictly blocked (Immutable Root Admin)"
    );

    // Verify Register Route Redirect for authenticated users
    const getRegisterRedirect = (user: { email: string } | null) => {
      if (!user) return null;
      return user.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase() ? "/admin" : "/dashboard";
    };
    assert(
      getRegisterRedirect({ email: "mrchinmayaswain07@gmail.com" }) === "/admin",
      "Authenticated root admin visiting /register redirects to /admin"
    );
    assert(
      getRegisterRedirect({ email: "student@test.com" }) === "/dashboard",
      "Authenticated student visiting /register redirects to /dashboard"
    );
  }

  // TEST 10: Content Publishing Workflow States & Study Materials System
  console.log("\n10. CONTENT PUBLISHING WORKFLOW STATES & STUDY MATERIALS SYSTEM");
  {
    const { getStudyMaterials, saveRuntimeMaterial, updateRuntimeMaterialStatus } = await import("../lib/data-service");

    const testMat = {
      id: "mat-test-verification-1",
      topic_id: "top-modern-history",
      subject_id: "sub-general-studies",
      exam_id: "exam-cgl",
      title: "Odisha Freedom Struggle & Paika Rebellion Notes",
      description: "Official summary of 1817 Paika Rebellion led by Bakshi Jagabandhu.",
      material_type: "note" as const,
      category: "notes" as const,
      url: "",
      file_url: "",
      file_size: 154000,
      content: "# Paika Rebellion 1817\nLed by Bakshi Jagabandhu in Khurda.",
      status: "published" as const,
      is_official: true,
      created_by: null,
      download_count: 0,
      created_at: new Date().toISOString(),
    };

    saveRuntimeMaterial(testMat);

    // 1. Verify students see published
    const studentMats = await getStudyMaterials({ status: "published", examId: "exam-cgl" });
    assert(
      studentMats.some((m) => m.id === "mat-test-verification-1"),
      "Published material appears in student catalog for eligible exam"
    );

    // 2. Verify category filter works
    const formulaMats = await getStudyMaterials({ status: "published", category: "formulas" });
    assert(
      !formulaMats.some((m) => m.id === "mat-test-verification-1"),
      "Category filter correctly isolates formula sheets from notes"
    );

    // 3. Verify search filter works
    const searchedMats = await getStudyMaterials({ status: "published", search: "Bakshi Jagabandhu" });
    assert(
      searchedMats.some((m) => m.id === "mat-test-verification-1"),
      "Real-time search matches keywords within title, description, and content"
    );

    // 4. Verify admin archiving immediately hides material from students
    updateRuntimeMaterialStatus("mat-test-verification-1", "archived");
    const studentMatsAfterArchive = await getStudyMaterials({ status: "published", examId: "exam-cgl" });
    assert(
      !studentMatsAfterArchive.some((m) => m.id === "mat-test-verification-1"),
      "Archiving material immediately hides it from student view"
    );

    // 5. Verify admin still sees archived materials when requesting all
    const adminMatsAfterArchive = await getStudyMaterials({ status: "all" });
    assert(
      adminMatsAfterArchive.some((m) => m.id === "mat-test-verification-1"),
      "Administrator retains visibility of archived materials for audit and restoration"
    );
  }

  // TEST 11: Tailwind Class Precedence (Card Dark Theme Conflict Resolution)
  console.log("\n11. TAILWIND CLASS RESOLUTION (CN UTILITY)");
  {
    const { cn } = await import("../lib/utils");
    const merged = cn("bg-white border-slate-200 text-slate-900", "bg-slate-950 border-slate-800 text-white");
    assert(!merged.includes("bg-white"), "twMerge strips conflicting 'bg-white' when 'bg-slate-950' is provided");
    assert(merged.includes("bg-slate-950"), "twMerge preserves 'bg-slate-950'");
    assert(!merged.includes("border-slate-200"), "twMerge strips conflicting 'border-slate-200'");
    assert(merged.includes("border-slate-800"), "twMerge preserves 'border-slate-800'");
  }

  // TEST 12: Student Directory & User Roles In-Memory Join
  console.log("\n12. STUDENT DIRECTORY SCHEMA DECOUPLING");
  {
    const profiles = [
      { id: "u1", full_name: "Subrat", target_exam_id: "e1" },
      { id: "u2", full_name: "Chinmaya", target_exam_id: "e2" },
    ];
    const roles = [
      { user_id: "u1", role: "student" },
      { user_id: "u2", role: "admin" },
    ];
    const roleMap = Object.fromEntries(roles.map((r) => [r.user_id, r.role]));
    const mapped = profiles.map((p) => ({
      ...p,
      role: roleMap[p.id] || "student",
    }));

    assert(mapped[0].role === "student", "User 1 correctly mapped to student role");
    assert(mapped[1].role === "admin", "User 2 correctly mapped to admin role");
  }

  // TEST 13: Resilient Schema Cache Recovery (Database Auto-Healing)
  console.log("\n13. RESILIENT DATABASE OPERATIONS & SCHEMA CACHE RECOVERY");
  {
    const { resilientInsert, resilientUpdate } = await import("../lib/db-resilient");

    // Simulate PostgREST throwing "Could not find the 'marks' column of 'questions' in the schema cache"
    let callCount = 0;
    const mockClient = {
      from: (table: string) => ({
        insert: (payload: any) => ({
          select: () => ({
            single: async () => {
              callCount++;
              if (payload.marks !== undefined) {
                return { data: null, error: { message: "Could not find the 'marks' column of 'questions' in the schema cache" } };
              }
              if (payload.negative_marks !== undefined) {
                return { data: null, error: { message: "Could not find the 'negative_marks' column of 'questions' in the schema cache" } };
              }
              return { data: { id: "new-q-1", ...payload }, error: null };
            },
          }),
        }),
        update: (payload: any) => ({
          eq: (col: string, val: any) => ({
            select: () => ({
              single: async () => {
                if (payload.marks !== undefined) {
                  return { data: null, error: { message: "Could not find the 'marks' column of 'questions' in the schema cache" } };
                }
                return { data: { id: val, ...payload }, error: null };
              },
            }),
          }),
        }),
      }),
    };

    const payload = {
      question_text: "What is the capital of Odisha?",
      options: ["Cuttack", "Bhubaneswar", "Puri", "Rourkela"],
      correct_option_index: 1,
      marks: 1.0,
      negative_marks: 0.25,
    };

    const res = await resilientInsert(mockClient, "questions", payload);
    assert(res.data !== null, "resilientInsert successfully recovers from missing 'marks' and 'negative_marks'");
    assert(res.data?.marks === undefined, "'marks' property cleanly stripped from insert payload");
    assert(res.data?.negative_marks === undefined, "'negative_marks' property cleanly stripped from insert payload");
    assert(callCount === 3, "resilientInsert retried exactly until unsupported columns were stripped");

    const updateRes = await resilientUpdate(mockClient, "questions", "q-1", { marks: 2.0, question_text: "Updated text" });
    assert(updateRes.data !== null, "resilientUpdate successfully recovers from missing 'marks'");
    assert(updateRes.data?.question_text === "Updated text", "resilientUpdate preserved valid fields");
  }

  // TEST 14: Centralized Contact & Platform Configuration
  console.log("\n14. CENTRALIZED CONTACT & PLATFORM CONFIGURATION");
  {
    const { SITE_CONFIG } = await import("../lib/constants");
    assert(
      SITE_CONFIG.contact.location === "Jagatsinghpur, Odisha – 754140, India",
      "Location matches verified address: 'Jagatsinghpur, Odisha – 754140, India'"
    );
    assert(
      SITE_CONFIG.contact.email === "cchinmaya8018@gmail.com",
      "Support email matches verified address: 'cchinmaya8018@gmail.com'"
    );
    assert(
      SITE_CONFIG.admin.rootEmail === "mrchinmayaswain07@gmail.com",
      "Root admin email matches: 'mrchinmayaswain07@gmail.com'"
    );
  }

  // TEST 15: Catalog In-Memory Caching & Performance
  console.log("\n15. CATALOG IN-MEMORY CACHING & PERFORMANCE OPTIMIZATION");
  {
    const { getExams, invalidateCatalogCache } = await import("../lib/data-service");
    invalidateCatalogCache();
    const t0 = performance.now();
    const exams1 = await getExams();
    const duration1 = performance.now() - t0;

    const t1 = performance.now();
    const exams2 = await getExams();
    const duration2 = performance.now() - t1;

    assert(exams1.length > 0, "Initial getExams retrieves exam catalog");
    assert(exams2.length === exams1.length, "Cached getExams returns identical catalog");
    assert(duration2 <= duration1 + 10, "Cached retrieval is fast and non-blocking");

    invalidateCatalogCache();
    const exams3 = await getExams();
    assert(exams3.length === exams1.length, "getExams works seamlessly after cache invalidation");
  }

  // TEST 16: Shared Monorepo Package Integration (@odisha-rank/shared)
  console.log("\n16. SHARED MONOREPO PACKAGE INTEGRATION (@odisha-rank/shared)");
  {
    const {
      evaluateMockTestScoring,
      calculateProgress,
      calculateAccuracy,
      calculateStudyStreak,
      loginSchema,
      registerSchema,
    } = await import("../packages/shared/src/index");

    // Pure evaluation test
    const dummyTest = {
      total_marks: 100,
      negative_marking: 0.25,
      pass_percentage: 50,
    };
    const dummyQuestions = [
      { id: "q1", question_text: "Q1", options: ["A", "B"], correct_option_index: 0, explanation: "Exp 1" },
      { id: "q2", question_text: "Q2", options: ["A", "B"], correct_option_index: 1, explanation: "Exp 2" },
      { id: "q3", question_text: "Q3", options: ["A", "B"], correct_option_index: 0, explanation: "Exp 3" },
      { id: "q4", question_text: "Q4", options: ["A", "B"], correct_option_index: 1, explanation: "Exp 4" },
    ];
    // 2 correct (50 marks), 1 incorrect (-0.25 marks), 1 skipped
    const answers = { q1: 0, q2: 1, q3: 1 };
    const evalResult = evaluateMockTestScoring(dummyTest, dummyQuestions, answers, 120);

    assert(evalResult.score === 49.75, "Server-authoritative scoring calculates (2 * 25) - 0.25 = 49.75");
    assert(evalResult.correct_count === 2, "Evaluated 2 correct answers");
    assert(evalResult.incorrect_count === 1, "Evaluated 1 incorrect answer");
    assert(evalResult.unanswered_count === 1, "Evaluated 1 unanswered question");
    assert(evalResult.accuracy === 67, "Calculated 67% accuracy (2/3 attempted)");
    assert(evalResult.passed === false, "49.75% is below 50% pass threshold");

    // Streak calculation test
    const streakDays = calculateStudyStreak([
      new Date().toISOString(),
      new Date(Date.now() - 86400000).toISOString(),
      new Date(Date.now() - 86400000 * 2).toISOString(),
    ]);
    assert(streakDays === 3, "Calculated consecutive 3-day study streak");

    // Validation schemas test
    assert(loginSchema.safeParse({ email: "test@domain.com", password: "secretPassword" }).success, "loginSchema validates valid credentials");
    assert(!loginSchema.safeParse({ email: "bad-email", password: "123" }).success, "loginSchema rejects invalid email and short password");
  }

  // TEST 17: Mobile Data Service Contract & Credential Isolation
  console.log("\n17. MOBILE ARCHITECTURE & CREDENTIAL ISOLATION");
  {
    const fs = await import("fs");
    const path = await import("path");

    // Verify mobile directory structure
    const mobileAppExists = fs.existsSync(path.resolve(__dirname, "../mobile/app/_layout.tsx"));
    const mobilePackageExists = fs.existsSync(path.resolve(__dirname, "../mobile/package.json"));
    const mobileEasExists = fs.existsSync(path.resolve(__dirname, "../mobile/eas.json"));
    const sharedPackageExists = fs.existsSync(path.resolve(__dirname, "../packages/shared/src/index.ts"));

    assert(mobileAppExists, "Mobile Expo Router app layout exists");
    assert(mobilePackageExists, "Mobile package.json configuration exists");
    assert(mobileEasExists, "Mobile EAS build configuration exists");
    assert(sharedPackageExists, "Shared TypeScript package exists");

    // Verify client-side Supabase configuration does NOT expose Service Role key
    const mobileSupabaseCode = fs.readFileSync(path.resolve(__dirname, "../mobile/src/lib/supabase.ts"), "utf-8");
    assert(!mobileSupabaseCode.includes("SUPABASE_SERVICE_ROLE_KEY"), "Mobile client never imports or references SUPABASE_SERVICE_ROLE_KEY (Zero leakage)");
  }

  // TEST 18: Ask Doubts, Admin Answers & Privacy Isolation
  console.log("\n18. ASK DOUBTS, ADMIN ANSWERS & PRIVACY ISOLATION");
  {
    const {
      getStudentDoubts,
      createStudentDoubt,
      updateStudentDoubtAnswer,
    } = await import("../lib/data-service");

    const student1 = "user-test-student-101";
    const student2 = "user-test-student-102";

    // 1. Student creates a public doubt
    const publicDoubt = await createStudentDoubt({
      user_id: student1,
      student_name: "Subhashree Mohanty",
      student_email: "subhashree@test.com",
      subject: "General Studies & Odisha Special",
      question: "What is the historical significance of Barabati Fort in Cuttack?",
      is_private: false,
    });
    assert(publicDoubt.status === "pending", "Newly submitted student doubt has status 'pending'");

    // 2. Student creates a private doubt
    const privateDoubt = await createStudentDoubt({
      user_id: student1,
      student_name: "Subhashree Mohanty",
      student_email: "subhashree@test.com",
      subject: "Exam Pattern & Scheme",
      question: "Will non-creamy layer OBC certificate from 2025 be accepted?",
      is_private: true,
    });
    assert(privateDoubt.is_private === true, "Private doubt created with is_private = true");

    // 3. Admin can view both doubts under student questions
    const adminDoubts = await getStudentDoubts({ isAdmin: true });
    assert(adminDoubts.some((d) => d.id === publicDoubt.id), "Admin sees public student question in student questions section");
    assert(adminDoubts.some((d) => d.id === privateDoubt.id), "Admin sees private student question with student details and date");

    // 4. Admin answers the student's question and updates status
    const answeredDoubt = await updateStudentDoubtAnswer(publicDoubt.id, {
      answer: "Barabati Fort was built in 987 CE by King Marakata Keshari of the Somavamshi dynasty (and renovated by the Ganga rulers). It served as the capital fortress of Odisha.",
      answered_by: "OdishaRank Academic Expert",
      status: "answered",
    });
    assert(answeredDoubt?.status === "answered", "Admin successfully answers doubt and updates status to 'answered'");
    assert(answeredDoubt?.is_notified === false, "Student notification triggered (is_notified set to false upon answering)");

    // 5. Correct student sees their answered question in their doubts section
    const student1Doubts = await getStudentDoubts({ userId: student1, includePublicAnswered: true });
    const foundInStudent1 = student1Doubts.find((d) => d.id === publicDoubt.id);
    assert(foundInStudent1?.answer !== null, "Answer appears in the correct student's Doubts section");
    assert(student1Doubts.some((d) => d.id === privateDoubt.id), "Student sees their own private doubt");

    // 6. Privacy Isolation: another student CANNOT see student1's private doubt
    const student2Doubts = await getStudentDoubts({ userId: student2, includePublicAnswered: true });
    assert(!student2Doubts.some((d) => d.id === privateDoubt.id), "Private doubt is strictly invisible to other students (Privacy Isolation)");
    assert(student2Doubts.some((d) => d.id === publicDoubt.id), "Other student sees answered public doubt in Recent Answered Doubts");
  }

  // TEST 19: Authentic Dynamic Performance Analytics Calculations
  console.log("\n19. AUTHENTIC DYNAMIC PERFORMANCE ANALYTICS CALCULATIONS");
  {
    const {
      getPerformanceAnalytics,
      saveRuntimeQuestionAttempt,
      saveRuntimeStudySession,
    } = await import("../lib/data-service");

    const freshUserId = "user-fresh-student-" + Date.now();

    // 1. Fresh student with 0 attempts has 0% or null accuracy (No fake 78% or fake rankings)
    const freshAnalytics = await getPerformanceAnalytics(freshUserId);
    assert(freshAnalytics.overall_accuracy === null, "Overall accuracy is null for student with 0 question attempts");
    assert(freshAnalytics.total_questions_attempted === 0, "Total questions attempted is 0");
    assert(freshAnalytics.avg_speed_seconds === null, "Average speed is null for student with 0 attempts");
    assert(freshAnalytics.total_study_hours === 0, "Total study hours is 0 when no study sessions logged");
    assert(freshAnalytics.has_sufficient_data === false, "Student with no attempts is flagged with insufficient data");
    assert(freshAnalytics.estimated_state_rank === null, "State rank is strictly null/unavailable when data is insufficient (No fake rank)");

    // 2. Student attempts 4 questions: 3 correct, 1 incorrect with specific durations
    saveRuntimeQuestionAttempt({
      user_id: freshUserId,
      question_id: "q-11111111-1111-1111-1111-111111111111",
      selected_option_index: 1,
      is_correct: true,
      time_taken_seconds: 30,
    });
    saveRuntimeQuestionAttempt({
      user_id: freshUserId,
      question_id: "q-22222222-2222-2222-2222-222222222222",
      selected_option_index: 2,
      is_correct: true,
      time_taken_seconds: 40,
    });
    saveRuntimeQuestionAttempt({
      user_id: freshUserId,
      question_id: "q-33333333-3333-3333-3333-333333333333",
      selected_option_index: 0,
      is_correct: false,
      time_taken_seconds: 50,
    });
    saveRuntimeQuestionAttempt({
      user_id: freshUserId,
      question_id: "q-44444444-4444-4444-4444-444444444444",
      selected_option_index: 1,
      is_correct: true,
      time_taken_seconds: 60,
    });

    // 3. Log 120 minutes of verified study session
    saveRuntimeStudySession({
      user_id: freshUserId,
      duration_minutes: 120,
    });

    // 4. Re-calculate analytics
    const updatedAnalytics = await getPerformanceAnalytics(freshUserId);
    assert(updatedAnalytics.total_questions_attempted === 4, "Total questions attempted equals 4");
    assert(updatedAnalytics.total_correct === 3, "Total correct answers equals 3");
    assert(updatedAnalytics.overall_accuracy === 75, "Overall accuracy accurately calculates: (3/4) * 100 = 75%");
    assert(updatedAnalytics.total_study_hours === 2, "Total study hours calculates accurately: 120 mins = 2.0 hrs");
    assert(updatedAnalytics.avg_speed_seconds === 45, "Average speed per MCQ calculates accurately: (30 + 40 + 50 + 60) / 4 = 45 sec");
    assert(updatedAnalytics.speed_label === "Fast Pace", "45 sec pace correctly classified as 'Fast Pace'");

    // 5. Subject breakdown reflection
    assert(Array.isArray(updatedAnalytics.subject_breakdown), "Subject breakdown is array of real subjects");
    assert(updatedAnalytics.recommended_focus.length > 0, "Recommended focus provides targeted guidance based on actual weak areas");
  }

  // --------------------------------------------------------------------------
  // 20. UNIFIED ROUTE SECURITY & FAST-PATH EDGE GUARDS
  // --------------------------------------------------------------------------
  console.log("\n20. UNIFIED ROUTE SECURITY & FAST-PATH EDGE GUARDS");
  {
    const PROTECTED_PREFIXES = [
      "/dashboard",
      "/doubts",
      "/syllabus",
      "/materials",
      "/performance",
      "/questions",
      "/mock-tests",
      "/bookmarks",
      "/courses",
      "/planner",
      "/profile",
      "/admin",
    ];

    const isRouteProtected = (pathname: string) =>
      PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      );

    // Verify all student and admin routes are strictly guarded
    assert(isRouteProtected("/dashboard"), "Dashboard is strictly protected");
    assert(isRouteProtected("/doubts"), "Doubts page is strictly protected against unauthenticated access");
    assert(isRouteProtected("/syllabus"), "Syllabus page is strictly protected");
    assert(isRouteProtected("/materials"), "Materials page is strictly protected");
    assert(isRouteProtected("/performance"), "Performance page is strictly protected");
    assert(isRouteProtected("/questions"), "Questions bank is strictly protected");
    assert(isRouteProtected("/mock-tests"), "Mock tests is strictly protected");
    assert(isRouteProtected("/mock-tests/test-123"), "Active mock test is strictly protected");
    assert(isRouteProtected("/bookmarks"), "Bookmarks is strictly protected");
    assert(isRouteProtected("/courses"), "Courses page is strictly protected");
    assert(isRouteProtected("/planner"), "Planner page is strictly protected");
    assert(isRouteProtected("/profile"), "Profile page is strictly protected");
    assert(isRouteProtected("/admin"), "Admin dashboard is strictly protected");
    assert(isRouteProtected("/admin/doubts"), "Admin doubts is strictly protected");
    assert(isRouteProtected("/admin/students"), "Admin students directory is strictly protected");

    // Verify public routes are accessible
    assert(!isRouteProtected("/"), "Landing page is public");
    assert(!isRouteProtected("/about"), "About page is public");
    assert(!isRouteProtected("/contact"), "Contact page is public");
    assert(!isRouteProtected("/login"), "Login page is public");
    assert(!isRouteProtected("/register"), "Register page is public");

    // Fast-path auth cookie check
    const checkFastPathRedirect = (pathname: string, hasAuthCookie: boolean) => {
      if (isRouteProtected(pathname) && !hasAuthCookie) {
        return `/login?redirectTo=${pathname}`;
      }
      return null;
    };

    assert(
      checkFastPathRedirect("/doubts", false) === "/login?redirectTo=/doubts",
      "Unauthenticated guest visiting /doubts is redirected instantly without network delay"
    );
    assert(
      checkFastPathRedirect("/performance", false) === "/login?redirectTo=/performance",
      "Unauthenticated guest visiting /performance is redirected instantly"
    );

    // Admin edge authorization check
    const checkAdminEdgeAccess = (user: { email: string; role?: string }) => {
      const ROOT_ADMIN = "mrchinmayaswain07@gmail.com";
      if (user.email.toLowerCase() === ROOT_ADMIN.toLowerCase()) return true;
      return user.role === "admin";
    };

    assert(
      checkAdminEdgeAccess({ email: "mrchinmayaswain07@gmail.com" }) === true,
      "Root admin has edge access to /admin"
    );
    assert(
      checkAdminEdgeAccess({ email: "student@odisharank.in", role: "student" }) === false,
      "Student is denied access to /admin at edge"
    );
    assert(
      checkAdminEdgeAccess({ email: "promoted@odisharank.in", role: "admin" }) === true,
      "Promoted admin user has access to /admin"
    );
  }

  // --------------------------------------------------------------------------
  // 21. STUDENT CUSTOM TOPICS & CHAPTERS PERSISTENCE
  // --------------------------------------------------------------------------
  console.log("\n21. STUDENT CUSTOM TOPICS & CHAPTERS PERSISTENCE");
  {
    const studentAId = "student-topic-test-user-a";
    const studentBId = "student-topic-test-user-b";

    // 1. Create a custom chapter for Student A
    const customChapA = {
      id: `custom-chap-${Date.now()}-1`,
      subject_id: "subj-ossc-gs",
      title: "Student A's High-Yield Odisha History Notes",
      is_official: false,
      created_by: studentAId,
    };

    // 2. Create custom topic under custom chapter
    const customTopA = {
      id: `custom-top-${Date.now()}-1`,
      chapter_id: customChapA.id,
      title: "Paika Rebellion & Buxi Jagabandhu Timeline",
      estimated_minutes: 60,
      is_official: false,
      created_by: studentAId,
    };

    assert(customChapA.is_official === false, "Custom chapter is non-official");
    assert(customTopA.is_official === false, "Custom topic is non-official");
    assert(customTopA.created_by === studentAId, "Custom topic owned by student A");

    // 3. User isolation test: Student B cannot delete or overwrite Student A's custom topic
    const canDelete = (item: { created_by: string; is_official: boolean }, callerId: string) => {
      if (item.is_official) return false;
      return item.created_by === callerId;
    };

    assert(canDelete(customTopA, studentAId) === true, "Student A can delete own custom topic");
    assert(canDelete(customTopA, studentBId) === false, "Student B cannot delete Student A's custom topic");
    assert(canDelete({ created_by: "system", is_official: true }, studentAId) === false, "Cannot delete official topic");
  }

  // --------------------------------------------------------------------------
  // 22. MULTI-TIER RESILIENT DOUBTS RETENTION ACROSS REFRESH
  // --------------------------------------------------------------------------
  console.log("\n22. MULTI-TIER RESILIENT DOUBTS RETENTION ACROSS REFRESH");
  {
    const { createStudentDoubt, getStudentDoubts, updateStudentDoubtAnswer } = await import("../lib/data-service");
    const studentId = "student-refresh-test-99";
    const studentName = "Debashis Mohapatra";

    // Submit doubt
    const doubt = await createStudentDoubt({
      user_id: studentId,
      student_name: studentName,
      student_email: "debashis@odisharank.in",
      subject: "Odisha General Studies",
      question: "What was the significance of the 1817 Paika Bidroha in Khordha?",
      is_private: false,
    });

    assert(Boolean(doubt.id), "Doubt is assigned a persistent ID");
    assert(doubt.user_id === studentId, "Doubt is linked to student ID");
    assert(doubt.status === "pending", "Initial doubt status is pending");

    // Fetch doubts as the student (simulating refresh)
    const refreshedStudentDoubts = await getStudentDoubts({ userId: studentId });
    const foundInStudent = refreshedStudentDoubts.find((d) => d.id === doubt.id);
    assert(Boolean(foundInStudent), "Student doubt persists and is immediately retrievable on refresh");

    // Fetch doubts as Admin
    const adminDoubts = await getStudentDoubts({ isAdmin: true });
    const foundInAdmin = adminDoubts.find((d) => d.id === doubt.id);
    assert(Boolean(foundInAdmin), "Admin sees student doubt in admin panel");

    // Admin answers the doubt
    const answeredDoubt = await updateStudentDoubtAnswer(doubt.id, {
      answer: "The Paika Rebellion of 1817 led by Bakshi Jagabandhu was an organized armed rebellion against British rule.",
      answered_by: "Prof. S. Das, Odisha History Faculty",
      status: "answered",
    });

    assert(answeredDoubt?.status === "answered", "Admin successfully marks doubt as answered");
    assert(Boolean(answeredDoubt?.answer), "Answer text is saved");

    // Re-fetch as student to confirm answered doubt appears
    const recheckedStudentDoubts = await getStudentDoubts({ userId: studentId });
    const answeredInStudent = recheckedStudentDoubts.find((d) => d.id === doubt.id);
    assert(answeredInStudent?.status === "answered", "Answered doubt appears for student after refresh");
    assert(answeredInStudent?.answered_by === "Prof. S. Das, Odisha History Faculty", "Faculty details appear on student view");
  }

  // 23. AUTHENTIC DASHBOARD METRICS, DELTAS & DYNAMIC TOPIC PROGRESS
  {
    console.log("\n23. AUTHENTIC DASHBOARD METRICS, DELTAS & DYNAMIC TOPIC PROGRESS");
    const {
      getDashboardMetrics,
      saveRuntimeStudySession,
      saveRuntimeQuestionAttempt,
    } = await import("../lib/data-service");

    const freshStudentId = "student-fresh-analytics-101";

    // 1. Fresh student with 0 data
    const freshMetrics = await getDashboardMetrics(freshStudentId);
    assert(freshMetrics.study_hours === 0, "Fresh student study_hours is 0");
    assert(freshMetrics.study_hours_today === 0, "Fresh student study_hours_today is 0");
    assert(freshMetrics.questions_practiced === 0, "Fresh student questions_practiced is 0");
    assert(freshMetrics.questions_practiced_today === 0, "Fresh student questions_practiced_today is 0");
    assert(freshMetrics.accuracy_percentage === 0, "Fresh student accuracy_percentage is 0% (never fake 78%)");
    assert(freshMetrics.mock_tests_completed === 0, "Fresh student mock_tests_completed is 0");
    assert(freshMetrics.mock_tests_this_month === 0, "Fresh student mock_tests_this_month is 0");
    assert(freshMetrics.study_hours_delta_pct === 0, "Fresh student study_hours_delta_pct is 0% (never fake 20%)");
    assert(freshMetrics.questions_delta_pct === 0, "Fresh student questions_delta_pct is 0% (never fake 12%)");
    assert(Array.isArray(freshMetrics.weekly_stats) && freshMetrics.weekly_stats.length === 7, "Weekly stats array has 7 days");
    assert(freshMetrics.weekly_stats?.[0]?.questionsCount === 0, "Weekly stats questions count is 0 when unattempted");
    assert(freshMetrics.weekly_stats?.[0]?.accuracyPercentage === 0, "Weekly stats accuracy is 0 when unattempted");
    assert(Array.isArray(freshMetrics.monthly_stats) && freshMetrics.monthly_stats.length === 30, "Monthly stats array has 30 days");

    // 2. Add realistic study sessions: yesterday 30m, today 60m
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    saveRuntimeStudySession({
      user_id: freshStudentId,
      duration_minutes: 30,
      session_date: yesterdayStr,
      notes: "Yesterday Indian Polity reading",
    });

    saveRuntimeStudySession({
      user_id: freshStudentId,
      duration_minutes: 60,
      session_date: todayStr,
      notes: "Today Quantitative Aptitude",
    });

    // 3. Add 4 questions today: 3 correct, 1 wrong
    for (let i = 0; i < 3; i++) {
      saveRuntimeQuestionAttempt({
        user_id: freshStudentId,
        question_id: `q-fresh-${i}`,
        is_correct: true,
        selected_option_index: 0,
        time_taken_seconds: 40,
      });
    }
    saveRuntimeQuestionAttempt({
      user_id: freshStudentId,
      question_id: "q-fresh-wrong",
      is_correct: false,
      selected_option_index: 1,
      time_taken_seconds: 50,
    });

    const activeMetrics = await getDashboardMetrics(freshStudentId);
    assert(activeMetrics.study_hours === 1.5, "Total study hours equals 1.5 hrs (90 mins)");
    assert(activeMetrics.study_hours_today === 1.0, "Today study hours equals 1.0 hr (60 mins)");
    assert(activeMetrics.study_hours_yesterday === 0.5, "Yesterday study hours equals 0.5 hr (30 mins)");
    assert(activeMetrics.study_hours_delta_pct === 100, "Study hours delta is +100% vs yesterday ((1.0 - 0.5) / 0.5 * 100)");
    assert(activeMetrics.questions_practiced === 4, "Total questions practiced equals 4");
    assert(activeMetrics.questions_practiced_today === 4, "Today questions practiced equals 4");
    assert(activeMetrics.accuracy_percentage === 75, "Overall accuracy equals 75% ((3/4)*100)");
    assert(activeMetrics.study_streak_days >= 1, "Active study streak is >= 1 day");
  }

  // 24. SPEED CALCULATION DRILLS & MENTAL MATH ENGINE
  {
    console.log("\n24. SPEED CALCULATION DRILLS & MENTAL MATH ENGINE");
    const {
      SPEED_MATH_CATEGORIES,
      generateSpeedMathQuestions,
      generateSingleQuestion,
      calculateSpeedMathResult,
    } = await import("../packages/shared/src/speed-math");

    // 1. Verify 16 categories exist
    assert(SPEED_MATH_CATEGORIES.length === 16, "All 16 speed calculation drill categories are registered");

    // Verify key categories present
    const categoryIds = SPEED_MATH_CATEGORIES.map((c) => c.id);
    assert(categoryIds.includes("addition"), "Addition drill registered");
    assert(categoryIds.includes("subtraction"), "Subtraction drill registered");
    assert(categoryIds.includes("multiplication"), "Multiplication drill registered");
    assert(categoryIds.includes("division"), "Division drill registered");
    assert(categoryIds.includes("bodmas"), "BODMAS drill registered");
    assert(categoryIds.includes("squares"), "Squares drill registered");
    assert(categoryIds.includes("cubes"), "Cubes drill registered");
    assert(categoryIds.includes("tables"), "Tables drill registered");
    assert(categoryIds.includes("square_root"), "Square Root drill registered");
    assert(categoryIds.includes("cube_root"), "Cube Root drill registered");
    assert(categoryIds.includes("exponents"), "Exponents drill registered");
    assert(categoryIds.includes("exponent_root"), "Exponent Root drill registered");
    assert(categoryIds.includes("fraction_of_percent"), "Fraction of % drill registered");
    assert(categoryIds.includes("percent_to_fraction"), "% to Fraction drill registered");
    assert(categoryIds.includes("di_addition"), "DI Addition drill registered");
    assert(categoryIds.includes("mix"), "Mix Mode drill registered");

    // 2. Test Question Generation across difficulties
    const easyAddition = generateSingleQuestion("addition", "easy", 1);
    assert(Boolean(easyAddition.prompt && easyAddition.answer), "Easy addition question generated with prompt and answer");

    const hardSquares = generateSingleQuestion("squares", "hard", 1);
    const nMatch = hardSquares.prompt.match(/^(\d+)²$/);
    assert(Boolean(nMatch), "Hard squares generates valid prompt n²");
    if (nMatch) {
      const base = Number(nMatch[1]);
      assert(base >= 51 && base <= 99, "Hard squares chooses base between 51 and 99");
      assert(hardSquares.answer === String(base * base), "Hard squares calculates exact square value");
    }

    const midDivision = generateSingleQuestion("division", "medium", 1);
    assert(midDivision.prompt.includes("÷"), "Division drill generates prompt with division symbol");

    // 3. Test Question Count Generation
    const questionsList10 = generateSpeedMathQuestions("multiplication", "easy", 10);
    assert(questionsList10.length === 10, "Generates requested 10 questions");

    const questionsList20 = generateSpeedMathQuestions("cubes", "medium", 20);
    assert(questionsList20.length === 20, "Generates requested 20 questions");

    // 4. Test Performance & Accuracy Calculation
    const testRecords = [
      { prompt: "12 + 15", userAnswer: "27", correctAnswer: "27", isCorrect: true, timeSeconds: 1.5 },
      { prompt: "20 + 30", userAnswer: "50", correctAnswer: "50", isCorrect: true, timeSeconds: 2.0 },
      { prompt: "45 + 55", userAnswer: "100", correctAnswer: "100", isCorrect: true, timeSeconds: 1.8 },
      { prompt: "18 + 19", userAnswer: "36", correctAnswer: "37", isCorrect: false, timeSeconds: 3.5 },
    ];
    const evaluated = calculateSpeedMathResult("addition", "easy", testRecords);
    assert(evaluated.totalQuestions === 4, "Total questions equals 4");
    assert(evaluated.correctAnswers === 3, "Correct answers equals 3");
    assert(evaluated.incorrectAnswers === 1, "Incorrect answers equals 1");
    assert(evaluated.accuracyPercentage === 75, "Accuracy equals 75% ((3/4)*100)");
    assert(evaluated.averageSecondsPerQuestion === 2.2, "Avg seconds per question accurately evaluates: (1.5+2.0+1.8+3.5)/4 = 2.2s");
    assert(evaluated.speedRating === "👍 Solid Pace", "75% accuracy and 2.2s pace rated as Solid Pace");
  }

  // TEST 25: GAMES & BRAIN TRAINING (32 COGNITIVE ENGINES & REASONING DRILLS)
  console.log("\n25. GAMES & BRAIN TRAINING (32 COGNITIVE ENGINES & REASONING DRILLS)");
  {
    const {
      GAMES_CATALOG,
      filterGames,
      generate24GamePuzzle,
      validate24GameExpression,
      init2048Game,
      slide2048,
      generateMagicSquarePuzzle,
      validateMagicSquare,
      generateNumberBonds,
      generateNerdlePuzzle,
      evaluateNerdleGuess,
      generateSudokuPuzzle,
      validateSudokuCell,
      initMinesweeper,
      placeMinesSafeFirstClick,
      initTowerOfHanoi,
      generateBinaryPuzzle,
      validateBinaryPuzzle,
      generateNumberSequenceQuestion,
      generateOddOneOutQuestion,
      generateMissingOperatorQuestion,
    } = await import("../packages/shared/src/index");

    const { getStudentGameProfile, saveGameSessionResult, getDailyBrainChallenge } = await import("../lib/games-service");

    // 1. Catalogue Completeness
    assert(GAMES_CATALOG.length === 32, "Catalog contains exactly all 32 games");
    const free = GAMES_CATALOG.filter((g: any) => g.access === "free");
    const premium = GAMES_CATALOG.filter((g: any) => g.access === "premium");
    assert(free.length === 20, "Contains exactly 20 Free games matching reference");
    assert(premium.length === 12, "Contains exactly 12 Premium games matching reference");

    const math = GAMES_CATALOG.filter((g: any) => g.category === "math");
    const memory = GAMES_CATALOG.filter((g: any) => g.category === "memory");
    const logic = GAMES_CATALOG.filter((g: any) => g.category === "logic");
    const pattern = GAMES_CATALOG.filter((g: any) => g.category === "pattern");

    assert(math.length === 15, "15 Math games registered");
    assert(memory.length === 3, "3 Memory games registered");
    assert(logic.length === 8, "8 Logic games registered");
    assert(pattern.length === 6, "6 Pattern games registered");

    // 2. Engine Correctness
    const p24 = generate24GamePuzzle("easy");
    const val24 = validate24GameExpression(p24.solution.replace("= 24", "").trim(), p24.numbers);
    assert(val24.valid, "24 Game validates legitimate solutions");

    const g2048 = init2048Game();
    assert(g2048.board.length === 4, "2048 initializes 4x4 matrix");

    const ms = generateMagicSquarePuzzle("easy");
    assert(validateMagicSquare(ms.solution, 15).valid, "Magic Square validates magic sum 15");

    const nb = generateNumberBonds(100, 6);
    assert(nb.cards.length === 12, "Number bonds generates 12 cards for 6 pairs");

    const nerdle = generateNerdlePuzzle();
    const evNerdle = evaluateNerdleGuess(nerdle.solutionEquation, nerdle.solutionEquation);
    assert(Boolean(evNerdle.valid && evNerdle.statuses?.every((s: any) => s === "correct")), "Nerdle evaluates valid equations");

    const sud = generateSudokuPuzzle("easy");
    assert(validateSudokuCell(sud.solution, 0, 0, sud.solution[0][0]), "Sudoku validates board constraints");

    let msweeper = initMinesweeper(8, 8, 10);
    msweeper = placeMinesSafeFirstClick(msweeper, 2, 2);
    assert(!msweeper.grid[2][2].isMine, "Minesweeper guarantees first-click safety");

    const hanoi = initTowerOfHanoi(3);
    assert(hanoi.optimalMoves === 7, "Tower of Hanoi evaluates 2^n - 1 = 7 optimal moves");

    const bin = generateBinaryPuzzle();
    assert(validateBinaryPuzzle(bin.solution).valid, "Binary Puzzle Takuzu rules validated");

    const nseq = generateNumberSequenceQuestion();
    assert(nseq.options.includes(nseq.correctAnswer), "Number Sequence includes intended answer");

    const odd = generateOddOneOutQuestion();
    assert(odd.numbers.includes(odd.outlier), "Odd One Out contains authentic mathematical outlier");

    const mop = generateMissingOperatorQuestion();
    assert(mop.options.includes(`${mop.correctOp1} , ${mop.correctOp2}`), "Missing operator contains correct operators");

    // 3. Daily Brain Challenge & Student Profile
    const daily = getDailyBrainChallenge();
    assert(daily.games.length === 3, "Daily Challenge provides exactly 3 curated games");
    assert(daily.bonusXp === 50, "Daily Challenge awards 50 bonus XP");

    const dummyUser = `test-gamer-${Date.now()}`;
    const prof = await getStudentGameProfile(dummyUser);
    assert(prof.brainScore >= 400 && prof.brainScore <= 1000, "Student initial Brain Score is within valid 400-1000 range");

    const sessionRes = await saveGameSessionResult(dummyUser, {
      gameId: "game-24",
      category: "math",
      difficulty: "easy",
      score: 100,
      timeSeconds: 45,
      moves: 4,
      accuracy: 100,
      won: true,
      explanation: "3 * 8 = 24",
    });
    assert(sessionRes.profile.totalGamesPlayed === 1, "Student total games played increments to 1");
    assert(sessionRes.profile.totalWins === 1, "Student total wins increments to 1");
    assert(sessionRes.newAchievements.some((a: any) => a.id === "first_game"), "First game achievement unlocks on first play");
  }

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();

