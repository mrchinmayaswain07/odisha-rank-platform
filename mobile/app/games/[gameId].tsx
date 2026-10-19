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
} from "@odisha-rank/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function MobileGameArenaScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = getGameById(gameId as GameId);

  const [timeSeconds, setTimeSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [explanation, setExplanation] = useState("");

  // Global Timer
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      setTimeSeconds((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver]);

  const handleFinish = async (won: boolean, pts: number, exp?: string) => {
    setIsGameOver(true);
    setIsWon(won);
    setScore(pts);
    if (exp) setExplanation(exp);

    // Save to local mobile stats
    try {
      const prev = await AsyncStorage.getItem("@odisha_rank_game_stats");
      const current = prev ? JSON.parse(prev) : { brainScore: 550, totalPlayed: 0 };
      current.totalPlayed += 1;
      if (won) current.brainScore = Math.min(1000, current.brainScore + 10);
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
          <Text style={styles.headerTitle}>{game.title}</Text>
          <Text style={styles.headerSub}>{game.category} challenge</Text>
        </View>

        <View style={styles.timerChip}>
          <Clock size={12} color="#2563eb" />
          <Text style={styles.timerText}>
            {Math.floor(timeSeconds / 60)}:{(timeSeconds % 60).toString().padStart(2, "0")}
          </Text>
        </View>

        <TouchableOpacity onPress={handleReset} style={styles.restartBtn}>
          <RotateCcw size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

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

        {/* DEFAULT ARENA FOR REMAINING GAMES */}
        {![
          "game-24",
          "game-2048",
          "quick-calc",
          "number-bonds",
          "number-sequence",
          "odd-one-out",
          "missing-operator",
          "speed-comparison",
          "approximation",
          "tower-of-hanoi",
          "lights-out",
          "symbol-match",
        ].includes(game.id) && (
          <View style={styles.defaultArena}>
            <View style={styles.defaultIconBox}>
              <Sparkles size={28} color="#2563eb" />
            </View>
            <Text style={styles.defaultTitle}>{game.title} Brain Arena</Text>
            <Text style={styles.defaultDesc}>{game.shortDescription}</Text>
            <TouchableOpacity
              style={styles.claimXpBtn}
              onPress={() => handleFinish(true, 120, `Completed ${game.title} mobile practice!`)}
            >
              <Text style={styles.claimXpBtnText}>Complete Simulation (+120 XP)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Completion Modal */}
      {isGameOver && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTrophy}>
              <Trophy size={32} color="#059669" />
            </View>
            <Text style={styles.modalTitle}>
              {isWon ? "Challenge Completed!" : "Session Concluded"}
            </Text>
            <Text style={styles.modalScore}>+{score} Points Earned</Text>

            {explanation ? (
              <View style={styles.expBox}>
                <Text style={styles.expTitle}>Explanation:</Text>
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
});
