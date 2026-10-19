/**
 * Speed Math & Mental Calculation Drill Engine
 * Used across OdishaRank Next.js web portal and Expo mobile application.
 */

export type SpeedMathCategory =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "bodmas"
  | "squares"
  | "cubes"
  | "tables"
  | "square_root"
  | "cube_root"
  | "exponents"
  | "exponent_root"
  | "fraction_of_percent"
  | "percent_to_fraction"
  | "di_addition"
  | "mix";

export type SpeedMathDifficulty = "easy" | "medium" | "hard";

export interface SpeedMathCategoryMeta {
  id: SpeedMathCategory;
  name: string;
  badge: "CORE" | "EXAM" | "MEMORY" | "CONCEPT" | "PERCENT" | "DI" | "RANDOM";
  description: string;
  badgeColor: string;
  iconName: string;
  color: string;
  bgColor: string;
}

export interface SpeedMathQuestion {
  id: string;
  category: SpeedMathCategory;
  difficulty: SpeedMathDifficulty;
  prompt: string;
  subtext?: string;
  answer: string; // Stored as string for uniform comparison
  options?: string[]; // Optional multiple choice options for fraction conversions
  hint?: string;
}

export interface SpeedMathAttemptRecord {
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSeconds: number;
}

export interface SpeedMathResult {
  category: SpeedMathCategory;
  difficulty: SpeedMathDifficulty;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracyPercentage: number;
  totalTimeSeconds: number;
  averageSecondsPerQuestion: number;
  speedRating: "⚡ Lightning Fast" | "🚀 High Speed" | "👍 Solid Pace" | "🎯 Needs Practice";
  records: SpeedMathAttemptRecord[];
}

export const SPEED_MATH_CATEGORIES: SpeedMathCategoryMeta[] = [
  {
    id: "addition",
    name: "Addition",
    badge: "CORE",
    description: "Fast column and row-wise sums.",
    badgeColor: "bg-blue-100 text-blue-700",
    iconName: "Plus",
    color: "#2563EB",
    bgColor: "bg-blue-500",
  },
  {
    id: "subtraction",
    name: "Subtraction",
    badge: "CORE",
    description: "Borrowing & difference questions.",
    badgeColor: "bg-red-100 text-red-700",
    iconName: "Minus",
    color: "#EF4444",
    bgColor: "bg-red-500",
  },
  {
    id: "multiplication",
    name: "Multiplication",
    badge: "CORE",
    description: "Speed tables & big products.",
    badgeColor: "bg-purple-100 text-purple-700",
    iconName: "X",
    color: "#8B5CF6",
    bgColor: "bg-purple-500",
  },
  {
    id: "division",
    name: "Division",
    badge: "CORE",
    description: "Clean integer division drills.",
    badgeColor: "bg-orange-100 text-orange-700",
    iconName: "Divide",
    color: "#F97316",
    bgColor: "bg-orange-500",
  },
  {
    id: "bodmas",
    name: "BODMAS (Mix)",
    badge: "EXAM",
    description: "Brackets + mixed operations.",
    badgeColor: "bg-slate-200 text-slate-800",
    iconName: "Calculator",
    color: "#475569",
    bgColor: "bg-slate-600",
  },
  {
    id: "squares",
    name: "Squares",
    badge: "MEMORY",
    description: "Square values by ranges.",
    badgeColor: "bg-emerald-100 text-emerald-700",
    iconName: "Square",
    color: "#10B981",
    bgColor: "bg-emerald-500",
  },
  {
    id: "cubes",
    name: "Cubes",
    badge: "MEMORY",
    description: "Cube values for fast recall.",
    badgeColor: "bg-teal-100 text-teal-700",
    iconName: "Box",
    color: "#14B8A6",
    bgColor: "bg-teal-500",
  },
  {
    id: "tables",
    name: "Tables",
    badge: "CORE",
    description: "Multiplication tables by range.",
    badgeColor: "bg-cyan-100 text-cyan-700",
    iconName: "Grid",
    color: "#06B6D4",
    bgColor: "bg-cyan-500",
  },
  {
    id: "square_root",
    name: "Square Root",
    badge: "CONCEPT",
    description: "Perfect square roots.",
    badgeColor: "bg-sky-100 text-sky-700",
    iconName: "Radical",
    color: "#0284C7",
    bgColor: "bg-sky-500",
  },
  {
    id: "cube_root",
    name: "Cube Root",
    badge: "CONCEPT",
    description: "Perfect cube roots.",
    badgeColor: "bg-blue-100 text-blue-700",
    iconName: "Cuboid",
    color: "#3B82F6",
    bgColor: "bg-blue-400",
  },
  {
    id: "exponents",
    name: "Exponents",
    badge: "CONCEPT",
    description: "Powers of a number, fast recall.",
    badgeColor: "bg-violet-100 text-violet-700",
    iconName: "Superscript",
    color: "#7C3AED",
    bgColor: "bg-violet-500",
  },
  {
    id: "exponent_root",
    name: "Exponent Root",
    badge: "CONCEPT",
    description: "Reverse of exponents — find the base.",
    badgeColor: "bg-rose-100 text-rose-700",
    iconName: "RotateCcw",
    color: "#F43F5E",
    bgColor: "bg-rose-500",
  },
  {
    id: "fraction_of_percent",
    name: "Fraction of %",
    badge: "PERCENT",
    description: "x% of N using fractions.",
    badgeColor: "bg-amber-100 text-amber-700",
    iconName: "PieChart",
    color: "#F59E0B",
    bgColor: "bg-amber-500",
  },
  {
    id: "percent_to_fraction",
    name: "% to Fraction",
    badge: "PERCENT",
    description: "Convert percent to fraction.",
    badgeColor: "bg-indigo-100 text-indigo-700",
    iconName: "ArrowLeftRight",
    color: "#6366F1",
    bgColor: "bg-indigo-500",
  },
  {
    id: "di_addition",
    name: "DI Addition",
    badge: "DI",
    description: "Table/column-wise totals.",
    badgeColor: "bg-pink-100 text-pink-700",
    iconName: "BarChart3",
    color: "#EC4899",
    bgColor: "bg-pink-500",
  },
  {
    id: "mix",
    name: "Mix Mode",
    badge: "RANDOM",
    description: "Random mix of key drills.",
    badgeColor: "bg-slate-200 text-slate-700",
    iconName: "Shuffle",
    color: "#64748B",
    bgColor: "bg-slate-500",
  },
];

// Helper random integer in range [min, max]
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to pick random item from array
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const COMMON_FRACTION_MAP: Array<{ percentStr: string; fracStr: string; decimal: number }> = [
  { percentStr: "50%", fracStr: "1/2", decimal: 0.5 },
  { percentStr: "25%", fracStr: "1/4", decimal: 0.25 },
  { percentStr: "75%", fracStr: "3/4", decimal: 0.75 },
  { percentStr: "20%", fracStr: "1/5", decimal: 0.2 },
  { percentStr: "40%", fracStr: "2/5", decimal: 0.4 },
  { percentStr: "60%", fracStr: "3/5", decimal: 0.6 },
  { percentStr: "80%", fracStr: "4/5", decimal: 0.8 },
  { percentStr: "10%", fracStr: "1/10", decimal: 0.1 },
  { percentStr: "30%", fracStr: "3/10", decimal: 0.3 },
  { percentStr: "70%", fracStr: "7/10", decimal: 0.7 },
  { percentStr: "90%", fracStr: "9/10", decimal: 0.9 },
  { percentStr: "12.5%", fracStr: "1/8", decimal: 0.125 },
  { percentStr: "37.5%", fracStr: "3/8", decimal: 0.375 },
  { percentStr: "62.5%", fracStr: "5/8", decimal: 0.625 },
  { percentStr: "87.5%", fracStr: "7/8", decimal: 0.875 },
  { percentStr: "16.66%", fracStr: "1/6", decimal: 1 / 6 },
  { percentStr: "33.33%", fracStr: "1/3", decimal: 1 / 3 },
  { percentStr: "66.66%", fracStr: "2/3", decimal: 2 / 3 },
  { percentStr: "14.28%", fracStr: "1/7", decimal: 1 / 7 },
  { percentStr: "11.11%", fracStr: "1/9", decimal: 1 / 9 },
  { percentStr: "9.09%", fracStr: "1/11", decimal: 1 / 11 },
  { percentStr: "8.33%", fracStr: "1/12", decimal: 1 / 12 },
  { percentStr: "6.25%", fracStr: "1/16", decimal: 0.0625 },
];

/**
 * Generates an individual question for a specific drill category & difficulty
 */
export function generateSingleQuestion(
  category: SpeedMathCategory,
  difficulty: SpeedMathDifficulty,
  index: number
): SpeedMathQuestion {
  const qId = `sm-${category}-${difficulty}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Handle mix mode by delegating to a random specific category
  if (category === "mix") {
    const specificCategories: SpeedMathCategory[] = [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "bodmas",
      "squares",
      "cubes",
      "tables",
      "square_root",
      "cube_root",
      "exponents",
      "fraction_of_percent",
      "di_addition",
    ];
    const picked = pickRandom(specificCategories);
    return generateSingleQuestion(picked, difficulty, index);
  }

  switch (category) {
    case "addition": {
      if (difficulty === "easy") {
        const a = randInt(12, 88);
        const b = randInt(9, 65);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} + ${b}`,
          answer: String(a + b),
          hint: `Sum of ${a} and ${b}`,
        };
      } else if (difficulty === "medium") {
        const a = randInt(75, 480);
        const b = randInt(45, 390);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} + ${b}`,
          answer: String(a + b),
          hint: `Add hundreds then tens`,
        };
      } else {
        // Hard: 3 numbers or 4 digits
        if (Math.random() > 0.5) {
          const a = randInt(115, 680);
          const b = randInt(85, 490);
          const c = randInt(65, 350);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ${b} + ${c}`,
            answer: String(a + b + c),
            hint: `3-number chain addition`,
          };
        } else {
          const a = randInt(1250, 4890);
          const b = randInt(850, 3950);
          return {
            id: qId,
            category,
            difficulty,
            prompt: `${a} + ${b}`,
            answer: String(a + b),
          };
        }
      }
    }

    case "subtraction": {
      if (difficulty === "easy") {
        const b = randInt(9, 45);
        const a = b + randInt(8, 50);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} - ${b}`,
          answer: String(a - b),
        };
      } else if (difficulty === "medium") {
        const b = randInt(55, 380);
        const a = b + randInt(45, 420);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} - ${b}`,
          answer: String(a - b),
        };
      } else {
        const b = randInt(850, 3950);
        const a = b + randInt(750, 4850);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} - ${b}`,
          answer: String(a - b),
        };
      }
    }

    case "multiplication": {
      if (difficulty === "easy") {
        const a = randInt(4, 19);
        const b = randInt(3, 12);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} × ${b}`,
          answer: String(a * b),
        };
      } else if (difficulty === "medium") {
        const a = randInt(14, 45);
        const b = randInt(11, 25);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} × ${b}`,
          answer: String(a * b),
        };
      } else {
        const a = randInt(35, 98);
        const b = randInt(15, 48);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} × ${b}`,
          answer: String(a * b),
        };
      }
    }

    case "division": {
      if (difficulty === "easy") {
        const divisor = randInt(3, 12);
        const ans = randInt(4, 15);
        const dividend = ans * divisor;
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${dividend} ÷ ${divisor}`,
          answer: String(ans),
        };
      } else if (difficulty === "medium") {
        const divisor = randInt(8, 24);
        const ans = randInt(12, 38);
        const dividend = ans * divisor;
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${dividend} ÷ ${divisor}`,
          answer: String(ans),
        };
      } else {
        const divisor = randInt(16, 48);
        const ans = randInt(25, 75);
        const dividend = ans * divisor;
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${dividend} ÷ ${divisor}`,
          answer: String(ans),
        };
      }
    }

    case "bodmas": {
      if (difficulty === "easy") {
        const a = randInt(3, 12);
        const b = randInt(2, 8);
        const c = randInt(2, 6);
        // (A + B) × C
        const ans = (a + b) * c;
        return {
          id: qId,
          category,
          difficulty,
          prompt: `(${a} + ${b}) × ${c}`,
          answer: String(ans),
        };
      } else if (difficulty === "medium") {
        const a = randInt(15, 60);
        const b = randInt(3, 12);
        const c = randInt(2, 8);
        const d = randInt(5, 25);
        // A + B × C - D
        const ans = a + b * c - d;
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${a} + ${b} × ${c} - ${d}`,
          answer: String(ans),
        };
      } else {
        const divisor = randInt(3, 8);
        const innerMult = randInt(12, 28);
        const b = randInt(4, 9);
        const targetInner = divisor * randInt(12, 35);
        const c = targetInner - innerMult * b;
        const promptStr = c >= 0 ? `(${innerMult} × ${b} + ${c}) ÷ ${divisor}` : `(${innerMult} × ${b} - ${Math.abs(c)}) ÷ ${divisor}`;
        return {
          id: qId,
          category,
          difficulty,
          prompt: promptStr,
          answer: String(targetInner / divisor),
        };
      }
    }

    case "squares": {
      let n: number;
      if (difficulty === "easy") {
        n = randInt(4, 25);
      } else if (difficulty === "medium") {
        n = randInt(26, 50);
      } else {
        n = randInt(51, 99);
      }
      return {
        id: qId,
        category,
        difficulty,
        prompt: `${n}²`,
        answer: String(n * n),
        hint: `Square of ${n}`,
      };
    }

    case "cubes": {
      let n: number;
      if (difficulty === "easy") {
        n = randInt(2, 12);
      } else if (difficulty === "medium") {
        n = randInt(13, 20);
      } else {
        n = randInt(21, 30);
      }
      return {
        id: qId,
        category,
        difficulty,
        prompt: `${n}³`,
        answer: String(n * n * n),
        hint: `Cube of ${n}`,
      };
    }

    case "tables": {
      let table: number;
      let mult: number;
      if (difficulty === "easy") {
        table = randInt(11, 20);
        mult = randInt(2, 10);
      } else if (difficulty === "medium") {
        table = randInt(21, 30);
        mult = randInt(2, 10);
      } else {
        table = randInt(31, 45);
        mult = randInt(2, 10);
      }
      return {
        id: qId,
        category,
        difficulty,
        prompt: `${table} × ${mult}`,
        answer: String(table * mult),
        hint: `Table of ${table}`,
      };
    }

    case "square_root": {
      let n: number;
      if (difficulty === "easy") {
        n = randInt(4, 25);
      } else if (difficulty === "medium") {
        n = randInt(26, 50);
      } else {
        n = randInt(51, 99);
      }
      return {
        id: qId,
        category,
        difficulty,
        prompt: `√${n * n}`,
        answer: String(n),
        hint: `Find base root of ${n * n}`,
      };
    }

    case "cube_root": {
      let n: number;
      if (difficulty === "easy") {
        n = randInt(2, 10);
      } else if (difficulty === "medium") {
        n = randInt(11, 18);
      } else {
        n = randInt(19, 25);
      }
      return {
        id: qId,
        category,
        difficulty,
        prompt: `∛${n * n * n}`,
        answer: String(n),
        hint: `Cube root of ${n * n * n}`,
      };
    }

    case "exponents": {
      if (difficulty === "easy") {
        // 2^3 to 2^8, 3^2 to 3^4, 5^2 to 5^3
        const bases = [
          { b: 2, exp: randInt(3, 8) },
          { b: 3, exp: randInt(2, 4) },
          { b: 5, exp: randInt(2, 3) },
        ];
        const item = pickRandom(bases);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${item.b}^${item.exp}`,
          answer: String(Math.pow(item.b, item.exp)),
        };
      } else if (difficulty === "medium") {
        const bases = [
          { b: 2, exp: randInt(7, 11) },
          { b: 3, exp: randInt(4, 6) },
          { b: 4, exp: randInt(3, 5) },
          { b: 7, exp: randInt(2, 4) },
        ];
        const item = pickRandom(bases);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${item.b}^${item.exp}`,
          answer: String(Math.pow(item.b, item.exp)),
        };
      } else {
        const bases = [
          { b: 2, exp: randInt(10, 14) },
          { b: 3, exp: randInt(6, 8) },
          { b: 5, exp: randInt(4, 6) },
          { b: 11, exp: randInt(2, 4) },
        ];
        const item = pickRandom(bases);
        return {
          id: qId,
          category,
          difficulty,
          prompt: `${item.b}^${item.exp}`,
          answer: String(Math.pow(item.b, item.exp)),
        };
      }
    }

    case "exponent_root": {
      let base: number;
      let exp: number;
      if (difficulty === "easy") {
        base = randInt(2, 5);
        exp = randInt(3, 4);
      } else if (difficulty === "medium") {
        base = randInt(3, 7);
        exp = randInt(3, 5);
      } else {
        base = randInt(2, 9);
        exp = randInt(4, 6);
      }
      const powerVal = Math.pow(base, exp);
      return {
        id: qId,
        category,
        difficulty,
        prompt: `If x^${exp} = ${powerVal}, x = ?`,
        answer: String(base),
        hint: `Find the base of power ${exp}`,
      };
    }

    case "fraction_of_percent": {
      // Pick a fraction that yields a clean integer result
      let selected: { percentStr: string; fracStr: string; decimal: number };
      if (difficulty === "easy") {
        selected = pickRandom([
          { percentStr: "50%", fracStr: "1/2", decimal: 0.5 },
          { percentStr: "25%", fracStr: "1/4", decimal: 0.25 },
          { percentStr: "75%", fracStr: "3/4", decimal: 0.75 },
          { percentStr: "20%", fracStr: "1/5", decimal: 0.2 },
          { percentStr: "10%", fracStr: "1/10", decimal: 0.1 },
        ]);
      } else if (difficulty === "medium") {
        selected = pickRandom([
          { percentStr: "12.5%", fracStr: "1/8", decimal: 0.125 },
          { percentStr: "37.5%", fracStr: "3/8", decimal: 0.375 },
          { percentStr: "16.66%", fracStr: "1/6", decimal: 1 / 6 },
          { percentStr: "33.33%", fracStr: "1/3", decimal: 1 / 3 },
          { percentStr: "40%", fracStr: "2/5", decimal: 0.4 },
        ]);
      } else {
        selected = pickRandom([
          { percentStr: "62.5%", fracStr: "5/8", decimal: 0.625 },
          { percentStr: "87.5%", fracStr: "7/8", decimal: 0.875 },
          { percentStr: "14.28%", fracStr: "1/7", decimal: 1 / 7 },
          { percentStr: "11.11%", fracStr: "1/9", decimal: 1 / 9 },
          { percentStr: "9.09%", fracStr: "1/11", decimal: 1 / 11 },
          { percentStr: "8.33%", fracStr: "1/12", decimal: 1 / 12 },
        ]);
      }

      // Generate a number N divisible by denominator
      const denom = Number(selected.fracStr.split("/")[1]);
      const num = Number(selected.fracStr.split("/")[0]);
      const multiplier = difficulty === "easy" ? randInt(4, 25) : difficulty === "medium" ? randInt(12, 45) : randInt(25, 80);
      const N = denom * multiplier;
      const ans = num * multiplier;

      return {
        id: qId,
        category,
        difficulty,
        prompt: `${selected.percentStr} of ${N}`,
        answer: String(ans),
        hint: `${selected.percentStr} = ${selected.fracStr}`,
      };
    }

    case "percent_to_fraction": {
      let pool = COMMON_FRACTION_MAP;
      if (difficulty === "easy") {
        pool = COMMON_FRACTION_MAP.slice(0, 11);
      } else if (difficulty === "medium") {
        pool = COMMON_FRACTION_MAP.slice(7, 18);
      } else {
        pool = COMMON_FRACTION_MAP.slice(14);
      }

      const item = pickRandom(pool);
      // Generate 4 multiple-choice options for quick tap
      const wrongOptions = pool
        .filter((p) => p.fracStr !== item.fracStr)
        .map((p) => p.fracStr);
      const shuffledOptions = [item.fracStr, ...wrongOptions.slice(0, 3)].sort(() => Math.random() - 0.5);

      return {
        id: qId,
        category,
        difficulty,
        prompt: `${item.percentStr} as a fraction`,
        answer: item.fracStr,
        options: shuffledOptions,
        hint: `Think in terms of 100%`,
      };
    }

    case "di_addition": {
      if (difficulty === "easy") {
        const nums = [randInt(20, 95), randInt(15, 85), randInt(10, 60)];
        const sum = nums.reduce((a, b) => a + b, 0);
        return {
          id: qId,
          category,
          difficulty,
          prompt: nums.join(" + "),
          subtext: "Row Total (DI)",
          answer: String(sum),
        };
      } else if (difficulty === "medium") {
        const nums = [randInt(110, 390), randInt(85, 290), randInt(65, 240), randInt(50, 180)];
        const sum = nums.reduce((a, b) => a + b, 0);
        return {
          id: qId,
          category,
          difficulty,
          prompt: nums.join(" + "),
          subtext: "Column Total (DI Table)",
          answer: String(sum),
        };
      } else {
        const nums = [
          randInt(150, 480),
          randInt(120, 390),
          randInt(110, 360),
          randInt(85, 290),
          randInt(60, 210),
        ];
        const sum = nums.reduce((a, b) => a + b, 0);
        return {
          id: qId,
          category,
          difficulty,
          prompt: nums.join(" + "),
          subtext: "5-Period Series Total (DI)",
          answer: String(sum),
        };
      }
    }
  }
}

/**
 * Generates an array of questions for a speed calculation drill session
 */
export function generateSpeedMathQuestions(
  category: SpeedMathCategory,
  difficulty: SpeedMathDifficulty,
  count: number = 20
): SpeedMathQuestion[] {
  const list: SpeedMathQuestion[] = [];
  for (let i = 0; i < count; i++) {
    list.push(generateSingleQuestion(category, difficulty, i));
  }
  return list;
}

/**
 * Evaluates performance metrics for a completed drill
 */
export function calculateSpeedMathResult(
  category: SpeedMathCategory,
  difficulty: SpeedMathDifficulty,
  records: SpeedMathAttemptRecord[]
): SpeedMathResult {
  const totalQuestions = records.length;
  const correctAnswers = records.filter((r) => r.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const accuracyPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const totalTimeSeconds = Math.round(records.reduce((acc, r) => acc + r.timeSeconds, 0) * 10) / 10;
  const averageSecondsPerQuestion =
    totalQuestions > 0 ? Math.round((totalTimeSeconds / totalQuestions) * 10) / 10 : 0;

  let speedRating: SpeedMathResult["speedRating"] = "🎯 Needs Practice";
  if (accuracyPercentage >= 85) {
    if (averageSecondsPerQuestion <= 3.0) {
      speedRating = "⚡ Lightning Fast";
    } else if (averageSecondsPerQuestion <= 5.5) {
      speedRating = "🚀 High Speed";
    } else {
      speedRating = "👍 Solid Pace";
    }
  } else if (accuracyPercentage >= 65) {
    speedRating = "👍 Solid Pace";
  }

  return {
    category,
    difficulty,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    accuracyPercentage,
    totalTimeSeconds,
    averageSecondsPerQuestion,
    speedRating,
    records,
  };
}
