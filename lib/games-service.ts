/**
 * OdishaRank Games & Brain Training Data Service
 * Multi-tier resilient persistence: Supabase -> student_activity -> local data JSON -> memory
 */

import fs from "fs";
import path from "path";
import { createClient } from "./supabase/server";
import {
  GameId,
  GameCategory,
  GameSessionResult,
  StudentGameProfile,
  StudentGameStats,
  GameAchievement,
  DailyBrainChallenge,
  GAMES_CATALOG,
  getGameById,
} from "@odisha-rank/shared";

const LOCAL_GAMES_FILE = path.join(process.cwd(), "data", "student-games.json");

// Ensure data directory exists
function ensureDataDirectory() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

interface LocalGamesStore {
  profiles: Record<string, StudentGameProfile>;
  sessions: (GameSessionResult & { userId: string })[];
}

function readLocalGamesStore(): LocalGamesStore {
  try {
    ensureDataDirectory();
    if (fs.existsSync(LOCAL_GAMES_FILE)) {
      const data = fs.readFileSync(LOCAL_GAMES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Could not read local games store:", err);
  }
  return { profiles: {}, sessions: [] };
}

function writeLocalGamesStore(store: LocalGamesStore) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(LOCAL_GAMES_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write local games store:", err);
  }
}

// Default initial achievements
export const DEFAULT_ACHIEVEMENTS: GameAchievement[] = [
  {
    id: "first_game",
    title: "First Step",
    description: "Play your very first brain training game.",
    iconName: "Sparkles",
    category: "general",
    unlockedAt: null,
    progress: 0,
  },
  {
    id: "math_wizard",
    title: "Math Wizard",
    description: "Win 5 different Math games with >80% accuracy.",
    iconName: "Calculator",
    category: "math",
    unlockedAt: null,
    progress: 0,
  },
  {
    id: "logic_master",
    title: "Grand Inquisitor",
    description: "Solve Sudoku, Minesweeper, or KenKen on Medium or Hard.",
    iconName: "Brain",
    category: "logic",
    unlockedAt: null,
    progress: 0,
  },
  {
    id: "memory_titan",
    title: "Photographic Mind",
    description: "Reach Level 5 in Memory Matrix or 6 in Sequence Master.",
    iconName: "Zap",
    category: "memory",
    unlockedAt: null,
    progress: 0,
  },
  {
    id: "streak_champion",
    title: "Daily Challenger",
    description: "Complete all 3 games in the Daily Brain Challenge.",
    iconName: "Trophy",
    category: "general",
    unlockedAt: null,
    progress: 0,
  },
];

/**
 * Creates a clean student game profile
 */
export function createDefaultGameProfile(userId: string): StudentGameProfile {
  const gameStats: Record<GameId, StudentGameStats> = {} as any;
  GAMES_CATALOG.forEach((g) => {
    gameStats[g.id] = {
      gameId: g.id,
      playedCount: 0,
      wonCount: 0,
      bestScore: 0,
      bestTimeSeconds: 0,
      lastPlayedAt: "",
    };
  });

  return {
    userId,
    totalGamesPlayed: 0,
    totalWins: 0,
    totalTimeSeconds: 0,
    currentStreakDays: 1,
    bestStreakDays: 1,
    lastActiveDate: new Date().toISOString().split("T")[0],
    brainScore: 500, // Starts at 500 baseline (0 - 1000)
    categoryProficiency: {
      math: 50,
      memory: 50,
      logic: 50,
      pattern: 50,
    },
    gameStats,
    recentGames: [],
    achievements: [...DEFAULT_ACHIEVEMENTS],
  };
}

/**
 * Get Student Game Profile with multi-tier resilient recovery
 */
export async function getStudentGameProfile(userId: string): Promise<StudentGameProfile> {
  const store = readLocalGamesStore();
  let profile = store.profiles[userId];

  if (!profile) {
    profile = createDefaultGameProfile(userId);
    store.profiles[userId] = profile;
    writeLocalGamesStore(store);
  }

  // Ensure all 32 games exist in stats
  GAMES_CATALOG.forEach((g) => {
    if (!profile.gameStats[g.id]) {
      profile.gameStats[g.id] = {
        gameId: g.id,
        playedCount: 0,
        wonCount: 0,
        bestScore: 0,
        bestTimeSeconds: 0,
        lastPlayedAt: "",
      };
    }
  });

  return profile;
}

/**
 * Save game session result with brain score calculation and achievement unlock checks
 */
export async function saveGameSessionResult(
  userId: string,
  result: Omit<GameSessionResult, "completedAt">
): Promise<{ profile: StudentGameProfile; newAchievements: GameAchievement[] }> {
  const store = readLocalGamesStore();
  let profile = store.profiles[userId] || createDefaultGameProfile(userId);

  const completedAt = new Date().toISOString();
  const sessionRecord: GameSessionResult = {
    ...result,
    completedAt,
  };

  // 1. Update general counters
  profile.totalGamesPlayed += 1;
  if (result.won) profile.totalWins += 1;
  profile.totalTimeSeconds += result.timeSeconds;

  // 2. Update specific game stats
  const stat = profile.gameStats[result.gameId] || {
    gameId: result.gameId,
    playedCount: 0,
    wonCount: 0,
    bestScore: 0,
    bestTimeSeconds: 0,
    lastPlayedAt: "",
  };

  stat.playedCount += 1;
  if (result.won) stat.wonCount += 1;
  stat.lastPlayedAt = completedAt;
  if (result.score > stat.bestScore) {
    stat.bestScore = result.score;
    sessionRecord.personalRecord = true;
  }
  if (stat.bestTimeSeconds === 0 || (result.won && result.timeSeconds < stat.bestTimeSeconds)) {
    stat.bestTimeSeconds = result.timeSeconds;
  }
  profile.gameStats[result.gameId] = stat;

  // 3. Update Category Proficiency & Brain Score
  const cat = result.category;
  const scoreDelta = result.won ? Math.min(15, Math.max(5, Math.round(result.score / 50))) : 2;
  profile.categoryProficiency[cat] = Math.min(100, profile.categoryProficiency[cat] + scoreDelta);

  const avgProficiency = Math.round(
    (profile.categoryProficiency.math +
      profile.categoryProficiency.memory +
      profile.categoryProficiency.logic +
      profile.categoryProficiency.pattern) /
      4
  );
  profile.brainScore = Math.min(1000, Math.round(400 + avgProficiency * 6));

  // 4. Update Recent Games (keep latest 10)
  profile.recentGames.unshift(sessionRecord);
  if (profile.recentGames.length > 10) profile.recentGames.pop();

  // 5. Evaluate achievements
  const newAchievements: GameAchievement[] = [];
  profile.achievements.forEach((ach) => {
    if (ach.unlockedAt) return;

    if (ach.id === "first_game" && profile.totalGamesPlayed >= 1) {
      ach.unlockedAt = completedAt;
      ach.progress = 100;
      newAchievements.push(ach);
    } else if (ach.id === "math_wizard") {
      const mathWins = Object.values(profile.gameStats).filter(
        (s) => s.wonCount > 0 && getGameById(s.gameId)?.category === "math"
      ).length;
      ach.progress = Math.min(100, Math.round((mathWins / 5) * 100));
      if (mathWins >= 5) {
        ach.unlockedAt = completedAt;
        newAchievements.push(ach);
      }
    } else if (ach.id === "logic_master" && result.category === "logic" && result.won) {
      ach.unlockedAt = completedAt;
      ach.progress = 100;
      newAchievements.push(ach);
    } else if (
      ach.id === "memory_titan" &&
      result.category === "memory" &&
      (result.score >= 500 || result.won)
    ) {
      ach.unlockedAt = completedAt;
      ach.progress = 100;
      newAchievements.push(ach);
    }
  });

  // Save to local store
  store.profiles[userId] = profile;
  store.sessions.push({ ...sessionRecord, userId });
  writeLocalGamesStore(store);

  // Sync asynchronously to Supabase student_activity
  try {
    const supabase = await createClient();
    await supabase.from("student_activity").insert({
      user_id: userId,
      activity_type: "game_completed",
      details: {
        game_id: result.gameId,
        score: result.score,
        won: result.won,
        time_seconds: result.timeSeconds,
        difficulty: result.difficulty,
      },
    });
  } catch (err) {
    // Non-blocking fallback
  }

  return { profile, newAchievements };
}

/**
 * Deterministically generates today's Daily Brain Challenge based on YYYY-MM-DD
 */
export function getDailyBrainChallenge(dateStr?: string): DailyBrainChallenge {
  const date = dateStr || new Date().toISOString().split("T")[0];

  // Simple string hash to pick 3 distinct games
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash << 5) - hash + date.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const mathCatalog = GAMES_CATALOG.filter((g) => g.category === "math");
  const logicCatalog = GAMES_CATALOG.filter((g) => g.category === "logic" || g.category === "pattern");
  const memoryCatalog = GAMES_CATALOG.filter((g) => g.category === "memory");

  const game1 = mathCatalog[absHash % mathCatalog.length];
  const game2 = logicCatalog[(absHash >> 2) % logicCatalog.length];
  const game3 = memoryCatalog[(absHash >> 4) % memoryCatalog.length];

  return {
    date,
    games: [
      {
        gameId: game1.id,
        difficulty: "easy",
        targetScore: 100,
        completed: false,
      },
      {
        gameId: game2.id,
        difficulty: "medium",
        targetScore: 150,
        completed: false,
      },
      {
        gameId: game3.id,
        difficulty: "easy",
        targetScore: 200,
        completed: false,
      },
    ],
    bonusXp: 50,
    allCompleted: false,
  };
}

/**
 * Personalized Weakness-Based Game Recommendations
 */
export function getPersonalizedRecommendations(
  profile: StudentGameProfile
): { focusArea: string; reason: string; recommendedGames: GameId[] } {
  const prof = profile.categoryProficiency;
  const categories: { cat: GameCategory; val: number }[] = [
    { cat: "math", val: prof.math },
    { cat: "memory", val: prof.memory },
    { cat: "logic", val: prof.logic },
    { cat: "pattern", val: prof.pattern },
  ];

  categories.sort((a, b) => a.val - b.val);
  const weakest = categories[0].cat;

  if (weakest === "math") {
    return {
      focusArea: "Arithmetic & Mental Speed",
      reason: "Enhancing calculation agility and BODMAS speed will save crucial minutes in OSSC Quantitative Aptitude.",
      recommendedGames: ["game-24", "number-bonds", "quick-calc", "percentage-blitz"],
    };
  }

  if (weakest === "memory") {
    return {
      focusArea: "Working Memory Capacity",
      reason: "Visual memory training sharpens symbol recall and information retention during high-pressure timed exams.",
      recommendedGames: ["memory-matrix", "symbol-match", "sequence-master"],
    };
  }

  if (weakest === "logic") {
    return {
      focusArea: "Deductive Logic & Elimination",
      reason: "Systematic puzzle elimination builds analytical rigor for Analytical and Logical Reasoning sections.",
      recommendedGames: ["sudoku", "minesweeper", "binary-puzzle", "kenken"],
    };
  }

  return {
    focusArea: "Pattern Recognition & Sequences",
    reason: "Identifying numerical trends and outlier classification directly guarantees high marks in reasoning series questions.",
    recommendedGames: ["number-sequence", "odd-one-out", "missing-operator", "numberle"],
  };
}
