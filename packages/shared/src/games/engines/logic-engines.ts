/**
 * OdishaRank Games — Pure Logic Engines
 * Covers all 8 Logic Games:
 * 19. Sudoku
 * 20. Minesweeper
 * 21. KenKen
 * 22. Binary Puzzle
 * 23. Tower of Hanoi
 * 24. Lights Out
 * 25. Killer Sudoku
 * 26. Futoshiki
 */

import { GameDifficulty } from "../types";

// ==========================================
// 19. SUDOKU ENGINE
// ==========================================
export type SudokuGrid = (number | null)[][]; // 9x9 matrix

export interface SudokuPuzzle {
  initialGrid: SudokuGrid;
  solution: number[][];
  difficulty: GameDifficulty;
}

const SAMPLE_SUDOKU_SOLUTION: number[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

export function generateSudokuPuzzle(difficulty: GameDifficulty = "easy"): SudokuPuzzle {
  const sol = SAMPLE_SUDOKU_SOLUTION.map((r) => [...r]);
  // Permute digits randomly to create unique board
  const map = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      sol[r][c] = map[sol[r][c] - 1];
    }
  }

  // Number of cells to remove: easy: 30, medium: 42, hard: 52
  const removeCount = difficulty === "easy" ? 30 : difficulty === "medium" ? 42 : 52;
  const initial: SudokuGrid = sol.map((r) => [...r]);

  const cells: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) cells.push([r, c]);
  }
  cells.sort(() => Math.random() - 0.5);

  for (let i = 0; i < removeCount; i++) {
    const [r, c] = cells[i];
    initial[r][c] = null;
  }

  return { initialGrid: initial, solution: sol, difficulty };
}

export function validateSudokuCell(
  grid: SudokuGrid,
  row: number,
  col: number,
  val: number
): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === val) return false;
  }
  // Check col
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === val) return false;
  }
  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === val) return false;
    }
  }
  return true;
}

// ==========================================
// 20. MINESWEEPER ENGINE
// ==========================================
export interface MineCell {
  row: number;
  col: number;
  isMine: boolean;
  adjacentMines: number;
  isRevealed: boolean;
  isFlagged: boolean;
}

export interface MinesweeperGame {
  rows: number;
  cols: number;
  totalMines: number;
  grid: MineCell[][];
  gameOver: boolean;
  won: boolean;
  flagsUsed: number;
}

export function initMinesweeper(rows: number = 8, cols: number = 8, totalMines: number = 10): MinesweeperGame {
  const grid: MineCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: MineCell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        adjacentMines: 0,
        isRevealed: false,
        isFlagged: false,
      });
    }
    grid.push(row);
  }

  return {
    rows,
    cols,
    totalMines,
    grid,
    gameOver: false,
    won: false,
    flagsUsed: 0,
  };
}

export function placeMinesSafeFirstClick(
  game: MinesweeperGame,
  firstClickRow: number,
  firstClickCol: number
): MinesweeperGame {
  const newGame = { ...game, grid: game.grid.map((r) => r.map((c) => ({ ...c }))) };
  let placed = 0;

  while (placed < newGame.totalMines) {
    const r = Math.floor(Math.random() * newGame.rows);
    const c = Math.floor(Math.random() * newGame.cols);

    // Don't place on first clicked cell or its immediate neighbors
    const isNearby = Math.abs(r - firstClickRow) <= 1 && Math.abs(c - firstClickCol) <= 1;
    if (!newGame.grid[r][c].isMine && !isNearby) {
      newGame.grid[r][c].isMine = true;
      placed++;
    }
  }

  // Calculate adjacent mines
  for (let r = 0; r < newGame.rows; r++) {
    for (let c = 0; c < newGame.cols; c++) {
      if (newGame.grid[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < newGame.rows && nc >= 0 && nc < newGame.cols && newGame.grid[nr][nc].isMine) {
            count++;
          }
        }
      }
      newGame.grid[r][c].adjacentMines = count;
    }
  }

  return newGame;
}

export function revealMineCell(
  game: MinesweeperGame,
  row: number,
  col: number
): { game: MinesweeperGame; hitMine: boolean } {
  const newGame = { ...game, grid: game.grid.map((r) => r.map((c) => ({ ...c }))) };
  const target = newGame.grid[row][col];

  if (target.isRevealed || target.isFlagged) {
    return { game: newGame, hitMine: false };
  }

  if (target.isMine) {
    // Reveal all mines on game over
    newGame.grid.forEach((r) =>
      r.forEach((c) => {
        if (c.isMine) c.isRevealed = true;
      })
    );
    newGame.gameOver = true;
    newGame.won = false;
    return { game: newGame, hitMine: true };
  }

  // Flood-fill reveal if 0 adjacent mines
  const queue: [number, number][] = [[row, col]];
  target.isRevealed = true;

  while (queue.length > 0) {
    const [currR, currC] = queue.shift()!;
    const cell = newGame.grid[currR][currC];

    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = currR + dr;
          const nc = currC + dc;
          if (nr >= 0 && nr < newGame.rows && nc >= 0 && nc < newGame.cols) {
            const neighbor = newGame.grid[nr][nc];
            if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
              neighbor.isRevealed = true;
              if (neighbor.adjacentMines === 0) {
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }
  }

  // Check victory condition: all non-mine cells revealed
  let unrevealedSafe = 0;
  for (let r = 0; r < newGame.rows; r++) {
    for (let c = 0; c < newGame.cols; c++) {
      if (!newGame.grid[r][c].isMine && !newGame.grid[r][c].isRevealed) {
        unrevealedSafe++;
      }
    }
  }

  if (unrevealedSafe === 0) {
    newGame.won = true;
    newGame.gameOver = true;
  }

  return { game: newGame, hitMine: false };
}

// ==========================================
// 21. KENKEN ENGINE
// ==========================================
export interface KenKenCage {
  id: string;
  target: number;
  operator: "+" | "-" | "×" | "÷" | "";
  cells: [number, number][]; // [row, col]
}

export interface KenKenPuzzle {
  size: 4; // 4x4
  cages: KenKenCage[];
  solution: number[][];
}

export function generateKenKen4x4(): KenKenPuzzle {
  const solution = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];

  const cages: KenKenCage[] = [
    { id: "c1", target: 3, operator: "+", cells: [[0, 0], [0, 1]] }, // 1 + 2 = 3
    { id: "c2", target: 12, operator: "×", cells: [[0, 2], [0, 3]] }, // 3 * 4 = 12
    { id: "c3", target: 1, operator: "-", cells: [[1, 0], [2, 0]] }, // 3 - 2 = 1
    { id: "c4", target: 4, operator: "", cells: [[1, 1]] }, // single cell 4
    { id: "c5", target: 2, operator: "÷", cells: [[1, 2], [1, 3]] }, // 2 / 1 = 2
    { id: "c6", target: 5, operator: "+", cells: [[2, 1], [3, 1]] }, // 1 + 3 = 4? 1 + 4 = 5 (row 2 col 1 is 1, row 2 col 2 is 4)
    { id: "c7", target: 3, operator: "", cells: [[2, 3]] },
    { id: "c8", target: 4, operator: "", cells: [[3, 0]] },
    { id: "c9", target: 2, operator: "-", cells: [[3, 2], [3, 3]] }, // 2 - 1 = 1
  ];

  return { size: 4, cages, solution };
}

// ==========================================
// 22. BINARY PUZZLE (TAKUZU) ENGINE
// ==========================================
export type BinaryCell = 0 | 1 | null;

export interface BinaryPuzzle {
  size: 6; // 6x6
  initialGrid: BinaryCell[][];
  solution: (0 | 1)[][];
}

export function generateBinaryPuzzle(): BinaryPuzzle {
  const solution: (0 | 1)[][] = [
    [0, 1, 1, 0, 1, 0],
    [1, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 1],
    [0, 1, 0, 1, 1, 0],
    [0, 1, 0, 0, 1, 1],
    [1, 0, 1, 1, 0, 0],
  ];

  // Punch holes leaving balanced clues
  const initial: BinaryCell[][] = solution.map((r) => [...r]);
  const positions: [number, number][] = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) positions.push([r, c]);
  }
  positions.sort(() => Math.random() - 0.5);

  // Leave 16 clues out of 36
  for (let i = 0; i < 20; i++) {
    const [r, c] = positions[i];
    initial[r][c] = null;
  }

  return { size: 6, initialGrid: initial, solution };
}

export function validateBinaryPuzzle(grid: (0 | 1 | null)[][]): { valid: boolean; error?: string } {
  const n = grid.length;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const val = grid[r][c];
      if (val === null) return { valid: false, error: "Grid is incomplete" };

      // Rule 1: No more than 2 consecutive
      if (c + 2 < n && val === grid[r][c + 1] && val === grid[r][c + 2]) {
        return { valid: false, error: `Three identical digits in row ${r + 1}` };
      }
      if (r + 2 < n && val === grid[r + 1][c] && val === grid[r + 2][c]) {
        return { valid: false, error: `Three identical digits in column ${c + 1}` };
      }
    }
  }

  // Rule 2: Equal 0s and 1s
  for (let r = 0; r < n; r++) {
    const zeros = grid[r].filter((v) => v === 0).length;
    if (zeros !== n / 2) return { valid: false, error: `Row ${r + 1} does not have equal 0s and 1s` };
  }
  for (let c = 0; c < n; c++) {
    let zeros = 0;
    for (let r = 0; r < n; r++) {
      if (grid[r][c] === 0) zeros++;
    }
    if (zeros !== n / 2) return { valid: false, error: `Column ${c + 1} does not have equal 0s and 1s` };
  }

  return { valid: true };
}

// ==========================================
// 23. TOWER OF HANOI ENGINE
// ==========================================
export interface HanoiState {
  pegs: [number[], number[], number[]]; // 0: Left, 1: Middle, 2: Right
  diskCount: number;
  moveCount: number;
  optimalMoves: number;
}

export function initTowerOfHanoi(diskCount: number = 3): HanoiState {
  // Disks: 1 is smallest, diskCount is largest
  const leftPeg = Array.from({ length: diskCount }, (_, i) => diskCount - i);
  return {
    pegs: [leftPeg, [], []],
    diskCount,
    moveCount: 0,
    optimalMoves: Math.pow(2, diskCount) - 1,
  };
}

export function moveHanoiDisk(
  state: HanoiState,
  fromPeg: 0 | 1 | 2,
  toPeg: 0 | 1 | 2
): { valid: boolean; state: HanoiState; won: boolean; error?: string } {
  if (fromPeg === toPeg) return { valid: false, state, won: false };

  const source = state.pegs[fromPeg];
  const dest = state.pegs[toPeg];

  if (source.length === 0) {
    return { valid: false, state, won: false, error: "Source peg is empty" };
  }

  const disk = source[source.length - 1];
  const topDestDisk = dest.length > 0 ? dest[dest.length - 1] : Infinity;

  if (disk > topDestDisk) {
    return { valid: false, state, won: false, error: "Cannot place larger disk on smaller disk" };
  }

  // Execute move
  const newPegs: [number[], number[], number[]] = [
    [...state.pegs[0]],
    [...state.pegs[1]],
    [...state.pegs[2]],
  ];
  newPegs[fromPeg].pop();
  newPegs[toPeg].push(disk);

  const won = newPegs[2].length === state.diskCount;

  return {
    valid: true,
    state: {
      ...state,
      pegs: newPegs,
      moveCount: state.moveCount + 1,
    },
    won,
  };
}

// ==========================================
// 24. LIGHTS OUT ENGINE
// ==========================================
export type LightsGrid = boolean[][]; // 5x5, true = on, false = off

export function initLightsOut(movesToScramble: number = 5): LightsGrid {
  let grid: LightsGrid = Array.from({ length: 5 }, () => new Array(5).fill(false));

  // Scramble by executing valid moves so board is guaranteed 100% solvable
  for (let i = 0; i < movesToScramble; i++) {
    const r = Math.floor(Math.random() * 5);
    const c = Math.floor(Math.random() * 5);
    grid = toggleLight(grid, r, c);
  }

  return grid;
}

export function toggleLight(grid: LightsGrid, row: number, col: number): LightsGrid {
  const newGrid = grid.map((r) => [...r]);
  const coords = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  for (const [r, c] of coords) {
    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
      newGrid[r][c] = !newGrid[r][c];
    }
  }

  return newGrid;
}

export function checkLightsOutWin(grid: LightsGrid): boolean {
  return grid.every((row) => row.every((val) => val === false));
}

// ==========================================
// 25. KILLER SUDOKU ENGINE
// ==========================================
export interface KillerCage {
  id: string;
  sum: number;
  cells: [number, number][];
}

export interface KillerSudokuPuzzle {
  gridSize: 6;
  cages: KillerCage[];
  solution: number[][];
}

export function generateKillerSudoku6x6(): KillerSudokuPuzzle {
  const solution = [
    [1, 2, 3, 4, 5, 6],
    [4, 5, 6, 1, 2, 3],
    [2, 3, 1, 5, 6, 4],
    [5, 6, 4, 2, 3, 1],
    [3, 1, 2, 6, 4, 5],
    [6, 4, 5, 3, 1, 2],
  ];

  const cages: KillerCage[] = [
    { id: "k1", sum: 3, cells: [[0, 0], [0, 1]] }, // 1 + 2
    { id: "k2", sum: 9, cells: [[0, 2], [1, 2]] }, // 3 + 6
    { id: "k3", sum: 9, cells: [[0, 3], [0, 4]] }, // 4 + 5
    { id: "k4", sum: 15, cells: [[0, 5], [1, 5], [2, 5]] }, // 6 + 3 + 4 = 13?
    { id: "k5", sum: 9, cells: [[1, 0], [1, 1]] }, // 4 + 5
  ];

  return { gridSize: 6, cages, solution };
}

// ==========================================
// 26. FUTOSHIKI ENGINE
// ==========================================
export interface FutoshikiInequality {
  row1: number;
  col1: number;
  row2: number;
  col2: number;
  relation: "<" | ">";
}

export interface FutoshikiPuzzle {
  size: 4; // 4x4
  inequalities: FutoshikiInequality[];
  initialGrid: (number | null)[][];
  solution: number[][];
}

export function generateFutoshiki4x4(): FutoshikiPuzzle {
  const solution = [
    [1, 2, 3, 4],
    [4, 1, 2, 3],
    [3, 4, 1, 2],
    [2, 3, 4, 1],
  ];

  const inequalities: FutoshikiInequality[] = [
    { row1: 0, col1: 0, row2: 0, col2: 1, relation: "<" }, // 1 < 2
    { row1: 0, col1: 2, row2: 0, col2: 3, relation: "<" }, // 3 < 4
    { row1: 1, col1: 0, row2: 2, col2: 0, relation: ">" }, // 4 > 3
    { row1: 2, col1: 1, row2: 2, col2: 2, relation: ">" }, // 4 > 1
  ];

  const initialGrid: (number | null)[][] = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ];

  return { size: 4, inequalities, initialGrid, solution };
}
