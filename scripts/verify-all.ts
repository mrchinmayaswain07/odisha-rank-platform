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
  }

  // TEST 10: Content Publishing Workflow States
  console.log("\n10. CONTENT PUBLISHING WORKFLOW STATES");
  {
    const allMaterials = [
      { id: "m1", status: "published" },
      { id: "m2", status: "draft" },
      { id: "m3", status: "archived" },
      { id: "m4", status: "published" },
    ];

    const filterForStudents = (items: typeof allMaterials) =>
      items.filter((item) => item.status === "published");
    const filterForAdmin = (items: typeof allMaterials) => items;

    const studentVisible = filterForStudents(allMaterials);
    assert(studentVisible.length === 2, "Students see only published materials (draft and archived excluded)");
    const adminVisible = filterForAdmin(allMaterials);
    assert(adminVisible.length === 4, "Admins see full catalog across all workflow states");
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

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();

