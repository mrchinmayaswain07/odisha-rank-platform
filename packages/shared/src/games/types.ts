/**
 * OdishaRank Games & Brain Training Engine — Type Definitions
 * Shared across Next.js Web Portal and Expo React Native Mobile App
 */

export type GameCategory = "math" | "memory" | "logic" | "pattern";

export type GameAccess = "free" | "premium";

export type GameDifficulty = "easy" | "medium" | "hard";

export type GameId =
  // Math Games (15)
  | "game-24"
  | "game-2048"
  | "magic-square"
  | "kakuro"
  | "number-bonds"
  | "nerdle"
  | "countdown-numbers"
  | "quick-calc"
  | "math-crossword"
  | "approximation"
  | "average-race"
  | "percentage-blitz"
  | "speed-comparison"
  | "simplification-sprint"
  | "factor-finder"
  // Memory Games (3)
  | "memory-matrix"
  | "symbol-match"
  | "sequence-master"
  // Logic Games (8)
  | "sudoku"
  | "minesweeper"
  | "kenken"
  | "binary-puzzle"
  | "tower-of-hanoi"
  | "lights-out"
  | "killer-sudoku"
  | "futoshiki"
  // Pattern and Reasoning Games (6)
  | "numberle"
  | "nonogram"
  | "cryptarithm"
  | "number-sequence"
  | "odd-one-out"
  | "missing-operator";

export interface GameMetadata {
  id: GameId;
  title: string;
  category: GameCategory;
  access: GameAccess;
  shortDescription: string;
  fullDescription: string;
  instructions: string[];
  rules: string[];
  examRelevance: string; // How this sharpens OSSC/OSSSC/OPSC competitive test readiness
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultDifficulty: GameDifficulty;
  hasTimer: boolean;
  timeLimitSeconds?: number;
  featured?: boolean;
}

export type GameStatus = "idle" | "playing" | "paused" | "won" | "lost";

export interface GameSessionResult {
  gameId: GameId;
  category: GameCategory;
  difficulty: GameDifficulty;
  score: number;
  timeSeconds: number;
  moves: number;
  accuracy: number; // 0 - 100 percentage
  won: boolean;
  completedAt: string;
  explanation?: string;
  personalRecord?: boolean;
}

export interface StudentGameStats {
  gameId: GameId;
  playedCount: number;
  wonCount: number;
  bestScore: number;
  bestTimeSeconds: number;
  lastPlayedAt: string;
}

export interface StudentGameProfile {
  userId: string;
  totalGamesPlayed: number;
  totalWins: number;
  totalTimeSeconds: number;
  currentStreakDays: number;
  bestStreakDays: number;
  lastActiveDate: string;
  brainScore: number; // Aggregate brain training rating (out of 1000)
  categoryProficiency: {
    math: number; // 0 - 100
    memory: number; // 0 - 100
    logic: number; // 0 - 100
    pattern: number; // 0 - 100
  };
  gameStats: Record<GameId, StudentGameStats>;
  recentGames: GameSessionResult[];
  achievements: GameAchievement[];
}

export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: GameCategory | "general";
  unlockedAt: string | null;
  progress: number; // 0 - 100
}

export interface DailyBrainChallenge {
  date: string; // YYYY-MM-DD
  games: {
    gameId: GameId;
    difficulty: GameDifficulty;
    targetScore: number;
    completed: boolean;
  }[];
  bonusXp: number;
  allCompleted: boolean;
}
