/**
 * Calculation Speed Trainer Engine — Core Domain Models, Generators & Metrics
 * Professional Mental Arithmetic Training System for OdishaRank
 * Built for competitive examinations (OSSC CGL, OSSSC, OPSC).
 */

import { getIndianDateStr } from "./date-utils";

export type CalculationTrainerDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "exam_challenge";

export type CalculationTrainerCategory =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "percentages"
  | "fractions"
  | "ratios_proportions"
  | "squares"
  | "square_roots"
  | "cubes_roots"
  | "bodmas"
  | "estimation_approximation"
  | "missing_number"
  | "reverse_calculation"
  | "mixed_exam_arithmetic";

export interface CategoryMetadata {
  id: CalculationTrainerCategory;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  color: string;
  bgColor: string;
  shortcutTip: string;
}

export interface CalculationTrainerQuestion {
  id: string;
  category: CalculationTrainerCategory;
  difficulty: CalculationTrainerDifficulty;
  prompt: string;
  subtext?: string;
  answer: string;
  options: string[]; // 4 distinct multiple choice options
  explanation: string;
  shortcut?: string;
  isApproximation?: boolean;
  tolerance?: number;
}

export interface CalculationTrainerConfig {
  durationMinutes: number; // minutes: 1, 2, 5, 10, 15, or custom (1-60)
  difficulty: CalculationTrainerDifficulty;
  categories: CalculationTrainerCategory[];
  inputMode?: "mcq" | "numpad";
}

export interface CalculationTrainerAttempt {
  questionId: string;
  category: CalculationTrainerCategory;
  difficulty: CalculationTrainerDifficulty;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isSkipped: boolean;
  timeMs: number;
  explanation: string;
  shortcut?: string;
}

export interface CategorySummaryStat {
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
  avgTimeMs: number;
  isWeakArea: boolean; // >= 3 attempts with < 70% accuracy
}

export interface CalculationTrainerSessionSummary {
  id: string;
  date: string; // Indian Standard Time (YYYY-MM-DD)
  timestamp: string; // ISO 8601
  durationMinutes: number;
  activeSeconds: number;
  difficulty: CalculationTrainerDifficulty;
  categories: CalculationTrainerCategory[];
  totalAttempted: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  accuracyPercentage: number;
  avgResponseTimeMs: number;
  correctPerMinute: number;
  speedRating: "⚡ Lightning Fast" | "🚀 High Speed" | "👍 Solid Pace" | "🎯 Needs Practice";
  categoryBreakdown: Record<string, CategorySummaryStat>;
  mistakes: CalculationTrainerAttempt[];
  isPersonalBest: boolean;
  warmupCount: number;
  sprintCount: number;
}

export interface CalculationTrainerHistoryStats {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  avgResponseTimeMs: number;
  avgCorrectPerMinute: number;
  personalBests: Record<string, number>; // key: `${difficulty}_${durationMinutes}` -> highest correctPerMinute
  weakCategories: CalculationTrainerCategory[];
  recentSessions: CalculationTrainerSessionSummary[];
}

export const CALCULATION_TRAINER_CATEGORIES: CategoryMetadata[] = [
  {
    id: "addition",
    name: "Addition",
    badge: "CORE",
    description: "Multi-digit column addition, split-sum & grouping",
    iconName: "Plus",
    color: "#2563eb",
    bgColor: "#eff6ff",
    shortcutTip: "Split by place value: 48 + 37 = (40 + 30) + (8 + 7) = 70 + 15 = 85.",
  },
  {
    id: "subtraction",
    name: "Subtraction",
    badge: "CORE",
    description: "Vedic base subtraction & borrowing shortcuts",
    iconName: "Minus",
    color: "#0891b2",
    bgColor: "#ecfeff",
    shortcutTip: "All from 9 and last from 10 when subtracting from 1000s.",
  },
  {
    id: "multiplication",
    name: "Multiplication",
    badge: "ESSENTIAL",
    description: "Vedic cross-method, 11x, 25x & base-100 multiplication",
    iconName: "X",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    shortcutTip: "To multiply by 25: Divide by 4 and multiply by 100.",
  },
  {
    id: "division",
    name: "Division",
    badge: "ESSENTIAL",
    description: "Divisibility rules, 5/25/125 shortcuts & factor division",
    iconName: "Divide",
    color: "#0d9488",
    bgColor: "#f0fdfa",
    shortcutTip: "Divide by 5: Double the number and drop the last zero.",
  },
  {
    id: "percentages",
    name: "Percentages",
    badge: "HIGH-YIELD",
    description: "Benchmark % (10%, 25%, 50%), split-percentage & fraction links",
    iconName: "Percent",
    color: "#ea580c",
    bgColor: "#fff7ed",
    shortcutTip: "15% = 10% + half of 10%. 35% of 240 = 70 + 14 = 84.",
  },
  {
    id: "fractions",
    name: "Fractions",
    badge: "HIGH-YIELD",
    description: "Fraction-to-percent equivalents, butterfly addition & comparison",
    iconName: "PieChart",
    color: "#16a34a",
    bgColor: "#f0fdf4",
    shortcutTip: "1/8 = 12.5%, 3/8 = 37.5%, 5/8 = 62.5%, 7/8 = 87.5%.",
  },
  {
    id: "ratios_proportions",
    name: "Ratios & Proportions",
    badge: "HIGH-YIELD",
    description: "Compounded ratios, missing extremes & ratio distribution",
    iconName: "Scale",
    color: "#4f46e5",
    bgColor: "#eef2ff",
    shortcutTip: "Product of extremes = Product of means: a:b = c:d => a*d = b*c.",
  },
  {
    id: "squares",
    name: "Squares",
    badge: "SPEED",
    description: "Squares 1-50, numbers ending in 5 & base-50/100 tricks",
    iconName: "Square",
    color: "#d97706",
    bgColor: "#fffbeb",
    shortcutTip: "Squares ending in 5: n5² = [n*(n+1)] followed by 25.",
  },
  {
    id: "square_roots",
    name: "Square Roots",
    badge: "SPEED",
    description: "Unit digit elimination, perfect squares up to 10,000",
    iconName: "Radical",
    color: "#0284c7",
    bgColor: "#f0f9ff",
    shortcutTip: "Unit digits match: 1->1/9, 4->2/8, 5->5, 6->4/6, 9->3/7.",
  },
  {
    id: "cubes_roots",
    name: "Cubes & Cube Roots",
    badge: "SPEED",
    description: "Cubes 1-25 & instant 2-second cube root extraction",
    iconName: "Box",
    color: "#9333ea",
    bgColor: "#faf5ff",
    shortcutTip: "Cube unit digit mapping is unique: 2<->8, 3<->7, others stay same.",
  },
  {
    id: "bodmas",
    name: "BODMAS Precedence",
    badge: "EXAM-CORE",
    description: "Nested brackets, orders, division and mixed operations",
    iconName: "Binary",
    color: "#dc2626",
    bgColor: "#fef2f2",
    shortcutTip: "Perform operations inside brackets first: () -> of -> ÷ -> × -> + -> -.",
  },
  {
    id: "estimation_approximation",
    name: "Estimation & Approx",
    badge: "EXAM-CORE",
    description: "Prelims elimination, round numbers & order of magnitude",
    iconName: "Compass",
    color: "#059669",
    bgColor: "#ecfdf5",
    shortcutTip: "Round extreme numbers to nearest 10 or 100 before computing.",
  },
  {
    id: "missing_number",
    name: "Missing Number",
    badge: "DI-LOGIC",
    description: "Algebraic balance equations, ? in series & arithmetic blanks",
    iconName: "HelpCircle",
    color: "#c026d3",
    bgColor: "#fdf4ff",
    shortcutTip: "Shift known constants to right side with inverted operator.",
  },
  {
    id: "reverse_calculation",
    name: "Reverse Calculation",
    badge: "DI-LOGIC",
    description: "Back-calculation from answers, percentage reversals",
    iconName: "RotateCcw",
    color: "#475569",
    bgColor: "#f8fafc",
    shortcutTip: "Start from final output and apply inverse operations backwards.",
  },
  {
    id: "mixed_exam_arithmetic",
    name: "Mixed Exam Sprint",
    badge: "SIMULATION",
    description: "Random competitive exam problems across all mental math domains",
    iconName: "Zap",
    color: "#e11d48",
    bgColor: "#fff1f2",
    shortcutTip: "Read fast, decide method instantly, do not spend >20s on any single step.",
  },
];

// =========================================================================
// RANDOMIZATION ENGINE (INJECTABLE / SEEDABLE)
// =========================================================================

export type RandomSource = () => number;

/**
 * Fast, deterministic 32-bit PRNG (Mulberry32) for reproducible tests and seeded sprints
 */
export function createSeededRandom(seed: number): RandomSource {
  let s = seed | 0;
  return function mulberry32() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helper: safe random integer inclusive
function randInt(min: number, max: number, rng: RandomSource = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Helper: pick random element
function pickRandom<T>(arr: T[], rng: RandomSource = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

// Shuffle array using Fisher-Yates with provided RNG
function shuffleArray<T>(array: T[], rng: RandomSource = Math.random): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Greatest common divisor helper
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Helper: generate 3 distinct distractors around correct numeric answer
function generateDistractors(
  correctValue: number,
  stepRange: number = 10,
  rng: RandomSource = Math.random
): string[] {
  const distractors = new Set<number>();
  const isDecimal = !Number.isInteger(correctValue);
  const allowNegative = correctValue <= 0;

  // Potential cognitive offsets
  const baseOffsets = [
    1,
    -1,
    2,
    -2,
    5,
    -5,
    10,
    -10,
    20,
    -20,
    randInt(3, stepRange, rng),
    -randInt(3, stepRange, rng),
  ];
  // Shuffle offsets so distractors vary between runs
  const offsets = shuffleArray(baseOffsets, rng);

  for (const off of offsets) {
    const candidate = isDecimal
      ? Math.round((correctValue + off * 0.1) * 100) / 100
      : correctValue + off;

    if (candidate !== correctValue && (allowNegative || candidate > 0)) {
      distractors.add(candidate);
    }
    if (distractors.size >= 3) break;
  }

  // Fallback if needed
  let multiplier = 2;
  while (distractors.size < 3) {
    const sign = distractors.size % 2 === 0 ? 1 : -1;
    const candidate = correctValue + multiplier * sign;
    if (candidate !== correctValue && (allowNegative || candidate > 0)) {
      distractors.add(candidate);
    }
    multiplier += 3;
  }

  return Array.from(distractors).slice(0, 3).map(String);
}

export interface GenerateQuestionOptions {
  rng?: RandomSource;
  excludePrompts?: Set<string> | string[];
  maxRetries?: number;
}

/**
 * Raw Single Question Generator
 */
function generateRawQuestion(
  category: CalculationTrainerCategory,
  difficulty: CalculationTrainerDifficulty,
  index: number,
  rng: RandomSource = Math.random
): CalculationTrainerQuestion {
  const qId = `cst-${category}-${difficulty}-${index}-${Date.now()}-${Math.floor(rng() * 1000000).toString(36)}`;

  // Handle mixed competitive exam arithmetic by picking from active categories
  if (category === "mixed_exam_arithmetic") {
    const pool: CalculationTrainerCategory[] = [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "percentages",
      "fractions",
      "ratios_proportions",
      "squares",
      "square_roots",
      "cubes_roots",
      "bodmas",
      "estimation_approximation",
      "missing_number",
      "reverse_calculation",
    ];
    return generateRawQuestion(pickRandom(pool, rng), difficulty, index, rng);
  }

  switch (category) {
    case "addition": {
      if (difficulty === "beginner") {
        const pattern = pickRandom(["2digit", "3addends", "tens_complement"], rng);
        if (pattern === "3addends") {
          const a = randInt(15, 45, rng);
          const b = randInt(10, 35, rng);
          const c = randInt(5, 25, rng);
          const ans = a + b + c;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ${b} + ${c}`,
            subtext: "3-Addend Warm-Up",
            answer: String(ans),
            options,
            explanation: `Group first two: (${a} + ${b} = ${a + b}), then add ${c} = ${ans}.`,
            shortcut: "Pair numbers that make easy tens endings.",
          };
        } else if (pattern === "tens_complement") {
          const tens1 = randInt(2, 6, rng) * 10;
          const tens2 = randInt(1, 4, rng) * 10;
          const u1 = randInt(1, 9, rng);
          const u2 = 10 - u1; // unit digits sum to 10
          const a = tens1 + u1;
          const b = tens2 + u2;
          const ans = a + b;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ${b}`,
            subtext: "Tens Complement Pair",
            answer: String(ans),
            options,
            explanation: `Notice units ${u1} + ${u2} = 10. Tens: ${tens1} + ${tens2} = ${tens1 + tens2}. Sum = ${tens1 + tens2 + 10} = ${ans}.`,
            shortcut: "Look for units summing to 10 for instant mental addition.",
          };
        } else {
          const a = randInt(24, 89, rng);
          const b = randInt(18, 76, rng);
          const ans = a + b;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ${b}`,
            subtext: "2-Digit Addition",
            answer: String(ans),
            options,
            explanation: `Add tens: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${(Math.floor(a / 10) + Math.floor(b / 10)) * 10}. Add units: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. Total = ${ans}.`,
            shortcut: `Round ${b} to ${Math.round(b / 10) * 10}: ${a} + ${Math.round(b / 10) * 10} ${b < Math.round(b / 10) * 10 ? "-" : "+"} ${Math.abs(b - Math.round(b / 10) * 10)} = ${ans}.`,
          };
        }
      } else if (difficulty === "intermediate") {
        const pattern = pickRandom(["3digit", "near_hundred"], rng);
        if (pattern === "near_hundred") {
          const a = randInt(150, 480, rng);
          const hundred = pickRandom([198, 298, 199, 299, 398], rng);
          const ans = a + hundred;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 20, rng)], rng);
          const roundedH = Math.round(hundred / 100) * 100;
          const diff = roundedH - hundred;
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ${hundred}`,
            subtext: "Near-Hundred Sum",
            answer: String(ans),
            options,
            explanation: `Add ${roundedH} then subtract ${diff}: (${a} + ${roundedH}) - ${diff} = ${a + roundedH} - ${diff} = ${ans}.`,
            shortcut: `Add ${roundedH} and take away ${diff}.`,
          };
        } else {
          const a = randInt(145, 480, rng);
          const b = randInt(125, 390, rng);
          const ans = a + b;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 20, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ${b}`,
            subtext: "3-Digit Mental Sum",
            answer: String(ans),
            options,
            explanation: `${a} + ${b} = (${a} + ${Math.floor(b / 100) * 100}) + ${b % 100} = ${a + Math.floor(b / 100) * 100} + ${b % 100} = ${ans}.`,
            shortcut: "Left-to-right calculation: Hundreds first, then tens, then units.",
          };
        }
      } else if (difficulty === "advanced") {
        const a = randInt(1250, 4850, rng);
        const b = randInt(1120, 3940, rng);
        const ans = a + b;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 50, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} + ${b}`,
          subtext: "4-Digit Column Addition",
          answer: String(ans),
          options,
          explanation: `Split sum: Thousands = ${Math.floor(a / 1000) * 1000 + Math.floor(b / 1000) * 1000}, Remainder = ${(a % 1000) + (b % 1000)}. Sum = ${ans}.`,
          shortcut: "Group near thousands for instantaneous mental accumulation.",
        };
      } else {
        // exam_challenge: 3 or 4 addends (DI style)
        const a = randInt(350, 850, rng);
        const b = randInt(250, 650, rng);
        const c = randInt(150, 450, rng);
        const ans = a + b + c;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 40, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} + ${b} + ${c}`,
          subtext: "Competitive Exam DI Multi-Sum",
          answer: String(ans),
          options,
          explanation: `Add pairs first: (${a} + ${b}) = ${a + b}. Then add ${c} = ${ans}.`,
          shortcut: "Look for combinations making 100 or 50 endings.",
        };
      }
    }

    case "subtraction": {
      if (difficulty === "beginner") {
        const a = randInt(55, 99, rng);
        const b = randInt(18, a - 10, rng);
        const ans = a - b;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} - ${b}`,
          subtext: "2-Digit Subtraction",
          answer: String(ans),
          options,
          explanation: `${a} - ${b}: Subtract tens (${a} - ${Math.floor(b / 10) * 10} = ${a - Math.floor(b / 10) * 10}), then subtract units (- ${b % 10}) = ${ans}.`,
          shortcut: `Add to ${b} to reach ${a}: ${b} + ${(Math.ceil(b / 10) * 10) - b} = ${Math.ceil(b / 10) * 10}, then + ${a - (Math.ceil(b / 10) * 10)} = ${ans}.`,
        };
      } else if (difficulty === "intermediate") {
        const a = randInt(450, 950, rng);
        const b = randInt(180, a - 50, rng);
        const ans = a - b;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 25, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} - ${b}`,
          subtext: "3-Digit Borrowing",
          answer: String(ans),
          options,
          explanation: `${a} - ${b} = ${ans}.`,
          shortcut: "Add difference to both numbers to eliminate borrowing.",
        };
      } else if (difficulty === "advanced") {
        const base = pickRandom([1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000], rng);
        const b = randInt(Math.floor(base * 0.15), Math.floor(base * 0.85), rng);
        const ans = base - b;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 30, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${base} - ${b}`,
          subtext: "Vedic Base Subtraction",
          answer: String(ans),
          options,
          explanation: `Subtract from ${base}: ${base} - ${b} = ${ans}.`,
          shortcut: "Vedic Sutra: 'All from 9 and last from 10'.",
        };
      } else {
        // exam_challenge: chain subtraction
        const base = randInt(2200, 4200, rng);
        const sub1 = randInt(350, 750, rng);
        const sub2 = randInt(250, 550, rng);
        const ans = base - sub1 - sub2;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 40, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${base} - ${sub1} - ${sub2}`,
          subtext: "Balance Equation Chain",
          answer: String(ans),
          options,
          explanation: `${base} - (${sub1} + ${sub2}) = ${base} - ${sub1 + sub2} = ${ans}.`,
          shortcut: "Group subtrahends together first before subtracting from base.",
        };
      }
    }

    case "multiplication": {
      if (difficulty === "beginner") {
        const a = randInt(11, 20, rng);
        const b = randInt(4, 12, rng);
        const ans = a * b;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} × ${b}`,
          subtext: "Tables & Fluency",
          answer: String(ans),
          options,
          explanation: `${a} × ${b} = (10 × ${b}) + (${a - 10} × ${b}) = ${10 * b} + ${(a - 10) * b} = ${ans}.`,
          shortcut: "Distribute using base 10.",
        };
      } else if (difficulty === "intermediate") {
        const type = pickRandom(["25x", "11x", "15x", "50x"], rng);
        let a = 0;
        let b = 0;
        let shortcut = "";
        if (type === "25x") {
          a = randInt(14, 64, rng) * 4;
          b = 25;
          shortcut = `${a} × 25 = (${a} ÷ 4) × 100 = ${a / 4} × 100 = ${(a / 4) * 100}.`;
        } else if (type === "11x") {
          a = randInt(23, 89, rng);
          b = 11;
          const tens = Math.floor(a / 10);
          const units = a % 10;
          shortcut = `${a} × 11: Put the sum of digits (${tens} + ${units} = ${tens + units}) in between.`;
        } else if (type === "50x") {
          a = randInt(14, 76, rng) * 2;
          b = 50;
          shortcut = `${a} × 50 = (${a} ÷ 2) × 100 = ${a / 2} × 100 = ${(a / 2) * 100}.`;
        } else {
          a = randInt(18, 78, rng);
          b = 15;
          shortcut = `${a} × 15 = (${a} × 10) + (${a} × 5) = ${a * 10} + ${(a * 10) / 2} = ${a * 15}.`;
        }
        const ans = a * b;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 30, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} × ${b}`,
          subtext: "Mental Arithmetic Shortcut",
          answer: String(ans),
          options,
          explanation: `${a} × ${b} = ${ans}.`,
          shortcut,
        };
      } else if (difficulty === "advanced") {
        const subMethod = pickRandom(["diff_squares", "125x", "base50"], rng);
        if (subMethod === "diff_squares") {
          const diff = randInt(2, 8, rng);
          const a = 100 - diff;
          const b = 100 + diff;
          const ans = a * b;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 50, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} × ${b}`,
            subtext: "Difference of Squares Formula",
            answer: String(ans),
            options,
            explanation: `(100 - ${diff})(100 + ${diff}) = 100² - ${diff}² = 10000 - ${diff * diff} = ${ans}.`,
            shortcut: "Algebraic shortcut: (x - y)(x + y) = x² - y².",
          };
        } else if (subMethod === "base50") {
          const diff = randInt(2, 6, rng);
          const a = 50 - diff;
          const b = 50 + diff;
          const ans = a * b;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 40, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} × ${b}`,
            subtext: "Base-50 Algebraic Product",
            answer: String(ans),
            options,
            explanation: `(50 - ${diff})(50 + ${diff}) = 50² - ${diff}² = 2500 - ${diff * diff} = ${ans}.`,
            shortcut: "Algebraic shortcut around 50: (50 - d)(50 + d) = 2500 - d².",
          };
        } else {
          const a = randInt(12, 48, rng) * 8;
          const b = 125;
          const ans = a * b;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 80, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} × ${b}`,
            subtext: "125x Vedic Multiplier",
            answer: String(ans),
            options,
            explanation: `${a} × 125 = (${a} ÷ 8) × 1000 = ${a / 8} × 1000 = ${ans}.`,
            shortcut: "Multiply by 1000 and divide by 8.",
          };
        }
      } else {
        // exam_challenge: 2-digit by 99/199/101/45
        const a = randInt(45, 98, rng);
        const b = pickRandom([99, 101, 199, 45, 49], rng);
        const ans = a * b;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 70, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} × ${b}`,
          subtext: "Competitive Exam Sprint",
          answer: String(ans),
          options,
          explanation:
            b === 99
              ? `${a} × 99 = ${a} × (100 - 1) = ${a * 100} - ${a} = ${ans}.`
              : b === 199
              ? `${a} × 199 = ${a} × (200 - 1) = ${a * 200} - ${a} = ${ans}.`
              : `${a} × ${b} = ${ans}.`,
          shortcut: "Distribute across base 100 or 200.",
        };
      }
    }

    case "division": {
      if (difficulty === "beginner") {
        const b = randInt(6, 15, rng);
        const ans = randInt(8, 24, rng);
        const a = b * ans;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 5, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} ÷ ${b}`,
          subtext: "Exact Division",
          answer: String(ans),
          options,
          explanation: `${a} ÷ ${b} = ${ans} because ${b} × ${ans} = ${a}.`,
          shortcut: "Direct table recall.",
        };
      } else if (difficulty === "intermediate") {
        const type = pickRandom(["div25", "div5", "composite"], rng);
        if (type === "div5") {
          const ans = randInt(18, 95, rng);
          const a = ans * 5;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 8, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} ÷ 5`,
            subtext: "Divide by 5 Trick",
            answer: String(ans),
            options,
            explanation: `${a} ÷ 5 = (${a} × 2) ÷ 10 = ${a * 2} ÷ 10 = ${ans}.`,
            shortcut: "Double the number and divide by 10.",
          };
        } else if (type === "div25") {
          const ans = randInt(12, 45, rng);
          const a = ans * 25;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 8, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} ÷ 25`,
            subtext: "Divide by 25 Shortcut",
            answer: String(ans),
            options,
            explanation: `${a} ÷ 25 = (${a} × 4) ÷ 100 = ${a * 4} ÷ 100 = ${ans}.`,
            shortcut: "Multiply by 4, then divide by 100.",
          };
        } else {
          const b = pickRandom([24, 32, 36, 45, 48], rng);
          const ans = randInt(12, 38, rng);
          const a = b * ans;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 8, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} ÷ ${b}`,
            subtext: "Composite Divisor",
            answer: String(ans),
            options,
            explanation: `Factorize divisor: divide step-by-step to get ${ans}.`,
            shortcut: "Repeated halving or factor division.",
          };
        }
      } else if (difficulty === "advanced") {
        const trick = pickRandom(["125", "50", "75"], rng);
        if (trick === "50") {
          const ans = randInt(25, 85, rng);
          const a = ans * 50;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 10, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} ÷ 50`,
            subtext: "Divide by 50 Trick",
            answer: String(ans),
            options,
            explanation: `${a} ÷ 50 = (${a} × 2) ÷ 100 = ${a * 2} ÷ 100 = ${ans}.`,
            shortcut: "Double the dividend and shift decimal 2 places left.",
          };
        } else if (trick === "75") {
          const ans = randInt(12, 40, rng);
          const a = ans * 75;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 10, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} ÷ 75`,
            subtext: "Divide by 75 Shortcut",
            answer: String(ans),
            options,
            explanation: `${a} ÷ 75 = (${a} × 4) ÷ 300 = ${(a * 4) / 100} ÷ 3 = ${ans}.`,
            shortcut: "Multiply by 4 and divide by 300.",
          };
        } else {
          const b = 125;
          const ans = randInt(14, 56, rng);
          const a = b * ans;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 10, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} ÷ 125`,
            subtext: "125 Division Trick",
            answer: String(ans),
            options,
            explanation: `${a} ÷ 125 = (${a} × 8) ÷ 1000 = ${a * 8} ÷ 1000 = ${ans}.`,
            shortcut: "Multiply by 8, then shift decimal 3 places left.",
          };
        }
      } else {
        // exam_challenge: chain division
        const div1 = randInt(12, 16, rng);
        const div2 = randInt(4, 9, rng);
        const ans = randInt(8, 25, rng);
        const a = div1 * div2 * ans;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 8, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `(${a} ÷ ${div1}) ÷ ${div2}`,
          subtext: "Multi-Step Simplification Division",
          answer: String(ans),
          options,
          explanation: `${a} ÷ (${div1} × ${div2}) = ${a} ÷ ${div1 * div2} = ${ans}.`,
          shortcut: "Combine denominators first: (A ÷ B) ÷ C = A ÷ (B × C).",
        };
      }
    }

    case "percentages": {
      if (difficulty === "beginner") {
        const pct = pickRandom([5, 10, 15, 20, 25, 30, 50], rng);
        const base = randInt(12, 48, rng) * 20;
        const ans = (pct * base) / 100;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${pct}% of ${base}`,
          subtext: "Benchmark Percentages",
          answer: String(ans),
          options,
          explanation:
            pct === 10
              ? `10% is 1/10th: ${base} ÷ 10 = ${ans}.`
              : pct === 25
              ? `25% is 1/4th: ${base} ÷ 4 = ${ans}.`
              : `${pct}% = ${pct / 100} × ${base} = ${ans}.`,
          shortcut: `Fraction equivalent: ${pct}% = 1/${100 / pct}.`,
        };
      } else if (difficulty === "intermediate") {
        const pct = pickRandom([15, 35, 45, 55, 65, 75, 85], rng);
        const base = randInt(8, 36, rng) * 40;
        const ans = (pct * base) / 100;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 20, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${pct}% of ${base}`,
          subtext: "Split-Percentage Technique",
          answer: String(ans),
          options,
          explanation:
            pct === 15
              ? `10% of ${base} = ${base * 0.1}. 5% of ${base} = ${base * 0.05}. 15% = ${base * 0.1} + ${base * 0.05} = ${ans}.`
              : pct === 75
              ? `75% is 3/4th: (${base} ÷ 4) × 3 = ${ans}.`
              : `(${pct} × ${base}) ÷ 100 = ${ans}.`,
          shortcut: "Split into 10% and 5% chunks.",
        };
      } else if (difficulty === "advanced") {
        const pairs = [
          { pct: "12.5%", frac: "1/8", num: 1, den: 8 },
          { pct: "37.5%", frac: "3/8", num: 3, den: 8 },
          { pct: "62.5%", frac: "5/8", num: 5, den: 8 },
          { pct: "87.5%", frac: "7/8", num: 7, den: 8 },
          { pct: "16⅔%", frac: "1/6", num: 1, den: 6 },
          { pct: "33⅓%", frac: "1/3", num: 1, den: 3 },
          { pct: "66⅔%", frac: "2/3", num: 2, den: 3 },
          { pct: "83⅓%", frac: "5/6", num: 5, den: 6 },
          { pct: "14.28%", frac: "1/7", num: 1, den: 7 },
          { pct: "9.09%", frac: "1/11", num: 1, den: 11 },
        ];
        const p = pickRandom(pairs, rng);
        const mult = randInt(12, 60, rng);
        const base = p.den * mult;
        const ans = p.num * mult;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 25, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${p.pct} of ${base}`,
          subtext: "Special Fraction Percentage",
          answer: String(ans),
          options,
          explanation: `${p.pct} is equivalent to ${p.frac}. Therefore (${base} ÷ ${p.den}) × ${p.num} = ${ans}.`,
          shortcut: `Memorize: ${p.pct} = ${p.frac}.`,
        };
      } else {
        // exam_challenge: combined percentage or percentage shift
        const isShift = rng() > 0.6;
        if (isShift) {
          // a% of b = b% of a: e.g. 64% of 25 = 25% of 64 = 16
          const baseNum = randInt(12, 48, rng) * 4;
          const ans = baseNum / 4;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${baseNum}% of 25`,
            subtext: "Percentage Reversal Symmetry",
            answer: String(ans),
            options,
            explanation: `${baseNum}% of 25 is equivalent to 25% of ${baseNum} = ${baseNum} ÷ 4 = ${ans}.`,
            shortcut: "A% of B = B% of A. Swap to make calculation effortless!",
          };
        } else {
          const pct1 = pickRandom([20, 25, 40, 50], rng);
          const base1 = randInt(15, 45, rng) * 10;
          const pct2 = pickRandom([10, 15, 30, 50], rng);
          const base2 = randInt(12, 35, rng) * 10;
          const ans = Math.round((pct1 * base1) / 100 + (pct2 * base2) / 100);
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 30, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${pct1}% of ${base1} + ${pct2}% of ${base2}`,
            subtext: "Competitive Exam Percent Sum",
            answer: String(ans),
            options,
            explanation: `Part 1: (${pct1}% of ${base1}) = ${(pct1 * base1) / 100}. Part 2: (${pct2}% of ${base2}) = ${(pct2 * base2) / 100}. Sum = ${ans}.`,
            shortcut: "Calculate each part using quick benchmarks then add.",
          };
        }
      }
    }

    case "fractions": {
      if (difficulty === "beginner") {
        const den = pickRandom([4, 5, 8, 10, 12], rng);
        const num = randInt(1, den - 1, rng);
        const base = den * randInt(12, 40, rng);
        const ans = (num * base) / den;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${num}/${den} of ${base}`,
          subtext: "Fraction of Integer",
          answer: String(ans),
          options,
          explanation: `Divide by denominator: ${base} ÷ ${den} = ${base / den}. Multiply by numerator: ${base / den} × ${num} = ${ans}.`,
          shortcut: "Divide first to keep numbers small, then multiply.",
        };
      } else if (difficulty === "intermediate") {
        // Unlike denominator fraction sum or difference
        const isAddition = rng() > 0.4;
        const den1 = pickRandom([3, 4, 5, 6], rng);
        const den2Pool = [2, 3, 4, 5, 6, 8].filter((d) => d !== den1);
        const den2 = pickRandom(den2Pool, rng);
        const num1 = 1;
        const num2 = 1;
        const commonDen = (den1 * den2) / gcd(den1, den2);
        const term1 = (commonDen / den1) * num1;
        const term2 = (commonDen / den2) * num2;
        
        let pNum1 = num1;
        let pDen1 = den1;
        let pNum2 = num2;
        let pDen2 = den2;
        let finalNum = term1 + term2;

        if (!isAddition) {
          // If subtracting, order so larger fraction comes first
          if (term1 >= term2) {
            finalNum = term1 - term2;
          } else {
            finalNum = term2 - term1;
            pNum1 = num2;
            pDen1 = den2;
            pNum2 = num1;
            pDen2 = den1;
          }
        }
        
        const finalGcd = gcd(finalNum, commonDen);
        const redNum = finalNum / finalGcd;
        const redDen = commonDen / finalGcd;
        const ansStr = `${redNum}/${redDen}`;

        // Generate clean integer fraction distractors
        const distSet = new Set<string>();
        const candidatePairs = [
          [redNum + 1, redDen],
          [redNum > 1 ? redNum - 1 : redNum + 2, redDen],
          [redNum, redDen + 1],
          [redNum, redDen > 1 ? redDen - 1 : redDen + 2],
          [redNum + 1, redDen + 1],
          [redNum + 2, redDen],
          [redNum, redDen + 2],
        ];
        const shuffledPairs = shuffleArray(candidatePairs, rng);
        for (const [cn, cd] of shuffledPairs) {
          const g = gcd(cn, cd);
          const opt = `${cn / g}/${cd / g}`;
          if (opt !== ansStr && cn > 0 && cd > 0) {
            distSet.add(opt);
          }
          if (distSet.size >= 3) break;
        }
        let fallback = 2;
        while (distSet.size < 3) {
          distSet.add(`${redNum + fallback}/${redDen}`);
          fallback++;
        }

        const options = shuffleArray([ansStr, ...Array.from(distSet).slice(0, 3)], rng);
        const operatorStr = isAddition ? "+" : "-";
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${pNum1}/${pDen1} ${operatorStr} ${pNum2}/${pDen2}`,
          subtext: "Fraction Arithmetic",
          answer: ansStr,
          options,
          explanation: `LCM of ${den1} and ${den2} is ${commonDen}. Expression reduces to ${ansStr}.`,
          shortcut: "Butterfly method: cross-multiply numerators and compute denominator product.",
        };
      } else if (difficulty === "advanced") {
        // Mixed fractions addition
        const w1 = randInt(2, 6, rng);
        const w2 = randInt(1, 5, rng);
        const den = pickRandom([2, 4, 8], rng);
        const n1 = 1;
        const n2 = den === 2 ? 1 : 3;
        const totalNum = n1 + n2;
        const carry = Math.floor(totalNum / den);
        const remNum = totalNum % den;
        const wholeSum = w1 + w2 + carry;
        const ansStr = remNum === 0 ? String(wholeSum) : `${wholeSum} ${remNum}/${den}`;

        const distSet = new Set<string>();
        if (remNum === 0) {
          distSet.add(String(wholeSum + 1));
          distSet.add(String(Math.max(1, wholeSum - 1)));
          distSet.add(`${wholeSum} 1/${den}`);
          distSet.add(`${wholeSum - 1} 1/${den}`);
        } else {
          distSet.add(`${wholeSum + 1} ${remNum}/${den}`);
          distSet.add(`${Math.max(1, wholeSum - 1)} ${remNum}/${den}`);
          const otherNum = remNum + 1 < den ? remNum + 1 : remNum > 1 ? remNum - 1 : 1;
          if (`${wholeSum} ${otherNum}/${den}` !== ansStr) {
            distSet.add(`${wholeSum} ${otherNum}/${den}`);
          }
          distSet.add(String(wholeSum));
        }
        distSet.delete(ansStr);
        let fb = 2;
        while (distSet.size < 3) {
          distSet.add(`${wholeSum + fb} 1/${den}`);
          fb++;
        }

        const options = shuffleArray([ansStr, ...Array.from(distSet).slice(0, 3)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${w1} ${n1}/${den} + ${w2} ${n2}/${den}`,
          subtext: "Mixed Fractions Sum",
          answer: ansStr,
          options,
          explanation: `Whole numbers: ${w1} + ${w2} = ${w1 + w2}. Fractions: ${n1}/${den} + ${n2}/${den} = ${totalNum}/${den}. Combined = ${ansStr}.`,
          shortcut: "Add whole numbers and fractional parts separately.",
        };
      } else {
        // exam_challenge: fraction simplification
        const num = randInt(3, 7, rng);
        const den = randInt(8, 16, rng);
        const mult = den * randInt(6, 18, rng);
        const ans = (num * mult) / den;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 20, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `(${num}/${den}) × ${mult}`,
          subtext: "Fraction Multiplication Sprint",
          answer: String(ans),
          options,
          explanation: `${mult} ÷ ${den} = ${mult / den}. Then ${num} × ${mult / den} = ${ans}.`,
          shortcut: "Cancel before multiplying.",
        };
      }
    }

    case "ratios_proportions": {
      if (difficulty === "beginner") {
        const r1 = randInt(2, 5, rng);
        const r2 = randInt(3, 7, rng);
        const mult = randInt(10, 30, rng);
        const total = (r1 + r2) * mult;
        const ans = r1 * mult;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `Divide ${total} in ratio ${r1} : ${r2}. First share = ?`,
          subtext: "Ratio Share Division",
          answer: String(ans),
          options,
          explanation: `Total ratio parts = ${r1} + ${r2} = ${r1 + r2}. 1 part = ${total} ÷ ${r1 + r2} = ${mult}. First share = ${r1} × ${mult} = ${ans}.`,
          shortcut: "Value of 1 part = Total ÷ Sum of ratios.",
        };
      } else if (difficulty === "intermediate") {
        const a = randInt(3, 9, rng);
        const b = randInt(4, 12, rng);
        const mult = randInt(3, 8, rng);
        const c = a * mult;
        const ans = b * mult;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 12, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} : ${b} = ${c} : ?`,
          subtext: "Proportional Mean / Extreme",
          answer: String(ans),
          options,
          explanation: `Product of means = Product of extremes. ? = (${b} × ${c}) ÷ ${a} = (${b} × ${c}) / ${a} = ${ans}.`,
          shortcut: `Notice ${c} is ${mult}× of ${a}. Therefore answer is ${b} × ${mult} = ${ans}.`,
        };
      } else if (difficulty === "advanced") {
        // Combined ratio A:B and B:C -> Find A:C
        const a = randInt(2, 5, rng);
        const b1 = randInt(3, 6, rng);
        const b2 = randInt(2, 5, rng);
        const c = randInt(3, 7, rng);
        const num = a * b2;
        const den = b1 * c;
        const divGcd = gcd(num, den);
        const redNum = num / divGcd;
        const redDen = den / divGcd;
        const ansStr = `${redNum}:${redDen}`;

        // Clean integer ratio distractors (no decimals, no zeroes)
        const distSet = new Set<string>();
        const candidatePairs = [
          [redNum + 1, redDen],
          [redNum > 1 ? redNum - 1 : redNum + 2, redDen],
          [redNum, redDen + 1],
          [redNum, redDen > 1 ? redDen - 1 : redDen + 2],
          [redDen, redNum], // inverse ratio distractor
          [redNum + 1, redDen + 1],
          [redNum + 2, redDen + 1],
        ];
        const shuffledPairs = shuffleArray(candidatePairs, rng);
        for (const [cn, cd] of shuffledPairs) {
          const g = gcd(cn, cd);
          const opt = `${cn / g}:${cd / g}`;
          if (opt !== ansStr && cn > 0 && cd > 0) {
            distSet.add(opt);
          }
          if (distSet.size >= 3) break;
        }
        let fb = 2;
        while (distSet.size < 3) {
          distSet.add(`${redNum + fb}:${redDen}`);
          fb++;
        }

        const options = shuffleArray([ansStr, ...Array.from(distSet).slice(0, 3)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `If A:B = ${a}:${b1} and B:C = ${b2}:${c}, find A:C`,
          subtext: "Compounded Ratio",
          answer: ansStr,
          options,
          explanation: `Multiply ratios: A/C = (A/B) × (B/C) = (${a}/${b1}) × (${b2}/${c}) = ${num}/${den} = ${ansStr}.`,
          shortcut: "A/C is simply the product of the two fractions.",
        };
      } else {
        // exam_challenge: Ratio difference
        const r1 = randInt(4, 7, rng);
        const r2 = r1 + randInt(2, 4, rng);
        const partDiff = r2 - r1;
        const onePart = randInt(8, 28, rng);
        const diff = partDiff * onePart;
        const sum = (r1 + r2) * onePart;
        const options = shuffleArray([String(sum), ...generateDistractors(sum, 25, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `Two numbers are in ratio ${r1}:${r2}. Their difference is ${diff}. Sum of numbers = ?`,
          subtext: "Competitive Exam Ratio Word Sprint",
          answer: String(sum),
          options,
          explanation: `Ratio difference = ${r2} - ${r1} = ${partDiff} parts = ${diff}. 1 part = ${onePart}. Total sum = (${r1} + ${r2}) × ${onePart} = ${sum}.`,
          shortcut: "1 Part = Difference ÷ Difference of ratios.",
        };
      }
    }

    case "squares": {
      if (difficulty === "beginner") {
        const base = randInt(11, 25, rng);
        const ans = base * base;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 20, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${base}²`,
          subtext: "Core Squares 1-25",
          answer: String(ans),
          options,
          explanation: `${base} × ${base} = ${ans}.`,
          shortcut: "Direct recall for foundational competitive exam speed.",
        };
      } else if (difficulty === "intermediate") {
        const pattern = pickRandom(["ends_in_5", "base_50", "range_20_40"], rng);
        if (pattern === "ends_in_5") {
          const tens = randInt(1, 14, rng);
          const base = tens * 10 + 5;
          const ans = base * base;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 50, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${base}²`,
            subtext: "Vedic Squaring (Ending in 5)",
            answer: String(ans),
            options,
            explanation: `Multiply tens by next integer: ${tens} × ${tens + 1} = ${tens * (tens + 1)}. Suffix 25 to get ${ans}.`,
            shortcut: `n5² = [n × (n+1)] || 25. Here ${tens} × ${tens + 1} = ${tens * (tens + 1)} -> ${ans}.`,
          };
        } else if (pattern === "range_20_40") {
          const base = randInt(21, 40, rng);
          const ans = base * base;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 40, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${base}²`,
            subtext: "Standard Squares 21-40",
            answer: String(ans),
            options,
            explanation: `${base} × ${base} = ${ans}.`,
            shortcut: "Essential squares recall for competitive speed.",
          };
        } else {
          // Base 50 method: 35 to 65
          const diff = randInt(-15, 15, rng);
          const base = 50 + diff;
          const ans = base * base;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 45, rng)], rng);
          const leftPart = 25 + diff;
          const rightPart = String(diff * diff).padStart(2, "0");
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${base}²`,
            subtext: "Base-50 Vedic Squaring",
            answer: String(ans),
            options,
            explanation: `Base 50: (50 + ${diff})² = (25 + ${diff}) || ${diff}² = ${leftPart}${rightPart} = ${ans}.`,
            shortcut: "(50 ± d)² = (25 ± d) hundreds + d².",
          };
        }
      } else if (difficulty === "advanced") {
        // Base 100 method: 85 to 115
        const isBelow = rng() > 0.5;
        const diff = randInt(2, 14, rng);
        const base = isBelow ? 100 - diff : 100 + diff;
        const ans = base * base;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 60, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${base}²`,
          subtext: "Base-100 Vedic Squaring",
          answer: String(ans),
          options,
          explanation: isBelow
            ? `Difference from 100 is -${diff}. Left part = ${base} - ${diff} = ${base - diff}. Right part = ${diff}² = ${String(diff * diff).padStart(2, "0")}. Result = ${ans}.`
            : `Difference from 100 is +${diff}. Left part = ${base} + ${diff} = ${base + diff}. Right part = ${diff}² = ${String(diff * diff).padStart(2, "0")}. Result = ${ans}.`,
          shortcut: "Base 100: (100 ± d)² = (100 ± 2d) || d².",
        };
      } else {
        // exam_challenge: Difference of squares a² - b²
        const diff = randInt(2, 8, rng);
        const a = randInt(35, 75, rng);
        const b = a - diff;
        const ans = a * a - b * b;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 50, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a}² - ${b}²`,
          subtext: "Algebraic Difference of Squares",
          answer: String(ans),
          options,
          explanation: `a² - b² = (a - b)(a + b) = (${a} - ${b})(${a} + ${b}) = ${a - b} × ${a + b} = ${ans}.`,
          shortcut: "Never calculate individual squares! Use (a - b)(a + b).",
        };
      }
    }

    case "square_roots": {
      if (difficulty === "beginner") {
        const root = randInt(11, 20, rng);
        const square = root * root;
        const options = shuffleArray([String(root), ...generateDistractors(root, 3, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `√${square}`,
          subtext: "Standard Square Root",
          answer: String(root),
          options,
          explanation: `${root} × ${root} = ${square}, so √${square} = ${root}.`,
          shortcut: "Direct memory anchor.",
        };
      } else if (difficulty === "intermediate") {
        const root = randInt(21, 55, rng);
        const square = root * root;
        const options = shuffleArray([String(root), ...generateDistractors(root, 4, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `√${square}`,
          subtext: "3-4 Digit Square Root",
          answer: String(root),
          options,
          explanation: `Last digit is ${square % 10}, tens bracket between ${Math.floor(root / 10) * 10}² and ${(Math.floor(root / 10) + 1) * 10}². Root = ${root}.`,
          shortcut: "Observe last digit and eliminate options by nearest decade square.",
        };
      } else if (difficulty === "advanced") {
        const root = randInt(56, 99, rng);
        const square = root * root;
        const options = shuffleArray([String(root), ...generateDistractors(root, 5, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `√${square}`,
          subtext: "High 4-Digit Square Root",
          answer: String(root),
          options,
          explanation: `√${square} = ${root}.`,
          shortcut: "Unit digit elimination: unit digit 1/9, 4/6, etc. Compare with mid-decade square ending in 5.",
        };
      } else {
        // exam_challenge: Square root equation
        const root = randInt(12, 35, rng);
        const square = root * root;
        const add = randInt(15, 45, rng);
        const rhs = root + add;
        const options = shuffleArray([String(square), ...generateDistractors(square, 40, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `√? + ${add} = ${rhs}`,
          subtext: "Square Root Equation",
          answer: String(square),
          options,
          explanation: `√? = ${rhs} - ${add} = ${root}. Squaring both sides: ? = ${root}² = ${square}.`,
          shortcut: "Subtract constant first, then square the remaining value.",
        };
      }
    }

    case "cubes_roots": {
      if (difficulty === "beginner") {
        const root = randInt(3, 11, rng);
        const cube = root * root * root;
        const options = shuffleArray([String(cube), ...generateDistractors(cube, 25, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${root}³`,
          subtext: "Basic Cube 1-12",
          answer: String(cube),
          options,
          explanation: `${root} × ${root} × ${root} = ${cube}.`,
          shortcut: "Foundational cubes memorization for government exams.",
        };
      } else if (difficulty === "intermediate") {
        const root = randInt(4, 18, rng);
        const cube = root * root * root;
        const options = shuffleArray([String(root), ...generateDistractors(root, 3, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `∛${cube}`,
          subtext: "Cube Root Extraction",
          answer: String(root),
          options,
          explanation: `${root}³ = ${cube}, so ∛${cube} = ${root}.`,
          shortcut: "Cubes have 1-to-1 unique ending digits: 2↔8, 3↔7, 1→1, 4→4, 5→5, 6→6, 9→9, 0→0.",
        };
      } else if (difficulty === "advanced") {
        const root = randInt(16, 42, rng);
        const cube = root * root * root;
        const options = shuffleArray([String(root), ...generateDistractors(root, 4, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `∛${cube}`,
          subtext: "5-6 Digit Instant Cube Root",
          answer: String(root),
          options,
          explanation: `Last digit is ${cube % 10} giving unit digit ${root % 10}. First group ${Math.floor(cube / 1000)} lies between ${Math.floor(root / 10)}³ and ${Math.floor(root / 10) + 1}³. Result = ${root}.`,
          shortcut: "Split into last 3 digits and remaining digits. Instant 2-second extraction!",
        };
      } else {
        // exam_challenge: Cube equation
        const root = randInt(5, 15, rng);
        const cube = root * root * root;
        const sub = randInt(12, 38, rng);
        const rhs = root - sub;
        const options = shuffleArray([String(cube), ...generateDistractors(cube, 40, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `∛? - ${sub} = ${rhs}`,
          subtext: "Cube Root Exam Equation",
          answer: String(cube),
          options,
          explanation: `∛? = ${rhs} + ${sub} = ${root}. Cubing both sides: ? = ${root}³ = ${cube}.`,
          shortcut: "Isolate ∛? then cube the resulting number.",
        };
      }
    }

    case "bodmas": {
      if (difficulty === "beginner") {
        const pattern = pickRandom(["mul_add", "mul_sub"], rng);
        const a = randInt(12, 35, rng);
        const b = randInt(3, 7, rng);
        const c = randInt(4, 8, rng);
        if (pattern === "mul_sub") {
          const product = b * c;
          const base = product + randInt(5, 25, rng);
          const ans = base - product;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${base} - ${b} × ${c}`,
            subtext: "Precedence: Multiplication First",
            answer: String(ans),
            options,
            explanation: `Multiply first: ${b} × ${c} = ${product}. Then subtract: ${base} - ${product} = ${ans}.`,
            shortcut: "BODMAS rule: Multiplication beats Subtraction.",
          };
        } else {
          const ans = a + b * c;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ${b} × ${c}`,
            subtext: "Precedence: Multiplication First",
            answer: String(ans),
            options,
            explanation: `Multiply first: ${b} × ${c} = ${b * c}. Then add: ${a} + ${b * c} = ${ans}.`,
            shortcut: "BODMAS rule: Multiplication beats Addition.",
          };
        }
      } else if (difficulty === "intermediate") {
        const a = randInt(18, 48, rng);
        const b = randInt(2, 6, rng);
        const c = randInt(3, 8, rng);
        const div = randInt(2, 4, rng);
        const bTimesDiv = b * div;
        const ans = a - bTimesDiv / div + c * 2;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} - ${bTimesDiv} ÷ ${div} + ${c} × 2`,
          subtext: "Division & Multiplication Precedence",
          answer: String(ans),
          options,
          explanation: `Division: ${bTimesDiv} ÷ ${div} = ${b}. Multiplication: ${c} × 2 = ${c * 2}. Expression: ${a} - ${b} + ${c * 2} = ${ans}.`,
          shortcut: "Work division and multiplication simultaneously from left to right.",
        };
      } else if (difficulty === "advanced") {
        const a = randInt(25, 60, rng);
        const b = randInt(12, 24, rng);
        const c = randInt(4, 9, rng);
        const ans = a - (b - c * 2);
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} - (${b} - ${c} × 2)`,
          subtext: "Parentheses Precedence",
          answer: String(ans),
          options,
          explanation: `Inside bracket: ${c} × 2 = ${c * 2}, then ${b} - ${c * 2} = ${b - c * 2}. Finally ${a} - (${b - c * 2}) = ${ans}.`,
          shortcut: "Brackets take absolute priority. Watch double negative: -(-x) = +x.",
        };
      } else {
        // exam_challenge: multi-tier BODMAS with guaranteed integer divisibility
        const a = randInt(40, 80, rng);
        const b = randInt(15, 30, rng);
        const d = randInt(2, 4, rng);
        const cBase = randInt(2, 5, rng);
        const c = cBase * d; // guarantees (c * 4) / d is integer
        const ans = a + b * 2 - (c * 4) / d;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 20, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} + ${b} × 2 - (${c} × 4) ÷ ${d}`,
          subtext: "Full Competitive Exam Simplification",
          answer: String(ans),
          options,
          explanation: `Brackets: ${c} × 4 = ${c * 4}. Division: ${c * 4} ÷ ${d} = ${(c * 4) / d}. Multiply: ${b} × 2 = ${b * 2}. Total: ${a} + ${b * 2} - ${(c * 4) / d} = ${ans}.`,
          shortcut: "Break into independent calculation blocks separated by + or -.",
        };
      }
    }

    case "estimation_approximation": {
      if (difficulty === "beginner") {
        const a = randInt(28, 79, rng);
        const b = randInt(19, 69, rng);
        const exact = a + b;
        const rounded = Math.round(exact / 10) * 10;
        const options = shuffleArray([String(rounded), ...generateDistractors(rounded, 20, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} + ${b} ≈ ? (nearest 10)`,
          subtext: "Nearest Decade Approximation",
          answer: String(rounded),
          options,
          explanation: `${a} + ${b} = ${exact}, which rounds to ${rounded}.`,
          shortcut: `Round addends to nearest 10 before adding: ~${Math.round(a / 10) * 10} + ~${Math.round(b / 10) * 10}.`,
          isApproximation: true,
        };
      } else if (difficulty === "intermediate") {
        const a = randInt(18, 48, rng) + 0.9;
        const b = randInt(8, 18, rng) + 0.1;
        const ans = Math.round(a) * Math.round(b);
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 30, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a.toFixed(1)} × ${b.toFixed(1)} ≈ ?`,
          subtext: "Decimal Rounding",
          answer: String(ans),
          options,
          explanation: `Round ${a.toFixed(1)} to ${Math.round(a)} and ${b.toFixed(1)} to ${Math.round(b)}. ${Math.round(a)} × ${Math.round(b)} = ${ans}.`,
          shortcut: "Ignore .9 and .1 by shifting to nearest integers.",
          isApproximation: true,
        };
      } else if (difficulty === "advanced") {
        const pctDec = pickRandom([29.9, 39.8, 49.9, 24.8], rng);
        const baseDec = pickRandom([399.8, 599.9, 799.6, 999.8], rng);
        const pctRound = Math.round(pctDec);
        const baseRound = Math.round(baseDec);
        const ans = Math.round((pctRound * baseRound) / 100);
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 40, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${pctDec}% of ${baseDec} ≈ ?`,
          subtext: "Prelims Elimination Approximation",
          answer: String(ans),
          options,
          explanation: `Round ${pctDec}% to ${pctRound}% and ${baseDec} to ${baseRound}. (${pctRound}% of ${baseRound}) = ${ans}.`,
          shortcut: "Standard CGL Prelims shortcut: round to whole percentages and clean hundreds.",
          isApproximation: true,
        };
      } else {
        const rootSquare = pickRandom([624.9, 899.8, 1224.7, 1599.8], rng);
        const mult = randInt(12, 28, rng) + 0.1;
        const rootRound = Math.round(Math.sqrt(Math.round(rootSquare)));
        const multRound = Math.round(mult);
        const ans = rootRound * multRound;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 50, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `√(${rootSquare}) × ${mult.toFixed(1)} ≈ ?`,
          subtext: "Multi-Term Prelims Approximation",
          answer: String(ans),
          options,
          explanation: `√${rootSquare} ≈ ${rootRound}. ${mult.toFixed(1)} ≈ ${multRound}. Result = ${rootRound} × ${multRound} = ${ans}.`,
          shortcut: "Round inside radical to nearest perfect square.",
          isApproximation: true,
        };
      }
    }

    case "missing_number": {
      if (difficulty === "beginner") {
        const isSub = rng() > 0.5;
        if (isSub) {
          const a = randInt(45, 95, rng);
          const ans = randInt(12, 35, rng);
          const rhs = a - ans;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} - ? = ${rhs}`,
            subtext: "Find the Missing Subtrahend",
            answer: String(ans),
            options,
            explanation: `? = ${a} - ${rhs} = ${ans}.`,
            shortcut: "Subtract difference from minuend.",
          };
        } else {
          const a = randInt(15, 65, rng);
          const ans = randInt(18, 55, rng);
          const total = a + ans;
          const options = shuffleArray([String(ans), ...generateDistractors(ans, 15, rng)], rng);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ? = ${total}`,
            subtext: "Find the Missing Addend",
            answer: String(ans),
            options,
            explanation: `? = ${total} - ${a} = ${ans}.`,
            shortcut: "Subtract known addend from the sum.",
          };
        }
      } else if (difficulty === "intermediate") {
        const mult = randInt(4, 9, rng);
        const ans = randInt(8, 25, rng);
        const add = randInt(12, 35, rng);
        const rhs = mult * ans + add;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 6, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${mult} × ? + ${add} = ${rhs}`,
          subtext: "Linear Equation",
          answer: String(ans),
          options,
          explanation: `${mult} × ? = ${rhs} - ${add} = ${rhs - add}. ? = ${rhs - add} ÷ ${mult} = ${ans}.`,
          shortcut: "Subtract constant first, then divide by coefficient.",
        };
      } else if (difficulty === "advanced") {
        const pct = pickRandom([20, 25, 50], rng);
        const ans = randInt(12, 45, rng) * (100 / pct);
        const rhs = (pct * ans) / 100;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 30, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${pct}% of ? = ${rhs}`,
          subtext: "Missing Base Percentage",
          answer: String(ans),
          options,
          explanation: `? = (${rhs} × 100) ÷ ${pct} = ${ans}.`,
          shortcut: `Multiply by reciprocal: 100/${pct}.`,
        };
      } else {
        const pct = 30;
        const base = randInt(25, 55, rng) * 20;
        const rhs = randInt(40, 95, rng);
        const leftVal = (pct * base) / 100;
        const ans = leftVal - rhs;
        const options = shuffleArray([String(ans), ...generateDistractors(ans, 25, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${pct}% of ${base} - ? = ${rhs}`,
          subtext: "Competitive Exam Missing Operator Value",
          answer: String(ans),
          options,
          explanation: `${pct}% of ${base} = ${leftVal}. ${leftVal} - ? = ${rhs} -> ? = ${leftVal} - ${rhs} = ${ans}.`,
          shortcut: "Calculate constant value first, then isolate '?'.",
        };
      }
    }

    case "reverse_calculation": {
      if (difficulty === "beginner") {
        const initial = randInt(15, 65, rng);
        const add = randInt(12, 45, rng);
        const finalVal = initial + add;
        const options = shuffleArray([String(initial), ...generateDistractors(initial, 12, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `A number plus ${add} gives ${finalVal}. What is the number?`,
          subtext: "Reverse Addition",
          answer: String(initial),
          options,
          explanation: `Reverse operation: ${finalVal} - ${add} = ${initial}.`,
          shortcut: "Inverse of addition is subtraction.",
        };
      } else if (difficulty === "intermediate") {
        const initial = randInt(8, 30, rng);
        const mult = randInt(2, 4, rng);
        const add = randInt(8, 25, rng);
        const finalVal = initial * mult + add;
        const options = shuffleArray([String(initial), ...generateDistractors(initial, 6, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `A number is multiplied by ${mult}, then ${add} is added to get ${finalVal}. What was the number?`,
          subtext: "Two-Step Backwards Reasoning",
          answer: String(initial),
          options,
          explanation: `Step 1 (reverse add): ${finalVal} - ${add} = ${finalVal - add}. Step 2 (reverse multiply): ${finalVal - add} ÷ ${mult} = ${initial}.`,
          shortcut: "Unwind the operations in exact reverse order.",
        };
      } else if (difficulty === "advanced") {
        const discountPct = pickRandom([10, 20, 25], rng);
        const mult = randInt(15, 65, rng);
        const originalPrice = 100 * mult;
        const finalPrice = originalPrice * ((100 - discountPct) / 100);
        const options = shuffleArray([String(originalPrice), ...generateDistractors(originalPrice, 50, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `After a ${discountPct}% discount, an item sells for ₹${finalPrice}. Original price = ?`,
          subtext: "Reverse Percentage / Marked Price",
          answer: String(originalPrice),
          options,
          explanation: `Selling price represents ${100 - discountPct}% of marked price. Marked price = (${finalPrice} × 100) ÷ ${100 - discountPct} = ₹${originalPrice}.`,
          shortcut: "Dividing by remaining percentage ratio yields the original base.",
        };
      } else {
        const initial = randInt(12, 35, rng);
        const step1 = initial * 2;
        const step2 = step1 - 10;
        const finalVal = step2 + 25;
        const options = shuffleArray([String(initial), ...generateDistractors(initial, 8, rng)], rng);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `A number is doubled, decreased by 10, then increased by 25 to reach ${finalVal}. Original number = ?`,
          subtext: "Competitive Exam Working Backwards",
          answer: String(initial),
          options,
          explanation: `Work backwards from ${finalVal}: ${finalVal} - 25 = ${step2}. ${step2} + 10 = ${step1}. ${step1} ÷ 2 = ${initial}.`,
          shortcut: "Execute opposite operations from end to start.",
        };
      }
    }

    default:
      return generateRawQuestion("addition", difficulty, index, rng);
  }
}

/**
 * Core Question Generator for Calculation Speed Trainer
 * Supports injectable RNG and dynamic question deduplication against excludePrompts.
 */
export function generateTrainerQuestion(
  category: CalculationTrainerCategory,
  difficulty: CalculationTrainerDifficulty,
  index: number = 1,
  options?: GenerateQuestionOptions
): CalculationTrainerQuestion {
  const rng = options?.rng || Math.random;
  const maxRetries = options?.maxRetries ?? 25;
  const excludeSet = options?.excludePrompts
    ? options.excludePrompts instanceof Set
      ? options.excludePrompts
      : new Set(options.excludePrompts)
    : undefined;

  let candidate: CalculationTrainerQuestion | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    candidate = generateRawQuestion(category, difficulty, index, rng);
    if (!excludeSet || !excludeSet.has(candidate.prompt)) {
      return candidate;
    }
  }

  // If retries exhausted (domain exhausted), return candidate safely
  return candidate || generateRawQuestion(category, difficulty, index, rng);
}

/**
 * Metric Evaluator: Computes accurate speed and accuracy statistics
 */
export function evaluateTrainerSession(
  attempts: CalculationTrainerAttempt[],
  config: CalculationTrainerConfig,
  activeSeconds: number,
  previousBestCpm: number = 0
): CalculationTrainerSessionSummary {
  const totalAttempted = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const incorrectCount = attempts.filter((a) => !a.isCorrect && !a.isSkipped).length;
  const skippedCount = attempts.filter((a) => a.isSkipped).length;

  const answeredAttempts = attempts.filter((a) => !a.isSkipped);
  const totalResponseTimeMs = answeredAttempts.reduce((sum, a) => sum + (a.timeMs || 0), 0);

  const accuracyPercentage =
    totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

  const avgResponseTimeMs =
    answeredAttempts.length > 0 ? Math.round(totalResponseTimeMs / answeredAttempts.length) : 0;

  const activeMinutes = Math.max(0.1, activeSeconds / 60);
  const correctPerMinute = Math.round((correctCount / activeMinutes) * 10) / 10;

  // Speed rating
  let speedRating: CalculationTrainerSessionSummary["speedRating"] = "🎯 Needs Practice";
  if (accuracyPercentage >= 85 && avgResponseTimeMs > 0 && avgResponseTimeMs <= 3500) {
    speedRating = "⚡ Lightning Fast";
  } else if (accuracyPercentage >= 75 && avgResponseTimeMs > 0 && avgResponseTimeMs <= 5500) {
    speedRating = "🚀 High Speed";
  } else if (accuracyPercentage >= 60) {
    speedRating = "👍 Solid Pace";
  }

  // Category breakdown
  const categoryBreakdown: Record<string, CategorySummaryStat> = {};
  for (const a of attempts) {
    if (!categoryBreakdown[a.category]) {
      categoryBreakdown[a.category] = {
        total: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        accuracy: 0,
        avgTimeMs: 0,
        isWeakArea: false,
      };
    }
    const stat = categoryBreakdown[a.category];
    stat.total += 1;
    if (a.isCorrect) stat.correct += 1;
    else if (a.isSkipped) stat.skipped += 1;
    else stat.incorrect += 1;
  }

  // Calculate percentages and weakness
  for (const catKey of Object.keys(categoryBreakdown)) {
    const stat = categoryBreakdown[catKey];
    stat.accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    const catAnswered = attempts.filter((a) => a.category === catKey && !a.isSkipped);
    const catTotalTime = catAnswered.reduce((s, a) => s + (a.timeMs || 0), 0);
    stat.avgTimeMs = catAnswered.length > 0 ? Math.round(catTotalTime / catAnswered.length) : 0;
    // Mark as weak if at least 3 attempts and accuracy below 70%
    stat.isWeakArea = stat.total >= 3 && stat.accuracy < 70;
  }

  const mistakes = attempts.filter((a) => !a.isCorrect);
  const isPersonalBest = correctPerMinute > previousBestCpm && correctCount >= 5;

  return {
    id: `cst-sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: getIndianDateStr(),
    timestamp: new Date().toISOString(),
    durationMinutes: config.durationMinutes,
    activeSeconds,
    difficulty: config.difficulty,
    categories: config.categories,
    totalAttempted,
    correctCount,
    incorrectCount,
    skippedCount,
    accuracyPercentage,
    avgResponseTimeMs,
    correctPerMinute,
    speedRating,
    categoryBreakdown,
    mistakes,
    isPersonalBest,
    warmupCount: Math.min(5, Math.floor(totalAttempted * 0.15)),
    sprintCount: Math.max(0, totalAttempted - Math.min(5, Math.floor(totalAttempted * 0.15))),
  };
}
