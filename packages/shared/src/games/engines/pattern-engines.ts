/**
 * OdishaRank Games — Pure Pattern & Reasoning Engines
 * Covers all 6 Pattern & Reasoning Games:
 * 27. Numberle
 * 28. Nonogram
 * 29. Cryptarithm
 * 30. Number Sequence
 * 31. Odd One Out
 * 32. Missing Operator
 */

import { GameDifficulty } from "../types";

// ==========================================
// 27. NUMBERLE ENGINE
// ==========================================
export type NumberleTileStatus = "correct" | "present" | "absent";

export interface NumberleFeedback {
  digit: string;
  status: NumberleTileStatus;
}

export function generateNumberleSecret(length: number = 4): string {
  // Generate random 4-digit number with unique digits
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  digits.sort(() => Math.random() - 0.5);
  return digits.slice(0, length).join("");
}

export function evaluateNumberleGuess(guess: string, secret: string): NumberleFeedback[] {
  const result: NumberleFeedback[] = [];
  const secretArr = secret.split("");
  const guessArr = guess.split("");
  const remainingSecret: (string | null)[] = [...secretArr];

  // Pass 1: exact matches
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === secretArr[i]) {
      result.push({ digit: guessArr[i], status: "correct" });
      remainingSecret[i] = null;
    } else {
      result.push({ digit: guessArr[i], status: "absent" });
    }
  }

  // Pass 2: present in wrong position
  for (let i = 0; i < guessArr.length; i++) {
    if (result[i].status !== "correct") {
      const idx = remainingSecret.indexOf(guessArr[i]);
      if (idx !== -1) {
        result[i].status = "present";
        remainingSecret[idx] = null;
      }
    }
  }

  return result;
}

// ==========================================
// 28. NONOGRAM (PICROSS) ENGINE
// ==========================================
export interface NonogramPuzzle {
  size: 5; // 5x5
  rowClues: number[][];
  colClues: number[][];
  solution: boolean[][]; // true = filled, false = empty
}

export function generateNonogram5x5(): NonogramPuzzle {
  // Sample 5x5 Heart or Smiley icon
  const solution: boolean[][] = [
    [false, true, false, true, false],
    [true, true, true, true, true],
    [true, true, true, true, true],
    [false, true, true, true, false],
    [false, false, true, false, false],
  ];

  // Compute clues
  const rowClues: number[][] = [];
  for (let r = 0; r < 5; r++) {
    const clues: number[] = [];
    let count = 0;
    for (let c = 0; c < 5; c++) {
      if (solution[r][c]) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    rowClues.push(clues.length > 0 ? clues : [0]);
  }

  const colClues: number[][] = [];
  for (let c = 0; c < 5; c++) {
    const clues: number[] = [];
    let count = 0;
    for (let r = 0; r < 5; r++) {
      if (solution[r][c]) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    colClues.push(clues.length > 0 ? clues : [0]);
  }

  return { size: 5, rowClues, colClues, solution };
}

// ==========================================
// 29. CRYPTARITHMETIC ENGINE
// ==========================================
export interface CryptarithmPuzzle {
  word1: string;
  word2: string;
  resultWord: string;
  solution: Record<string, number>;
  hint: string;
}

export function generateCryptarithmPuzzle(): CryptarithmPuzzle {
  const puzzles: CryptarithmPuzzle[] = [
    {
      word1: "TO",
      word2: "GO",
      resultWord: "OUT",
      solution: { T: 2, O: 1, G: 8, U: 0 }, // 21 + 81 = 102
      hint: "O + O ends in T. T is a leading digit and must be > 0.",
    },
    {
      word1: "SEND",
      word2: "MORE",
      resultWord: "MONEY",
      solution: { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 }, // 9567 + 1085 = 10652
      hint: "Notice M is a carry-over into the 5th column, so M must equal 1.",
    },
    {
      word1: "BASE",
      word2: "BALL",
      resultWord: "GAMES",
      solution: { B: 7, A: 4, S: 8, E: 3, L: 5, G: 1, M: 9 }, // 7483 + 7455 = 14938
      hint: "B + B with potential carry produces GA in the sum column.",
    },
  ];

  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

// ==========================================
// 30. NUMBER SEQUENCE ENGINE
// ==========================================
export interface NumberSequenceQuestion {
  id: string;
  sequenceWithMissing: string[];
  missingIndex: number;
  correctAnswer: number;
  options: number[];
  patternType: "arithmetic" | "geometric" | "fibonacci" | "squares" | "alternating";
  explanation: string;
}

export function generateNumberSequenceQuestion(): NumberSequenceQuestion {
  const types = ["arithmetic", "geometric", "squares", "differences"];
  const t = types[Math.floor(Math.random() * types.length)];

  if (t === "arithmetic") {
    const start = Math.floor(Math.random() * 20) + 5;
    const diff = Math.floor(Math.random() * 7) + 3;
    const full = Array.from({ length: 6 }, (_, i) => start + i * diff);
    const missIdx = 4;
    const ans = full[missIdx];

    const display = full.map((n, i) => (i === missIdx ? "?" : String(n)));
    const options = [ans, ans + diff, ans - diff, ans + 2].sort(() => Math.random() - 0.5);

    return {
      id: `seq-${Date.now()}`,
      sequenceWithMissing: display,
      missingIndex: missIdx,
      correctAnswer: ans,
      options: Array.from(new Set(options)),
      patternType: "arithmetic",
      explanation: `Arithmetic sequence with common difference +${diff}: [${full.join(", ")}].`,
    };
  }

  if (t === "squares") {
    // 1, 4, 9, 16, 25, 36...
    const base = Math.floor(Math.random() * 4) + 1;
    const full = Array.from({ length: 5 }, (_, i) => Math.pow(base + i, 2));
    const missIdx = 3;
    const ans = full[missIdx];

    const display = full.map((n, i) => (i === missIdx ? "?" : String(n)));
    const options = [ans, ans + 5, ans - 5, ans + 10].sort(() => Math.random() - 0.5);

    return {
      id: `seq-${Date.now()}`,
      sequenceWithMissing: display,
      missingIndex: missIdx,
      correctAnswer: ans,
      options: Array.from(new Set(options)),
      patternType: "squares",
      explanation: `Series of consecutive squares: ${Array.from(
        { length: 5 },
        (_, i) => `${base + i}² = ${full[i]}`
      ).join(", ")}.`,
    };
  }

  // Doubling differences (e.g., +3, +6, +12, +24)
  let curr = 4;
  let d = 3;
  const full: number[] = [curr];
  for (let i = 0; i < 5; i++) {
    curr += d;
    full.push(curr);
    d *= 2;
  }
  const missIdx = 4;
  const ans = full[missIdx];
  const display = full.map((n, i) => (i === missIdx ? "?" : String(n)));
  const options = [ans, ans + 8, ans - 6, ans + 12].sort(() => Math.random() - 0.5);

  return {
    id: `seq-${Date.now()}`,
    sequenceWithMissing: display,
    missingIndex: missIdx,
    correctAnswer: ans,
    options: Array.from(new Set(options)),
    patternType: "alternating",
    explanation: `The successive differences double at each step (+3, +6, +12, +24, +48). Missing number = ${ans}.`,
  };
}

// ==========================================
// 31. ODD ONE OUT ENGINE
// ==========================================
export interface OddOneOutQuestion {
  id: string;
  numbers: number[];
  outlier: number;
  explanation: string;
}

export function generateOddOneOutQuestion(): OddOneOutQuestion {
  const bank: OddOneOutQuestion[] = [
    {
      id: "odd-1",
      numbers: [23, 29, 31, 37, 39],
      outlier: 39,
      explanation: "39 is composite (3 × 13), whereas 23, 29, 31, and 37 are all prime numbers.",
    },
    {
      id: "odd-2",
      numbers: [27, 64, 125, 216, 256],
      outlier: 256,
      explanation: "256 is 16² (a square, not a cube of an integer), whereas 27 = 3³, 64 = 4³, 125 = 5³, and 216 = 6³ are perfect cubes.",
    },
    {
      id: "odd-3",
      numbers: [28, 42, 56, 70, 85],
      outlier: 85,
      explanation: "All numbers except 85 are exact multiples of 14 (14×2, 14×3, 14×4, 14×5).",
    },
    {
      id: "odd-4",
      numbers: [121, 144, 169, 196, 210],
      outlier: 210,
      explanation: "121 (11²), 144 (12²), 169 (13²), and 196 (14²) are perfect squares; 210 is not a perfect square.",
    },
  ];

  return bank[Math.floor(Math.random() * bank.length)];
}

// ==========================================
// 32. MISSING OPERATOR ENGINE
// ==========================================
export interface MissingOperatorQuestion {
  id: string;
  num1: number;
  num2: number;
  num3: number;
  result: number;
  correctOp1: "+" | "-" | "×" | "÷";
  correctOp2: "+" | "-" | "×" | "÷";
  options: string[]; // e.g. ["+ , ×", "× , -", "÷ , +", "- , ÷"]
  explanation: string;
}

export function generateMissingOperatorQuestion(): MissingOperatorQuestion {
  const bank = [
    {
      n1: 8,
      n2: 4,
      n3: 2,
      res: 16,
      op1: "×" as const,
      op2: "÷" as const, // 8 * 4 / 2 = 16
      explanation: "8 × 4 ÷ 2 = 32 ÷ 2 = 16.",
    },
    {
      n1: 15,
      n2: 3,
      n3: 4,
      res: 9,
      op1: "÷" as const,
      op2: "+" as const, // 15 / 3 + 4 = 5 + 4 = 9
      explanation: "BODMAS priority: Division first (15 ÷ 3 = 5), then addition (5 + 4 = 9).",
    },
    {
      n1: 20,
      n2: 5,
      n3: 2,
      res: 10,
      op1: "-" as const,
      op2: "×" as const, // 20 - 5 * 2 = 20 - 10 = 10
      explanation: "BODMAS priority: Multiplication first (5 × 2 = 10), then subtraction (20 - 10 = 10).",
    },
    {
      n1: 6,
      n2: 3,
      n3: 5,
      res: 23,
      op1: "×" as const,
      op2: "+" as const, // 6 * 3 + 5 = 18 + 5 = 23
      explanation: "6 × 3 + 5 = 18 + 5 = 23.",
    },
  ];

  const q = bank[Math.floor(Math.random() * bank.length)];
  const correctChoice = `${q.op1} , ${q.op2}`;
  const allCombos = ["+ , ×", "× , ÷", "÷ , +", "- , ×", "+ , -", "× , +"];
  const dist = allCombos.filter((c) => c !== correctChoice).slice(0, 3);
  const options = [correctChoice, ...dist].sort(() => Math.random() - 0.5);

  return {
    id: `mop-${Date.now()}-${Math.random()}`,
    num1: q.n1,
    num2: q.n2,
    num3: q.n3,
    result: q.res,
    correctOp1: q.op1,
    correctOp2: q.op2,
    options,
    explanation: q.explanation,
  };
}
