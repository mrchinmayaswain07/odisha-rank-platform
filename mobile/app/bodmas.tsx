import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Zap,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Flame,
  Clock,
  Sparkles,
  Trophy,
  ChevronRight,
  Info,
  X,
  Divide,
  Calculator,
} from "lucide-react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";

const { width } = Dimensions.get("window");

type BodmasDifficulty = "easy" | "medium" | "hard" | "sprint";

interface BodmasQuestion {
  id: string;
  expression: string;
  answer: number;
  steps: string[];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBodmasQuestion(difficulty: BodmasDifficulty): BodmasQuestion {
  const id = Math.random().toString(36).substring(2, 9);

  if (difficulty === "easy") {
    // Mode 1: (A + B) × C or A + B × C
    const type = Math.random() > 0.5 ? 1 : 2;
    if (type === 1) {
      const a = randInt(4, 15);
      const b = randInt(2, 10);
      const c = randInt(2, 6);
      const sum = a + b;
      const ans = sum * c;
      return {
        id,
        expression: `(${a} + ${b}) × ${c}`,
        answer: ans,
        steps: [
          `Step 1: Solve inside brackets first → (${a} + ${b}) = ${sum}`,
          `Step 2: Multiply by ${c} → ${sum} × ${c} = ${ans}`,
        ],
      };
    } else {
      const a = randInt(10, 30);
      const b = randInt(3, 8);
      const c = randInt(2, 6);
      const mult = b * c;
      const ans = a + mult;
      return {
        id,
        expression: `${a} + ${b} × ${c}`,
        answer: ans,
        steps: [
          `Step 1: Multiplication comes before Addition → ${b} × ${c} = ${mult}`,
          `Step 2: Add ${a} → ${a} + ${mult} = ${ans}`,
        ],
      };
    }
  } else if (difficulty === "medium") {
    // Mode 2: A × B - C ÷ D or A + B × C - D
    const type = Math.random() > 0.5 ? 1 : 2;
    if (type === 1) {
      const div = randInt(2, 6);
      const c = div * randInt(2, 8);
      const a = randInt(5, 12);
      const b = randInt(3, 8);
      const mult = a * b;
      const division = c / div;
      const ans = mult - division;
      return {
        id,
        expression: `${a} × ${b} - ${c} ÷ ${div}`,
        answer: ans,
        steps: [
          `Step 1: Perform Multiplication → ${a} × ${b} = ${mult}`,
          `Step 2: Perform Division → ${c} ÷ ${div} = ${division}`,
          `Step 3: Perform Subtraction → ${mult} - ${division} = ${ans}`,
        ],
      };
    } else {
      const a = randInt(15, 45);
      const b = randInt(4, 9);
      const c = randInt(3, 7);
      const d = randInt(6, 20);
      const mult = b * c;
      const ans = a + mult - d;
      return {
        id,
        expression: `${a} + ${b} × ${c} - ${d}`,
        answer: ans,
        steps: [
          `Step 1: Multiplication evaluates first → ${b} × ${c} = ${mult}`,
          `Step 2: Addition (left to right) → ${a} + ${mult} = ${a + mult}`,
          `Step 3: Subtraction → ${a + mult} - ${d} = ${ans}`,
        ],
      };
    }
  } else {
    // Mode 3: Hard / Sprint → (A × B + C) ÷ D - E or A + (B - C) × (D + E)
    const divisor = randInt(2, 6);
    const quotient = randInt(8, 25);
    const targetInner = divisor * quotient;
    const a = randInt(4, 12);
    const b = randInt(3, 8);
    const mult = a * b;
    const c = targetInner - mult;
    const e = randInt(3, 15);
    const sign = c >= 0 ? "+" : "-";
    const absC = Math.abs(c);
    const ans = quotient - e;

    return {
      id,
      expression: `(${a} × ${b} ${sign} ${absC}) ÷ ${divisor} - ${e}`,
      answer: ans,
      steps: [
        `Step 1: Inside brackets → multiply first: ${a} × ${b} = ${mult}`,
        `Step 2: Complete bracket → ${mult} ${sign} ${absC} = ${targetInner}`,
        `Step 3: Division → ${targetInner} ÷ ${divisor} = ${quotient}`,
        `Step 4: Subtraction → ${quotient} - ${e} = ${ans}`,
      ],
    };
  }
}

export default function BodmasScreen() {
  const [difficulty, setDifficulty] = useState<BodmasDifficulty>("easy");
  const [currentQ, setCurrentQ] = useState<BodmasQuestion>(() => generateBodmasQuestion("easy"));
  const [userInput, setUserInput] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleDifficultyChange = (d: BodmasDifficulty) => {
    setDifficulty(d);
    setCurrentQ(generateBodmasQuestion(d));
    setUserInput("");
    setFeedback("idle");
  };

  const handleKeyPress = (val: string) => {
    if (feedback !== "idle") return;
    if (userInput.length >= 8) return;
    setUserInput((prev) => prev + val);
  };

  const handleDelete = () => {
    if (feedback !== "idle") return;
    setUserInput((prev) => prev.slice(0, -1));
  };

  const handleToggleSign = () => {
    if (feedback !== "idle") return;
    if (userInput.startsWith("-")) {
      setUserInput((prev) => prev.slice(1));
    } else {
      setUserInput((prev) => (prev ? `-${prev}` : "-"));
    }
  };

  const handleSubmit = () => {
    if (!userInput.trim() || userInput === "-") return;
    const num = parseInt(userInput, 10);
    if (isNaN(num)) return;

    if (num === currentQ.answer) {
      setFeedback("correct");
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) setBestStreak(nextStreak);
      setTotalSolved((t) => t + 1);

      setTimeout(() => {
        setCurrentQ(generateBodmasQuestion(difficulty));
        setUserInput("");
        setFeedback("idle");
      }, 1200);
    } else {
      setFeedback("incorrect");
      setStreak(0);
    }
  };

  const handleNextAfterError = () => {
    setCurrentQ(generateBodmasQuestion(difficulty));
    setUserInput("");
    setFeedback("idle");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={BRAND_COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>BODMAS Master</Text>
          <Text style={styles.headerSubtitle}>Order of Operations Drill</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowRuleModal(true)}
          style={styles.infoBtn}
          activeOpacity={0.7}
        >
          <Info size={20} color={BRAND_COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Switcher to 16 Speed Calculation Drills */}
        <TouchableOpacity
          style={styles.speedDrillsSwitchBanner}
          onPress={() => router.push("/speed-math" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.speedDrillsSwitchLeft}>
            <View style={styles.speedDrillsSwitchIconBox}>
              <Calculator size={14} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.speedDrillsSwitchTitle}>16 Speed Calculation Drills</Text>
              <Text style={styles.speedDrillsSwitchSub}>Squares, Roots, Tables, % to Fractions</Text>
            </View>
          </View>
          <View style={styles.speedDrillsSwitchRight}>
            <Text style={styles.speedDrillsSwitchAction}>Open ⚡</Text>
            <ChevronRight size={14} color="#2563eb" />
          </View>
        </TouchableOpacity>

        {/* Difficulty Selector Tabs */}
        <View style={styles.diffSelector}>
          {(["easy", "medium", "hard", "sprint"] as BodmasDifficulty[]).map((d) => {
            const isSel = difficulty === d;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => handleDifficultyChange(d)}
                style={[styles.diffPill, isSel && styles.diffPillActive]}
              >
                <Text style={[styles.diffPillText, isSel && styles.diffPillTextActive]}>
                  {d.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Flame size={14} color="#f59e0b" />
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={[styles.statVal, { color: "#f59e0b" }]}>{streak}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Trophy size={14} color="#3b82f6" />
            <Text style={styles.statLabel}>Best</Text>
            <Text style={[styles.statVal, { color: "#3b82f6" }]}>{bestStreak}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <CheckCircle2 size={14} color="#10b981" />
            <Text style={styles.statLabel}>Solved</Text>
            <Text style={[styles.statVal, { color: "#10b981" }]}>{totalSolved}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statVal}>
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
            </Text>
          </View>
        </View>

        {/* Main Equation Box */}
        <View style={styles.equationCard}>
          <View style={styles.equationTag}>
            <Zap size={13} color="#2563eb" />
            <Text style={styles.equationTagText}>Calculate according to BODMAS</Text>
          </View>

          <Text style={styles.equationText}>{currentQ.expression}</Text>
          <Text style={styles.equalsSign}>=</Text>

          {/* User Input Display */}
          <View
            style={[
              styles.inputBox,
              feedback === "correct" && styles.inputBoxCorrect,
              feedback === "incorrect" && styles.inputBoxIncorrect,
            ]}
          >
            <Text style={styles.inputText}>
              {userInput ? userInput : <Text style={styles.placeholderText}>?</Text>}
            </Text>
          </View>

          {/* Correct Celebration Feedback */}
          {feedback === "correct" && (
            <View style={styles.correctBanner}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.correctBannerText}>Excellent! Correct Answer.</Text>
            </View>
          )}

          {/* Step-by-Step Breakdown on Error */}
          {feedback === "incorrect" && (
            <View style={styles.errorWalkthrough}>
              <View style={styles.errorHeader}>
                <XCircle size={16} color="#dc2626" />
                <Text style={styles.errorHeaderText}>
                  Incorrect. Correct answer is <Text style={{ fontWeight: "900" }}>{currentQ.answer}</Text>
                </Text>
              </View>

              <Text style={styles.stepTitle}>BODMAS Order of Operations:</Text>
              {currentQ.steps.map((step, idx) => (
                <Text key={idx} style={styles.stepText}>
                  {step}
                </Text>
              ))}

              <TouchableOpacity onPress={handleNextAfterError} style={styles.nextQuestionBtn}>
                <Text style={styles.nextQuestionBtnText}>Next Question →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          <View style={styles.keyRow}>
            {["7", "8", "9"].map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => handleKeyPress(k)}
                style={styles.key}
                activeOpacity={0.6}
              >
                <Text style={styles.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keyRow}>
            {["4", "5", "6"].map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => handleKeyPress(k)}
                style={styles.key}
                activeOpacity={0.6}
              >
                <Text style={styles.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keyRow}>
            {["1", "2", "3"].map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => handleKeyPress(k)}
                style={styles.key}
                activeOpacity={0.6}
              >
                <Text style={styles.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keyRow}>
            <TouchableOpacity onPress={handleToggleSign} style={styles.opKey} activeOpacity={0.6}>
              <Text style={styles.opKeyText}>+/-</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleKeyPress("0")} style={styles.key} activeOpacity={0.6}>
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} style={styles.opKey} activeOpacity={0.6}>
              <Text style={styles.opKeyText}>⌫</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keyRow}>
            <TouchableOpacity onPress={() => setUserInput("")} style={styles.clearBtn} activeOpacity={0.7}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitBtn, !userInput && styles.submitBtnDisabled]}
              disabled={!userInput}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Submit Answer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* BODMAS Rule Reference Modal */}
      <Modal visible={showRuleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Calculator size={20} color="#2563eb" />
                <Text style={styles.modalTitle}>BODMAS Order Rules</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRuleModal(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.ruleIntro}>
                Always evaluate arithmetic expressions following the strict hierarchy from top to bottom:
              </Text>

              {[
                { letter: "B", title: "Brackets First", desc: "Evaluate expressions inside ( ), { }, [ ] before anything else." },
                { letter: "O", title: "Orders / Powers", desc: "Evaluate powers, roots, and exponents (e.g. 5² = 25, √16 = 4)." },
                { letter: "D", title: "Division", desc: "Division and Multiplication have equal priority; evaluate from Left to Right." },
                { letter: "M", title: "Multiplication", desc: "e.g. In 20 ÷ 5 × 2 → 4 × 2 = 8 (Left to Right rule)." },
                { letter: "A", title: "Addition", desc: "Addition and Subtraction have equal priority; evaluate from Left to Right." },
                { letter: "S", title: "Subtraction", desc: "e.g. In 15 - 5 + 3 → 10 + 3 = 13 (Left to Right rule)." },
              ].map((r) => (
                <View key={r.letter} style={styles.ruleRow}>
                  <View style={styles.ruleLetterBox}>
                    <Text style={styles.ruleLetterText}>{r.letter}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleRowTitle}>{r.title}</Text>
                    <Text style={styles.ruleRowDesc}>{r.desc}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setShowRuleModal(false)}
                style={styles.closeModalBtn}
              >
                <Text style={styles.closeModalBtnText}>Got It, Let's Practice</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    marginTop: 1,
  },
  infoBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.background,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  speedDrillsSwitchBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 14,
  },
  speedDrillsSwitchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  speedDrillsSwitchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  speedDrillsSwitchTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e40af",
  },
  speedDrillsSwitchSub: {
    fontSize: 11,
    color: "#3b82f6",
    marginTop: 1,
  },
  speedDrillsSwitchRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  speedDrillsSwitchAction: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563eb",
  },
  diffSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  diffPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  diffPillActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  diffPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.textSecondary,
  },
  diffPillTextActive: {
    color: "#ffffff",
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
    marginTop: 2,
  },
  statVal: {
    fontSize: 14,
    fontWeight: "900",
    color: BRAND_COLORS.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: BRAND_COLORS.border,
  },
  equationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  equationTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  equationTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
  },
  equationText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  equalsSign: {
    fontSize: 22,
    fontWeight: "900",
    color: "#94a3b8",
    marginVertical: 4,
  },
  inputBox: {
    minWidth: 120,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.background,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inputBoxCorrect: {
    borderColor: "#10b981",
    backgroundColor: "#ecfdf5",
  },
  inputBoxIncorrect: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  inputText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
  },
  placeholderText: {
    color: "#94a3b8",
  },
  correctBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  correctBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  errorWalkthrough: {
    marginTop: 16,
    width: "100%",
    backgroundColor: "#fff1f2",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  errorHeaderText: {
    fontSize: 13,
    color: "#b91c1c",
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9f1239",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 2,
  },
  nextQuestionBtn: {
    marginTop: 10,
    backgroundColor: "#e11d48",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  nextQuestionBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  keypad: {
    gap: 8,
  },
  keyRow: {
    flexDirection: "row",
    gap: 8,
  },
  key: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  keyText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  opKey: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  opKeyText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#334155",
  },
  clearBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  submitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  modalBody: {
    padding: 18,
  },
  ruleIntro: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  ruleLetterBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleLetterText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1d4ed8",
  },
  ruleRowTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  ruleRowDesc: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    marginTop: 1,
    lineHeight: 16,
  },
  closeModalBtn: {
    marginTop: 10,
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
