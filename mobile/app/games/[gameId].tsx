import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  RotateCcw,
  Clock,
  Trophy,
  Check,
  X,
  HelpCircle,
  Sparkles,
  Flame,
  ArrowRight,
  Lightbulb,
  Pause,
  Play,
  Share2,
} from "lucide-react-native";
import {
  GAMES_CATALOG,
  getGameById,
  GameId,
  BRAND_COLORS,
  generate24GamePuzzle,
  validate24GameExpression,
  init2048Game,
  slide2048,
  check2048GameOver,
  generateMagicSquarePuzzle,
  validateMagicSquare,
  generateNumberBonds,
  generateNerdlePuzzle,
  evaluateNerdleGuess,
  generateQuickCalcQuestion,
  generateMemoryMatrixLevel,
  generateSymbolMatchGame,
  appendSequenceStep,
  validateSequenceInput,
  generateSudokuPuzzle,
  initMinesweeper,
  placeMinesSafeFirstClick,
  revealMineCell,
  initTowerOfHanoi,
  moveHanoiDisk,
  initLightsOut,
  toggleLight,
  checkLightsOutWin,
  generateNumberleSecret,
  evaluateNumberleGuess,
  generateNumberSequenceQuestion,
  generateOddOneOutQuestion,
  generateMissingOperatorQuestion,
  generateApproximationQuestion,
  generateAverageQuestion,
  generatePercentageQuestion,
  generateSpeedComparisonQuestion,
  generateSimplificationQuestion,
  generateFactorFinderQuestion,
  generateBinaryPuzzle,
  validateBinaryPuzzle,
  generateKakuroPuzzle,
  generateKenKen4x4,
  generateCountdownPuzzle,
  generateMathCrossword,
  generateKillerSudoku6x6,
  generateFutoshiki4x4,
  generateNonogram5x5,
  generateCryptarithmPuzzle,
  validateSudokuCell,
} from "@odisha-rank/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

function getGameHint(gameId?: string): string {
  switch (gameId) {
    case "game-24":
      return "💡 Strategy: Combine pairs to reach 6, 8, 3, or 4 first (since 6×4=24 and 8×3=24).";
    case "game-2048":
      return "💡 Corner Strategy: Keep your highest-value tile locked in one corner and avoid moving it away.";
    case "magic-square":
      return "💡 Magic Constant: Every row, column, and diagonal must sum to the same magic number. Center is 5.";
    case "quick-calc":
      return "💡 Mental Math: Multiplying by 5 is dividing by 2 and multiplying by 10 (46 × 5 = 23 × 10 = 230).";
    case "number-bonds":
      return "💡 Mental Complement: Look for numbers whose units digits add up to 10.";
    case "nerdle":
      return "💡 BODMAS Rule: Multiplication & Division evaluate before Addition & Subtraction.";
    case "memory-matrix":
      return "💡 Visual Chunking: Group illuminated tiles into recognizable shapes.";
    case "sudoku":
      return "💡 Elimination: Check rows and columns for missing single candidate numbers.";
    case "minesweeper":
      return "💡 Safe Move: A '1' touching only one hidden tile means it is guaranteed a mine.";
    case "tower-of-hanoi":
      return "💡 Hanoi Principle: A larger disk can never sit on a smaller disk.";
    default:
      return "💡 Analyze the constraints, eliminate impossible choices, and verify against standard math rules.";
  }
}

export default function MobileGameArenaScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = getGameById(gameId as GameId);

  const [timeSeconds, setTimeSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [explanation, setExplanation] = useState("");

  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Global Timer (Freezes on pause or game over)
  useEffect(() => {
    if (isGameOver || isPaused) return;
    const interval = setInterval(() => {
      setTimeSeconds((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, isPaused]);

  const handleFinish = async (won: boolean, pts: number, exp?: string) => {
    setIsGameOver(true);
    setIsWon(won);
    const ptsWithCombo = won && combo >= 2 ? Math.round(pts * (1 + combo * 0.1)) : pts;
    setScore(ptsWithCombo);
    if (exp) setExplanation(exp);

    // Save full stats to local mobile storage
    try {
      const prev = await AsyncStorage.getItem("@odisha_rank_game_stats");
      const current = prev
        ? JSON.parse(prev)
        : {
            brainScore: 550,
            totalPlayed: 0,
            totalWins: 0,
            streakDays: 1,
            categoryProficiency: { math: 50, memory: 50, logic: 50, pattern: 50 },
          };

      current.totalPlayed = (current.totalPlayed || 0) + 1;
      if (won) current.totalWins = (current.totalWins || 0) + 1;
      if (won) current.brainScore = Math.min(1000, (current.brainScore || 550) + 15);
      if (game?.category && current.categoryProficiency) {
        current.categoryProficiency[game.category] = Math.min(
          100,
          (current.categoryProficiency[game.category] || 50) + (won ? 8 : 2)
        );
      }
      await AsyncStorage.setItem("@odisha_rank_game_stats", JSON.stringify(current));
    } catch {}
  };

  // ==========================================
  // GAME STATES
  // ==========================================
  // 1. 24 Game
  const [p24, setP24] = useState(() => generate24GamePuzzle());
  const [expr24, setExpr24] = useState("");

  // 2. 2048
  const [g2048, setG2048] = useState(() => init2048Game());

  // 3. Quick Calc
  const [qc, setQc] = useState(() => generateQuickCalcQuestion());
  const [qcStreak, setQcStreak] = useState(0);

  // 4. Number Bonds
  const [nb, setNb] = useState(() => generateNumberBonds(100, 6));
  const [selNb, setSelNb] = useState<string | null>(null);

  // 5. Memory Matrix
  const [mmLevel, setMmLevel] = useState(1);
  const [mm, setMm] = useState(() => generateMemoryMatrixLevel(1));
  const [mmShow, setMmShow] = useState(true);
  const [mmSel, setMmSel] = useState<number[]>([]);

  // 6. Numberle
  const [numSec, setNumSec] = useState(() => generateNumberleSecret(4));
  const [numGuess, setNumGuess] = useState<string[]>([]);
  const [numInput, setNumInput] = useState("");

  // 7. Sequence Master
  const [seqMaster, setSeqMaster] = useState<any[]>(() => appendSequenceStep([]));
  const [seqPlayer, setSeqPlayer] = useState<any[]>([]);

  // 8. Number Sequence
  const [nseq, setNseq] = useState(() => generateNumberSequenceQuestion());

  // 9. Odd One Out
  const [odd, setOdd] = useState(() => generateOddOneOutQuestion());

  // 10. Missing Operator
  const [mop, setMop] = useState(() => generateMissingOperatorQuestion());

  // 11. Approximation
  const [appx, setAppx] = useState(() => generateApproximationQuestion());

  // 12. Speed Comparison
  const [sc, setSc] = useState(() => generateSpeedComparisonQuestion());

  // 13. Tower of Hanoi
  const [hanoi, setHanoi] = useState(() => initTowerOfHanoi(3));
  const [selHanoi, setSelHanoi] = useState<0 | 1 | 2 | null>(null);

  // 14. Lights Out
  const [lights, setLights] = useState(() => initLightsOut(5));

  // 15. Symbol Match
  const [smCards, setSmCards] = useState(() => generateSymbolMatchGame(6));
  const [smFlipped, setSmFlipped] = useState<number[]>([]);

  // 16. Magic Square
  const [ms, setMs] = useState(() => generateMagicSquarePuzzle());
  const [msGrid, setMsGrid] = useState<number[][]>(() =>
    ms.initialGrid.map((r) => r.map((c) => c || 0))
  );
  const [selMsCell, setSelMsCell] = useState<[number, number] | null>(null);

  // 17. Nerdle
  const [nerdle, setNerdle] = useState(() => generateNerdlePuzzle());
  const [nerdleGuesses, setNerdleGuesses] = useState<string[]>([]);
  const [currentNerdleInput, setCurrentNerdleInput] = useState("");

  // 18. Sudoku
  const [sud, setSud] = useState(() => generateSudokuPuzzle("easy"));
  const [sudGrid, setSudGrid] = useState(() => sud.initialGrid.map((r) => [...r]));
  const [selSudCell, setSelSudCell] = useState<[number, number] | null>(null);

  // 19. Minesweeper
  const [msweeper, setMsweeper] = useState(() => initMinesweeper(8, 8, 10));
  const [flagMode, setFlagMode] = useState(false);

  // 20. Binary Puzzle
  const [bin, setBin] = useState(() => generateBinaryPuzzle());
  const [binGrid, setBinGrid] = useState(() => bin.initialGrid.map((r) => [...r]));

  // 21. Average Race
  const [avg, setAvg] = useState(() => generateAverageQuestion());

  // 22. Percentage Blitz
  const [pb, setPb] = useState(() => generatePercentageQuestion());

  // 23. Simplification Sprint
  const [simp, setSimp] = useState(() => generateSimplificationQuestion());

  // 24. Factor Finder
  const [fac, setFac] = useState(() => generateFactorFinderQuestion());

  // 25. Kakuro
  const [kak, setKak] = useState(() => generateKakuroPuzzle());
  const [kakGrid, setKakGrid] = useState<(number | null)[][]>(() =>
    kak.initialGrid.map((r) => [...r])
  );
  const [selKakCell, setSelKakCell] = useState<[number, number] | null>(null);

  // 26. KenKen
  const [ken, setKen] = useState(() => generateKenKen4x4());
  const [kenGrid, setKenGrid] = useState<number[][]>(() => [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [selKenCell, setSelKenCell] = useState<[number, number] | null>(null);

  // 27. Countdown
  const [cd, setCd] = useState(() => generateCountdownPuzzle());
  const [cdExpr, setCdExpr] = useState("");

  // 28. Math Crossword
  const [mc, setMc] = useState(() => generateMathCrossword());
  const [mcInputs, setMcInputs] = useState<Record<string, string>>({});
  const [selMcCoord, setSelMcCoord] = useState<string | null>(null);

  // 29. Killer Sudoku
  const [ks, setKs] = useState(() => generateKillerSudoku6x6());
  const [ksGrid, setKsGrid] = useState<number[][]>(() =>
    Array.from({ length: 6 }, () => new Array(6).fill(0))
  );
  const [selKsCell, setSelKsCell] = useState<[number, number] | null>(null);

  // 30. Futoshiki
  const [fut, setFut] = useState(() => generateFutoshiki4x4());
  const [futGrid, setFutGrid] = useState<number[][]>(() => [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [selFutCell, setSelFutCell] = useState<[number, number] | null>(null);

  // 31. Nonogram
  const [nono, setNono] = useState(() => generateNonogram5x5());
  const [nonoGrid, setNonoGrid] = useState<boolean[][]>(() =>
    Array.from({ length: 5 }, () => new Array(5).fill(false))
  );

  // 32. Cryptarithm
  const [crypt, setCrypt] = useState(() => generateCryptarithmPuzzle());
  const [cryptMap, setCryptMap] = useState<Record<string, number>>({});
  const [selCryptLetter, setSelCryptLetter] = useState<string | null>(null);

  // Memory Matrix Flash timer
  useEffect(() => {
    if (game?.id !== "memory-matrix") return;
    setMmShow(true);
    const tm = setTimeout(() => setMmShow(false), mm.displayDurationMs);
    return () => clearTimeout(tm);
  }, [game?.id, mm]);

  if (!game) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 40 }}>Game Not Found</Text>
      </SafeAreaView>
    );
  }

  const handleReset = () => {
    setTimeSeconds(0);
    setScore(0);
    setIsGameOver(false);
    setIsWon(false);
    setExplanation("");

    if (game.id === "game-24") {
      setP24(generate24GamePuzzle());
      setExpr24("");
    } else if (game.id === "game-2048") {
      setG2048(init2048Game());
    } else if (game.id === "quick-calc") {
      setQc(generateQuickCalcQuestion());
      setQcStreak(0);
    } else if (game.id === "number-bonds") {
      setNb(generateNumberBonds(100, 6));
      setSelNb(null);
    } else if (game.id === "memory-matrix") {
      setMmLevel(1);
      const l = generateMemoryMatrixLevel(1);
      setMm(l);
      setMmShow(true);
      setMmSel([]);
      setTimeout(() => setMmShow(false), l.displayDurationMs);
    } else if (game.id === "numberle") {
      setNumSec(generateNumberleSecret(4));
      setNumGuess([]);
      setNumInput("");
    } else if (game.id === "number-sequence") {
      setNseq(generateNumberSequenceQuestion());
    } else if (game.id === "odd-one-out") {
      setOdd(generateOddOneOutQuestion());
    } else if (game.id === "missing-operator") {
      setMop(generateMissingOperatorQuestion());
    } else if (game.id === "approximation") {
      setAppx(generateApproximationQuestion());
    } else if (game.id === "speed-comparison") {
      setSc(generateSpeedComparisonQuestion());
    } else if (game.id === "tower-of-hanoi") {
      setHanoi(initTowerOfHanoi(3));
      setSelHanoi(null);
    } else if (game.id === "lights-out") {
      setLights(initLightsOut(5));
    } else if (game.id === "symbol-match") {
      setSmCards(generateSymbolMatchGame(6));
      setSmFlipped([]);
    } else if (game.id === "magic-square") {
      const newMs = generateMagicSquarePuzzle();
      setMs(newMs);
      setMsGrid(newMs.initialGrid.map((r) => r.map((c) => c || 0)));
      setSelMsCell(null);
    } else if (game.id === "nerdle") {
      setNerdle(generateNerdlePuzzle());
      setNerdleGuesses([]);
      setCurrentNerdleInput("");
    } else if (game.id === "sudoku") {
      const newSud = generateSudokuPuzzle("easy");
      setSud(newSud);
      setSudGrid(newSud.initialGrid.map((r) => [...r]));
      setSelSudCell(null);
    } else if (game.id === "minesweeper") {
      setMsweeper(initMinesweeper(8, 8, 10));
      setFlagMode(false);
    } else if (game.id === "binary-puzzle") {
      const newBin = generateBinaryPuzzle();
      setBin(newBin);
      setBinGrid(newBin.initialGrid.map((r) => [...r]));
    } else if (game.id === "average-race") {
      setAvg(generateAverageQuestion());
    } else if (game.id === "percentage-blitz") {
      setPb(generatePercentageQuestion());
    } else if (game.id === "simplification-sprint") {
      setSimp(generateSimplificationQuestion());
    } else if (game.id === "factor-finder") {
      setFac(generateFactorFinderQuestion());
    } else if (game.id === "kakuro") {
      const newKak = generateKakuroPuzzle();
      setKak(newKak);
      setKakGrid(newKak.initialGrid.map((r) => [...r]));
      setSelKakCell(null);
    } else if (game.id === "kenken") {
      setKen(generateKenKen4x4());
      setKenGrid([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      setSelKenCell(null);
    } else if (game.id === "countdown-numbers") {
      setCd(generateCountdownPuzzle());
      setCdExpr("");
    } else if (game.id === "math-crossword") {
      setMc(generateMathCrossword());
      setMcInputs({});
      setSelMcCoord(null);
    } else if (game.id === "killer-sudoku") {
      setKs(generateKillerSudoku6x6());
      setKsGrid(Array.from({ length: 6 }, () => new Array(6).fill(0)));
      setSelKsCell(null);
    } else if (game.id === "futoshiki") {
      setFut(generateFutoshiki4x4());
      setFutGrid([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      setSelFutCell(null);
    } else if (game.id === "nonogram") {
      setNono(generateNonogram5x5());
      setNonoGrid(Array.from({ length: 5 }, () => new Array(5).fill(false)));
    } else if (game.id === "cryptarithm") {
      setCrypt(generateCryptarithmPuzzle());
      setCryptMap({});
      setSelCryptLetter(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Navigation Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{game.title}</Text>
          <Text style={styles.headerSub}>{game.category} • cognitive drill</Text>
        </View>

        {combo >= 2 && (
          <View style={styles.comboPill}>
            <Flame size={12} color="#f59e0b" />
            <Text style={styles.comboPillText}>{combo}x</Text>
          </View>
        )}

        <View style={styles.timerChip}>
          <Clock size={12} color="#2563eb" />
          <Text style={styles.timerText}>
            {Math.floor(timeSeconds / 60)}:{(timeSeconds % 60).toString().padStart(2, "0")}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowHint((h) => !h)} style={styles.iconBtn}>
          <Lightbulb size={16} color={showHint ? "#d97706" : "#64748b"} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsPaused((p) => !p)} style={styles.iconBtn}>
          {isPaused ? <Play size={16} color="#059669" /> : <Pause size={16} color="#64748b" />}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReset} style={styles.iconBtn}>
          <RotateCcw size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Hint Strategy Banner */}
      {showHint && (
        <View style={styles.hintBanner}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Lightbulb size={13} color="#b45309" />
              <Text style={styles.hintTitle}>Strategy Tip</Text>
            </View>
            <TouchableOpacity onPress={() => setShowHint(false)}>
              <X size={14} color="#78350f" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hintBody}>{getGameHint(game.id)}</Text>
        </View>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Pause size={32} color="#2563eb" style={{ marginBottom: 8 }} />
            <Text style={styles.pauseTitle}>Drill Paused</Text>
            <Text style={styles.pauseSub}>Timer is frozen. Take a breath and resume whenever ready.</Text>
            <TouchableOpacity onPress={() => setIsPaused(false)} style={styles.resumeBtn}>
              <Text style={styles.resumeBtnText}>Resume Practice</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.arenaContent}>
        {/* 1. 24 GAME */}
        {game.id === "game-24" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Use all 4 numbers with operations to make 24
            </Text>

            <View style={styles.numCardsRow}>
              {p24.numbers.map((n, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.bigNumCard}
                  onPress={() => setExpr24((prev) => `${prev} ${n}`.trim())}
                >
                  <Text style={styles.bigNumText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formulaDisplay}>
              <Text style={styles.formulaText}>
                {expr24 || "Tap numbers & operators..."}
              </Text>
            </View>

            <View style={styles.keypadRow}>
              {["+", "-", "*", "/", "(", ")"].map((op) => (
                <TouchableOpacity
                  key={op}
                  style={styles.opKey}
                  onPress={() => setExpr24((prev) => `${prev} ${op}`.trim())}
                >
                  <Text style={styles.opKeyText}>
                    {op === "*" ? "×" : op === "/" ? "÷" : op}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#f1f5f9" }]}
                onPress={() => setExpr24("")}
              >
                <Text style={styles.actionBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#2563eb" }]}
                onPress={() => {
                  const res = validate24GameExpression(expr24, p24.numbers);
                  if (res.valid) {
                    handleFinish(true, 100, `Solved! Expression: ${expr24} = 24`);
                  } else {
                    Alert.alert("Check Failed", res.error || "Does not equal 24");
                  }
                }}
              >
                <Text style={[styles.actionBtnText, { color: "#ffffff" }]}>Check = 24</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2. 2048 */}
        {game.id === "game-2048" && (
          <View style={styles.gameWrapper}>
            <View style={styles.grid2048}>
              {g2048.board.map((row, r) =>
                row.map((val, c) => (
                  <View
                    key={`${r}-${c}`}
                    style={[
                      styles.cell2048,
                      val > 0 && {
                        backgroundColor:
                          val === 2
                            ? "#e2e8f0"
                            : val === 4
                            ? "#fed7aa"
                            : val === 8
                            ? "#fb923c"
                            : val >= 16
                            ? "#ea580c"
                            : "#e2e8f0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cell2048Text,
                        val >= 8 && { color: "#ffffff" },
                      ]}
                    >
                      {val > 0 ? val : ""}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* D-Pad */}
            <View style={styles.dpad}>
              <TouchableOpacity
                style={styles.dpadBtn}
                onPress={() => {
                  const res = slide2048(g2048.board, "up");
                  setG2048({ ...g2048, board: res.board, score: g2048.score + res.scoreGained });
                }}
              >
                <Text style={styles.dpadText}>↑</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={styles.dpadBtn}
                  onPress={() => {
                    const res = slide2048(g2048.board, "left");
                    setG2048({ ...g2048, board: res.board, score: g2048.score + res.scoreGained });
                  }}
                >
                  <Text style={styles.dpadText}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dpadBtn}
                  onPress={() => {
                    const res = slide2048(g2048.board, "down");
                    setG2048({ ...g2048, board: res.board, score: g2048.score + res.scoreGained });
                  }}
                >
                  <Text style={styles.dpadText}>↓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dpadBtn}
                  onPress={() => {
                    const res = slide2048(g2048.board, "right");
                    setG2048({ ...g2048, board: res.board, score: g2048.score + res.scoreGained });
                  }}
                >
                  <Text style={styles.dpadText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 3. QUICK CALC */}
        {game.id === "quick-calc" && (
          <View style={styles.gameWrapper}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "center" }}>
              <Flame size={18} color="#dc2626" />
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#dc2626" }}>
                Streak: {qcStreak}x
              </Text>
            </View>

            <Text style={styles.hugePrompt}>{qc.prompt} = ?</Text>

            <View style={styles.choicesGrid}>
              {qc.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.choiceBtn}
                  onPress={() => {
                    if (opt === qc.answer) {
                      setScore((s) => s + 20 + qcStreak * 5);
                      setQcStreak((s) => s + 1);
                      setQc(generateQuickCalcQuestion());
                    } else {
                      setQcStreak(0);
                      setQc(generateQuickCalcQuestion());
                    }
                  }}
                >
                  <Text style={styles.choiceBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 4. NUMBER BONDS */}
        {game.id === "number-bonds" && (
          <View style={styles.gameWrapper}>
            <View style={styles.targetBanner}>
              <Text style={styles.targetBannerText}>Target Sum: {nb.target}</Text>
            </View>

            <View style={styles.bondsGrid}>
              {nb.cards.map((c) => {
                if (c.matched) {
                  return (
                    <View key={c.id} style={[styles.bondCard, { opacity: 0.25 }]}>
                      <Check size={20} color="#059669" />
                    </View>
                  );
                }
                const isSelected = selNb === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.bondCard, isSelected && styles.bondCardSelected]}
                    onPress={() => {
                      if (!selNb) {
                        setSelNb(c.id);
                      } else if (selNb === c.id) {
                        setSelNb(null);
                      } else {
                        const first = nb.cards.find((x) => x.id === selNb);
                        if (first && first.value + c.value === nb.target) {
                          const updated = nb.cards.map((x) =>
                            x.id === first.id || x.id === c.id ? { ...x, matched: true } : x
                          );
                          setNb({ ...nb, cards: updated });
                          setSelNb(null);
                          setScore((s) => s + 50);

                          if (updated.every((x) => x.matched)) {
                            handleFinish(true, score + 100, "All pairs cleared!");
                          }
                        } else {
                          setSelNb(null);
                        }
                      }
                    }}
                  >
                    <Text style={[styles.bondCardText, isSelected && { color: "#ffffff" }]}>
                      {c.value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 5. NUMBER SEQUENCE */}
        {game.id === "number-sequence" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Find the missing number</Text>
            <View style={styles.seqRow}>
              {nseq.sequenceWithMissing.map((term, i) => (
                <View
                  key={i}
                  style={[
                    styles.seqChip,
                    term === "?" && { backgroundColor: "#2563eb", borderColor: "#2563eb" },
                  ]}
                >
                  <Text style={[styles.seqChipText, term === "?" && { color: "#ffffff" }]}>
                    {term}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.choicesGrid}>
              {nseq.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.choiceBtn}
                  onPress={() => {
                    if (opt === nseq.correctAnswer) {
                      handleFinish(true, 100, nseq.explanation);
                    } else {
                      handleFinish(false, 20, nseq.explanation);
                    }
                  }}
                >
                  <Text style={styles.choiceBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 6. ODD ONE OUT */}
        {game.id === "odd-one-out" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Spot the number that breaks the pattern</Text>
            <View style={styles.numCardsRow}>
              {odd.numbers.map((n, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.bigNumCard}
                  onPress={() => {
                    if (n === odd.outlier) {
                      handleFinish(true, 100, odd.explanation);
                    } else {
                      handleFinish(false, 20, odd.explanation);
                    }
                  }}
                >
                  <Text style={styles.bigNumText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 7. MISSING OPERATOR */}
        {game.id === "missing-operator" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Fill operators under BODMAS</Text>
            <Text style={styles.hugePrompt}>
              {mop.num1} ? {mop.num2} ? {mop.num3} = {mop.result}
            </Text>

            <View style={styles.choicesGrid}>
              {mop.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.choiceBtn}
                  onPress={() => {
                    const corr = `${mop.correctOp1} , ${mop.correctOp2}`;
                    if (opt === corr) {
                      handleFinish(true, 100, mop.explanation);
                    } else {
                      handleFinish(false, 20, mop.explanation);
                    }
                  }}
                >
                  <Text style={styles.choiceBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 8. SPEED COMPARISON */}
        {game.id === "speed-comparison" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Which quantity is greater?</Text>
            <View style={{ flexDirection: "row", gap: 10, alignSelf: "center", marginBottom: 20 }}>
              <View style={styles.compBox}>
                <Text style={styles.compSub}>Quantity A</Text>
                <Text style={styles.compVal}>{sc.quantityA}</Text>
              </View>
              <View style={styles.compBox}>
                <Text style={styles.compSub}>Quantity B</Text>
                <Text style={styles.compVal}>{sc.quantityB}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { label: "Quantity A", rel: "A_GREATER" },
                { label: "Equal", rel: "EQUAL" },
                { label: "Quantity B", rel: "B_GREATER" },
              ].map((btn) => (
                <TouchableOpacity
                  key={btn.rel}
                  style={styles.actionBtnWide}
                  onPress={() => {
                    if (btn.rel === sc.correctRelation) {
                      handleFinish(true, 100, sc.explanation);
                    } else {
                      handleFinish(false, 20, sc.explanation);
                    }
                  }}
                >
                  <Text style={styles.actionBtnWideText}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 9. APPROXIMATION */}
        {game.id === "approximation" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Estimate the approximate result</Text>
            <Text style={styles.hugePrompt}>{appx.expression} ≈ ?</Text>

            <View style={styles.choicesGrid}>
              {appx.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.choiceBtn}
                  onPress={() => {
                    if (opt === appx.correctAnswer) {
                      handleFinish(true, 100, appx.explanation);
                    } else {
                      handleFinish(false, 20, appx.explanation);
                    }
                  }}
                >
                  <Text style={styles.choiceBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 10. TOWER OF HANOI */}
        {game.id === "tower-of-hanoi" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Moves: {hanoi.moveCount} • Target: {hanoi.optimalMoves} moves
            </Text>

            <View style={styles.hanoiRow}>
              {[0, 1, 2].map((pegIdx) => {
                const isSelected = selHanoi === pegIdx;
                const disks = hanoi.pegs[pegIdx as 0 | 1 | 2];
                return (
                  <TouchableOpacity
                    key={pegIdx}
                    style={[styles.hanoiPeg, isSelected && { borderColor: "#2563eb", borderWidth: 2 }]}
                    onPress={() => {
                      if (selHanoi === null) {
                        if (disks.length > 0) setSelHanoi(pegIdx as 0 | 1 | 2);
                      } else {
                        const res = moveHanoiDisk(hanoi, selHanoi, pegIdx as 0 | 1 | 2);
                        setSelHanoi(null);
                        if (res.valid) {
                          setHanoi(res.state);
                          if (res.won) handleFinish(true, 150, "Tower of Hanoi transfer completed!");
                        }
                      }
                    }}
                  >
                    {disks.map((d) => (
                      <View
                        key={d}
                        style={[
                          styles.hanoiDisk,
                          { width: d * 25 + 20, backgroundColor: "#f59e0b" },
                        ]}
                      />
                    ))}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 11. LIGHTS OUT */}
        {game.id === "lights-out" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Turn all lights OFF to win</Text>
            <View style={styles.lightsGrid}>
              {lights.map((row, r) =>
                row.map((isOn, c) => (
                  <TouchableOpacity
                    key={`${r}-${c}`}
                    style={[
                      styles.lightCell,
                      isOn ? { backgroundColor: "#f59e0b" } : { backgroundColor: "#1e293b" },
                    ]}
                    onPress={() => {
                      const next = toggleLight(lights, r, c);
                      setLights(next);
                      if (checkLightsOutWin(next)) {
                        handleFinish(true, 150, "All lights turned off successfully!");
                      }
                    }}
                  />
                ))
              )}
            </View>
          </View>
        )}

        {/* 12. SYMBOL MATCH */}
        {game.id === "symbol-match" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Match pairs of math symbols</Text>
            <View style={styles.smGrid}>
              {smCards.map((card, i) => {
                const isRev = card.isMatched || smFlipped.includes(i);
                return (
                  <TouchableOpacity
                    key={card.id}
                    disabled={card.isMatched || isRev}
                    style={[styles.smCard, isRev && { backgroundColor: "#f5f3ff", borderColor: "#c084fc" }]}
                    onPress={() => {
                      if (smFlipped.length === 0) {
                        setSmFlipped([i]);
                      } else if (smFlipped.length === 1) {
                        const fst = smFlipped[0];
                        setSmFlipped([fst, i]);
                        if (smCards[fst].pairId === card.pairId) {
                          setTimeout(() => {
                            const upd = smCards.map((c, ci) =>
                              ci === fst || ci === i ? { ...c, isMatched: true } : c
                            );
                            setSmCards(upd);
                            setSmFlipped([]);
                            setScore((s) => s + 40);
                            if (upd.every((x) => x.isMatched)) {
                              handleFinish(true, score + 100, "All symbols matched!");
                            }
                          }, 400);
                        } else {
                          setTimeout(() => setSmFlipped([]), 800);
                        }
                      }
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: "900", color: isRev ? "#7e22ce" : "#1e293b" }}>
                      {isRev ? card.symbol : "?"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 13. MAGIC SQUARE */}
        {game.id === "magic-square" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Fill digits 1-9 so every row, column & diagonal sums to {ms.targetSum}
            </Text>
            <View style={styles.msGrid}>
              {msGrid.map((row, r) => (
                <View key={r} style={styles.msRow}>
                  {row.map((val, c) => {
                    const isInit = ms.initialGrid[r][c] !== null;
                    const isSel = selMsCell?.[0] === r && selMsCell?.[1] === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        disabled={isInit}
                        style={[
                          styles.msCell,
                          isInit && styles.msCellInit,
                          isSel && styles.msCellSel,
                        ]}
                        onPress={() => setSelMsCell([r, c])}
                      >
                        <Text style={[styles.msCellText, isInit && styles.msCellTextInit]}>
                          {val > 0 ? val : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitKey}
                  onPress={() => {
                    if (!selMsCell) return;
                    const [r, c] = selMsCell;
                    const next = msGrid.map((rowArr, ri) =>
                      rowArr.map((cv, ci) => (ri === r && ci === c ? d : cv))
                    );
                    setMsGrid(next);
                    const chk = validateMagicSquare(next, ms.targetSum);
                    if (chk.valid) {
                      handleFinish(true, 150, "Magic Square solved! All lines sum to 15.");
                    }
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 14. NERDLE */}
        {game.id === "nerdle" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Guess the hidden 8-character math equation in 6 tries
            </Text>
            <View style={styles.nerdleBoard}>
              {Array.from({ length: 6 }).map((_, rIdx) => {
                const guess = nerdleGuesses[rIdx];
                const isCurr = rIdx === nerdleGuesses.length;
                const evalRes = guess ? evaluateNerdleGuess(guess, nerdle.solutionEquation) : null;
                return (
                  <View key={rIdx} style={styles.nerdleRow}>
                    {Array.from({ length: 8 }).map((__, cIdx) => {
                      const char = isCurr
                        ? currentNerdleInput[cIdx] || ""
                        : guess
                        ? guess[cIdx]
                        : "";
                      const st = evalRes?.statuses?.[cIdx];
                      let bg = "#ffffff";
                      let color = "#0f172a";
                      if (st === "correct") {
                        bg = "#10b981";
                        color = "#ffffff";
                      } else if (st === "present") {
                        bg = "#9333ea";
                        color = "#ffffff";
                      } else if (st === "absent") {
                        bg = "#94a3b8";
                        color = "#ffffff";
                      }
                      return (
                        <View key={cIdx} style={[styles.nerdleCell, { backgroundColor: bg }]}>
                          <Text style={[styles.nerdleCellText, { color }]}>{char}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
            <View style={styles.keypadRowWrap}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "+", "-", "*", "/", "="].map((k) => (
                <TouchableOpacity
                  key={k}
                  style={styles.nerdleKey}
                  onPress={() => {
                    if (currentNerdleInput.length < 8) setCurrentNerdleInput((prev) => prev + k);
                  }}
                >
                  <Text style={styles.nerdleKeyText}>{k === "*" ? "×" : k === "/" ? "÷" : k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#f1f5f9" }]}
                onPress={() => setCurrentNerdleInput((p) => p.slice(0, -1))}
              >
                <Text style={styles.actionBtnText}>⌫ Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#2563eb" }]}
                onPress={() => {
                  if (currentNerdleInput.length !== 8) {
                    Alert.alert("Incomplete", "Equation must be 8 characters");
                    return;
                  }
                  const evalRes = evaluateNerdleGuess(currentNerdleInput, nerdle.solutionEquation);
                  if (!evalRes.valid) {
                    Alert.alert("Invalid", evalRes.error || "Not mathematically equal");
                    return;
                  }
                  const upd = [...nerdleGuesses, currentNerdleInput];
                  setNerdleGuesses(upd);
                  setCurrentNerdleInput("");
                  if (currentNerdleInput === nerdle.solutionEquation) {
                    handleFinish(true, 200, `Equation Solved: ${nerdle.solutionEquation}`);
                  } else if (upd.length >= 6) {
                    handleFinish(false, 30, `Solution was: ${nerdle.solutionEquation}`);
                  }
                }}
              >
                <Text style={[styles.actionBtnText, { color: "#ffffff" }]}>Enter Guess</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 15. MEMORY MATRIX */}
        {game.id === "memory-matrix" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Level {mmLevel} • {mmShow ? "Memorize the pattern!" : "Tap the illuminated tiles"}
            </Text>
            <View
              style={[
                styles.matrixGrid,
                { width: mm.gridSize * 65, height: mm.gridSize * 65 },
              ]}
            >
              {Array.from({ length: mm.gridSize * mm.gridSize }).map((_, idx) => {
                const isHighlight = mm.highlightedIndices.includes(idx);
                const isSel = mmSel.includes(idx);
                let bg = "#f1f5f9";
                if (mmShow && isHighlight) bg = "#2563eb";
                else if (!mmShow && isSel) bg = isHighlight ? "#10b981" : "#ef4444";
                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={mmShow}
                    style={[
                      styles.matrixCell,
                      { width: 55, height: 55, backgroundColor: bg },
                    ]}
                    onPress={() => {
                      if (mmSel.includes(idx)) return;
                      const next = [...mmSel, idx];
                      setMmSel(next);
                      if (!isHighlight) {
                        handleFinish(false, score, "Pattern mismatch! Practice improves memory recall.");
                      } else if (
                        next.filter((i) => mm.highlightedIndices.includes(i)).length ===
                        mm.highlightedIndices.length
                      ) {
                        const nextLvl = mmLevel + 1;
                        const nextScore = score + 50;
                        setScore(nextScore);
                        if (nextLvl > 5) {
                          handleFinish(true, nextScore, "Photographic memory achieved! Cleared all 5 levels.");
                        } else {
                          setMmLevel(nextLvl);
                          const newGen = generateMemoryMatrixLevel(nextLvl);
                          setMm(newGen);
                          setMmShow(true);
                          setMmSel([]);
                          setTimeout(() => setMmShow(false), newGen.displayDurationMs);
                        }
                      }
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* 16. SEQUENCE MASTER */}
        {game.id === "sequence-master" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Sequence Length: {seqMaster.length} • Repeat the pattern
            </Text>
            <View style={styles.simonGrid}>
              {[
                { id: "blue", bg: "#2563eb" },
                { id: "emerald", bg: "#10b981" },
                { id: "amber", bg: "#f59e0b" },
                { id: "rose", bg: "#ef4444" },
              ].map((btn) => (
                <TouchableOpacity
                  key={btn.id}
                  style={[styles.simonBtn, { backgroundColor: btn.bg }]}
                  onPress={() => {
                    const next = [...seqPlayer, btn.id];
                    setSeqPlayer(next);
                    const chk = validateSequenceInput(next, seqMaster);
                    if (!chk.isCorrectSoFar) {
                      handleFinish(false, seqMaster.length * 20, `Sequence broken at step ${seqMaster.length}`);
                    } else if (chk.isRoundComplete) {
                      setScore((s) => s + 30);
                      setSeqPlayer([]);
                      setSeqMaster(appendSequenceStep(seqMaster));
                    }
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* 17. SUDOKU */}
        {game.id === "sudoku" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Tap an empty cell then tap a number 1-9
            </Text>
            <View style={styles.sudokuGrid}>
              {sudGrid.map((row, r) => (
                <View key={r} style={[styles.sudokuRow, r % 3 === 2 && r < 8 && styles.sudokuRowBorder]}>
                  {row.map((val, c) => {
                    const isInit = sud.initialGrid[r][c] !== null;
                    const isSel = selSudCell?.[0] === r && selSudCell?.[1] === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        disabled={isInit}
                        style={[
                          styles.sudokuCell,
                          c % 3 === 2 && c < 8 && styles.sudokuColBorder,
                          isInit && styles.sudokuCellInit,
                          isSel && styles.sudokuCellSel,
                        ]}
                        onPress={() => setSelSudCell([r, c])}
                      >
                        <Text style={[styles.sudokuCellText, isInit && styles.sudokuCellTextInit]}>
                          {val || ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitKey}
                  onPress={() => {
                    if (!selSudCell) return;
                    const [r, c] = selSudCell;
                    if (sud.initialGrid[r][c] !== null) return;
                    const next = sudGrid.map((rowArr, ri) =>
                      rowArr.map((cv, ci) => (ri === r && ci === c ? d : cv))
                    );
                    setSudGrid(next);
                    const isFilled = next.every((rowArr) => rowArr.every((cv) => cv !== null && cv > 0));
                    if (isFilled) {
                      const allValid = next.every((rowArr, ri) =>
                        rowArr.every((cv, ci) => validateSudokuCell(next, ri, ci, cv as number))
                      );
                      if (allValid) {
                        handleFinish(true, 250, "Sudoku grid completed flawlessly!");
                      }
                    }
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 18. MINESWEEPER */}
        {game.id === "minesweeper" && (
          <View style={styles.gameWrapper}>
            <View style={styles.mswHeader}>
              <Text style={styles.mswMines}>
                💣 Mines: {msweeper.totalMines - msweeper.flagsUsed}
              </Text>
              <TouchableOpacity
                style={[styles.flagModeBtn, flagMode && styles.flagModeBtnActive]}
                onPress={() => setFlagMode((f) => !f)}
              >
                <Text style={[styles.flagModeText, flagMode && { color: "#ffffff" }]}>
                  🚩 Flag Mode: {flagMode ? "ON" : "OFF"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mswGrid}>
              {msweeper.grid.map((row, r) => (
                <View key={r} style={styles.mswRow}>
                  {row.map((cell, c) => {
                    let bg = "#64748b";
                    let borderCol = "#475569";
                    let label = "";
                    let color = "#ffffff";
                    if (cell.isRevealed) {
                      borderCol = "#cbd5e1";
                      if (cell.isMine) {
                        bg = "#ef4444";
                        label = "💣";
                      } else {
                        bg = "#f8fafc";
                        label = cell.adjacentMines > 0 ? String(cell.adjacentMines) : "";
                        color =
                          cell.adjacentMines === 1
                            ? "#2563eb"
                            : cell.adjacentMines === 2
                            ? "#059669"
                            : "#dc2626";
                      }
                    } else if (cell.isFlagged) {
                      bg = "#334155";
                      borderCol = "#f59e0b";
                      label = "🚩";
                    }
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.mswCell, { backgroundColor: bg, borderColor: borderCol }]}
                        onPress={() => {
                          if (cell.isRevealed) return;
                          if (flagMode) {
                            const upd = {
                              ...msweeper,
                              flagsUsed: msweeper.flagsUsed + (cell.isFlagged ? -1 : 1),
                              grid: msweeper.grid.map((rA, ri) =>
                                rA.map((cl, ci) =>
                                  ri === r && ci === c ? { ...cl, isFlagged: !cl.isFlagged } : cl
                                )
                              ),
                            };
                            setMsweeper(upd);
                            return;
                          }
                          let active = msweeper;
                          if (!msweeper.grid.some((rA) => rA.some((cl) => cl.isMine))) {
                            active = placeMinesSafeFirstClick(msweeper, r, c);
                          }
                          const rev = revealMineCell(active, r, c);
                          setMsweeper(rev.game);
                          if (rev.hitMine) {
                            handleFinish(false, 0, "Detonated a mine! Watch the numbers closely.");
                          } else if (rev.game.won) {
                            handleFinish(true, 200, "Minesweeper board swept cleanly!");
                          }
                        }}
                      >
                        <Text style={[styles.mswCellText, { color }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 19. KENKEN */}
        {game.id === "kenken" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Fill 1-4 with unique numbers per row/column satisfying cage math
            </Text>
            <View style={styles.kenGrid}>
              {kenGrid.map((row, r) => (
                <View key={r} style={styles.kenRow}>
                  {row.map((val, c) => {
                    const isSel = selKenCell?.[0] === r && selKenCell?.[1] === c;
                    const cage = ken.cages.find((cg) => cg.cells.some(([cr, cc]) => cr === r && cc === c));
                    const isCageLead = cage && cage.cells[0][0] === r && cage.cells[0][1] === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.kenCell, isSel && styles.kenCellSel]}
                        onPress={() => setSelKenCell([r, c])}
                      >
                        {isCageLead && (
                          <Text style={styles.kenCageLabel}>
                            {cage.target}
                            {cage.operator}
                          </Text>
                        )}
                        <Text style={styles.kenCellText}>{val > 0 ? val : ""}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[1, 2, 3, 4].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitKeyLarge}
                  onPress={() => {
                    if (!selKenCell) return;
                    const [r, c] = selKenCell;
                    const next = kenGrid.map((rowArr, ri) =>
                      rowArr.map((cv, ci) => (ri === r && ci === c ? d : cv))
                    );
                    setKenGrid(next);
                    if (next.every((rowArr) => rowArr.every((v) => v > 0))) {
                      handleFinish(true, 180, "KenKen 4x4 arithmetic constraints satisfied!");
                    }
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 20. BINARY PUZZLE */}
        {game.id === "binary-puzzle" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Fill with 0 and 1. Max 2 consecutive same digits. Equal count per row/col.
            </Text>
            <View style={styles.binGrid}>
              {binGrid.map((row, r) => (
                <View key={r} style={styles.binRow}>
                  {row.map((val, c) => {
                    const isFixed = bin.initialGrid[r][c] !== null;
                    return (
                      <TouchableOpacity
                        key={c}
                        disabled={isFixed}
                        style={[
                          styles.binCell,
                          isFixed && styles.binCellFixed,
                          val === 0 && { backgroundColor: "#2563eb" },
                          val === 1 && { backgroundColor: "#f59e0b" },
                        ]}
                        onPress={() => {
                          const nxt = val === null ? 0 : val === 0 ? 1 : null;
                          const nextG = binGrid.map((rA, ri) =>
                            rA.map((cv, ci) => (ri === r && ci === c ? nxt : cv))
                          );
                          setBinGrid(nextG);
                          const chk = validateBinaryPuzzle(nextG);
                          if (chk.valid) {
                            handleFinish(true, 180, "Binary puzzle parity satisfied!");
                          }
                        }}
                      >
                        <Text style={[styles.binCellText, val !== null && { color: "#ffffff" }]}>
                          {val !== null ? val : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 21. NUMBERLE */}
        {game.id === "numberle" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Crack the secret 4-digit number code in 6 tries
            </Text>
            <View style={styles.numberleBoard}>
              {Array.from({ length: 6 }).map((_, rIdx) => {
                const guess = numGuess[rIdx];
                const isCurr = rIdx === numGuess.length;
                const feedback = guess ? evaluateNumberleGuess(guess, numSec) : null;
                return (
                  <View key={rIdx} style={styles.numberleRow}>
                    {Array.from({ length: 4 }).map((__, cIdx) => {
                      const d = isCurr ? numInput[cIdx] || "" : guess ? guess[cIdx] : "";
                      const st = feedback?.[cIdx]?.status;
                      let bg = "#ffffff";
                      let color = "#0f172a";
                      if (st === "correct") {
                        bg = "#10b981";
                        color = "#ffffff";
                      } else if (st === "present") {
                        bg = "#f59e0b";
                        color = "#ffffff";
                      } else if (st === "absent") {
                        bg = "#94a3b8";
                        color = "#ffffff";
                      }
                      return (
                        <View key={cIdx} style={[styles.numberleCell, { backgroundColor: bg }]}>
                          <Text style={[styles.numberleCellText, { color }]}>{d}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
            <View style={styles.keypadRowWrap}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.numberleKey}
                  onPress={() => {
                    if (numInput.length < 4) setNumInput((p) => p + d);
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#f1f5f9" }]}
                onPress={() => setNumInput((p) => p.slice(0, -1))}
              >
                <Text style={styles.actionBtnText}>⌫ Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#2563eb" }]}
                onPress={() => {
                  if (numInput.length !== 4) return;
                  const nextG = [...numGuess, numInput];
                  setNumGuess(nextG);
                  setNumInput("");
                  if (numInput === numSec) {
                    handleFinish(true, 150, `Numberle code cracked! Secret: ${numSec}`);
                  } else if (nextG.length >= 6) {
                    handleFinish(false, 30, `Secret code was: ${numSec}`);
                  }
                }}
              >
                <Text style={[styles.actionBtnText, { color: "#ffffff" }]}>Submit Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 22. AVERAGE RACE */}
        {game.id === "average-race" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Calculate the exact mean of these values</Text>
            <View style={styles.avgBadgeRow}>
              {avg.numbers.map((n, i) => (
                <View key={i} style={styles.avgBadge}>
                  <Text style={styles.avgBadgeText}>{n}</Text>
                </View>
              ))}
            </View>
            <View style={styles.mcqGrid}>
              {avg.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.mcqBtn}
                  onPress={() => {
                    if (opt === avg.average) {
                      handleFinish(true, 100, avg.shortcutExplanation);
                    } else {
                      handleFinish(false, 20, avg.shortcutExplanation);
                    }
                  }}
                >
                  <Text style={styles.mcqBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 23. PERCENTAGE BLITZ */}
        {game.id === "percentage-blitz" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Fast percentage-to-fraction mental arithmetic</Text>
            <Text style={styles.bigMathPrompt}>{pb.prompt}</Text>
            <View style={styles.mcqGrid}>
              {pb.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.mcqBtn}
                  onPress={() => {
                    if (opt === pb.answer) {
                      handleFinish(true, 100, pb.fractionEquivalent);
                    } else {
                      handleFinish(false, 20, pb.fractionEquivalent);
                    }
                  }}
                >
                  <Text style={styles.mcqBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 24. SIMPLIFICATION SPRINT */}
        {game.id === "simplification-sprint" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Evaluate strictly under BODMAS order of operations</Text>
            <Text style={styles.bigMathPrompt}>{simp.expression} = ?</Text>
            <View style={styles.mcqGrid}>
              {simp.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.mcqBtn}
                  onPress={() => {
                    if (opt === simp.answer) {
                      handleFinish(true, 120, simp.steps.join("\n"));
                    } else {
                      handleFinish(false, 20, simp.steps.join("\n"));
                    }
                  }}
                >
                  <Text style={styles.mcqBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 25. FACTOR FINDER */}
        {game.id === "factor-finder" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Target Number: {fac.targetNumber}</Text>
            <Text style={styles.factorPromptText}>{fac.prompt}</Text>
            <View style={styles.mcqGrid}>
              {fac.options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.mcqBtn}
                  onPress={() => {
                    if (opt === fac.answer) {
                      handleFinish(true, 100, fac.explanation);
                    } else {
                      handleFinish(false, 20, fac.explanation);
                    }
                  }}
                >
                  <Text style={styles.mcqBtnText}>{String(opt)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 26. KAKURO */}
        {game.id === "kakuro" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Fill white cells with 1-9 so each run sums to its clue header
            </Text>
            <View style={styles.kakGrid}>
              {kakGrid.map((row, r) => (
                <View key={r} style={styles.kakRow}>
                  {row.map((val, c) => {
                    const clue = kak.clues.find((cl) => cl.row === r && cl.col === c);
                    const isBlack = kak.solution[r][c] === null;
                    const isSel = selKakCell?.[0] === r && selKakCell?.[1] === c;
                    if (isBlack) {
                      return (
                        <View key={c} style={styles.kakBlackCell}>
                          {clue?.downSum ? (
                            <Text style={styles.kakClueDown}>↓{clue.downSum}</Text>
                          ) : null}
                          {clue?.acrossSum ? (
                            <Text style={styles.kakClueAcross}>→{clue.acrossSum}</Text>
                          ) : null}
                        </View>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.kakWhiteCell, isSel && styles.kakWhiteCellSel]}
                        onPress={() => setSelKakCell([r, c])}
                      >
                        <Text style={styles.kakCellText}>{val || ""}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitKey}
                  onPress={() => {
                    if (!selKakCell) return;
                    const [r, c] = selKakCell;
                    const next = kakGrid.map((rA, ri) =>
                      rA.map((cv, ci) => (ri === r && ci === c ? d : cv))
                    );
                    setKakGrid(next);
                    if (next.every((rA, ri) => rA.every((cv, ci) => kak.solution[ri][ci] === null || cv !== null))) {
                      handleFinish(true, 180, "Kakuro sums solved correctly!");
                    }
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 27. COUNTDOWN NUMBERS */}
        {game.id === "countdown-numbers" && (
          <View style={styles.gameWrapper}>
            <View style={styles.countdownTargetCard}>
              <Text style={styles.countdownTargetLabel}>TARGET NUMBER</Text>
              <Text style={styles.countdownTargetVal}>{cd.target}</Text>
            </View>
            <View style={styles.numCardsRow}>
              {cd.numbers.map((n, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.bigNumCard}
                  onPress={() => setCdExpr((p) => `${p} ${n}`.trim())}
                >
                  <Text style={styles.bigNumText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.formulaDisplay}>
              <Text style={styles.formulaText}>{cdExpr || "Tap numbers & operators..."}</Text>
            </View>
            <View style={styles.keypadRow}>
              {["+", "-", "*", "/", "(", ")"].map((op) => (
                <TouchableOpacity
                  key={op}
                  style={styles.opKey}
                  onPress={() => setCdExpr((p) => `${p} ${op}`.trim())}
                >
                  <Text style={styles.opKeyText}>{op === "*" ? "×" : op === "/" ? "÷" : op}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#f1f5f9" }]}
                onPress={() => setCdExpr("")}
              >
                <Text style={styles.actionBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#2563eb" }]}
                onPress={() => {
                  try {
                    const fn = new Function(`"use strict"; return (${cdExpr});`);
                    const val = fn();
                    if (val === cd.target) {
                      handleFinish(true, 150, `Hit target exactly! ${cdExpr} = ${cd.target}`);
                    } else {
                      Alert.alert("Result", `${cdExpr} = ${val} (Target was ${cd.target})`);
                    }
                  } catch {
                    Alert.alert("Error", "Invalid mathematical expression");
                  }
                }}
              >
                <Text style={[styles.actionBtnText, { color: "#ffffff" }]}>Check Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 28. MATH CROSSWORD */}
        {game.id === "math-crossword" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>Solve intersecting arithmetic equations</Text>
            <View style={styles.crosswordGrid}>
              {Array.from({ length: 5 }).map((_, r) => (
                <View key={r} style={styles.crosswordRow}>
                  {Array.from({ length: 5 }).map((__, c) => {
                    const cell = mc.cells.find((cl) => cl.row === r && cl.col === c);
                    if (!cell) {
                      return <View key={c} style={styles.crosswordBlank} />;
                    }
                    const coordKey = `${r}-${c}`;
                    const isSel = selMcCoord === coordKey;
                    const val = cell.isFixed ? cell.val : mcInputs[coordKey] || "";
                    return (
                      <TouchableOpacity
                        key={c}
                        disabled={cell.isFixed}
                        style={[
                          styles.crosswordCell,
                          cell.isFixed && styles.crosswordCellFixed,
                          isSel && styles.crosswordCellSel,
                        ]}
                        onPress={() => setSelMcCoord(coordKey)}
                      >
                        <Text style={[styles.crosswordCellText, cell.isFixed && styles.crosswordCellTextFixed]}>
                          {val}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitKey}
                  onPress={() => {
                    if (!selMcCoord) return;
                    const next = { ...mcInputs, [selMcCoord]: String(d) };
                    setMcInputs(next);
                    const allFilled = mc.cells.filter((cl) => !cl.isFixed).every((cl) => next[`${cl.row}-${cl.col}`]);
                    if (allFilled) {
                      handleFinish(true, 150, "Math Crossword balanced across all rows & columns!");
                    }
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 29. KILLER SUDOKU */}
        {game.id === "killer-sudoku" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Fill 1-6 with unique digits per row/col satisfying cage totals
            </Text>
            <View style={styles.ksGrid}>
              {ksGrid.map((row, r) => (
                <View key={r} style={styles.ksRow}>
                  {row.map((val, c) => {
                    const isSel = selKsCell?.[0] === r && selKsCell?.[1] === c;
                    const cage = ks.cages.find((cg) => cg.cells.some(([cr, cc]) => cr === r && cc === c));
                    const isLeader = cage && cage.cells[0][0] === r && cage.cells[0][1] === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[styles.ksCell, isSel && styles.ksCellSel]}
                        onPress={() => setSelKsCell([r, c])}
                      >
                        {isLeader && <Text style={styles.ksCageLabel}>{cage.sum}</Text>}
                        <Text style={styles.ksCellText}>{val > 0 ? val : ""}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitKeyLarge}
                  onPress={() => {
                    if (!selKsCell) return;
                    const [r, c] = selKsCell;
                    const next = ksGrid.map((rA, ri) =>
                      rA.map((cv, ci) => (ri === r && ci === c ? d : cv))
                    );
                    setKsGrid(next);
                    if (next.every((rA) => rA.every((v) => v > 0))) {
                      handleFinish(true, 200, "Killer Sudoku cage sums mastered!");
                    }
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 30. FUTOSHIKI */}
        {game.id === "futoshiki" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Fill 1-4 satisfying all inequality signs (&lt; and &gt;)
            </Text>
            <View style={styles.futGrid}>
              {futGrid.map((row, r) => (
                <View key={r} style={styles.futRow}>
                  {row.map((val, c) => {
                    const isSel = selFutCell?.[0] === r && selFutCell?.[1] === c;
                    const ineqRight = fut.inequalities.find(
                      (iq) => iq.row1 === r && iq.col1 === c && iq.row2 === r && iq.col2 === c + 1
                    );
                    return (
                      <View key={c} style={{ flexDirection: "row", alignItems: "center" }}>
                        <TouchableOpacity
                          style={[styles.futCell, isSel && styles.futCellSel]}
                          onPress={() => setSelFutCell([r, c])}
                        >
                          <Text style={styles.futCellText}>{val > 0 ? val : ""}</Text>
                        </TouchableOpacity>
                        {c < 3 && (
                          <Text style={styles.futIneqText}>
                            {ineqRight ? ineqRight.relation : " "}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {[1, 2, 3, 4].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitKeyLarge}
                  onPress={() => {
                    if (!selFutCell) return;
                    const [r, c] = selFutCell;
                    const next = futGrid.map((rA, ri) =>
                      rA.map((cv, ci) => (ri === r && ci === c ? d : cv))
                    );
                    setFutGrid(next);
                    if (next.every((rA) => rA.every((v) => v > 0))) {
                      handleFinish(true, 180, "Futoshiki inequality board completed!");
                    }
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 31. NONOGRAM */}
        {game.id === "nonogram" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Tap cells to shade them and reveal the hidden pixel art
            </Text>
            <View style={styles.nonoContainer}>
              {/* Top Column Clues */}
              <View style={styles.nonoTopCluesRow}>
                <View style={{ width: 45 }} />
                {nono.colClues.map((clues, c) => (
                  <View key={c} style={styles.nonoColClue}>
                    {clues.map((cl, i) => (
                      <Text key={i} style={styles.nonoClueText}>{cl}</Text>
                    ))}
                  </View>
                ))}
              </View>
              {/* Rows with Left Clues */}
              {nonoGrid.map((row, r) => (
                <View key={r} style={styles.nonoRow}>
                  <View style={styles.nonoRowClue}>
                    <Text style={styles.nonoClueText}>{nono.rowClues[r].join(" ")}</Text>
                  </View>
                  {row.map((isShaded, c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.nonoCell, isShaded && styles.nonoCellShaded]}
                      onPress={() => {
                        const next = nonoGrid.map((rA, ri) =>
                          rA.map((cv, ci) => (ri === r && ci === c ? !cv : cv))
                        );
                        setNonoGrid(next);
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.claimXpBtn, { marginTop: 16 }]}
              onPress={() => {
                const isMatch = nonoGrid.every((rA, ri) =>
                  rA.every((cv, ci) => cv === nono.solution[ri][ci])
                );
                if (isMatch) {
                  handleFinish(true, 200, "Nonogram picture revealed successfully!");
                } else {
                  Alert.alert("Keep Trying", "Check row and column count clues.");
                }
              }}
            >
              <Text style={styles.claimXpBtnText}>Verify Nonogram Picture</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 32. CRYPTARITHM */}
        {game.id === "cryptarithm" && (
          <View style={styles.gameWrapper}>
            <Text style={styles.promptSub}>
              Map each letter to a unique digit (0-9) to balance equation
            </Text>
            <View style={styles.cryptEquationBox}>
              <Text style={styles.cryptWord}>{crypt.word1}</Text>
              <Text style={styles.cryptWord}>+ {crypt.word2}</Text>
              <View style={styles.cryptDivider} />
              <Text style={styles.cryptResultWord}>{crypt.resultWord}</Text>
            </View>
            <Text style={styles.cryptHintText}>💡 Hint: {crypt.hint}</Text>
            {/* Letter selection row */}
            <View style={styles.cryptLettersRow}>
              {Array.from(new Set(`${crypt.word1}${crypt.word2}${crypt.resultWord}`)).map((char) => {
                const isSel = selCryptLetter === char;
                const assigned = cryptMap[char];
                return (
                  <TouchableOpacity
                    key={char}
                    style={[styles.cryptLetterPill, isSel && styles.cryptLetterPillSel]}
                    onPress={() => setSelCryptLetter(char)}
                  >
                    <Text style={styles.cryptLetterChar}>{char}</Text>
                    <Text style={styles.cryptLetterDigit}>{assigned !== undefined ? assigned : "?"}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Keypad for digit mapping */}
            <View style={styles.keypadRowWrap}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.digitKey}
                  onPress={() => {
                    if (!selCryptLetter) return;
                    setCryptMap((prev) => ({ ...prev, [selCryptLetter]: d }));
                  }}
                >
                  <Text style={styles.digitKeyText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.claimXpBtn, { marginTop: 12 }]}
              onPress={() => {
                const isCorrect = Object.entries(crypt.solution).every(
                  ([k, v]) => cryptMap[k] === v
                );
                if (isCorrect) {
                  handleFinish(true, 250, "Cryptarithmetic letter-to-digit substitution solved!");
                } else {
                  Alert.alert("Incorrect", "Check sum column carry and uniqueness.");
                }
              }}
            >
              <Text style={styles.claimXpBtnText}>Verify Arithmetic Solution</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Epic Completion Modal */}
      {isGameOver && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalTrophy, isWon ? styles.modalTrophyWon : styles.modalTrophyLost]}>
              {isWon ? <Trophy size={32} color="#d97706" /> : <Sparkles size={32} color="#64748b" />}
            </View>
            <Text style={styles.modalTitle}>
              {isWon ? "Challenge Mastered!" : "Practice Concluded"}
            </Text>
            <Text style={styles.modalScore}>
              {isWon ? "+15 Brain Rating Awarded" : "Keep practicing to build agility"}
            </Text>

            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatLabel}>SCORE</Text>
                <Text style={styles.modalStatVal}>+{score}</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatLabel}>TIME</Text>
                <Text style={styles.modalStatVal}>
                  {Math.floor(timeSeconds / 60)}:{(timeSeconds % 60).toString().padStart(2, "0")}
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatLabel}>STREAK</Text>
                <Text style={styles.modalStatVal}>{combo >= 2 ? `${combo}x` : "1x"}</Text>
              </View>
            </View>

            {explanation ? (
              <View style={styles.expBox}>
                <Text style={styles.expTitle}>Solution Method:</Text>
                <Text style={styles.expBody}>{explanation}</Text>
              </View>
            ) : null}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#f1f5f9" }]}
                onPress={handleReset}
              >
                <Text style={styles.modalBtnText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#2563eb" }]}
                onPress={() => router.back()}
              >
                <Text style={[styles.modalBtnText, { color: "#ffffff" }]}>All Games</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => {
                Alert.alert(
                  "OdishaRank Challenge",
                  `Challenge copied! "I scored ${score} pts in ${game.title}! Can you beat my time?"`
                );
              }}
            >
              <Share2 size={14} color="#2563eb" />
              <Text style={styles.shareBtnText}>Share Challenge</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "capitalize",
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  restartBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  arenaContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  gameWrapper: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  promptSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  numCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  bigNumCard: {
    width: 60,
    height: 70,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#93c5fd",
    alignItems: "center",
    justifyContent: "center",
  },
  bigNumText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1e3a8a",
  },
  formulaDisplay: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 52,
  },
  formulaText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  keypadRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  opKey: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  opKeyText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  hugePrompt: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  choicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
    justifyContent: "center",
  },
  choiceBtn: {
    width: (width - 60) / 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  choiceBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  grid2048: {
    width: 260,
    height: 260,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignSelf: "center",
    marginBottom: 20,
  },
  cell2048: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  cell2048Text: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  dpad: {
    alignItems: "center",
    gap: 8,
  },
  dpadBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  dpadText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  targetBanner: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    marginBottom: 16,
  },
  targetBannerText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#065f46",
  },
  bondsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  bondCard: {
    width: (width - 70) / 4,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  bondCardSelected: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  bondCardText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  seqRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  seqChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  seqChipText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  compBox: {
    width: (width - 60) / 2,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
  },
  compSub: {
    fontSize: 10,
    fontWeight: "800",
    color: "#3b82f6",
    textTransform: "uppercase",
  },
  compVal: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e3a8a",
    marginTop: 4,
  },
  actionBtnWide: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  actionBtnWideText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  hanoiRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    justifyContent: "space-around",
    borderBottomWidth: 3,
    borderBottomColor: "#334155",
    paddingBottom: 6,
  },
  hanoiPeg: {
    width: (width - 70) / 3,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    flexDirection: "column-reverse",
    alignItems: "center",
    padding: 4,
  },
  hanoiDisk: {
    height: 18,
    borderRadius: 6,
    marginBottom: 3,
  },
  lightsGrid: {
    width: 240,
    height: 240,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignSelf: "center",
  },
  lightCell: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  smGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    width: "100%",
  },
  smCard: {
    width: (width - 70) / 4,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  defaultArena: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    width: "100%",
  },
  defaultIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  defaultDesc: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  claimXpBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  claimXpBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  modalTrophy: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  modalScore: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
    marginBottom: 12,
  },
  expBox: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    width: "100%",
    marginBottom: 16,
  },
  expTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  expBody: {
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  comboPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  comboPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#d97706",
  },
  iconBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  hintBanner: {
    backgroundColor: "#fef3c7",
    padding: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  hintTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#92400e",
  },
  hintBody: {
    fontSize: 11,
    color: "#78350f",
    lineHeight: 16,
  },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
    padding: 24,
  },
  pauseCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  pauseTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 4,
  },
  pauseSub: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
  },
  resumeBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  resumeBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
  modalStatsRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    marginBottom: 14,
    width: "100%",
  },
  modalStatItem: {
    flex: 1,
    alignItems: "center",
  },
  modalStatLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
  },
  modalStatVal: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 2,
  },
  modalTrophyWon: {
    backgroundColor: "#fef3c7",
  },
  modalTrophyLost: {
    backgroundColor: "#f1f5f9",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    width: "100%",
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563eb",
  },
  // Game 13. Magic Square
  msGrid: {
    gap: 8,
    marginBottom: 20,
    alignSelf: "center",
  },
  msRow: {
    flexDirection: "row",
    gap: 8,
  },
  msCell: {
    width: 65,
    height: 65,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  msCellInit: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  msCellSel: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  msCellText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2563eb",
  },
  msCellTextInit: {
    color: "#0f172a",
  },
  digitKey: {
    width: 32,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  digitKeyLarge: {
    width: 50,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  digitKeyText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  // Game 14. Nerdle
  nerdleBoard: {
    gap: 6,
    marginBottom: 16,
    alignSelf: "center",
  },
  nerdleRow: {
    flexDirection: "row",
    gap: 4,
  },
  nerdleCell: {
    width: (width - 64) / 8,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  nerdleCellText: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  keypadRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginBottom: 14,
    maxWidth: 320,
  },
  nerdleKey: {
    width: 50,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  nerdleKeyText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  // Game 15. Memory Matrix
  matrixGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    alignSelf: "center",
  },
  matrixCell: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  // Game 16. Sequence Master
  simonGrid: {
    width: 240,
    height: 240,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignSelf: "center",
    justifyContent: "center",
  },
  simonBtn: {
    width: 110,
    height: 110,
    borderRadius: 24,
  },
  // Game 17. Sudoku
  sudokuGrid: {
    borderWidth: 2,
    borderColor: "#0f172a",
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 16,
  },
  sudokuRow: {
    flexDirection: "row",
  },
  sudokuRowBorder: {
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
  },
  sudokuCell: {
    width: 34,
    height: 34,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  sudokuColBorder: {
    borderRightWidth: 2,
    borderRightColor: "#0f172a",
  },
  sudokuCellInit: {
    backgroundColor: "#f1f5f9",
  },
  sudokuCellSel: {
    backgroundColor: "#bfdbfe",
  },
  sudokuCellText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563eb",
  },
  sudokuCellTextInit: {
    color: "#0f172a",
    fontWeight: "900",
  },
  // Game 18. Minesweeper
  mswHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 280,
    marginBottom: 12,
  },
  mswMines: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  flagModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  flagModeBtnActive: {
    backgroundColor: "#dc2626",
  },
  flagModeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },
  mswGrid: {
    borderWidth: 3,
    borderColor: "#334155",
    borderRadius: 14,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "#1e293b",
    padding: 4,
  },
  mswRow: {
    flexDirection: "row",
  },
  mswCell: {
    width: 38,
    height: 38,
    margin: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mswCellText: {
    fontSize: 14,
    fontWeight: "900",
  },
  // Game 19. KenKen
  kenGrid: {
    borderWidth: 2,
    borderColor: "#334155",
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 16,
  },
  kenRow: {
    flexDirection: "row",
  },
  kenCell: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    position: "relative",
  },
  kenCellSel: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  kenCageLabel: {
    position: "absolute",
    top: 2,
    left: 3,
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
  },
  kenCellText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  // Game 20. Binary Puzzle
  binGrid: {
    borderWidth: 2,
    borderColor: "#0f172a",
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
  binRow: {
    flexDirection: "row",
  },
  binCell: {
    width: 44,
    height: 44,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  binCellFixed: {
    backgroundColor: "#e2e8f0",
  },
  binCellText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  // Game 21. Numberle
  numberleBoard: {
    gap: 6,
    marginBottom: 16,
    alignSelf: "center",
  },
  numberleRow: {
    flexDirection: "row",
    gap: 6,
  },
  numberleCell: {
    width: 50,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  numberleCellText: {
    fontSize: 20,
    fontWeight: "900",
  },
  numberleKey: {
    width: 45,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  // Game 22. Average Race
  avgBadgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  avgBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  avgBadgeText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e3a8a",
  },
  mcqGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
    justifyContent: "center",
  },
  mcqBtn: {
    width: (width - 60) / 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  mcqBtnText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  bigMathPrompt: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  factorPromptText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  // Game 26. Kakuro
  kakGrid: {
    borderWidth: 2,
    borderColor: "#0f172a",
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 16,
  },
  kakRow: {
    flexDirection: "row",
  },
  kakBlackCell: {
    width: 55,
    height: 55,
    backgroundColor: "#1e293b",
    borderWidth: 0.5,
    borderColor: "#334155",
    padding: 3,
    justifyContent: "space-between",
  },
  kakWhiteCell: {
    width: 55,
    height: 55,
    backgroundColor: "#ffffff",
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  kakWhiteCellSel: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  kakClueDown: {
    fontSize: 9,
    fontWeight: "800",
    color: "#38bdf8",
  },
  kakClueAcross: {
    fontSize: 9,
    fontWeight: "800",
    color: "#f59e0b",
    alignSelf: "flex-end",
  },
  kakCellText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  // Game 27. Countdown Numbers
  countdownTargetCard: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#93c5fd",
    alignItems: "center",
    marginBottom: 16,
  },
  countdownTargetLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e40af",
    letterSpacing: 1,
  },
  countdownTargetVal: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1e3a8a",
  },
  // Game 28. Math Crossword
  crosswordGrid: {
    gap: 4,
    marginBottom: 16,
    alignSelf: "center",
  },
  crosswordRow: {
    flexDirection: "row",
    gap: 4,
  },
  crosswordBlank: {
    width: 45,
    height: 45,
  },
  crosswordCell: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  crosswordCellFixed: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  crosswordCellSel: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  crosswordCellText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2563eb",
  },
  crosswordCellTextFixed: {
    color: "#0f172a",
  },
  // Game 29. Killer Sudoku
  ksGrid: {
    borderWidth: 2,
    borderColor: "#0f172a",
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: 16,
  },
  ksRow: {
    flexDirection: "row",
  },
  ksCell: {
    width: 45,
    height: 45,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    position: "relative",
  },
  ksCellSel: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  ksCageLabel: {
    position: "absolute",
    top: 1,
    left: 2,
    fontSize: 8,
    fontWeight: "800",
    color: "#ef4444",
  },
  ksCellText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  // Game 30. Futoshiki
  futGrid: {
    gap: 6,
    marginBottom: 16,
    alignSelf: "center",
  },
  futRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  futCell: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  futCellSel: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  futIneqText: {
    width: 18,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    color: "#f59e0b",
  },
  futCellText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  // Game 31. Nonogram
  nonoContainer: {
    alignSelf: "center",
    marginBottom: 10,
  },
  nonoTopCluesRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  nonoColClue: {
    width: 44,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  nonoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  nonoRowClue: {
    width: 45,
    paddingRight: 6,
    alignItems: "flex-end",
  },
  nonoClueText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
  },
  nonoCell: {
    width: 42,
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    marginHorizontal: 1,
  },
  nonoCellShaded: {
    backgroundColor: "#1e1b4b",
    borderColor: "#1e1b4b",
  },
  // Game 32. Cryptarithm
  cryptEquationBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "flex-end",
    marginBottom: 10,
    minWidth: 180,
  },
  cryptWord: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 4,
  },
  cryptDivider: {
    width: "100%",
    height: 2,
    backgroundColor: "#0f172a",
    marginVertical: 4,
  },
  cryptResultWord: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2563eb",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 4,
  },
  cryptHintText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  cryptLettersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 16,
  },
  cryptLetterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  cryptLetterPillSel: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  cryptLetterChar: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  cryptLetterDigit: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2563eb",
    marginTop: 2,
  },
});
