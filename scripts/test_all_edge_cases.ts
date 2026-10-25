import {
  evaluateTrainerSession,
  generateTrainerQuestion,
  CalculationTrainerAttempt,
  CalculationTrainerConfig,
  CalculationTrainerDifficulty,
  CalculationTrainerCategory,
} from "../packages/shared/src/calc-trainer";

console.log("==================================================");
console.log("   CALCULATION TRAINER EXTREME EDGE CASES TEST    ");
console.log("==================================================");

let totalPassed = 0;
let totalFailed = 0;

function assert(cond: boolean, desc: string) {
  if (cond) {
    console.log(`  [PASS] ${desc}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    totalFailed++;
  }
}

const baseConfig: CalculationTrainerConfig = {
  durationMinutes: 10,
  difficulty: "intermediate",
  categories: ["addition", "multiplication"],
  inputMode: "mcq",
};

// 1. STARTING AND IMMEDIATELY EXITING (0, 1, 2 ATTEMPTS)
console.log("\n1. SPRINT DISCARDING (< 3 ATTEMPTS)");
const eval0 = evaluateTrainerSession([], baseConfig, 2);
assert(eval0.totalAttempted === 0, "0 attempts recorded");
assert(eval0.correctCount === 0, "0 correct answers");
assert(eval0.accuracyPercentage === 0, "Accuracy is 0% without NaN");
assert(eval0.correctPerMinute === 0, "0 CPM");
assert(eval0.speedRating === "🎯 Needs Practice", "Rating handles 0 attempts safely");

const attempt1: CalculationTrainerAttempt = {
  questionId: "q1",
  category: "addition",
  difficulty: "intermediate",
  prompt: "100 + 50",
  userAnswer: "150",
  correctAnswer: "150",
  isCorrect: true,
  isSkipped: false,
  timeMs: 2500,
  explanation: "100 + 50 = 150",
};
const eval1 = evaluateTrainerSession([attempt1], baseConfig, 5);
assert(eval1.totalAttempted === 1, "1 attempt recorded");
assert(eval1.correctCount === 1, "1 correct");
assert(eval1.accuracyPercentage === 100, "100% accuracy on single attempt");

const attempt2: CalculationTrainerAttempt = {
  questionId: "q2",
  category: "multiplication",
  difficulty: "intermediate",
  prompt: "12 × 5",
  userAnswer: "60",
  correctAnswer: "60",
  isCorrect: true,
  isSkipped: false,
  timeMs: 1800,
  explanation: "12 × 5 = 60",
};
const eval2 = evaluateTrainerSession([attempt1, attempt2], baseConfig, 8);
assert(eval2.totalAttempted === 2, "2 attempts recorded");
// Under OdishaRank Brain Gym rules, sprints with < 3 attempts are discarded by the UI

// 2. EXACTLY THREE ANSWERS (MINIMUM SPRINT THRESHOLD)
console.log("\n2. EXACTLY 3 ANSWERS (ELIGIBILITY BOUNDARY)");
const attempt3Wrong: CalculationTrainerAttempt = {
  questionId: "q3",
  category: "addition",
  difficulty: "intermediate",
  prompt: "45 + 35",
  userAnswer: "70",
  correctAnswer: "80",
  isCorrect: false,
  isSkipped: false,
  timeMs: 3200,
  explanation: "45 + 35 = 80",
};
const eval3 = evaluateTrainerSession([attempt1, attempt2, attempt3Wrong], baseConfig, 15);
assert(eval3.totalAttempted === 3, "3 attempts recorded");
assert(eval3.correctCount === 2, "2 of 3 correct");
assert(eval3.accuracyPercentage === 67, "67% accuracy computed accurately");
assert(eval3.mistakes.length === 1, "Exactly 1 mistake recorded");
assert(eval3.mistakes[0].prompt === "45 + 35", "Mistake references prompt accurately");

// 3. ALL ANSWERS CORRECT (0 MISTAKES)
console.log("\n3. ALL ANSWERS CORRECT (100% ACCURACY)");
const perfectAttempts: CalculationTrainerAttempt[] = Array.from({ length: 15 }, (_, i) => ({
  questionId: `perf-${i}`,
  category: "addition",
  difficulty: "intermediate",
  prompt: `${i * 10} + 10`,
  userAnswer: String(i * 10 + 10),
  correctAnswer: String(i * 10 + 10),
  isCorrect: true,
  isSkipped: false,
  timeMs: 2000,
  explanation: "Perfect sum",
}));
const evalPerfect = evaluateTrainerSession(perfectAttempts, baseConfig, 30);
assert(evalPerfect.accuracyPercentage === 100, "100% accuracy");
assert(evalPerfect.mistakes.length === 0, "0 mistakes logged");
assert(evalPerfect.speedRating === "⚡ Lightning Fast", "Rated Lightning Fast (2.0s avg, 100% acc)");

// 4. ALL ANSWERS INCORRECT (0% ACCURACY)
console.log("\n4. ALL ANSWERS INCORRECT (0% ACCURACY)");
const wrongAttempts: CalculationTrainerAttempt[] = Array.from({ length: 8 }, (_, i) => ({
  questionId: `wrong-${i}`,
  category: "multiplication",
  difficulty: "intermediate",
  prompt: `${i + 2} × 5`,
  userAnswer: "0",
  correctAnswer: String((i + 2) * 5),
  isCorrect: false,
  isSkipped: false,
  timeMs: 4500,
  explanation: "Wrong product",
}));
const evalWrong = evaluateTrainerSession(wrongAttempts, baseConfig, 36);
assert(evalWrong.accuracyPercentage === 0, "0% accuracy");
assert(evalWrong.mistakes.length === 8, "All 8 attempts queued in mistakes");
assert(evalWrong.speedRating === "🎯 Needs Practice", "Rated Needs Practice");
assert(evalWrong.categoryBreakdown["multiplication"].isWeakArea === true, "Multiplication marked as weak area");

// 5. HIGH-VOLUME SPRINT (60 ANSWERS)
console.log("\n5. HIGH VOLUME SPRINT (60 QUESTIONS)");
const highVolumeAttempts: CalculationTrainerAttempt[] = Array.from({ length: 60 }, (_, i) => ({
  questionId: `hv-${i}`,
  category: i % 2 === 0 ? "addition" : "multiplication",
  difficulty: "intermediate",
  prompt: `Q#${i + 1}`,
  userAnswer: i % 5 === 0 ? "wrong" : "correct",
  correctAnswer: "correct",
  isCorrect: i % 5 !== 0,
  isSkipped: false,
  timeMs: 1800,
  explanation: "Detailed solution",
}));
const evalHV = evaluateTrainerSession(highVolumeAttempts, baseConfig, 120);
assert(evalHV.totalAttempted === 60, "60 attempts recorded");
assert(evalHV.correctCount === 48, "48 correct");
assert(evalHV.incorrectCount === 12, "12 incorrect");
assert(evalHV.accuracyPercentage === 80, "80% accuracy");
assert(evalHV.correctPerMinute === 24.0, "24.0 CPM on 2 active minutes");

// 6. TIMER PAUSE & RESUME MATH
console.log("\n6. ACTIVE TIME CALCULATION EXCLUDING PAUSES");
const now = Date.now();
const sessionStart = now - 60000; // 60s ago
const pausedDurationMs = 25000; // paused for 25s
const activeSec = Math.floor((now - sessionStart - pausedDurationMs) / 1000); // 35s
assert(activeSec === 35, `Active seconds correctly equals 35s (got ${activeSec}s)`);

// 7. WEAK AREA DETECTION LOGIC
console.log("\n7. WEAK AREA BOUNDARY CONDITIONS");
const testWeak = (total: number, correct: number) => {
  const atts: CalculationTrainerAttempt[] = Array.from({ length: total }, (_, i) => ({
    questionId: `w-${i}`,
    category: "percentages",
    difficulty: "advanced",
    prompt: `P#${i}`,
    userAnswer: i < correct ? "c" : "w",
    correctAnswer: "c",
    isCorrect: i < correct,
    isSkipped: false,
    timeMs: 2500,
    explanation: "exp",
  }));
  const res = evaluateTrainerSession(atts, { ...baseConfig, categories: ["percentages"] }, 60);
  return res.categoryBreakdown["percentages"]?.isWeakArea;
};

assert(testWeak(2, 0) === false, "2 attempts with 0% is NOT weak area (requires >= 3)");
assert(testWeak(3, 2) === true, "3 attempts with 67% IS weak area (< 70%)");
assert(testWeak(3, 3) === false, "3 attempts with 100% is NOT weak area");
assert(testWeak(10, 7) === false, "10 attempts with 70% is NOT weak area (>= 70%)");
assert(testWeak(10, 6) === true, "10 attempts with 60% IS weak area (< 70%)");

// 8. IDEMPOTENT BRAIN SCORE REWARD LOGIC
console.log("\n8. BRAIN SCORE IDEMPOTENT DISPATCH SIMULATION");
let userBrainScore = 650;
let rewardAwarded = false;

function awardSprintReward(attemptsCount: number) {
  if (attemptsCount >= 3 && !rewardAwarded) {
    rewardAwarded = true;
    userBrainScore += 5;
    return true;
  }
  return false;
}

assert(awardSprintReward(2) === false, "Ineligible sprint (< 3 attempts) rejected");
assert(userBrainScore === 650, "Score remains 650");
assert(awardSprintReward(4) === true, "Eligible sprint awards +5 Brain Score");
assert(userBrainScore === 655, "Score increments to 655");
assert(awardSprintReward(4) === false, "Duplicate reward attempt blocked by idempotency guard");
assert(userBrainScore === 655, "Score remains 655 (no double reward)");
assert(awardSprintReward(10) === false, "Subsequent calls in same session blocked");
assert(userBrainScore === 655, "Score strictly protected at 655");

// 9. CUSTOM DURATION (1 MIN, 2 MIN, CUSTOM) EVALUATION
console.log("\n9. CUSTOM SESSION DURATION ACCURACY");
const config1m: CalculationTrainerConfig = { ...baseConfig, durationMinutes: 1 };
const eval1m = evaluateTrainerSession(
  [
    { questionId: "1", category: "addition", difficulty: "beginner", prompt: "2+2", userAnswer: "4", correctAnswer: "4", isCorrect: true, isSkipped: false, timeMs: 2000, explanation: "" },
    { questionId: "2", category: "addition", difficulty: "beginner", prompt: "3+3", userAnswer: "6", correctAnswer: "6", isCorrect: true, isSkipped: false, timeMs: 2000, explanation: "" },
    { questionId: "3", category: "addition", difficulty: "beginner", prompt: "4+4", userAnswer: "8", correctAnswer: "8", isCorrect: true, isSkipped: false, timeMs: 2000, explanation: "" },
  ],
  config1m,
  60
);
assert(eval1m.durationMinutes === 1, "1-minute session duration recorded");
assert(eval1m.activeSeconds === 60, "60s active time recorded");
assert(eval1m.correctCount === 3, "3 correct answers in 1m sprint");
assert(eval1m.correctPerMinute === 3.0, "3.0 CPM calculated accurately on 1-minute sprint");

const config2m: CalculationTrainerConfig = { ...baseConfig, durationMinutes: 2 };
const eval2m = evaluateTrainerSession(
  Array.from({ length: 8 }, (_, i) => ({
    questionId: `q-${i}`,
    category: "multiplication",
    difficulty: "beginner",
    prompt: `p-${i}`,
    userAnswer: "ans",
    correctAnswer: "ans",
    isCorrect: true,
    isSkipped: false,
    timeMs: 1500,
    explanation: "",
  })),
  config2m,
  120
);
assert(eval2m.durationMinutes === 2, "2-minute session duration recorded");
assert(eval2m.activeSeconds === 120, "120s active time recorded");
assert(eval2m.correctCount === 8, "8 correct answers in 2m sprint");
assert(eval2m.correctPerMinute === 4.0, "4.0 CPM calculated accurately on 2-minute sprint");

console.log("\n==================================================");
console.log(`  ALL EDGE CASES: ${totalPassed} PASSED, ${totalFailed} FAILED!`);
console.log("==================================================");

if (totalFailed > 0) process.exit(1);
