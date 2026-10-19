/**
 * OdishaRank Games — Pure Memory Engines
 * Covers all 3 Memory Games:
 * 16. Memory Matrix
 * 17. Symbol Match
 * 18. Sequence Master
 */

import { GameDifficulty } from "../types";

// ==========================================
// 16. MEMORY MATRIX ENGINE
// ==========================================
export interface MemoryMatrixLevel {
  gridSize: number; // e.g. 3 (3x3), 4 (4x4), 5 (5x5)
  highlightedIndices: number[]; // Flattened indices of active tiles
  displayDurationMs: number;
}

export function generateMemoryMatrixLevel(level: number): MemoryMatrixLevel {
  // Level 1-2: 3x3, 3-4 tiles
  // Level 3-5: 4x4, 4-6 tiles
  // Level 6+: 5x5, 6-9 tiles
  let gridSize = 3;
  let tileCount = 3;

  if (level <= 2) {
    gridSize = 3;
    tileCount = 2 + level; // 3, 4
  } else if (level <= 5) {
    gridSize = 4;
    tileCount = level + 1; // 4, 5, 6
  } else {
    gridSize = 5;
    tileCount = Math.min(10, 5 + Math.floor(level / 2)); // 7, 8, 9, 10
  }

  const totalCells = gridSize * gridSize;
  const indices: number[] = [];
  while (indices.length < tileCount) {
    const idx = Math.floor(Math.random() * totalCells);
    if (!indices.includes(idx)) indices.push(idx);
  }

  return {
    gridSize,
    highlightedIndices: indices.sort((a, b) => a - b),
    displayDurationMs: Math.max(1200, 2500 - level * 100),
  };
}

// ==========================================
// 17. SYMBOL MATCH ENGINE
// ==========================================
export interface SymbolCard {
  id: string;
  symbol: string;
  name: string;
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MATH_SYMBOLS = [
  { symbol: "π", name: "Pi" },
  { symbol: "Σ", name: "Summation" },
  { symbol: "∫", name: "Integral" },
  { symbol: "√", name: "Square Root" },
  { symbol: "∞", name: "Infinity" },
  { symbol: "Δ", name: "Delta" },
  { symbol: "θ", name: "Theta" },
  { symbol: "≈", name: "Approximate" },
  { symbol: "λ", name: "Lambda" },
  { symbol: "Ω", name: "Omega" },
  { symbol: "≠", name: "Not Equal" },
  { symbol: "±", name: "Plus Minus" },
];

export function generateSymbolMatchGame(pairCount: number = 8): SymbolCard[] {
  const chosen = [...MATH_SYMBOLS].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const cards: SymbolCard[] = [];

  chosen.forEach((item, index) => {
    const pairId = `pair-${index}`;
    cards.push({
      id: `card-${index}-a`,
      symbol: item.symbol,
      name: item.name,
      pairId,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: `card-${index}-b`,
      symbol: item.symbol,
      name: item.name,
      pairId,
      isFlipped: false,
      isMatched: false,
    });
  });

  return cards.sort(() => Math.random() - 0.5);
}

// ==========================================
// 18. SEQUENCE MASTER ENGINE
// ==========================================
export type SequenceColor = "blue" | "emerald" | "amber" | "rose";

export const SEQUENCE_COLORS: { color: SequenceColor; hex: string; bgClass: string }[] = [
  { color: "blue", hex: "#2563eb", bgClass: "bg-blue-600" },
  { color: "emerald", hex: "#059669", bgClass: "bg-emerald-600" },
  { color: "amber", hex: "#d97706", bgClass: "bg-amber-500" },
  { color: "rose", hex: "#e11d48", bgClass: "bg-rose-600" },
];

export function appendSequenceStep(currentSequence: SequenceColor[]): SequenceColor[] {
  const choices: SequenceColor[] = ["blue", "emerald", "amber", "rose"];
  const nextColor = choices[Math.floor(Math.random() * choices.length)];
  return [...currentSequence, nextColor];
}

export function validateSequenceInput(
  playerInput: SequenceColor[],
  masterSequence: SequenceColor[]
): { isCorrectSoFar: boolean; isRoundComplete: boolean } {
  for (let i = 0; i < playerInput.length; i++) {
    if (playerInput[i] !== masterSequence[i]) {
      return { isCorrectSoFar: false, isRoundComplete: false };
    }
  }

  return {
    isCorrectSoFar: true,
    isRoundComplete: playerInput.length === masterSequence.length,
  };
}
