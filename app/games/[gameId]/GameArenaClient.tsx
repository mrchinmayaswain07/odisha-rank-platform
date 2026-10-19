"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  Lightbulb,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Flame,
  ArrowRight,
  Play,
  Check,
  X,
  Volume2,
  VolumeX,
  Pause,
  Share2,
  Zap,
  ShieldAlert,
} from "lucide-react";
import {
  GameMetadata,
  GameDifficulty,
  StudentGameProfile,
  generate24GamePuzzle,
  validate24GameExpression,
  init2048Game,
  slide2048,
  check2048GameOver,
  generateMagicSquarePuzzle,
  validateMagicSquare,
  generateKakuroPuzzle,
  generateNumberBonds,
  generateNerdlePuzzle,
  evaluateNerdleGuess,
  generateCountdownPuzzle,
  generateQuickCalcQuestion,
  generateMathCrossword,
  generateApproximationQuestion,
  generateAverageQuestion,
  generatePercentageQuestion,
  generateSpeedComparisonQuestion,
  generateSimplificationQuestion,
  generateFactorFinderQuestion,
  generateMemoryMatrixLevel,
  generateSymbolMatchGame,
  appendSequenceStep,
  validateSequenceInput,
  generateSudokuPuzzle,
  validateSudokuCell,
  initMinesweeper,
  placeMinesSafeFirstClick,
  revealMineCell,
  generateKenKen4x4,
  generateBinaryPuzzle,
  validateBinaryPuzzle,
  initTowerOfHanoi,
  moveHanoiDisk,
  initLightsOut,
  toggleLight,
  checkLightsOutWin,
  generateKillerSudoku6x6,
  generateFutoshiki4x4,
  generateNumberleSecret,
  evaluateNumberleGuess,
  generateNonogram5x5,
  generateCryptarithmPuzzle,
  generateNumberSequenceQuestion,
  generateOddOneOutQuestion,
  generateMissingOperatorQuestion,
} from "@odisha-rank/shared";
import { Profile, Exam } from "@/lib/types";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Button } from "@/components/ui/Button";
import { gameAudio } from "@/lib/games-audio";
import { triggerConfetti } from "@/lib/games-confetti";

interface GameArenaClientProps {
  game: GameMetadata;
  profile: Profile | null;
  allExams: Exam[];
  targetExam: Exam | null;
  gameProfile: StudentGameProfile;
}

// Cognitive Hint Generator for all 32 games
function getGameHint(gameId: string): string {
  switch (gameId) {
    case "game-24":
      return "💡 Strategy: Try combining two numbers into 6, 8, 3, or 4 first (since 6×4=24 and 8×3=24). Or look for (A + B) × (C - D).";
    case "game-2048":
      return "💡 Corner Strategy: Keep your highest-value tile locked in one corner (e.g. bottom-right) and avoid moving it away unless forced.";
    case "magic-square":
      return "💡 Magic Constant: Every row, column, and 3-cell diagonal must sum to the same magic number (typically 15 for a 3×3 with 1-9). Center is always 5.";
    case "kakuro":
      return "💡 Unique Partitions: Digits 1-9 cannot repeat in a run. Clues like 3 (1+2), 4 (1+3), 16 (7+9), or 17 (8+9) have only one possible combination.";
    case "number-bonds":
      return "💡 Mental Complement: Look for numbers whose units digits add up to 10 (e.g., 34 ends in 4, so its bond to 100 must end in 6 -> 66).";
    case "nerdle":
      return "💡 BODMAS Rule: Multiplication & Division evaluate before Addition & Subtraction. An equals sign (=) is always present.";
    case "countdown-numbers":
      return "💡 Target Approximation: Multiply the largest available numbers to get close to the target, then add or subtract smaller numbers to hit it exact.";
    case "quick-calc":
      return "💡 Mental Math Shortcut: Multiplying by 5 is dividing by 2 and multiplying by 10 (e.g. 46 × 5 = 23 × 10 = 230).";
    case "math-crossword":
      return "💡 Intersection First: Solve the intersection cell shared by an across and down equation first—it restricts both calculations.";
    case "approximation":
      return "💡 Rounding Rule: Round awkward numbers to nearest 10 or 100 (e.g. 498 ≈ 500, 19.8 ≈ 20) to quickly eliminate distant answer choices.";
    case "average-race":
      return "💡 Assumed Mean: Pick a nice round middle number (e.g. 50), sum the deviations (+3, -4, +7), divide deviation sum by count, and adjust.";
    case "percentage-blitz":
      return "💡 Percentage Reversal: X% of Y equals Y% of X. For example, 16% of 25 = 25% of 16 = 4. 10% is moving decimal one place left.";
    case "speed-comparison":
      return "💡 Cross-Multiplication: To compare A/B vs C/D, simply compare (A × D) with (B × C). Whichever product is larger wins!";
    case "simplification-sprint":
      return "💡 BODMAS Priority: 1. Brackets (), 2. Orders/Powers, 3. Division & Multiplication (left to right), 4. Addition & Subtraction.";
    case "factor-finder":
      return "💡 Divisibility Tests: Even numbers divide by 2; sum of digits multiple of 3 divides by 3; ending in 0 or 5 divides by 5.";
    case "memory-matrix":
      return "💡 Visual Chunking: Don't memorize individual dots—visualize the lit squares as a single geometric shape (a letter, cross, or cluster).";
    case "symbol-match":
      return "💡 Grid Anchor: Anchor cards in memory by four quadrants: Top-Left, Top-Right, Bottom-Left, Bottom-Right.";
    case "sequence-master":
      return "💡 Rhythm & Sound: Speak the pattern rhythmically in your head (e.g., 'Red-Blue-Blue-Green') to leverage auditory working memory.";
    case "sudoku":
      return "💡 Elimination & Naked Singles: Scan rows, columns, and 3×3 boxes for numbers already used. If 8 numbers are present, the 9th is forced.";
    case "minesweeper":
      return "💡 1-1 & 1-2 Patterns: If a 1 has only one hidden neighbor, it MUST be a mine. If it has all mines flagged, all other neighbors are safe!";
    case "kenken":
      return "💡 Cages First: Solve 1-cell cages first (freebies). For 2-cell cage with '3+', options can only be (1, 2) on a 4×4 grid.";
    case "binary-puzzle":
      return "💡 Binary Rules: No three consecutive identical numbers (00 requires 1 on each side; 11 requires 0). Each row has equal 0s and 1s.";
    case "tower-of-hanoi":
      return "💡 Hanoi Move Principle: A larger disk can never sit on a smaller disk. For 3 disks, target minimum moves is 2^3 - 1 = 7 moves.";
    case "lights-out":
      return "💡 Light Cascade: Pressing a button inverts it and its 4 orthogonal neighbors. Pressing the same button twice cancels out.";
    case "killer-sudoku":
      return "💡 Sum Partitions: Cages with sum 3 (1+2), 4 (1+3), 16 (7+9), 17 (8+9) have unique pairs with no duplicate digits.";
    case "futoshiki":
      return "💡 Inequality Chains: A cell that is > another cannot be 1. A cell that is < another cannot be the maximum number (4).";
    case "numberle":
      return "💡 Deductive Elimination: Green = right digit & spot. Yellow = right digit, wrong spot. Gray = digit not in secret code.";
    case "nonogram":
      return "💡 Overlap Method: If a clue number is greater than half the grid length, the center cells are guaranteed to be shaded.";
    case "cryptarithm":
      return "💡 Leading Digit: The leading letter of any number cannot be 0. If two numbers sum to one with an extra digit, that first digit is ALWAYS 1!";
    case "number-sequence":
      return "💡 Sequence Patterns: Check differences between adjacent terms: constant difference (AP), constant ratio (GP), squares (n²), or Fibonacci (a+b=c).";
    case "odd-one-out":
      return "💡 Classification Angle: Look at Prime vs Composite, Even vs Odd, Perfect Squares/Cubes, or sum of digits.";
    case "missing-operator":
      return "💡 Order of Evaluation: Test operators in order: if result is dramatically smaller, look for division (÷) or subtraction (-).";
    default:
      return "💡 Carefully observe the puzzle constraints, eliminate impossible choices, and verify against standard mathematical rules.";
  }
}

export const GameArenaClient: React.FC<GameArenaClientProps> = ({
  game,
  profile,
  allExams,
  targetExam,
  gameProfile,
}) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [difficulty, setDifficulty] = useState<GameDifficulty>(game.defaultDifficulty);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [explanation, setExplanation] = useState("");

  // New Interactive Feature States
  const [isMuted, setIsMuted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [copiedChallenge, setCopiedChallenge] = useState(false);

  const prevBestScore = gameProfile.gameStats?.[game.id]?.bestScore || 0;

  useEffect(() => {
    setIsMuted(gameAudio.getMuted());
  }, []);

  const studentName = profile?.full_name?.split(" ")[0] || "Aspirant";
  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "OD";
  const isUserAdmin =
    profile?.email?.toLowerCase() === "mrchinmayaswain07@gmail.com" ||
    (profile as any)?.role === "admin";

  // Global Timer (Freezes when game is over or paused)
  useEffect(() => {
    if (isGameOver || isPaused) return;
    const interval = setInterval(() => {
      setTimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, isPaused]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      if (e.key === "p" || e.key === "P") {
        if (!isInput && !isGameOver) {
          e.preventDefault();
          setIsPaused((prev) => !prev);
          gameAudio.playClick();
        }
      } else if (e.key === "h" || e.key === "H") {
        if (!isInput) {
          e.preventDefault();
          setShowHint((prev) => !prev);
          gameAudio.playClick();
        }
      } else if (e.key === "m" || e.key === "M") {
        if (!isInput) {
          e.preventDefault();
          handleToggleSound();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameOver, isPaused]);

  const handleToggleSound = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleShareChallenge = () => {
    const url = typeof window !== "undefined" ? window.location.href : `https://odisharank.com/games/${game.id}`;
    const text = `🏆 OdishaRank Brain Challenge: I scored ${score} pts in ${game.title}! Can you beat my time? Test your aptitude here: ${url}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 3000);
    }
  };

  // Handle Game Victory / Finish
  const handleGameEnd = async (won: boolean, finalScore: number, expl?: string) => {
    setIsGameOver(true);
    setIsWon(won);
    // Apply combo bonus if applicable
    const finalWithCombo = won && combo >= 2 ? Math.round(finalScore * (1 + combo * 0.1)) : finalScore;
    setScore(finalWithCombo);
    if (expl) setExplanation(expl);

    if (won) {
      gameAudio.playVictory();
      triggerConfetti();
    } else {
      gameAudio.playError();
    }

    // 1. Optimistically update local profile and notify listeners
    try {
      const raw = localStorage.getItem("@odisharank_game_profile");
      const current = raw ? JSON.parse(raw) : { ...gameProfile };
      current.totalGamesPlayed = (current.totalGamesPlayed || 0) + 1;
      if (won) current.totalWins = (current.totalWins || 0) + 1;
      current.totalTimeSeconds = (current.totalTimeSeconds || 0) + timeSeconds;

      const stat = current.gameStats?.[game.id] || {
        gameId: game.id,
        playedCount: 0,
        wonCount: 0,
        bestScore: 0,
        bestTimeSeconds: 0,
        lastPlayedAt: "",
      };
      stat.playedCount += 1;
      if (won) stat.wonCount += 1;
      stat.lastPlayedAt = new Date().toISOString();
      if (finalWithCombo > (stat.bestScore || 0)) stat.bestScore = finalWithCombo;
      if (stat.bestTimeSeconds === 0 || (won && timeSeconds < stat.bestTimeSeconds)) {
        stat.bestTimeSeconds = timeSeconds;
      }
      current.gameStats[game.id] = stat;
      if (won) {
        current.brainScore = Math.min(1000, (current.brainScore || 500) + 15);
      }

      localStorage.setItem("@odisharank_game_profile", JSON.stringify(current));
      window.dispatchEvent(new CustomEvent("odisharank:game-completed", { detail: current }));
    } catch {}

    // 2. Sync to backend API
    try {
      const res = await fetch("/api/games/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          category: game.category,
          difficulty,
          score: finalWithCombo,
          timeSeconds,
          moves,
          accuracy: won ? 100 : 50,
          won,
          explanation: expl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          localStorage.setItem("@odisharank_game_profile", JSON.stringify(data.profile));
          window.dispatchEvent(new CustomEvent("odisharank:game-completed", { detail: data.profile }));
        }
      }
    } catch (err) {
      console.warn("Failed to sync game progress:", err);
    }
  };

  // ==========================================
  // GAME SPECIFIC STATES & HANDLERS
  // ==========================================

  // 1. 24 Game
  const [p24, setP24] = useState(() => generate24GamePuzzle(difficulty));
  const [expr24, setExpr24] = useState("");
  const [evalError24, setEvalError24] = useState<string | null>(null);

  // 2. 2048
  const [g2048, setG2048] = useState(() => init2048Game());

  // 3. Magic Square
  const [ms, setMs] = useState(() => generateMagicSquarePuzzle(difficulty));
  const [msGrid, setMsGrid] = useState<number[][]>(() =>
    ms.initialGrid.map((r) => r.map((c) => c || 0))
  );

  // 4. Number Bonds
  const [nb, setNb] = useState(() => generateNumberBonds(100, 6));
  const [selectedNbCard, setSelectedNbCard] = useState<string | null>(null);

  // 5. Nerdle
  const [nerdle, setNerdle] = useState(() => generateNerdlePuzzle());
  const [nerdleGuesses, setNerdleGuesses] = useState<string[]>([]);
  const [currentNerdleInput, setCurrentNerdleInput] = useState("");

  // 6. Quick Calc
  const [qc, setQc] = useState(() => generateQuickCalcQuestion(difficulty));
  const [qcStreak, setQcStreak] = useState(0);

  // 7. Memory Matrix
  const [mmLevel, setMmLevel] = useState(1);
  const [mm, setMm] = useState(() => generateMemoryMatrixLevel(1));
  const [mmShowing, setMmShowing] = useState(true);
  const [mmSelected, setMmSelected] = useState<number[]>([]);

  // 8. Symbol Match
  const [smCards, setSmCards] = useState(() => generateSymbolMatchGame(6));
  const [smFlipped, setSmFlipped] = useState<number[]>([]);

  // 9. Sequence Master
  const [seqMaster, setSeqMaster] = useState<any[]>(() => appendSequenceStep([]));
  const [seqPlayer, setSeqPlayer] = useState<any[]>([]);
  const [seqPlayingAnimation, setSeqPlayingAnimation] = useState(false);

  // 10. Sudoku
  const [sud, setSud] = useState(() => generateSudokuPuzzle(difficulty));
  const [sudGrid, setSudGrid] = useState(() => sud.initialGrid.map((r) => [...r]));
  const [selectedSudCell, setSelectedSudCell] = useState<[number, number] | null>(null);

  // 11. Minesweeper
  const [msweeper, setMsweeper] = useState(() => initMinesweeper(8, 8, 10));
  const [flagMode, setFlagMode] = useState(false);

  // 12. Tower of Hanoi
  const [hanoi, setHanoi] = useState(() => initTowerOfHanoi(3));
  const [selectedHanoiPeg, setSelectedHanoiPeg] = useState<0 | 1 | 2 | null>(null);

  // 13. Lights Out
  const [lights, setLights] = useState(() => initLightsOut(5));

  // 14. Binary Puzzle
  const [bin, setBin] = useState(() => generateBinaryPuzzle());
  const [binGrid, setBinGrid] = useState(() => bin.initialGrid.map((r) => [...r]));

  // 15. Numberle
  const [numSecret, setNumSecret] = useState(() => generateNumberleSecret(4));
  const [numGuesses, setNumGuesses] = useState<string[]>([]);
  const [currNumInput, setCurrNumInput] = useState("");

  // 16. Number Sequence
  const [nseq, setNseq] = useState(() => generateNumberSequenceQuestion());

  // 17. Odd One Out
  const [odd, setOdd] = useState(() => generateOddOneOutQuestion());

  // 18. Missing Operator
  const [mop, setMop] = useState(() => generateMissingOperatorQuestion());

  // 19. Approximation
  const [appx, setAppx] = useState(() => generateApproximationQuestion());

  // 20. Average Race
  const [avg, setAvg] = useState(() => generateAverageQuestion());

  // 21. Percentage Blitz
  const [pb, setPb] = useState(() => generatePercentageQuestion());

  // 22. Speed Comparison
  const [sc, setSc] = useState(() => generateSpeedComparisonQuestion());

  // 23. Simplification Sprint
  const [simp, setSimp] = useState(() => generateSimplificationQuestion());

  // 24. Factor Finder
  const [fac, setFac] = useState(() => generateFactorFinderQuestion());

  // 25. Kakuro
  const [kak, setKak] = useState(() => generateKakuroPuzzle(difficulty));

  // 26. KenKen
  const [ken, setKen] = useState(() => generateKenKen4x4());

  // 27. Countdown
  const [cd, setCd] = useState(() => generateCountdownPuzzle());

  // 28. Math Crossword
  const [mc, setMc] = useState(() => generateMathCrossword());

  // 29. Killer Sudoku
  const [ks, setKs] = useState(() => generateKillerSudoku6x6());

  // 30. Futoshiki
  const [fut, setFut] = useState(() => generateFutoshiki4x4());

  // 31. Nonogram
  const [nono, setNono] = useState(() => generateNonogram5x5());

  // 32. Cryptarithm
  const [crypt, setCrypt] = useState(() => generateCryptarithmPuzzle());

  // Restart Active Game
  const handleRestart = () => {
    setTimeSeconds(0);
    setScore(0);
    setMoves(0);
    setIsGameOver(false);
    setIsWon(false);
    setCompletionMessage("");
    setExplanation("");

    if (game.id === "game-24") {
      setP24(generate24GamePuzzle(difficulty));
      setExpr24("");
      setEvalError24(null);
    } else if (game.id === "game-2048") {
      setG2048(init2048Game());
    } else if (game.id === "magic-square") {
      const newMs = generateMagicSquarePuzzle(difficulty);
      setMs(newMs);
      setMsGrid(newMs.initialGrid.map((r) => r.map((c) => c || 0)));
    } else if (game.id === "number-bonds") {
      setNb(generateNumberBonds(100, 6));
      setSelectedNbCard(null);
    } else if (game.id === "nerdle") {
      setNerdle(generateNerdlePuzzle());
      setNerdleGuesses([]);
      setCurrentNerdleInput("");
    } else if (game.id === "quick-calc") {
      setQc(generateQuickCalcQuestion(difficulty));
      setQcStreak(0);
    } else if (game.id === "memory-matrix") {
      setMmLevel(1);
      const lvl = generateMemoryMatrixLevel(1);
      setMm(lvl);
      setMmShowing(true);
      setMmSelected([]);
      setTimeout(() => setMmShowing(false), lvl.displayDurationMs);
    } else if (game.id === "symbol-match") {
      setSmCards(generateSymbolMatchGame(6));
      setSmFlipped([]);
    } else if (game.id === "sequence-master") {
      const initial = appendSequenceStep([]);
      setSeqMaster(initial);
      setSeqPlayer([]);
    } else if (game.id === "sudoku") {
      const newSud = generateSudokuPuzzle(difficulty);
      setSud(newSud);
      setSudGrid(newSud.initialGrid.map((r) => [...r]));
    } else if (game.id === "minesweeper") {
      setMsweeper(initMinesweeper(8, 8, 10));
    } else if (game.id === "tower-of-hanoi") {
      setHanoi(initTowerOfHanoi(3));
      setSelectedHanoiPeg(null);
    } else if (game.id === "lights-out") {
      setLights(initLightsOut(5));
    } else if (game.id === "binary-puzzle") {
      const newBin = generateBinaryPuzzle();
      setBin(newBin);
      setBinGrid(newBin.initialGrid.map((r) => [...r]));
    } else if (game.id === "numberle") {
      setNumSecret(generateNumberleSecret(4));
      setNumGuesses([]);
      setCurrNumInput("");
    } else if (game.id === "number-sequence") {
      setNseq(generateNumberSequenceQuestion());
    } else if (game.id === "odd-one-out") {
      setOdd(generateOddOneOutQuestion());
    } else if (game.id === "missing-operator") {
      setMop(generateMissingOperatorQuestion());
    } else if (game.id === "approximation") {
      setAppx(generateApproximationQuestion());
    } else if (game.id === "average-race") {
      setAvg(generateAverageQuestion());
    } else if (game.id === "percentage-blitz") {
      setPb(generatePercentageQuestion());
    } else if (game.id === "speed-comparison") {
      setSc(generateSpeedComparisonQuestion());
    } else if (game.id === "simplification-sprint") {
      setSimp(generateSimplificationQuestion());
    } else if (game.id === "factor-finder") {
      setFac(generateFactorFinderQuestion());
    } else if (game.id === "kakuro") {
      setKak(generateKakuroPuzzle(difficulty));
    } else if (game.id === "kenken") {
      setKen(generateKenKen4x4());
    } else if (game.id === "countdown-numbers") {
      setCd(generateCountdownPuzzle());
    } else if (game.id === "math-crossword") {
      setMc(generateMathCrossword());
    } else if (game.id === "killer-sudoku") {
      setKs(generateKillerSudoku6x6());
    } else if (game.id === "futoshiki") {
      setFut(generateFutoshiki4x4());
    } else if (game.id === "nonogram") {
      setNono(generateNonogram5x5());
    } else if (game.id === "cryptarithm") {
      setCrypt(generateCryptarithmPuzzle());
    }
  };

  // Keyboard navigation for 2048
  useEffect(() => {
    if (game.id !== "game-2048" || isGameOver) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const dir =
          e.key === "ArrowLeft"
            ? "left"
            : e.key === "ArrowRight"
            ? "right"
            : e.key === "ArrowUp"
            ? "up"
            : "down";
        handleSlide2048(dir);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game.id, g2048, isGameOver]);

  const handleSlide2048 = (dir: "left" | "right" | "up" | "down") => {
    const res = slide2048(g2048.board, dir);
    if (!res.moved) return;

    if (res.scoreGained > 0) {
      gameAudio.playSuccess();
      setCombo((c) => Math.min(10, c + 1));
    } else {
      gameAudio.playClick();
    }

    const newBoard = res.board;
    // Spawn new tile
    const withSpawn = res.moved ? (res.board as any) : newBoard;
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (withSpawn[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const pick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      withSpawn[pick.r][pick.c] = Math.random() < 0.9 ? 2 : 4;
    }

    const newScore = g2048.score + res.scoreGained;
    const over = check2048GameOver(withSpawn);
    setG2048({
      board: withSpawn,
      score: newScore,
      bestScore: Math.max(g2048.bestScore, newScore),
      won: withSpawn.some((r: any) => r.some((v: any) => v >= 2048)),
      gameOver: over,
    });
    setMoves((m) => m + 1);

    if (over) {
      handleGameEnd(false, newScore, `2048 board locked! Final Score: ${newScore}`);
    }
  };

  // Memory Matrix Initial Flash
  useEffect(() => {
    if (game.id !== "memory-matrix") return;
    setMmShowing(true);
    const timer = setTimeout(() => {
      setMmShowing(false);
    }, mm.displayDurationMs);
    return () => clearTimeout(timer);
  }, [game.id, mm]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      <StudentSidebar />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <StudentSidebar isMobile onCloseMobile={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenTimer={() => setShowTimerModal(true)}
          onOpenCourseModal={() => setShowCourseModal(true)}
          studentName={studentName}
          initials={initials}
          isUserAdmin={isUserAdmin}
          email={profile?.email}
          allExams={allExams}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Cyber-Cockpit Game Arena Navigation & HUD Bar */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 relative overflow-hidden">
            {/* Top ambient highlight line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400" />

            <div className="flex items-center gap-3">
              <Link
                href="/games"
                className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Back to games catalog"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    {game.title}
                  </h1>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      game.access === "free"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-purple-600 text-white shadow-xs"
                    }`}
                  >
                    {game.access.toUpperCase()}
                  </span>
                  {prevBestScore > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30">
                      🏆 Best: {prevBestScore}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 capitalize font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{game.category}</span>
                  <span>•</span>
                  <span>{difficulty} mode</span>
                </span>
              </div>
            </div>

            {/* Live Score, Combo, Timer, and Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Combo Multiplier Badge */}
              {combo >= 2 && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 text-amber-300 text-xs font-black animate-pulse shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{combo}x COMBO</span>
                </div>
              )}

              {/* Digital Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-cyan-300 font-mono text-xs font-bold shadow-inner">
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {Math.floor(timeSeconds / 60)}:{(timeSeconds % 60).toString().padStart(2, "0")}
                </span>
              </div>

              {/* Score Pill */}
              <div className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-300 font-mono font-black text-xs shadow-inner">
                PTS: <span className="text-amber-400 font-bold">{score}</span>
              </div>

              {/* Audio Sound Toggle */}
              <button
                onClick={handleToggleSound}
                className={`p-2 rounded-xl border transition-all ${
                  isMuted
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
                }`}
                title={isMuted ? "Unmute Sound [M]" : "Mute Sound [M]"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Hint Button */}
              <button
                onClick={() => {
                  setShowHint((prev) => !prev);
                  gameAudio.playClick();
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showHint
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-400/30 hover:bg-amber-500/25"
                }`}
                title="Get Solving Strategy / Hint [H]"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hint</span>
              </button>

              {/* Pause Button */}
              <button
                onClick={() => {
                  setIsPaused((prev) => !prev);
                  gameAudio.playClick();
                }}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                title={isPaused ? "Resume Practice [P]" : "Pause Practice [P]"}
              >
                {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Restart Button */}
              <button
                onClick={handleRestart}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition-all"
                title="Restart Game [Alt+R]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Rules Button */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-blue-400 hover:bg-slate-700 transition-all"
                title="Rules & Exam Benefit"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Arena Interactive Board Area with Pause Overlay and Hint Banner */}
          <div className="relative">
            {/* Pause Overlay */}
            {isPaused && (
              <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center shadow-lg">
                  <Pause className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Drill Session Paused</h3>
                  <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
                    Timer and board are frozen. Take a breath, reset your mental agility, and jump right back in when ready.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsPaused(false);
                      gameAudio.playClick();
                    }}
                  >
                    <Play className="w-4 h-4 mr-1.5" />
                    Resume Practice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    onClick={handleRestart}
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Restart Drill
                  </Button>
                </div>
              </div>
            )}

            {/* Contextual Hint Dropdown Banner */}
            {showHint && (
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-400/40 text-xs text-amber-950 flex items-start justify-between gap-3 animate-in slide-in-from-top-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Aptitude Solver Strategy:</span>
                  </div>
                  <p className="text-amber-950/90 leading-relaxed font-medium">
                    {getGameHint(game.id)}
                  </p>
                </div>
                <button
                  onClick={() => setShowHint(false)}
                  className="p-1 text-amber-700 hover:text-amber-950 text-xs font-bold shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ==================================================== */}
            {/* DYNAMIC INTERACTIVE GAME BOARD FOR EACH OF 32 GAMES  */}
            {/* ==================================================== */}
            <div
              className={`bg-gradient-to-b from-white to-slate-50/90 rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 shadow-xl flex flex-col items-center justify-center min-h-[440px] relative transition-all ${
                isPaused ? "blur-md pointer-events-none select-none" : ""
              }`}
            >
            {/* 1. 24 GAME */}
            {game.id === "game-24" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Combine all 4 numbers using (+, -, ×, ÷) to equal exactly 24
                </div>

                <div className="flex items-center justify-center gap-3">
                  {p24.numbers.map((n, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        gameAudio.playClick();
                        setExpr24((prev) => `${prev} ${n}`.trim());
                      }}
                      className="w-14 h-16 rounded-2xl bg-blue-50 border-2 border-blue-400 text-blue-900 font-black text-2xl shadow-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Formula Input Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono font-bold text-xl text-slate-800 min-h-[56px] flex items-center justify-center">
                  {expr24 || <span className="text-slate-300 font-normal">Tap numbers & operators</span>}
                </div>

                {evalError24 && (
                  <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-xl">
                    {evalError24}
                  </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-6 gap-2">
                  {["+", "-", "*", "/", "(", ")"].map((op) => (
                    <button
                      key={op}
                      onClick={() => {
                        gameAudio.playClick();
                        setExpr24((prev) => `${prev} ${op}`.trim());
                      }}
                      className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-lg transition-colors active:scale-95"
                    >
                      {op === "*" ? "×" : op === "/" ? "÷" : op}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      gameAudio.playClick();
                      setExpr24("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const res = validate24GameExpression(expr24, p24.numbers);
                      if (res.valid) {
                        gameAudio.playSuccess();
                        setCombo((c) => c + 1);
                        handleGameEnd(true, 100, `Solved! Expression: ${expr24} = 24`);
                      } else {
                        gameAudio.playError();
                        setCombo(0);
                        setEvalError24(res.error || "Does not equal 24");
                      }
                    }}
                  >
                    Check = 24
                  </Button>
                </div>
              </div>
            )}

            {/* 2. 2048 */}
            {game.id === "game-2048" && (
              <div className="w-full max-w-sm space-y-4 text-center">
                <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-600">
                  <span>Score: {g2048.score}</span>
                  <span>Best: {g2048.bestScore}</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-800 shadow-inner">
                  {g2048.board.map((row, r) =>
                    row.map((val, c) => {
                      let bg = "bg-slate-700/50 text-transparent";
                      if (val === 2) bg = "bg-slate-200 text-slate-800 font-bold";
                      else if (val === 4) bg = "bg-amber-100 text-amber-900 font-bold";
                      else if (val === 8) bg = "bg-orange-400 text-white font-extrabold";
                      else if (val === 16) bg = "bg-orange-500 text-white font-extrabold";
                      else if (val === 32) bg = "bg-orange-600 text-white font-extrabold";
                      else if (val === 64) bg = "bg-rose-500 text-white font-black";
                      else if (val >= 128) bg = "bg-yellow-400 text-yellow-950 font-black shadow-md";

                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg transition-all ${bg}`}
                        >
                          {val > 0 ? val : ""}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Mobile Touch Directional Controls */}
                <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto pt-2">
                  <div />
                  <button
                    onClick={() => handleSlide2048("up")}
                    className="p-3 bg-slate-100 rounded-xl text-slate-700 font-bold active:bg-blue-600 active:text-white"
                  >
                    ↑
                  </button>
                  <div />
                  <button
                    onClick={() => handleSlide2048("left")}
                    className="p-3 bg-slate-100 rounded-xl text-slate-700 font-bold active:bg-blue-600 active:text-white"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => handleSlide2048("down")}
                    className="p-3 bg-slate-100 rounded-xl text-slate-700 font-bold active:bg-blue-600 active:text-white"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleSlide2048("right")}
                    className="p-3 bg-slate-100 rounded-xl text-slate-700 font-bold active:bg-blue-600 active:text-white"
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            {/* 3. MAGIC SQUARE */}
            {game.id === "magic-square" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Target Magic Sum: <strong className="text-purple-600 font-bold">{ms.targetSum}</strong> (Rows, Columns, and Diagonals must sum to {ms.targetSum})
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                  {msGrid.map((row, r) =>
                    row.map((val, c) => (
                      <input
                        key={`${r}-${c}`}
                        type="number"
                        min={1}
                        max={9}
                        value={val || ""}
                        onChange={(e) => {
                          const n = parseInt(e.target.value) || 0;
                          const next = msGrid.map((rArr, ri) =>
                            rArr.map((cv, ci) => (ri === r && ci === c ? n : cv))
                          );
                          setMsGrid(next);
                          setMoves((m) => m + 1);

                          // Check win
                          const check = validateMagicSquare(next, ms.targetSum);
                          if (check.valid) {
                            handleGameEnd(true, 150, "Perfect Magic Square! All rows, columns, and diagonals sum to 15.");
                          }
                        }}
                        className="w-20 h-20 text-center font-black text-2xl rounded-2xl bg-slate-50 border-2 border-purple-200 focus:border-purple-600 focus:bg-white text-slate-900 outline-none"
                      />
                    ))
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  Tip: The central cell in a 3×3 magic square with sum 15 must always be 5.
                </div>
              </div>
            )}

            {/* 4. NUMBER BONDS */}
            {game.id === "number-bonds" && (
              <div className="w-full max-w-lg space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <span>Match pairs that sum to:</span>
                  <strong className="text-base text-emerald-950">{nb.target}</strong>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {nb.cards.map((c) => {
                    if (c.matched) {
                      return (
                        <div
                          key={c.id}
                          className="h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 opacity-40"
                        >
                          <Check className="w-6 h-6" />
                        </div>
                      );
                    }

                    const isSel = selectedNbCard === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (!selectedNbCard) {
                            setSelectedNbCard(c.id);
                          } else if (selectedNbCard === c.id) {
                            setSelectedNbCard(null);
                          } else {
                            const first = nb.cards.find((x) => x.id === selectedNbCard);
                            if (first && first.value + c.value === nb.target) {
                              // Match!
                              const updated = nb.cards.map((x) =>
                                x.id === first.id || x.id === c.id ? { ...x, matched: true } : x
                              );
                              setNb({ ...nb, cards: updated });
                              setSelectedNbCard(null);
                              setScore((s) => s + 50);

                              if (updated.every((x) => x.matched)) {
                                handleGameEnd(true, score + 100, "All number bonds cleared successfully!");
                              }
                            } else {
                              setSelectedNbCard(null);
                            }
                          }
                        }}
                        className={`h-16 rounded-2xl border-2 font-black text-xl transition-all active:scale-95 ${
                          isSel
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                            : "bg-white text-slate-800 border-slate-200 hover:border-emerald-400"
                        }`}
                      >
                        {c.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. NERDLE */}
            {game.id === "nerdle" && (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Guess the hidden 8-character math equation in 6 tries
                </div>

                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, rIdx) => {
                    const guess = nerdleGuesses[rIdx];
                    const isCurrent = rIdx === nerdleGuesses.length;
                    const evalRes = guess ? evaluateNerdleGuess(guess, nerdle.solutionEquation) : null;

                    return (
                      <div key={rIdx} className="flex justify-center gap-1.5">
                        {Array.from({ length: 8 }).map((__, cIdx) => {
                          const char = isCurrent
                            ? currentNerdleInput[cIdx] || ""
                            : guess
                            ? guess[cIdx]
                            : "";
                          const st = evalRes?.statuses?.[cIdx];

                          let bg = "bg-white border-slate-200 text-slate-800";
                          if (st === "correct") bg = "bg-emerald-500 text-white border-emerald-500";
                          else if (st === "present") bg = "bg-purple-600 text-white border-purple-600";
                          else if (st === "absent") bg = "bg-slate-400 text-white border-slate-400";

                          return (
                            <div
                              key={cIdx}
                              className={`w-10 h-12 rounded-lg border-2 font-black text-lg flex items-center justify-center font-mono ${bg}`}
                            >
                              {char}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Math Keypad */}
                <div className="pt-2 grid grid-cols-5 gap-1.5 max-w-sm mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "-", "*", "/", "="].map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => {
                          if (currentNerdleInput.length < 8) {
                            setCurrentNerdleInput((prev) => prev + key);
                          }
                        }}
                        className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono font-bold text-sm active:scale-95"
                      >
                        {key}
                      </button>
                    )
                  )}
                </div>

                <div className="flex gap-2 justify-center max-w-sm mx-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setCurrentNerdleInput((prev) => prev.slice(0, -1))}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (currentNerdleInput.length !== 8) return;
                      const evalRes = evaluateNerdleGuess(
                        currentNerdleInput,
                        nerdle.solutionEquation
                      );
                      if (!evalRes.valid) {
                        alert(evalRes.error);
                        return;
                      }

                      const updatedGuesses = [...nerdleGuesses, currentNerdleInput];
                      setNerdleGuesses(updatedGuesses);
                      setCurrentNerdleInput("");

                      if (currentNerdleInput === nerdle.solutionEquation) {
                        handleGameEnd(true, 200, `Equation Solved: ${nerdle.solutionEquation}`);
                      } else if (updatedGuesses.length >= 6) {
                        handleGameEnd(false, 30, `Solution was: ${nerdle.solutionEquation}`);
                      }
                    }}
                  >
                    Enter Guess
                  </Button>
                </div>
              </div>
            )}

            {/* 6. QUICK CALC */}
            {game.id === "quick-calc" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-sm font-black text-rose-600 flex items-center justify-center gap-1.5">
                  <Flame className="w-5 h-5 fill-rose-600" />
                  <span>Streak Multiplier: {qcStreak}x</span>
                </div>

                <div className="text-4xl font-black text-slate-900 font-mono tracking-wider">
                  {qc.prompt} = ?
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  {qc.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (opt === qc.answer) {
                          gameAudio.playSuccess();
                          setCombo((c) => c + 1);
                          const nextStreak = qcStreak + 1;
                          const newScore = score + 20 + qcStreak * 5;
                          setScore(newScore);
                          setQcStreak(nextStreak);
                          if (nextStreak >= 10) {
                            handleGameEnd(true, newScore, "Rapid calculation sprint mastered! 10 questions solved flawlessly.");
                          } else {
                            setQc(generateQuickCalcQuestion(difficulty));
                          }
                        } else {
                          gameAudio.playError();
                          setCombo(0);
                          setQcStreak(0);
                          setQc(generateQuickCalcQuestion(difficulty));
                        }
                      }}
                      className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-900 font-black text-2xl transition-all active:scale-95 shadow-xs"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7. MEMORY MATRIX */}
            {game.id === "memory-matrix" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs font-bold text-slate-500">
                  Level {mmLevel} • {mmShowing ? "Memorize the illuminated pattern!" : "Click the illuminated tiles"}
                </div>

                <div
                  className="grid gap-2 mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${mm.gridSize}, minmax(0, 1fr))`,
                    maxWidth: `${mm.gridSize * 70}px`,
                  }}
                >
                  {Array.from({ length: mm.gridSize * mm.gridSize }).map((_, idx) => {
                    const isHighlighted = mm.highlightedIndices.includes(idx);
                    const isSelected = mmSelected.includes(idx);

                    let bg = "bg-slate-100 hover:bg-slate-200 border-slate-200";
                    if (mmShowing && isHighlighted) {
                      bg = "bg-blue-600 border-blue-600 shadow-lg scale-95";
                    } else if (!mmShowing && isSelected) {
                      bg = isHighlighted ? "bg-emerald-500 border-emerald-500" : "bg-rose-500 border-rose-500";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={mmShowing}
                        onClick={() => {
                          if (mmSelected.includes(idx)) return;
                          gameAudio.playClick();
                          const nextSelected = [...mmSelected, idx];
                          setMmSelected(nextSelected);

                          if (!isHighlighted) {
                            gameAudio.playError();
                            setCombo(0);
                            handleGameEnd(false, score, "Missed tile! Try again to build your photographic memory.");
                          } else if (
                            nextSelected.filter((i) => mm.highlightedIndices.includes(i)).length ===
                            mm.highlightedIndices.length
                          ) {
                            // Level cleared!
                            gameAudio.playSuccess();
                            setCombo((c) => c + 1);
                            const nextLvl = mmLevel + 1;
                            const newScore = score + 50;
                            setScore(newScore);

                            if (nextLvl > 5) {
                              handleGameEnd(true, newScore, "Photographic memory achieved! Cleared all 5 matrix levels.");
                            } else {
                              setMmLevel(nextLvl);
                              const newGen = generateMemoryMatrixLevel(nextLvl);
                              setMm(newGen);
                              setMmShowing(true);
                              setMmSelected([]);
                              setTimeout(() => setMmShowing(false), newGen.displayDurationMs);
                            }
                          }
                        }}
                        className={`w-16 h-16 rounded-2xl border-2 transition-all active:scale-95 ${bg}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 8. SYMBOL MATCH */}
            {game.id === "symbol-match" && (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Find all matching pairs of mathematical symbols
                </div>

                <div className="grid grid-cols-4 gap-2.5 max-w-sm mx-auto">
                  {smCards.map((card, idx) => {
                    const isRevealed = card.isMatched || smFlipped.includes(idx);

                    return (
                      <button
                        key={card.id}
                        disabled={card.isMatched || isRevealed}
                        onClick={() => {
                          if (smFlipped.length === 0) {
                            setSmFlipped([idx]);
                          } else if (smFlipped.length === 1) {
                            const firstIdx = smFlipped[0];
                            const firstCard = smCards[firstIdx];
                            const newFlipped = [firstIdx, idx];
                            setSmFlipped(newFlipped);
                            setMoves((m) => m + 1);

                            if (firstCard.pairId === card.pairId) {
                              // Match!
                              setTimeout(() => {
                                const updated = smCards.map((c, i) =>
                                  i === firstIdx || i === idx ? { ...c, isMatched: true } : c
                                );
                                setSmCards(updated);
                                setSmFlipped([]);
                                setScore((s) => s + 40);

                                if (updated.every((c) => c.isMatched)) {
                                  handleGameEnd(true, score + 100, "All symbol pairs matched successfully!");
                                }
                              }, 400);
                            } else {
                              setTimeout(() => setSmFlipped([]), 900);
                            }
                          }
                        }}
                        className={`h-16 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                          isRevealed
                            ? "bg-purple-50 border-purple-400 text-purple-900"
                            : "bg-slate-800 border-slate-700 text-transparent hover:bg-slate-700"
                        }`}
                      >
                        {isRevealed ? card.symbol : "?"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 9. SEQUENCE MASTER */}
            {game.id === "sequence-master" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs font-bold text-slate-500">
                  Sequence Length: <strong className="text-rose-600 text-sm">{seqMaster.length}</strong>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-[240px] mx-auto">
                  {[
                    { id: "blue", bg: "bg-blue-600" },
                    { id: "emerald", bg: "bg-emerald-600" },
                    { id: "amber", bg: "bg-amber-500" },
                    { id: "rose", bg: "bg-rose-600" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => {
                        const nextPlayer = [...seqPlayer, btn.id];
                        setSeqPlayer(nextPlayer);

                        const check = validateSequenceInput(nextPlayer, seqMaster);
                        if (!check.isCorrectSoFar) {
                          handleGameEnd(false, seqMaster.length * 20, `Wrong color! Reached sequence length ${seqMaster.length}.`);
                        } else if (check.isRoundComplete) {
                          setScore((s) => s + 30);
                          setSeqPlayer([]);
                          const nextSeq = appendSequenceStep(seqMaster);
                          setSeqMaster(nextSeq);
                        }
                      }}
                      className={`w-28 h-28 rounded-3xl transition-transform active:scale-95 shadow-md ${btn.bg}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 10. SUDOKU */}
            {game.id === "sudoku" && (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Tap cell then select digit 1-9
                </div>

                <div className="grid grid-cols-9 gap-0.5 p-1 bg-slate-900 rounded-2xl max-w-[320px] mx-auto">
                  {sudGrid.map((row, r) =>
                    row.map((val, c) => {
                      const isInitial = sud.initialGrid[r][c] !== null;
                      const isSelected = selectedSudCell?.[0] === r && selectedSudCell?.[1] === c;

                      return (
                        <button
                          key={`${r}-${c}`}
                          onClick={() => setSelectedSudCell([r, c])}
                          className={`w-8 h-8 flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? "bg-blue-200 text-blue-900"
                              : isInitial
                              ? "bg-slate-100 text-slate-900"
                              : val
                              ? "bg-white text-blue-600"
                              : "bg-white text-transparent"
                          }`}
                        >
                          {val || ""}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Digits Pad */}
                <div className="flex justify-center gap-1.5 pt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        if (!selectedSudCell) return;
                        const [r, c] = selectedSudCell;
                        if (sud.initialGrid[r][c] !== null) return;

                        const nextGrid = sudGrid.map((rowArr, ri) =>
                          rowArr.map((cv, ci) => (ri === r && ci === c ? d : cv))
                        );
                        setSudGrid(nextGrid);
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-xs text-slate-800 hover:bg-blue-600 hover:text-white"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 11. MINESWEEPER */}
            {game.id === "minesweeper" && (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="flex items-center justify-between max-w-[280px] mx-auto text-xs font-bold text-slate-700">
                  <span>Mines: {msweeper.totalMines - msweeper.flagsUsed}</span>
                  <button
                    onClick={() => setFlagMode((f) => !f)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      flagMode ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    🚩 Flag: {flagMode ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="grid grid-cols-8 gap-1 p-2 bg-slate-200 rounded-2xl max-w-[280px] mx-auto shadow-inner">
                  {msweeper.grid.map((row, r) =>
                    row.map((cell, c) => {
                      let bg = "bg-slate-300 hover:bg-slate-400";
                      let text = "";

                      if (cell.isRevealed) {
                        if (cell.isMine) {
                          bg = "bg-rose-500 text-white";
                          text = "💣";
                        } else {
                          bg = "bg-slate-50 text-slate-800 font-bold";
                          text = cell.adjacentMines > 0 ? String(cell.adjacentMines) : "";
                        }
                      } else if (cell.isFlagged) {
                        text = "🚩";
                      }

                      return (
                        <button
                          key={`${r}-${c}`}
                          onClick={() => {
                            if (cell.isRevealed) return;
                            if (flagMode) {
                              const updated = {
                                ...msweeper,
                                grid: msweeper.grid.map((rA, ri) =>
                                  rA.map((cl, ci) =>
                                    ri === r && ci === c ? { ...cl, isFlagged: !cl.isFlagged } : cl
                                  )
                                ),
                              };
                              setMsweeper(updated);
                              return;
                            }

                            // First click mine safety placement
                            let activeGame = msweeper;
                            if (!msweeper.grid.some((rowA) => rowA.some((cl) => cl.isMine))) {
                              activeGame = placeMinesSafeFirstClick(msweeper, r, c);
                            }

                            const rev = revealMineCell(activeGame, r, c);
                            setMsweeper(rev.game);

                            if (rev.hitMine) {
                              handleGameEnd(false, 0, "Detonated a mine! Watch the numbers closely.");
                            } else if (rev.game.won) {
                              handleGameEnd(true, 250, "Minesweeper board safely swept! Flawless deduction.");
                            }
                          }}
                          className={`w-7 h-7 rounded text-xs flex items-center justify-center font-mono ${bg}`}
                        >
                          {text}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 12. TOWER OF HANOI */}
            {game.id === "tower-of-hanoi" && (
              <div className="w-full max-w-lg space-y-6 text-center">
                <div className="text-xs font-bold text-slate-500">
                  Moves: <strong className="text-blue-600">{hanoi.moveCount}</strong> • Optimal: {hanoi.optimalMoves} moves
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-b-4 border-slate-700 pb-2">
                  {[0, 1, 2].map((pegIdx) => {
                    const isSelected = selectedHanoiPeg === pegIdx;
                    const disks = hanoi.pegs[pegIdx as 0 | 1 | 2];

                    return (
                      <button
                        key={pegIdx}
                        onClick={() => {
                          if (selectedHanoiPeg === null) {
                            if (disks.length > 0) setSelectedHanoiPeg(pegIdx as 0 | 1 | 2);
                          } else {
                            const res = moveHanoiDisk(hanoi, selectedHanoiPeg, pegIdx as 0 | 1 | 2);
                            setSelectedHanoiPeg(null);
                            if (res.valid) {
                              setHanoi(res.state);
                              setMoves(res.state.moveCount);
                              if (res.won) {
                                handleGameEnd(true, 150, `Hanoi Tower solved in ${res.state.moveCount} moves!`);
                              }
                            } else if (res.error) {
                              alert(res.error);
                            }
                          }
                        }}
                        className={`h-40 rounded-2xl flex flex-col-reverse items-center justify-start p-2 transition-all ${
                          isSelected ? "bg-blue-100 ring-2 ring-blue-500" : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        {disks.map((disk) => (
                          <div
                            key={disk}
                            className="h-6 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 shadow-xs mb-1"
                            style={{ width: `${disk * 30 + 20}px` }}
                          />
                        ))}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-slate-400">
                  Tap a peg to pick up top disk, then tap destination peg.
                </div>
              </div>
            )}

            {/* 13. LIGHTS OUT */}
            {game.id === "lights-out" && (
              <div className="w-full max-w-sm space-y-6 text-center">
                <div className="text-xs font-bold text-slate-500">
                  Turn all the lights OFF to win!
                </div>

                <div className="grid grid-cols-5 gap-2.5 max-w-[280px] mx-auto">
                  {lights.map((row, r) =>
                    row.map((isOn, c) => (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => {
                          const updated = toggleLight(lights, r, c);
                          setLights(updated);
                          setMoves((m) => m + 1);

                          if (checkLightsOutWin(updated)) {
                            handleGameEnd(true, 180, "All lights successfully toggled off!");
                          }
                        }}
                        className={`w-12 h-12 rounded-2xl border-2 transition-all active:scale-95 ${
                          isOn
                            ? "bg-amber-400 border-amber-300 shadow-md shadow-amber-400/50"
                            : "bg-slate-800 border-slate-700"
                        }`}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 14. NUMBERLE */}
            {game.id === "numberle" && (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Guess the hidden 4-digit number in 6 tries
                </div>

                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, rIdx) => {
                    const guess = numGuesses[rIdx];
                    const isCurrent = rIdx === numGuesses.length;
                    const feedback = guess ? evaluateNumberleGuess(guess, numSecret) : null;

                    return (
                      <div key={rIdx} className="flex justify-center gap-2">
                        {Array.from({ length: 4 }).map((__, cIdx) => {
                          const digit = isCurrent ? currNumInput[cIdx] || "" : guess ? guess[cIdx] : "";
                          const st = feedback?.[cIdx]?.status;

                          let bg = "bg-white border-slate-200 text-slate-800";
                          if (st === "correct") bg = "bg-emerald-500 text-white border-emerald-500";
                          else if (st === "present") bg = "bg-amber-500 text-white border-amber-500";
                          else if (st === "absent") bg = "bg-slate-400 text-white border-slate-400";

                          return (
                            <div
                              key={cIdx}
                              className={`w-12 h-14 rounded-xl border-2 font-black text-xl flex items-center justify-center font-mono ${bg}`}
                            >
                              {digit}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto pt-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        if (currNumInput.length < 4) setCurrNumInput((prev) => prev + d);
                      }}
                      className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-mono font-bold text-base"
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 justify-center max-w-xs mx-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setCurrNumInput((prev) => prev.slice(0, -1))}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (currNumInput.length !== 4) return;
                      const nextGuesses = [...numGuesses, currNumInput];
                      setNumGuesses(nextGuesses);
                      setCurrNumInput("");

                      if (currNumInput === numSecret) {
                        handleGameEnd(true, 150, `Numberle cracked! Target was ${numSecret}`);
                      } else if (nextGuesses.length >= 6) {
                        handleGameEnd(false, 30, `Target was ${numSecret}`);
                      }
                    }}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {/* 15. NUMBER SEQUENCE */}
            {game.id === "number-sequence" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Identify the missing term in the sequence
                </div>

                <div className="flex items-center justify-center gap-2 font-mono font-bold text-xl">
                  {nseq.sequenceWithMissing.map((term, i) => (
                    <span
                      key={i}
                      className={`px-3 py-2 rounded-xl border ${
                        term === "?"
                          ? "bg-blue-600 text-white border-blue-600 animate-pulse"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      {term}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-4">
                  {nseq.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (opt === nseq.correctAnswer) {
                          handleGameEnd(true, 100, nseq.explanation);
                        } else {
                          handleGameEnd(false, 20, nseq.explanation);
                        }
                      }}
                      className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-600 font-bold text-lg text-slate-800"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 16. ODD ONE OUT */}
            {game.id === "odd-one-out" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Tap the unique number that does NOT belong to the pattern
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {odd.numbers.map((num, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (num === odd.outlier) {
                          handleGameEnd(true, 120, odd.explanation);
                        } else {
                          handleGameEnd(false, 20, odd.explanation);
                        }
                      }}
                      className="w-16 h-16 rounded-2xl border-2 border-slate-200 hover:border-amber-500 font-black text-2xl text-slate-900 shadow-xs"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 17. MISSING OPERATOR */}
            {game.id === "missing-operator" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Select the operators that balance the equation under BODMAS
                </div>

                <div className="text-3xl font-black text-slate-900 font-mono">
                  {mop.num1} <span className="text-blue-600">[ ? ]</span> {mop.num2}{" "}
                  <span className="text-blue-600">[ ? ]</span> {mop.num3} = {mop.result}
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  {mop.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const correctStr = `${mop.correctOp1} , ${mop.correctOp2}`;
                        if (opt === correctStr) {
                          handleGameEnd(true, 100, mop.explanation);
                        } else {
                          handleGameEnd(false, 20, mop.explanation);
                        }
                      }}
                      className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-600 font-mono font-bold text-lg text-slate-800"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 18. APPROXIMATION */}
            {game.id === "approximation" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Estimate the approximate value (no exact calculations)
                </div>

                <div className="text-2xl font-black text-slate-900 font-mono">
                  {appx.expression} ≈ ?
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  {appx.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (opt === appx.correctAnswer) {
                          handleGameEnd(true, 100, appx.explanation);
                        } else {
                          handleGameEnd(false, 20, appx.explanation);
                        }
                      }}
                      className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-emerald-600 font-bold text-xl text-slate-800"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 19. AVERAGE RACE */}
            {game.id === "average-race" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Calculate the exact mean of these numbers at speed
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {avg.numbers.map((n, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 font-black text-xl text-blue-900"
                    >
                      {n}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  {avg.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (opt === avg.average) {
                          handleGameEnd(true, 100, avg.shortcutExplanation);
                        } else {
                          handleGameEnd(false, 20, avg.shortcutExplanation);
                        }
                      }}
                      className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-600 font-bold text-xl text-slate-800"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 20. PERCENTAGE BLITZ */}
            {game.id === "percentage-blitz" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Fast percentage-to-fraction mental arithmetic
                </div>

                <div className="text-3xl font-black text-slate-900 font-mono">
                  {pb.prompt}
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  {pb.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (opt === pb.answer) {
                          handleGameEnd(true, 100, pb.fractionEquivalent);
                        } else {
                          handleGameEnd(false, 20, pb.fractionEquivalent);
                        }
                      }}
                      className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-orange-500 font-bold text-xl text-slate-800"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 21. SPEED COMPARISON */}
            {game.id === "speed-comparison" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Which quantity is strictly greater?
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
                    <span className="text-[10px] font-bold text-blue-500 uppercase block">Quantity A</span>
                    <span className="text-2xl font-black text-blue-950 font-mono">{sc.quantityA}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase block">Quantity B</span>
                    <span className="text-2xl font-black text-indigo-950 font-mono">{sc.quantityB}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  {[
                    { label: "Quantity A", rel: "A_GREATER" },
                    { label: "Equal", rel: "EQUAL" },
                    { label: "Quantity B", rel: "B_GREATER" },
                  ].map((btn) => (
                    <button
                      key={btn.rel}
                      onClick={() => {
                        if (btn.rel === sc.correctRelation) {
                          handleGameEnd(true, 100, sc.explanation);
                        } else {
                          handleGameEnd(false, 20, sc.explanation);
                        }
                      }}
                      className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 hover:border-indigo-600 font-bold text-sm text-slate-800 active:scale-95"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 22. SIMPLIFICATION SPRINT */}
            {game.id === "simplification-sprint" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Evaluate strictly under BODMAS priority
                </div>

                <div className="text-2xl font-black text-slate-900 font-mono">
                  {simp.expression} = ?
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  {simp.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (opt === simp.answer) {
                          handleGameEnd(true, 120, simp.steps.join("\n"));
                        } else {
                          handleGameEnd(false, 20, simp.steps.join("\n"));
                        }
                      }}
                      className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-600 font-bold text-xl text-slate-800"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 23. FACTOR FINDER */}
            {game.id === "factor-finder" && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  Target: {fac.targetNumber}
                </div>

                <div className="text-lg font-bold text-slate-900">{fac.prompt}</div>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                  {fac.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (opt === fac.answer) {
                          handleGameEnd(true, 100, fac.explanation);
                        } else {
                          handleGameEnd(false, 20, fac.explanation);
                        }
                      }}
                      className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-emerald-600 font-bold text-lg text-slate-800"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 24. BINARY PUZZLE */}
            {game.id === "binary-puzzle" && (
              <div className="w-full max-w-sm space-y-4 text-center">
                <div className="text-xs text-slate-500 font-semibold">
                  Fill with 0 and 1. Max 2 consecutive same digits. Equal 0s and 1s in every row & col.
                </div>

                <div className="grid grid-cols-6 gap-1 p-2 bg-slate-900 rounded-2xl max-w-[280px] mx-auto">
                  {binGrid.map((row, r) =>
                    row.map((val, c) => {
                      const isFixed = bin.initialGrid[r][c] !== null;

                      return (
                        <button
                          key={`${r}-${c}`}
                          disabled={isFixed}
                          onClick={() => {
                            const nextVal = val === null ? 0 : val === 0 ? 1 : null;
                            const nextG = binGrid.map((rA, ri) =>
                              rA.map((cv, ci) => (ri === r && ci === c ? nextVal : cv))
                            );
                            setBinGrid(nextG);

                            const chk = validateBinaryPuzzle(nextG);
                            if (chk.valid) {
                              handleGameEnd(true, 180, "Binary Puzzle solved! Strict parity and uniqueness satisfied.");
                            }
                          }}
                          className={`w-10 h-10 rounded font-mono font-black text-sm ${
                            isFixed
                              ? "bg-slate-700 text-slate-200"
                              : val === 0
                              ? "bg-blue-600 text-white"
                              : val === 1
                              ? "bg-amber-500 text-white"
                              : "bg-white text-transparent"
                          }`}
                        >
                          {val !== null ? val : ""}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* FALLBACK FOR REMAINING ENGINES (Kakuro, KenKen, Crossword, Futoshiki, Nonogram, Cryptarithm, Countdown) */}
            {["kakuro", "kenken", "countdown-numbers", "math-crossword", "killer-sudoku", "futoshiki", "nonogram", "cryptarithm"].includes(game.id) && (
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-2xl">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{game.title} Challenge Arena</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    {game.shortDescription}
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleGameEnd(true, 150, `Completed ${game.title} official pattern simulation!`)}
                    >
                      Complete Session & Claim XP
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Keyboard shortcuts bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-semibold px-2 gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-slate-500">⌨️ Shortcuts:</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">[1-9] Inputs</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">[H] Hint</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">[P] Pause</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">[M] Mute</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">[Alt+R] Restart</span>
              </div>
              <span className="hidden sm:inline text-slate-400 font-medium">OdishaRank Cognitive Aptitude</span>
            </div>
          </div>
        </main>
      </div>

      {/* Epic Game Victory / Completion Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white border border-indigo-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95 relative overflow-hidden">
            {/* Radiant decorative background glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

            <div
              className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg relative z-10 ${
                isWon
                  ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 ring-4 ring-amber-400/30"
                  : "bg-slate-800 text-slate-300 ring-4 ring-slate-700"
              }`}
            >
              {isWon ? <Trophy className="w-10 h-10" /> : <Sparkles className="w-10 h-10" />}
            </div>

            <div className="relative z-10 space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-amber-300 border border-amber-300/30 mb-1">
                {isWon ? "MISSION ACCOMPLISHED" : "DRILL COMPLETED"}
              </span>
              <h3 className="text-2xl font-black text-white">
                {isWon ? "Cognitive Victory!" : "Practice Concluded"}
              </h3>
              <p className="text-xs text-slate-300">
                {isWon
                  ? "Outstanding speed and precision. +15 Brain Score Rating awarded!"
                  : "Every attempt trains neural synapses and builds exam speed."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 relative z-10 font-mono">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Score</span>
                <span className="text-xl font-black text-amber-400">+{score}</span>
              </div>
              <div className="text-center border-x border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time</span>
                <span className="text-xl font-black text-cyan-300">
                  {Math.floor(timeSeconds / 60)}:{(timeSeconds % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Streak</span>
                <span className="text-xl font-black text-emerald-400">
                  {combo >= 2 ? `${combo}x` : "1x"}
                </span>
              </div>
            </div>

            {explanation && (
              <div className="text-left p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1 relative z-10">
                <span className="font-extrabold text-cyan-300 block">Solution & Method:</span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-[11px]">{explanation}</p>
              </div>
            )}

            <div className="space-y-2 pt-2 relative z-10">
              <Button
                variant="primary"
                size="md"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30"
                onClick={handleRestart}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Another Round
              </Button>

              <div className="flex gap-2">
                <button
                  onClick={handleShareChallenge}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{copiedChallenge ? "Link Copied!" : "Share Challenge"}</span>
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-white/5 border-white/15 text-white hover:bg-white/10"
                  onClick={() => router.push("/games")}
                >
                  All 32 Games
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules / Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">{game.title} Rules</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div>
                <strong className="text-slate-900 block mb-1">How to Play:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  {game.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong className="text-slate-900 block mb-1">Exam Aptitude Benefit:</strong>
                <p className="bg-blue-50 p-2.5 rounded-xl text-blue-900 border border-blue-200">
                  {game.examRelevance}
                </p>
              </div>
            </div>

            <Button variant="primary" size="sm" className="w-full" onClick={() => setShowHelpModal(false)}>
              Got it, let&apos;s play!
            </Button>
          </div>
        </div>
      )}

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExam?.title || "Odisha State Competitive Exam"}
      />

      {showCourseModal && (
        <CourseSelectModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          currentExamId={targetExam?.id || null}
          exams={allExams}
        />
      )}
    </div>
  );
};
