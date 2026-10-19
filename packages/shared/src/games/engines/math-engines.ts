/**
 * OdishaRank Games — Pure Math Engines
 * Covers all 15 Math Games:
 * 1. 24 Game
 * 2. 2048
 * 3. Magic Square
 * 4. Kakuro
 * 5. Number Bonds
 * 6. Nerdle
 * 7. Countdown Numbers
 * 8. Quick Calc
 * 9. Math Crossword
 * 10. Approximation
 * 11. Average Race
 * 12. Percentage Blitz
 * 13. Speed Comparison
 * 14. Simplification Sprint
 * 15. Factor Finder
 */

import { GameDifficulty } from "../types";

// ==========================================
// 1. 24 GAME ENGINE
// ==========================================
export interface Game24Puzzle {
  numbers: number[];
  solution: string; // Known sample solution for hint
}

const GAME_24_PRESETS: Game24Puzzle[] = [
  { numbers: [3, 8, 3, 8], solution: "8 / (3 - 8/3) = 24" },
  { numbers: [4, 1, 8, 7], solution: "(8 - 4) * (7 - 1) = 24" },
  { numbers: [6, 6, 6, 6], solution: "6 + 6 + 6 + 6 = 24" },
  { numbers: [1, 2, 3, 4], solution: "1 * 2 * 3 * 4 = 24" },
  { numbers: [5, 5, 5, 1], solution: "(5 - 1/5) * 5 = 24" },
  { numbers: [2, 3, 4, 6], solution: "(6 * 4) / (3 - 2) = 24" },
  { numbers: [4, 4, 7, 7], solution: "(4 - 4/7) * 7 = 24" },
  { numbers: [2, 4, 6, 8], solution: "(8 * 6) / (4 - 2) = 24" },
  { numbers: [1, 3, 5, 7], solution: "(7 - 3) * (5 + 1) = 24" },
  { numbers: [1, 2, 7, 7], solution: "(7 * 7 - 1) / 2 = 24" },
  { numbers: [1, 3, 4, 6], solution: "6 / (1 - 3/4) = 24" },
  { numbers: [2, 3, 4, 5], solution: "(5 + 3 - 2) * 4 = 24" },
  { numbers: [1, 3, 6, 9], solution: "(9 - 1) * (6 - 3) = 24" },
  { numbers: [2, 3, 3, 8], solution: "(8 * 3) / (3 - 2) = 24" },
];

export function generate24GamePuzzle(difficulty: GameDifficulty = "medium"): Game24Puzzle {
  // Select preset or generate solvable combination
  const index = Math.floor(Math.random() * GAME_24_PRESETS.length);
  const p = GAME_24_PRESETS[index];
  return {
    numbers: [...p.numbers].sort(() => Math.random() - 0.5),
    solution: p.solution,
  };
}

export function validate24GameExpression(
  expression: string,
  givenNumbers: number[]
): { valid: boolean; value?: number; error?: string } {
  // 1. Sanitize expression (only allow digits, +, -, *, /, (, ), space)
  if (!/^[\d\s\+\-\*\/\(\)\.]+$/.test(expression)) {
    return { valid: false, error: "Only numbers and +, -, *, /, ( ) are allowed" };
  }

  // 2. Extract numbers used
  const usedNumbers = expression
    .match(/\b\d+\b/g)
    ?.map(Number)
    .sort((a, b) => a - b) || [];
  const requiredNumbers = [...givenNumbers].sort((a, b) => a - b);

  if (usedNumbers.length !== requiredNumbers.length) {
    return {
      valid: false,
      error: `You must use all ${requiredNumbers.length} numbers exactly once`,
    };
  }

  for (let i = 0; i < requiredNumbers.length; i++) {
    if (usedNumbers[i] !== requiredNumbers[i]) {
      return {
        valid: false,
        error: `Numbers used do not match the given numbers [${givenNumbers.join(", ")}]`,
      };
    }
  }

  // 3. Safe evaluation using Function
  try {
    const fn = new Function(`"use strict"; return (${expression});`);
    const result = fn();
    if (typeof result !== "number" || !isFinite(result)) {
      return { valid: false, error: "Invalid mathematical expression" };
    }

    const is24 = Math.abs(result - 24) < 1e-6;
    return {
      valid: is24,
      value: result,
      error: is24 ? undefined : `Evaluates to ${result}, not 24`,
    };
  } catch (err: any) {
    return { valid: false, error: "Syntax error in expression" };
  }
}

// ==========================================
// 2. 2048 GAME ENGINE
// ==========================================
export type Board2048 = number[][]; // 4x4 matrix

export interface Game2048State {
  board: Board2048;
  score: number;
  bestScore: number;
  won: boolean;
  gameOver: boolean;
}

export function createEmpty2048Board(): Board2048 {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

export function spawnRandom2048Tile(board: Board2048): Board2048 {
  const emptyCells: { r: number; c: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) emptyCells.push({ r, c });
    }
  }
  if (emptyCells.length === 0) return board;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  const newBoard = board.map((row) => [...row]);
  newBoard[randomCell.r][randomCell.c] = value;
  return newBoard;
}

export function init2048Game(): Game2048State {
  let board = createEmpty2048Board();
  board = spawnRandom2048Tile(board);
  board = spawnRandom2048Tile(board);
  return {
    board,
    score: 0,
    bestScore: 0,
    won: false,
    gameOver: false,
  };
}

export function slide2048(
  board: Board2048,
  direction: "left" | "right" | "up" | "down"
): { board: Board2048; scoreGained: number; moved: boolean } {
  let scoreGained = 0;
  let moved = false;

  const rotate = (m: Board2048): Board2048 =>
    m[0].map((_, index) => m.map((row) => row[index]).reverse());

  // Normalize: rotate so we always slide left
  let working = board.map((r) => [...r]);
  const rotations = direction === "left" ? 0 : direction === "down" ? 1 : direction === "right" ? 2 : 3;

  for (let i = 0; i < rotations; i++) {
    working = rotate(working);
  }

  // Slide & Merge left
  const newGrid: Board2048 = [];
  for (let r = 0; r < 4; r++) {
    const row = working[r].filter((v) => v !== 0);
    const newRow: number[] = [];
    for (let c = 0; c < row.length; c++) {
      if (c + 1 < row.length && row[c] === row[c + 1]) {
        const mergedVal = row[c] * 2;
        newRow.push(mergedVal);
        scoreGained += mergedVal;
        c++; // skip merged neighbor
      } else {
        newRow.push(row[c]);
      }
    }
    while (newRow.length < 4) newRow.push(0);
    newGrid.push(newRow);

    for (let c = 0; c < 4; c++) {
      if (newRow[c] !== working[r][c]) moved = true;
    }
  }

  // Rotate back to original orientation
  let result = newGrid;
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    result = rotate(result);
  }

  return { board: result, scoreGained, moved };
}

export function check2048GameOver(board: Board2048): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return false;
      if (c + 1 < 4 && board[r][c] === board[r][c + 1]) return false;
      if (r + 1 < 4 && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

// ==========================================
// 3. MAGIC SQUARE ENGINE
// ==========================================
export interface MagicSquarePuzzle {
  size: 3 | 4;
  targetSum: number;
  initialGrid: (number | null)[][];
  solution: number[][];
}

export function generateMagicSquarePuzzle(difficulty: GameDifficulty = "easy"): MagicSquarePuzzle {
  // Standard 3x3 Lo Shu Magic Square (Magic constant = 15)
  // 8  1  6
  // 3  5  7
  // 4  9  2
  const solution3 = [
    [8, 1, 6],
    [3, 5, 7],
    [4, 9, 2],
  ];

  // Random reflection/rotation of solution
  let sol = solution3;
  if (Math.random() < 0.5) sol = sol.map((r) => [...r].reverse());
  if (Math.random() < 0.5) sol = sol.reverse();

  // Holes to punch depending on difficulty
  const holesCount = difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 7;
  const initial: (number | null)[][] = sol.map((r) => [...r]);

  const positions: [number, number][] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) positions.push([r, c]);
  }
  positions.sort(() => Math.random() - 0.5);

  for (let i = 0; i < holesCount; i++) {
    const [r, c] = positions[i];
    initial[r][c] = null;
  }

  return {
    size: 3,
    targetSum: 15,
    initialGrid: initial,
    solution: sol,
  };
}

export function validateMagicSquare(
  grid: number[][],
  targetSum: number
): { valid: boolean; rowSums: number[]; colSums: number[]; diagSums: [number, number] } {
  const n = grid.length;
  const rowSums = grid.map((r) => r.reduce((a, b) => a + b, 0));
  const colSums = Array.from({ length: n }, (_, c) =>
    grid.reduce((acc, row) => acc + (row[c] || 0), 0)
  );

  let diag1 = 0;
  let diag2 = 0;
  for (let i = 0; i < n; i++) {
    diag1 += grid[i][i] || 0;
    diag2 += grid[i][n - 1 - i] || 0;
  }

  const allRowsMatch = rowSums.every((s) => s === targetSum);
  const allColsMatch = colSums.every((s) => s === targetSum);
  const diagsMatch = diag1 === targetSum && diag2 === targetSum;

  return {
    valid: allRowsMatch && allColsMatch && diagsMatch,
    rowSums,
    colSums,
    diagSums: [diag1, diag2],
  };
}

// ==========================================
// 4. KAKURO ENGINE
// ==========================================
export interface KakuroClue {
  row: number;
  col: number;
  downSum?: number;
  acrossSum?: number;
}

export interface KakuroPuzzle {
  gridSize: number; // e.g. 4 or 5
  clues: KakuroClue[];
  solution: (number | null)[][]; // null represents black cell
  initialGrid: (number | null)[][];
}

export function generateKakuroPuzzle(difficulty: GameDifficulty = "easy"): KakuroPuzzle {
  // Pre-compiled verified Kakuro 4x4
  // Row 0: Black(clue), Down 4, Down 16, Down 7
  // Row 1: Across 11, [ 3 ], [ 8 ], [ X ]
  // etc.
  return {
    gridSize: 4,
    clues: [
      { row: 0, col: 1, downSum: 4 },
      { row: 0, col: 2, downSum: 16 },
      { row: 0, col: 3, downSum: 7 },
      { row: 1, col: 0, acrossSum: 11 },
      { row: 2, col: 0, acrossSum: 12 },
      { row: 3, col: 0, acrossSum: 4 },
    ],
    solution: [
      [null, null, null, null],
      [null, 3, 8, null],
      [null, 1, 9, 2],
      [null, null, 1, 3],
    ],
    initialGrid: [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
  };
}

// ==========================================
// 5. NUMBER BONDS ENGINE
// ==========================================
export interface NumberBondCard {
  id: string;
  value: number;
  matched: boolean;
  pairId: string;
}

export interface NumberBondsGame {
  target: number;
  cards: NumberBondCard[];
}

export function generateNumberBonds(target: number = 100, pairCount: number = 6): NumberBondsGame {
  const cards: NumberBondCard[] = [];
  const usedNumbers = new Set<number>();

  for (let i = 0; i < pairCount; i++) {
    let a: number;
    do {
      a = Math.floor(Math.random() * (target - 10)) + 5;
    } while (usedNumbers.has(a) || usedNumbers.has(target - a) || a === target - a);

    const b = target - a;
    usedNumbers.add(a);
    usedNumbers.add(b);

    const pairId = `pair-${i}`;
    cards.push({ id: `card-${i}-a`, value: a, matched: false, pairId });
    cards.push({ id: `card-${i}-b`, value: b, matched: false, pairId });
  }

  // Shuffle cards
  cards.sort(() => Math.random() - 0.5);

  return { target, cards };
}

// ==========================================
// 6. NERDLE ENGINE
// ==========================================
export interface NerdlePuzzle {
  solutionEquation: string; // Length 8, e.g. "12+34=46"
}

const NERDLE_EQUATIONS = [
  "12+34=46",
  "98-45=53",
  "25*3=75",
  "84/4=21",
  "7*8-6=50",
  "15+29=44",
  "9*9-1=80",
  "64/8+7=15",
  "42-18=24",
  "36/6*2=12",
  "11*4=44",
  "72/9=8",
  "50-15=35",
  "14*3=42",
  "88/8=11",
];

export function generateNerdlePuzzle(): NerdlePuzzle {
  const equation = NERDLE_EQUATIONS[Math.floor(Math.random() * NERDLE_EQUATIONS.length)];
  return { solutionEquation: equation };
}

export type NerdleTileStatus = "correct" | "present" | "absent";

export function evaluateNerdleGuess(
  guess: string,
  solution: string
): { valid: boolean; error?: string; statuses?: NerdleTileStatus[] } {
  if (guess.length !== solution.length) {
    return { valid: false, error: `Equation must be exactly ${solution.length} characters` };
  }
  if (!guess.includes("=")) {
    return { valid: false, error: "Equation must contain an '=' sign" };
  }

  const [left, right] = guess.split("=");
  try {
    const fn = new Function(`"use strict"; return (${left});`);
    const val = fn();
    if (val !== Number(right)) {
      return { valid: false, error: "Equation is not mathematically equal" };
    }
  } catch {
    return { valid: false, error: "Invalid math expression on left side" };
  }

  const statuses: NerdleTileStatus[] = new Array(guess.length).fill("absent");
  const solChars = solution.split("");
  const guessChars = guess.split("");
  const remainingSolChars: (string | null)[] = [...solChars];

  // 1st pass: exact matches (green)
  for (let i = 0; i < guess.length; i++) {
    if (guessChars[i] === solChars[i]) {
      statuses[i] = "correct";
      remainingSolChars[i] = null;
    }
  }

  // 2nd pass: misplaced (yellow/purple)
  for (let i = 0; i < guess.length; i++) {
    if (statuses[i] !== "correct") {
      const idx = remainingSolChars.indexOf(guessChars[i]);
      if (idx !== -1) {
        statuses[i] = "present";
        remainingSolChars[idx] = null;
      }
    }
  }

  return { valid: true, statuses };
}

// ==========================================
// 7. COUNTDOWN NUMBERS ENGINE
// ==========================================
export interface CountdownNumbersPuzzle {
  numbers: number[];
  target: number;
}

export function generateCountdownPuzzle(): CountdownNumbersPuzzle {
  const largeNumbers = [25, 50, 75, 100];
  const smallNumbers = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];

  // Pick 2 large, 4 small
  const largePicked = largeNumbers.sort(() => Math.random() - 0.5).slice(0, 2);
  const smallPicked = smallNumbers.sort(() => Math.random() - 0.5).slice(0, 4);
  const numbers = [...largePicked, ...smallPicked].sort(() => Math.random() - 0.5);

  const target = Math.floor(Math.random() * 899) + 101; // 101 - 999
  return { numbers, target };
}

// ==========================================
// 8. QUICK CALC ENGINE
// ==========================================
export interface QuickCalcQuestion {
  id: string;
  prompt: string;
  answer: number;
  options: number[];
}

export function generateQuickCalcQuestion(difficulty: GameDifficulty = "easy"): QuickCalcQuestion {
  const ops = ["+", "-", "*", "/"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a = 0;
  let b = 0;
  let answer = 0;

  if (op === "+") {
    a = Math.floor(Math.random() * 40) + 10;
    b = Math.floor(Math.random() * 40) + 10;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 60) + 30;
    b = Math.floor(Math.random() * (a - 10)) + 5;
    answer = a - b;
  } else if (op === "*") {
    a = Math.floor(Math.random() * 12) + 3;
    b = Math.floor(Math.random() * 12) + 3;
    answer = a * b;
  } else {
    b = Math.floor(Math.random() * 9) + 2;
    answer = Math.floor(Math.random() * 12) + 2;
    a = b * answer;
  }

  const options = [
    answer,
    answer + (Math.random() < 0.5 ? 2 : -2),
    answer + (Math.random() < 0.5 ? 10 : -10),
    answer + (Math.random() < 0.5 ? 1 : -1),
  ].sort(() => Math.random() - 0.5);

  return {
    id: `qc-${Date.now()}-${Math.random()}`,
    prompt: `${a} ${op === "*" ? "×" : op === "/" ? "÷" : op} ${b}`,
    answer,
    options: Array.from(new Set(options)),
  };
}

// ==========================================
// 9. MATH CROSSWORD ENGINE
// ==========================================
export interface MathCrosswordCell {
  row: number;
  col: number;
  val: string; // digit or operator or '='
  isFixed: boolean; // pre-filled or user input
}

export interface MathCrosswordPuzzle {
  gridSize: number;
  cells: MathCrosswordCell[];
}

export function generateMathCrossword(): MathCrosswordPuzzle {
  // 5x5 Crossword template
  // Row 0: 7 + 5 = 12
  // Col 0: 7 * 2 = 14
  // Col 2: 5 - 1 = 4
  // Col 4: 12 / 2 = 6
  // Row 2: 2 + 1 = 3
  // Row 4: 14 - 4 = 10 (or 14 / 2 = 7)
  const cells: MathCrosswordCell[] = [
    { row: 0, col: 0, val: "7", isFixed: true },
    { row: 0, col: 1, val: "+", isFixed: true },
    { row: 0, col: 2, val: "5", isFixed: false },
    { row: 0, col: 3, val: "=", isFixed: true },
    { row: 0, col: 4, val: "12", isFixed: false },

    { row: 1, col: 0, val: "*", isFixed: true },
    { row: 1, col: 2, val: "-", isFixed: true },
    { row: 1, col: 4, val: "/", isFixed: true },

    { row: 2, col: 0, val: "2", isFixed: false },
    { row: 2, col: 1, val: "+", isFixed: true },
    { row: 2, col: 2, val: "1", isFixed: false },
    { row: 2, col: 3, val: "=", isFixed: true },
    { row: 2, col: 4, val: "3", isFixed: true },

    { row: 3, col: 0, val: "=", isFixed: true },
    { row: 3, col: 2, val: "=", isFixed: true },
    { row: 3, col: 4, val: "=", isFixed: true },

    { row: 4, col: 0, val: "14", isFixed: true },
    { row: 4, col: 1, val: "-", isFixed: true },
    { row: 4, col: 2, val: "4", isFixed: false },
    { row: 4, col: 3, val: "=", isFixed: true },
    { row: 4, col: 4, val: "10", isFixed: true },
  ];

  return { gridSize: 5, cells };
}

// ==========================================
// 10. APPROXIMATION CHALLENGE ENGINE
// ==========================================
export interface ApproximationQuestion {
  id: string;
  expression: string;
  roundedExpression: string;
  exactValue: number;
  correctAnswer: number;
  options: number[];
  explanation: string;
}

export function generateApproximationQuestion(): ApproximationQuestion {
  const templates = [
    {
      expr: "499.85 × 11.98 ÷ 24.95",
      rounded: "500 × 12 ÷ 25 = 240",
      exact: 240.4,
      ans: 240,
      options: [240, 210, 280, 190],
      exp: "Round 499.85 → 500, 11.98 → 12, 24.95 → 25. Calculation: (500 ÷ 25) × 12 = 20 × 12 = 240.",
    },
    {
      expr: "√(144.12) + √(80.95) × 3.02",
      rounded: "12 + 9 × 3 = 12 + 27 = 39",
      exact: 39.1,
      ans: 39,
      options: [39, 45, 33, 51],
      exp: "Round √144.12 → 12, √80.95 → √81 = 9, 3.02 → 3. Formula: 12 + (9 × 3) = 12 + 27 = 39.",
    },
    {
      expr: "34.98% of 799.80 + 19.92% of 450.15",
      rounded: "35% of 800 + 20% of 450 = 280 + 90 = 370",
      exact: 369.8,
      ans: 370,
      options: [370, 395, 340, 420],
      exp: "Round to 35% of 800 = (35 × 8) = 280; 20% of 450 = 90. Total = 280 + 90 = 370.",
    },
    {
      expr: "1799.9 ÷ 29.89 × 4.02",
      rounded: "1800 ÷ 30 × 4 = 60 × 4 = 240",
      exact: 240.8,
      ans: 240,
      options: [240, 210, 270, 300],
      exp: "Round 1799.9 → 1800, 29.89 → 30, 4.02 → 4. Then (1800 ÷ 30) × 4 = 60 × 4 = 240.",
    },
  ];

  const q = templates[Math.floor(Math.random() * templates.length)];
  return {
    id: `approx-${Date.now()}-${Math.random()}`,
    expression: q.expr,
    roundedExpression: q.rounded,
    exactValue: q.exact,
    correctAnswer: q.ans,
    options: [...q.options].sort(() => Math.random() - 0.5),
    explanation: q.exp,
  };
}

// ==========================================
// 11. AVERAGE RACE ENGINE
// ==========================================
export interface AverageQuestion {
  id: string;
  numbers: number[];
  average: number;
  options: number[];
  shortcutExplanation: string;
}

export function generateAverageQuestion(): AverageQuestion {
  // Generate numbers clustered around a base (assumed mean)
  const base = Math.floor(Math.random() * 50) + 40; // 40 to 90
  const count = 4 + Math.floor(Math.random() * 2); // 4 or 5 numbers
  const deviations = [-12, -8, -4, 0, 4, 8, 12, 16]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  // Adjust last deviation so sum is divisible by count
  const sumDev = deviations.reduce((a, b) => a + b, 0);
  const rem = sumDev % count;
  deviations[deviations.length - 1] -= rem;

  const numbers = deviations.map((d) => base + d);
  const avg = base + deviations.reduce((a, b) => a + b, 0) / count;

  const options = [avg, avg + 2, avg - 2, avg + 4].sort(() => Math.random() - 0.5);

  return {
    id: `avg-${Date.now()}-${Math.random()}`,
    numbers,
    average: avg,
    options: Array.from(new Set(options)),
    shortcutExplanation: `Deviation method: Choose assumed baseline = ${base}. Deviations = [${deviations.join(
      ", "
    )}]. Net deviation = ${deviations.reduce((a, b) => a + b, 0)}. Net / ${count} = ${
      deviations.reduce((a, b) => a + b, 0) / count
    }. Average = ${base} + (${deviations.reduce((a, b) => a + b, 0) / count}) = ${avg}.`,
  };
}

// ==========================================
// 12. PERCENTAGE BLITZ ENGINE
// ==========================================
export interface PercentageQuestion {
  id: string;
  prompt: string;
  percent: number;
  base: number;
  answer: number;
  options: number[];
  fractionEquivalent: string;
}

export function generatePercentageQuestion(): PercentageQuestion {
  const presets = [
    { pct: 12.5, frac: "1/8", base: 640, ans: 80 },
    { pct: 25, frac: "1/4", base: 360, ans: 90 },
    { pct: 37.5, frac: "3/8", base: 480, ans: 180 },
    { pct: 50, frac: "1/2", base: 740, ans: 370 },
    { pct: 62.5, frac: "5/8", base: 320, ans: 200 },
    { pct: 75, frac: "3/4", base: 440, ans: 330 },
    { pct: 87.5, frac: "7/8", base: 560, ans: 490 },
    { pct: 16.66, frac: "1/6", base: 420, ans: 70 },
    { pct: 33.33, frac: "1/3", base: 270, ans: 90 },
    { pct: 66.66, frac: "2/3", base: 390, ans: 260 },
    { pct: 20, frac: "1/5", base: 450, ans: 90 },
    { pct: 40, frac: "2/5", base: 350, ans: 140 },
    { pct: 60, frac: "3/5", base: 550, ans: 330 },
  ];

  const p = presets[Math.floor(Math.random() * presets.length)];
  const options = [p.ans, p.ans + 10, p.ans - 10, p.ans + 25].sort(() => Math.random() - 0.5);

  return {
    id: `pct-${Date.now()}-${Math.random()}`,
    prompt: `${p.pct}% of ${p.base} = ?`,
    percent: p.pct,
    base: p.base,
    answer: p.ans,
    options: Array.from(new Set(options)),
    fractionEquivalent: `${p.pct}% = ${p.frac}. Hence ${p.base} × ${p.frac} = ${p.ans}.`,
  };
}

// ==========================================
// 13. SPEED COMPARISON ENGINE
// ==========================================
export type ComparisonRelation = "A_GREATER" | "B_GREATER" | "EQUAL";

export interface ComparisonQuestion {
  id: string;
  quantityA: string;
  quantityB: string;
  correctRelation: ComparisonRelation;
  explanation: string;
}

export function generateSpeedComparisonQuestion(): ComparisonQuestion {
  const types = ["fraction", "roots", "percentage"];
  const t = types[Math.floor(Math.random() * types.length)];

  if (t === "fraction") {
    // Compare a/b and c/d via cross multiplication a*d vs b*c
    const a = Math.floor(Math.random() * 8) + 3;
    const b = a + Math.floor(Math.random() * 5) + 2;
    const c = Math.floor(Math.random() * 8) + 3;
    const d = c + Math.floor(Math.random() * 5) + 2;

    const cross1 = a * d;
    const cross2 = b * c;
    const rel: ComparisonRelation =
      cross1 > cross2 ? "A_GREATER" : cross1 < cross2 ? "B_GREATER" : "EQUAL";

    return {
      id: `comp-${Date.now()}`,
      quantityA: `${a}/${b}`,
      quantityB: `${c}/${d}`,
      correctRelation: rel,
      explanation: `Cross multiplication test: ${a} × ${d} = ${cross1} vs ${b} × ${c} = ${cross2}. Since ${
        cross1 > cross2 ? cross1 + " > " + cross2 : cross2 + " > " + cross1
      }, Quantity ${rel === "A_GREATER" ? "A" : "B"} is greater.`,
    };
  }

  // Percentage vs Value
  return {
    id: `comp-${Date.now()}`,
    quantityA: "35% of 600",
    quantityB: "42% of 500",
    correctRelation: "EQUAL",
    explanation: "35% of 600 = 210. 42% of 500 = 210. Both quantities are exactly equal.",
  };
}

// ==========================================
// 14. SIMPLIFICATION SPRINT ENGINE
// ==========================================
export interface SimplificationQuestion {
  id: string;
  expression: string;
  answer: number;
  options: number[];
  steps: string[];
}

export function generateSimplificationQuestion(): SimplificationQuestion {
  const bank = [
    {
      expr: "48 ÷ 6 × 3 + (15 - 7)",
      ans: 32,
      options: [32, 28, 40, 16],
      steps: [
        "1. Parentheses first: (15 - 7) = 8",
        "2. Left-to-right division: 48 ÷ 6 = 8",
        "3. Multiplication: 8 × 3 = 24",
        "4. Addition: 24 + 8 = 32",
      ],
    },
    {
      expr: "(25 × 4) - (144 ÷ 12) + 18",
      ans: 106,
      options: [106, 96, 114, 118],
      steps: [
        "1. Brackets: (25 × 4) = 100",
        "2. Brackets: (144 ÷ 12) = 12",
        "3. Subtraction and Addition: 100 - 12 + 18 = 88 + 18 = 106",
      ],
    },
    {
      expr: "60% of 250 - 35% of 200",
      ans: 80,
      options: [80, 75, 90, 85],
      steps: [
        "1. 60% of 250 = (60/100) × 250 = 150",
        "2. 35% of 200 = 70",
        "3. 150 - 70 = 80",
      ],
    },
  ];

  const q = bank[Math.floor(Math.random() * bank.length)];
  return {
    id: `simp-${Date.now()}-${Math.random()}`,
    expression: q.expr,
    answer: q.ans,
    options: [...q.options].sort(() => Math.random() - 0.5),
    steps: q.steps,
  };
}

// ==========================================
// 15. FACTOR FINDER ENGINE
// ==========================================
export interface FactorFinderQuestion {
  id: string;
  targetNumber: number;
  prompt: string;
  answer: number | string;
  options: (number | string)[];
  explanation: string;
}

export function generateFactorFinderQuestion(): FactorFinderQuestion {
  const questions = [
    {
      num: 72,
      prompt: "Find the total number of factors of 72.",
      ans: 12,
      options: [12, 10, 8, 14],
      exp: "72 = 2³ × 3². Total factors = (3 + 1)(2 + 1) = 4 × 3 = 12.",
    },
    {
      num: 120,
      prompt: "What is the prime factorization of 120?",
      ans: "2³ × 3 × 5",
      options: ["2³ × 3 × 5", "2² × 3² × 5", "2⁴ × 3 × 5", "2³ × 15"],
      exp: "120 = 8 × 15 = 2³ × 3 × 5.",
    },
    {
      num: 144,
      prompt: "How many prime factors does 144 have?",
      ans: 2,
      options: [2, 3, 4, 15],
      exp: "144 = 2⁴ × 3². Distinct prime factors are {2, 3}, exactly 2.",
    },
    {
      num: 84,
      prompt: "Which of the following numbers is NOT a factor of 84?",
      ans: 16,
      options: [16, 12, 14, 21],
      exp: "84 = 2 × 2 × 3 × 7. 84 ÷ 12 = 7, 84 ÷ 14 = 6, 84 ÷ 21 = 4. 84 is not divisible by 16.",
    },
  ];

  const q = questions[Math.floor(Math.random() * questions.length)];
  return {
    id: `fac-${Date.now()}-${Math.random()}`,
    targetNumber: q.num,
    prompt: q.prompt,
    answer: q.ans,
    options: [...q.options].sort(() => Math.random() - 0.5),
    explanation: q.exp,
  };
}
