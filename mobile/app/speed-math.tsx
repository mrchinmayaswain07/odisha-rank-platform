import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Zap,
  Plus,
  Minus,
  X,
  Divide,
  Calculator,
  Square,
  Box,
  Grid,
  PieChart,
  ArrowLeftRight,
  BarChart3,
  Shuffle,
  RotateCcw,
  Timer,
  Flame,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Play,
  Check,
} from "lucide-react-native";
import {
  SpeedMathCategory,
  SpeedMathDifficulty,
  SpeedMathQuestion,
  SpeedMathResult,
  SpeedMathAttemptRecord,
  SPEED_MATH_CATEGORIES,
  generateSpeedMathQuestions,
  calculateSpeedMathResult,
  BRAND_COLORS,
} from "@odisha-rank/shared";

const { width } = Dimensions.get("window");

export default function SpeedMathScreen() {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<SpeedMathCategory | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<SpeedMathDifficulty>("medium");
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(20);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Active Drill State
  const [isDrillActive, setIsDrillActive] = useState(false);
  const [questions, setQuestions] = useState<SpeedMathQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInputValue, setUserInputValue] = useState("");
  const [records, setRecords] = useState<SpeedMathAttemptRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Timing
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionStartTimestamp, setQuestionStartTimestamp] = useState<number>(0);
  const [drillResult, setDrillResult] = useState<SpeedMathResult | null>(null);

  // Feedback Animation
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [lastFeedbackAnswer, setLastFeedbackAnswer] = useState("");

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isDrillActive && !drillResult) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => Math.round((prev + 0.1) * 10) / 10);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isDrillActive, drillResult]);

  useEffect(() => {
    if (isDrillActive && !drillResult) {
      setUserInputValue("");
      setQuestionStartTimestamp(Date.now());
    }
  }, [currentIndex, isDrillActive, drillResult]);

  const handleOpenConfig = (category: SpeedMathCategory) => {
    setSelectedCategory(category);
    setShowConfigModal(true);
  };

  const handleStartDrill = () => {
    if (!selectedCategory) return;
    const generated = generateSpeedMathQuestions(
      selectedCategory,
      selectedDifficulty,
      selectedQuestionCount
    );
    setQuestions(generated);
    setCurrentIndex(0);
    setRecords([]);
    setStreak(0);
    setMaxStreak(0);
    setElapsedSeconds(0);
    setDrillResult(null);
    setFeedbackState("idle");
    setShowConfigModal(false);
    setIsDrillActive(true);
  };

  const handleAnswerSubmit = (submittedValue?: string) => {
    const value = (submittedValue !== undefined ? submittedValue : userInputValue).trim();
    if (!value && value !== "0") return;

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const now = Date.now();
    const timeTaken = Math.max(0.2, Math.round(((now - questionStartTimestamp) / 1000) * 10) / 10);

    const isCorrect = value.toLowerCase() === currentQ.answer.toLowerCase();

    const newRecord: SpeedMathAttemptRecord = {
      prompt: currentQ.prompt,
      userAnswer: value,
      correctAnswer: currentQ.answer,
      isCorrect,
      timeSeconds: timeTaken,
    };

    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);
      setFeedbackState("correct");
    } else {
      setStreak(0);
      setFeedbackState("incorrect");
      setLastFeedbackAnswer(currentQ.answer);
    }

    setTimeout(() => {
      setFeedbackState("idle");
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        const result = calculateSpeedMathResult(
          selectedCategory || "mix",
          selectedDifficulty,
          updatedRecords
        );
        setDrillResult(result);
        setIsDrillActive(false);
      }
    }, isCorrect ? 250 : 600);
  };

  const handleNumpadPress = (char: string) => {
    if (char === "DEL") {
      setUserInputValue((prev) => prev.slice(0, -1));
    } else if (char === "ENTER") {
      handleAnswerSubmit();
    } else {
      setUserInputValue((prev) => prev + char);
    }
  };

  const renderDrillIcon = (iconName: string, color: string) => {
    const props = { size: 24, color: "#ffffff" };
    switch (iconName) {
      case "Plus":
        return <Plus {...props} />;
      case "Minus":
        return <Minus {...props} />;
      case "X":
        return <X {...props} />;
      case "Divide":
        return <Divide {...props} />;
      case "Calculator":
        return <Calculator {...props} />;
      case "Square":
        return <Square {...props} />;
      case "Box":
        return <Box {...props} />;
      case "Grid":
        return <Grid {...props} />;
      case "Radical":
        return <Text style={styles.symbolIcon}>√</Text>;
      case "Cuboid":
        return <Text style={styles.symbolIcon}>∛</Text>;
      case "Superscript":
        return <Text style={styles.symbolIcon}>x²</Text>;
      case "RotateCcw":
        return <Text style={styles.symbolIcon}>x√</Text>;
      case "PieChart":
        return <PieChart {...props} />;
      case "ArrowLeftRight":
        return <ArrowLeftRight {...props} />;
      case "BarChart3":
        return <BarChart3 {...props} />;
      case "Shuffle":
        return <Shuffle {...props} />;
      default:
        return <Zap {...props} />;
    }
  };

  const filteredCategories = SPEED_MATH_CATEGORIES.filter((cat) => {
    if (activeFilter === "CORE" && cat.badge !== "CORE") return false;
    if (activeFilter === "MEMORY" && cat.badge !== "MEMORY") return false;
    if (activeFilter === "CONCEPT" && cat.badge !== "CONCEPT") return false;
    if (activeFilter === "PERCENT" && cat.badge !== "PERCENT") return false;
    if (activeFilter === "EXAM_DI" && !["EXAM", "DI", "RANDOM"].includes(cat.badge)) return false;
    return true;
  });

  const selectedCategoryMeta = SPEED_MATH_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (isDrillActive && !drillResult) {
              Alert.alert(
                "Exit Drill?",
                "Are you sure you want to stop the current calculation drill?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Exit", style: "destructive", onPress: () => setIsDrillActive(false) },
                ]
              );
            } else {
              router.back();
            }
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Speed Calculation</Text>
          <Text style={styles.headerSubtitle}>Mental Arithmetic Drills</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* VIEW 1: RESULTS SUMMARY */}
      {drillResult && (
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={styles.resultsCard}>
            <View style={styles.trophyBadge}>
              <Trophy size={18} color="#f59e0b" />
              <Text style={styles.trophyBadgeText}>Drill Completed</Text>
            </View>

            <Text style={styles.resultsTitle}>{selectedCategoryMeta?.name} Performance</Text>
            <Text style={styles.resultsSubtitle}>
              {drillResult.difficulty.toUpperCase()} • {drillResult.totalQuestions} Questions
            </Text>

            <View style={styles.ratingBox}>
              <Text style={styles.ratingSub}>CALCULATION SPEED RATING</Text>
              <Text style={styles.ratingText}>{drillResult.speedRating}</Text>
            </View>

            {/* 4 Stat Boxes */}
            <View style={styles.statGrid}>
              <View style={[styles.statBox, { backgroundColor: "#eff6ff" }]}>
                <Text style={[styles.statLabel, { color: "#2563eb" }]}>ACCURACY</Text>
                <Text style={[styles.statValue, { color: "#1e3a8a" }]}>
                  {drillResult.accuracyPercentage}%
                </Text>
                <Text style={styles.statMeta}>
                  {drillResult.correctAnswers}/{drillResult.totalQuestions}
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: "#ecfdf5" }]}>
                <Text style={[styles.statLabel, { color: "#059669" }]}>AVG SPEED</Text>
                <Text style={[styles.statValue, { color: "#064e3b" }]}>
                  {drillResult.averageSecondsPerQuestion}s
                </Text>
                <Text style={styles.statMeta}>per Q</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: "#fffbeb" }]}>
                <Text style={[styles.statLabel, { color: "#d97706" }]}>DURATION</Text>
                <Text style={[styles.statValue, { color: "#78350f" }]}>
                  {drillResult.totalTimeSeconds}s
                </Text>
                <Text style={styles.statMeta}>total</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: "#fff1f2" }]}>
                <Text style={[styles.statLabel, { color: "#e11d48" }]}>STREAK</Text>
                <Text style={[styles.statValue, { color: "#881337" }]}>🔥 {maxStreak}</Text>
                <Text style={styles.statMeta}>in a row</Text>
              </View>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleStartDrill}
              activeOpacity={0.8}
            >
              <RotateCcw size={16} color="#ffffff" />
              <Text style={styles.primaryActionButtonText}>Restart This Drill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => {
                setDrillResult(null);
                setIsDrillActive(false);
                setShowConfigModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionButtonText}>Change Difficulty / Count</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineActionButton}
              onPress={() => {
                setDrillResult(null);
                setIsDrillActive(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineActionButtonText}>Back to All Drills</Text>
            </TouchableOpacity>
          </View>

          {/* Breakdown List */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Question Breakdown</Text>
            {drillResult.records.map((rec, i) => (
              <View
                key={i}
                style={[
                  styles.breakdownRow,
                  rec.isCorrect ? styles.rowCorrect : styles.rowIncorrect,
                ]}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowIndex}>#{i + 1}</Text>
                  <Text style={styles.rowPrompt}>{rec.prompt}</Text>
                </View>
                <View style={styles.rowRight}>
                  <View style={styles.rowAnswers}>
                    <Text
                      style={[
                        styles.rowUserAns,
                        rec.isCorrect ? styles.textCorrect : styles.textIncorrect,
                      ]}
                    >
                      {rec.userAnswer || "—"}
                    </Text>
                    {!rec.isCorrect && (
                      <Text style={styles.rowCorrectAns}>Ans: {rec.correctAnswer}</Text>
                    )}
                  </View>
                  <Text style={styles.rowTime}>{rec.timeSeconds}s</Text>
                  {rec.isCorrect ? (
                    <CheckCircle2 size={18} color="#059669" />
                  ) : (
                    <XCircle size={18} color="#dc2626" />
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* VIEW 2: ACTIVE DRILL RUNNER */}
      {isDrillActive && !drillResult && (
        <View style={styles.drillContainer}>
          {/* Top Info Bar */}
          <View style={styles.drillTopBar}>
            <View>
              <View style={styles.drillMetaRow}>
                <Text style={styles.drillCategoryName}>{selectedCategoryMeta?.name}</Text>
                <View style={styles.diffPill}>
                  <Text style={styles.diffPillText}>{selectedDifficulty.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.drillCounterText}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
            </View>

            <View style={styles.drillTopRight}>
              {streak > 1 && (
                <View style={styles.streakPill}>
                  <Flame size={14} color="#f59e0b" />
                  <Text style={styles.streakPillText}>{streak} Streak</Text>
                </View>
              )}
              <View style={styles.timerPill}>
                <Timer size={14} color="#38bdf8" />
                <Text style={styles.timerText}>{elapsedSeconds.toFixed(1)}s</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>

          {/* Main Question Box */}
          <View
            style={[
              styles.questionBox,
              feedbackState === "correct" && styles.boxCorrect,
              feedbackState === "incorrect" && styles.boxIncorrect,
            ]}
          >
            {questions[currentIndex]?.subtext && (
              <Text style={styles.questionSubtext}>{questions[currentIndex].subtext}</Text>
            )}

            <Text style={styles.questionPromptText}>{questions[currentIndex]?.prompt}</Text>

            {/* Answer Display */}
            <View style={styles.answerDisplayBox}>
              <Text style={styles.answerDisplayText}>
                {userInputValue || "?"}
              </Text>
            </View>

            {/* Options if Multiple Choice */}
            {questions[currentIndex]?.options && questions[currentIndex].options!.length > 0 ? (
              <View style={styles.optionsGrid}>
                {questions[currentIndex].options!.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.optionButton}
                    onPress={() => handleAnswerSubmit(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.optionButtonText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Feedback Banners */}
            {feedbackState === "incorrect" && (
              <View style={styles.feedbackBannerWrong}>
                <Text style={styles.feedbackBannerWrongText}>
                  Wrong! Correct: {lastFeedbackAnswer}
                </Text>
              </View>
            )}
            {feedbackState === "correct" && (
              <View style={styles.feedbackBannerRight}>
                <Text style={styles.feedbackBannerRightText}>✓ Correct!</Text>
              </View>
            )}
          </View>

          {/* Touch Numpad */}
          {(!questions[currentIndex]?.options || questions[currentIndex].options!.length === 0) && (
            <View style={styles.numpadContainer}>
              <View style={styles.numpadRow}>
                {["1", "2", "3"].map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={styles.numpadKey}
                    onPress={() => handleNumpadPress(k)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.numpadKeyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.numpadRow}>
                {["4", "5", "6"].map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={styles.numpadKey}
                    onPress={() => handleNumpadPress(k)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.numpadKeyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.numpadRow}>
                {["7", "8", "9"].map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={styles.numpadKey}
                    onPress={() => handleNumpadPress(k)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.numpadKeyText}>{k}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.numpadRow}>
                <TouchableOpacity
                  style={[styles.numpadKey, styles.numpadKeyDel]}
                  onPress={() => handleNumpadPress("DEL")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.numpadKeyDelText}>⌫</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.numpadKey}
                  onPress={() => handleNumpadPress("0")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.numpadKeyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.numpadKey, styles.numpadKeyEnter]}
                  onPress={() => handleNumpadPress("ENTER")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.numpadKeyEnterText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* VIEW 3: DRILL CATALOG */}
      {!isDrillActive && !drillResult && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroBadge}>
              <Zap size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.heroBadgeText}>Speed Math & BODMAS</Text>
            </View>
            <Text style={styles.heroTitle}>BODMAS & Speed Drills</Text>
            <Text style={styles.heroSub}>
              Build lightning calculation speed for OSSC, OSSSC, and OPSC exams with 16 dedicated
              speed drills including BODMAS, powers, roots, and percentages.
            </Text>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            {[
              { id: "ALL", label: "All (16)" },
              { id: "CORE", label: "Core Operations" },
              { id: "MEMORY", label: "Memory (Sq & Cubes)" },
              { id: "CONCEPT", label: "Roots & Exponents" },
              { id: "PERCENT", label: "Percentages" },
              { id: "EXAM_DI", label: "Exam & DI" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPill,
                  activeFilter === tab.id && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === tab.id && styles.filterPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cards Grid */}
          <View style={styles.cardsGrid}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.drillCard}
                onPress={() => handleOpenConfig(cat.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.cardIconBox, { backgroundColor: cat.color }]}>
                    {renderDrillIcon(cat.iconName, cat.color)}
                  </View>
                  <View style={styles.cardBadgePill}>
                    <Text style={styles.cardBadgePillText}>{cat.badge}</Text>
                  </View>
                </View>

                <Text style={styles.cardName}>{cat.name}</Text>
                <Text style={styles.cardDesc}>{cat.description}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>Start Practice</Text>
                  <ArrowRight size={14} color={BRAND_COLORS.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* SETUP CONFIG MODAL */}
      <Modal visible={showConfigModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <View
                  style={[
                    styles.modalIconBox,
                    { backgroundColor: selectedCategoryMeta?.color || BRAND_COLORS.primary },
                  ]}
                >
                  {selectedCategoryMeta &&
                    renderDrillIcon(selectedCategoryMeta.iconName, selectedCategoryMeta.color)}
                </View>
                <View>
                  <Text style={styles.modalTitle}>{selectedCategoryMeta?.name}</Text>
                  <Text style={styles.modalSub}>Speed Drill Setup</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowConfigModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* 1. Difficulty Selector: Easy | Mid | Hard */}
            <Text style={styles.configSectionTitle}>1. Select Difficulty</Text>
            <View style={styles.configOptionsRow}>
              {[
                { id: "easy" as SpeedMathDifficulty, label: "Easy", sub: "Basic drills" },
                { id: "medium" as SpeedMathDifficulty, label: "Mid", sub: "Exam standard" },
                { id: "hard" as SpeedMathDifficulty, label: "Hard", sub: "High speed" },
              ].map((diff) => (
                <TouchableOpacity
                  key={diff.id}
                  style={[
                    styles.diffButton,
                    selectedDifficulty === diff.id && styles.diffButtonActive,
                  ]}
                  onPress={() => setSelectedDifficulty(diff.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.diffButtonText,
                      selectedDifficulty === diff.id && styles.diffButtonTextActive,
                    ]}
                  >
                    {diff.label}
                  </Text>
                  <Text style={styles.diffButtonSub}>{diff.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 2. Question Count Selector: 10 | 20 | 30 | 50 */}
            <Text style={styles.configSectionTitle}>2. Number of Questions</Text>
            <View style={styles.configOptionsRow}>
              {[10, 20, 30, 50].map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.countButton,
                    selectedQuestionCount === count && styles.countButtonActive,
                  ]}
                  onPress={() => setSelectedQuestionCount(count)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.countButtonText,
                      selectedQuestionCount === count && styles.countButtonTextActive,
                    ]}
                  >
                    {count} Qs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Launch Button */}
            <TouchableOpacity
              style={styles.launchButton}
              onPress={handleStartDrill}
              activeOpacity={0.8}
            >
              <Play size={16} color="#ffffff" fill="#ffffff" />
              <Text style={styles.launchButtonText}>Start Practice Session ⚡</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  headerTitles: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  symbolIcon: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
  },

  /* Hero Banner */
  heroBanner: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#f59e0b",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
  },

  /* Filter Pills */
  filterPillsContainer: {
    gap: 8,
    paddingBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPillActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },

  /* Cards Grid */
  cardsGrid: {
    gap: 12,
  },
  drillCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBadgePill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardBadgePillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#475569",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  cardFooterText: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },

  /* Modal Config */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 380,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 14,
  },
  modalTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalSub: {
    fontSize: 11,
    color: "#64748b",
  },
  modalCloseBtn: {
    padding: 4,
  },
  configSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  configOptionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  diffButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  diffButtonActive: {
    backgroundColor: "#eff6ff",
    borderColor: BRAND_COLORS.primary,
  },
  diffButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
  },
  diffButtonTextActive: {
    color: BRAND_COLORS.primary,
  },
  diffButtonSub: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 2,
  },
  countButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  countButtonActive: {
    backgroundColor: "#eff6ff",
    borderColor: BRAND_COLORS.primary,
  },
  countButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
  },
  countButtonTextActive: {
    color: BRAND_COLORS.primary,
  },
  launchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    marginTop: 6,
  },
  launchButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },

  /* Drill Runner */
  drillContainer: {
    flex: 1,
    padding: 16,
  },
  drillTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  drillMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  drillCategoryName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  diffPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#475569",
  },
  drillCounterText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  drillTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#b45309",
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ffffff",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: BRAND_COLORS.primary,
  },
  questionBox: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    marginBottom: 12,
  },
  boxCorrect: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  boxIncorrect: {
    borderColor: "#f43f5e",
    backgroundColor: "#fff1f2",
  },
  questionSubtext: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  questionPromptText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0f172a",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginVertical: 10,
  },
  answerDisplayBox: {
    width: "70%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    marginVertical: 8,
  },
  answerDisplayText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    width: "100%",
  },
  optionButton: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  feedbackBannerWrong: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
  },
  feedbackBannerWrongText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#991b1b",
  },
  feedbackBannerRight: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#dcfce7",
  },
  feedbackBannerRightText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#166534",
  },

  /* Touch Numpad */
  numpadContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  numpadRow: {
    flexDirection: "row",
    gap: 8,
  },
  numpadKey: {
    flex: 1,
    height: 48,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  numpadKeyText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  numpadKeyDel: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  numpadKeyDelText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e11d48",
  },
  numpadKeyEnter: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  numpadKeyEnterText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },

  /* Results Screen */
  resultsContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  resultsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  trophyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  trophyBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
  },
  resultsSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  ratingBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginVertical: 14,
    width: "100%",
  },
  ratingSub: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 2,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
    marginBottom: 16,
  },
  statBox: {
    width: "48%",
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    marginVertical: 2,
  },
  statMeta: {
    fontSize: 10,
    color: "#64748b",
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    width: "100%",
    gap: 6,
    marginBottom: 8,
  },
  primaryActionButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  secondaryActionButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  secondaryActionButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },
  outlineActionButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  outlineActionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },

  /* Breakdown */
  breakdownCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  rowCorrect: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  rowIncorrect: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowIndex: {
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  rowPrompt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowAnswers: {
    alignItems: "flex-end",
  },
  rowUserAns: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  textCorrect: {
    color: "#15803d",
  },
  textIncorrect: {
    color: "#b91c1c",
    textDecorationLine: "line-through",
  },
  rowCorrectAns: {
    fontSize: 10,
    color: "#64748b",
  },
  rowTime: {
    fontSize: 10,
    color: "#94a3b8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
