import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  AppState,
  AppStateStatus,
  BackHandler,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Timer,
  Trophy,
  Zap,
  Target,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Check,
  Flame,
  BarChart3,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Brain,
  BookOpen,
  Hash,
  Scale,
  Percent,
  X,
  Plus,
  Minus,
  Divide,
  Square,
  Box,
  PieChart,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CalculationTrainerCategory,
  CalculationTrainerDifficulty,
  CalculationTrainerQuestion,
  CalculationTrainerAttempt,
  CalculationTrainerConfig,
  CalculationTrainerSessionSummary,
  CALCULATION_TRAINER_CATEGORIES,
  generateTrainerQuestion,
  evaluateTrainerSession,
  getIndianDateStr,
} from "@odisha-rank/shared";

const { width } = Dimensions.get("window");
const STORAGE_KEY_HISTORY = "@odisha_rank_calc_trainer_history";
const STORAGE_KEY_PREFS = "@odisha_rank_calc_trainer_prefs";
const STORAGE_KEY_RECENT_PROMPTS = "@odisha_rank_calc_trainer_recent_prompts";
const STORAGE_KEY_GAME_STATS = "@odisha_rank_game_stats";

type ScreenState = "config" | "training" | "results" | "mistake_review_mode";

export default function CalculationTrainerScreen() {
  const params = useLocalSearchParams<{ difficulty?: string; duration?: string; category?: string }>();

  // Screen State
  const [screenState, setScreenState] = useState<ScreenState>("config");

  // Configuration State
  const [selectedDuration, setSelectedDuration] = useState<number>(10);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customMinutesText, setCustomMinutesText] = useState<string>("3");
  const [selectedDifficulty, setSelectedDifficulty] = useState<CalculationTrainerDifficulty>("intermediate");
  const [selectedCategories, setSelectedCategories] = useState<CalculationTrainerCategory[]>([
    "addition",
    "subtraction",
    "multiplication",
    "division",
    "percentages",
    "bodmas",
  ]);
  const [inputMode, setInputMode] = useState<"mcq" | "numpad">("mcq");

  // Training Session State
  const [currentQuestion, setCurrentQuestion] = useState<CalculationTrainerQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [attempts, setAttempts] = useState<CalculationTrainerAttempt[]>([]);
  const attemptsRef = useRef<CalculationTrainerAttempt[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "wrong">("idle");
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; explanation: string; shortcut?: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [numpadValue, setNumpadValue] = useState<string>("");
  const [exitModalState, setExitModalState] = useState<"none" | "discard" | "finish_early">("none");

  // Elapsed Timing (Timestamp-based to avoid drift)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const sessionStartTimeRef = useRef<number>(0);
  const totalPausedMsRef = useRef<number>(0);
  const pauseStartMsRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const hasAwardedRewardRef = useRef<boolean>(false);

  // Results State
  const [sessionSummary, setSessionSummary] = useState<CalculationTrainerSessionSummary | null>(null);
  const [historyList, setHistoryList] = useState<CalculationTrainerSessionSummary[]>([]);
  const [activeMistakeReviewList, setActiveMistakeReviewList] = useState<CalculationTrainerAttempt[]>([]);

  // Deduplication & Balanced Category Deck State
  const seenPromptsRef = useRef<Set<string>>(new Set());
  const recentPromptsRef = useRef<string[]>([]);
  const categoryDeckRef = useRef<CalculationTrainerCategory[]>([]);

  const drawCategory = (pool: CalculationTrainerCategory[]) => {
    if (categoryDeckRef.current.length === 0) {
      categoryDeckRef.current = [...pool].sort(() => Math.random() - 0.5);
    }
    return categoryDeckRef.current.pop() || pool[0] || "addition";
  };

  // Load Saved Preferences & Past History once on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_PREFS).then((raw) => {
      if (raw) {
        try {
          const p = JSON.parse(raw);
          if (p.durationMinutes && !params?.duration) setSelectedDuration(p.durationMinutes);
          if (p.difficulty && !params?.difficulty) setSelectedDifficulty(p.difficulty);
          if (Array.isArray(p.categories) && p.categories.length > 0) setSelectedCategories(p.categories);
          if (p.inputMode) setInputMode(p.inputMode);
        } catch {}
      }
    });

    AsyncStorage.getItem(STORAGE_KEY_HISTORY).then((raw) => {
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) setHistoryList(list);
        } catch {}
      }
    });

    AsyncStorage.getItem(STORAGE_KEY_RECENT_PROMPTS).then((raw) => {
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) recentPromptsRef.current = list;
        } catch {}
      }
    });
  }, []);

  // Safe handler for deep-link difficulty param (avoids infinite re-render loop)
  const difficultyParam = params?.difficulty;
  useEffect(() => {
    if (difficultyParam && ["beginner", "intermediate", "advanced", "exam_challenge"].includes(difficultyParam)) {
      setSelectedDifficulty((prev) => (prev !== difficultyParam ? (difficultyParam as CalculationTrainerDifficulty) : prev));
      setScreenState((prev) => (prev !== "config" ? "config" : prev));
    }
  }, [difficultyParam]);

  // AppState backgrounding handler
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (screenState === "training" && !isPaused) {
        if (nextAppState === "background") {
          // Pause when app goes to background
          pauseStartMsRef.current = Date.now();
          setIsPaused(true);
        }
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [screenState, isPaused]);

  // Phase computation
  const sessionPhase = useMemo(() => {
    const totalSec = selectedDuration * 60;
    const elapsed = totalSec - remainingSeconds;
    const warmupThreshold = selectedDuration <= 2 ? Math.min(15, Math.floor(totalSec * 0.25)) : selectedDuration === 5 ? 45 : selectedDuration === 10 ? 60 : 90;
    const reviewThreshold = totalSec - (selectedDuration <= 2 ? Math.min(20, Math.floor(totalSec * 0.25)) : selectedDuration === 5 ? 60 : selectedDuration === 10 ? 120 : 180);

    if (elapsed < warmupThreshold) return { name: "Warm-Up", color: "#38bdf8", desc: "Build momentum" };
    if (elapsed >= reviewThreshold) return { name: "Final Sprint", color: "#f59e0b", desc: "Push speed under pressure" };
    return { name: "Main Sprint", color: "#22c55e", desc: "Accuracy & speed focus" };
  }, [selectedDuration, remainingSeconds]);

  // Next Question Generator
  const loadNextQuestion = useCallback(
    (idx: number, specificPool?: CalculationTrainerCategory[]) => {
      const pool = specificPool && specificPool.length > 0 ? specificPool : selectedCategories;
      const cat = drawCategory(pool);
      const excludeSet = new Set([...Array.from(seenPromptsRef.current), ...recentPromptsRef.current]);
      const q = generateTrainerQuestion(cat, selectedDifficulty, idx, {
        excludePrompts: excludeSet,
      });
      seenPromptsRef.current.add(q.prompt);
      setCurrentQuestion(q);
      setSelectedOption(null);
      setNumpadValue("");
      setFeedbackState("idle");
      questionStartTimeRef.current = Date.now();
      isSubmittingRef.current = false;
    },
    [selectedCategories, selectedDifficulty]
  );

  // Start Training Session
  const handleStartTraining = useCallback(() => {
    console.log("[CALC-TRAINER] handleStartTraining called! difficulty:", selectedDifficulty, "duration:", selectedDuration);
    if (selectedCategories.length === 0) {
      Alert.alert("Select Categories", "Please select at least one calculation category to start training.");
      return;
    }

    // Save preferences
    AsyncStorage.setItem(
      STORAGE_KEY_PREFS,
      JSON.stringify({
        durationMinutes: selectedDuration,
        difficulty: selectedDifficulty,
        categories: selectedCategories,
        inputMode,
      })
    );

    const totalSeconds = selectedDuration * 60;
    setRemainingSeconds(totalSeconds);
    attemptsRef.current = [];
    setAttempts([]);
    setQuestionIndex(1);
    setIsPaused(false);
    setFeedbackState("idle");
    setLastFeedback(null);
    totalPausedMsRef.current = 0;
    pauseStartMsRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    isSubmittingRef.current = false;
    hasAwardedRewardRef.current = false;

    seenPromptsRef.current = new Set();
    categoryDeckRef.current = [...selectedCategories].sort(() => Math.random() - 0.5);

    setScreenState("training");
    loadNextQuestion(1, selectedCategories);
  }, [selectedDuration, selectedDifficulty, selectedCategories, inputMode, loadNextQuestion]);

  // Finish Session & Evaluate
  const handleFinishSession = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const now = Date.now();
    const pausedAdd = pauseStartMsRef.current > 0 ? now - pauseStartMsRef.current : 0;
    const totalPaused = totalPausedMsRef.current + pausedAdd;
    const activeMs = Math.max(0, now - sessionStartTimeRef.current - totalPaused);
    const activeSec = Math.floor(activeMs / 1000);

    // Calculate highest previous CPM for comparable sessions (same difficulty & duration)
    const comparable = historyList.filter(
      (s) => s.difficulty === selectedDifficulty && s.durationMinutes === selectedDuration
    );
    const bestCpm = comparable.reduce((max, s) => Math.max(max, s.correctPerMinute || 0), 0);

    const config: CalculationTrainerConfig = {
      durationMinutes: selectedDuration,
      difficulty: selectedDifficulty,
      categories: selectedCategories,
      inputMode,
    };

    const curAttempts = attemptsRef.current;
    const summary = evaluateTrainerSession(curAttempts, config, activeSec, bestCpm);
    setSessionSummary(summary);
    setScreenState("results");

    // Persist into history list
    const updatedHistory = [summary, ...historyList].slice(0, 30);
    setHistoryList(updatedHistory);
    AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory)).catch(() => {});

    // Update cross-session rolling recent prompts buffer
    const updatedRecent = Array.from(new Set([...Array.from(seenPromptsRef.current), ...recentPromptsRef.current])).slice(0, 50);
    recentPromptsRef.current = updatedRecent;
    AsyncStorage.setItem(STORAGE_KEY_RECENT_PROMPTS, JSON.stringify(updatedRecent)).catch(() => {});

    // Increment Brain Score (+5) and games played in existing stats (only if eligible sprint and not yet awarded)
    if (curAttempts.length >= 3 && !hasAwardedRewardRef.current) {
      hasAwardedRewardRef.current = true;
      AsyncStorage.getItem(STORAGE_KEY_GAME_STATS).then((raw) => {
        let stats: any = {};
        try {
          if (raw) stats = JSON.parse(raw);
        } catch {}
        const curScore = stats.brainScore || 550;
        const curPlayed = stats.totalPlayed || 0;
        stats.brainScore = curScore + 5;
        stats.totalPlayed = curPlayed + 1;
        stats.lastTrainedAt = new Date().toISOString();
        AsyncStorage.setItem(STORAGE_KEY_GAME_STATS, JSON.stringify(stats));
      });
    }
  }, [selectedDifficulty, selectedDuration, selectedCategories, inputMode, historyList]);

  const handleFinishSessionRef = useRef(handleFinishSession);
  handleFinishSessionRef.current = handleFinishSession;

  // Timer Tick (Timestamp-based)
  useEffect(() => {
    if (screenState !== "training" || isPaused) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - sessionStartTimeRef.current - totalPausedMsRef.current;
      const totalSec = selectedDuration * 60;
      const left = Math.max(0, totalSec - Math.floor(elapsedMs / 1000));
      setRemainingSeconds(left);

      if (left <= 0) {
        clearInterval(timerIntervalRef.current!);
        handleFinishSessionRef.current();
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [screenState, isPaused, selectedDuration]);

  // Pause / Resume
  const togglePause = useCallback(() => {
    if (isPaused) {
      // Resume
      if (pauseStartMsRef.current > 0) {
        totalPausedMsRef.current += Date.now() - pauseStartMsRef.current;
        pauseStartMsRef.current = 0;
      }
      setIsPaused(false);
    } else {
      // Pause
      pauseStartMsRef.current = Date.now();
      setIsPaused(true);
    }
  }, [isPaused]);

  // Advance to next question cleanly
  const advanceToNextQuestion = useCallback(() => {
    try {
      const pool =
        selectedCategories && selectedCategories.length > 0
          ? selectedCategories
          : CALCULATION_TRAINER_CATEGORIES.map((c) => c.id);
      const cat = drawCategory(pool);
      const excludeSet = new Set([...Array.from(seenPromptsRef.current), ...recentPromptsRef.current]);
      const nextQ = generateTrainerQuestion(cat, selectedDifficulty, questionIndex + 1, {
        excludePrompts: excludeSet,
      });
      seenPromptsRef.current.add(nextQ.prompt);
      setCurrentQuestion(nextQ);
      setSelectedOption(null);
      setNumpadValue("");
      setFeedbackState("idle");
      setQuestionIndex((prev) => prev + 1);
      questionStartTimeRef.current = Date.now();
      isSubmittingRef.current = false;
    } catch (err: any) {
      isSubmittingRef.current = false;
      setFeedbackState("idle");
    }
  }, [selectedCategories, selectedDifficulty, questionIndex]);

  // Answer Submission Handler (Protected against double submission)
  const handleSubmitAnswer = useCallback(
    (rawAnswer: string, isSkip: boolean = false) => {
      console.log("[CALC-TRAINER] handleSubmitAnswer called:", { rawAnswer, isSkip, isSubmitting: isSubmittingRef.current, isPaused });
      if (!currentQuestion || isSubmittingRef.current || isPaused) return;
      isSubmittingRef.current = true;

      const timeTakenMs = Math.max(100, Date.now() - questionStartTimeRef.current);
      const cleanedUser = rawAnswer.trim().toLowerCase();
      const cleanedCorrect = currentQuestion.answer.trim().toLowerCase();
      const isCorrect = !isSkip && cleanedUser === cleanedCorrect;

      const attempt: CalculationTrainerAttempt = {
        questionId: currentQuestion.id,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        prompt: currentQuestion.prompt,
        userAnswer: isSkip ? "Skipped" : rawAnswer,
        correctAnswer: currentQuestion.answer,
        isCorrect,
        isSkipped: isSkip,
        timeMs: timeTakenMs,
        explanation: currentQuestion.explanation,
        shortcut: currentQuestion.shortcut,
      };

      attemptsRef.current = [...attemptsRef.current, attempt];
      setAttempts((prev) => [...prev, attempt]);
      setSelectedOption(rawAnswer);
      setFeedbackState(isCorrect ? "correct" : "wrong");
      setLastFeedback({
        isCorrect,
        explanation: currentQuestion.explanation,
        shortcut: currentQuestion.shortcut,
      });

      // Quick advance: 350ms for correct, 900ms for incorrect to absorb shortcut
      const delayMs = isCorrect ? 350 : 900;
      setTimeout(() => {
        advanceToNextQuestion();
      }, delayMs);
    },
    [currentQuestion, isPaused, advanceToNextQuestion]
  );

  // Retrying Mistakes Mode
  const handleStartMistakePractice = useCallback(() => {
    if (!sessionSummary || sessionSummary.mistakes.length === 0) return;
    setActiveMistakeReviewList([...sessionSummary.mistakes]);
    setScreenState("mistake_review_mode");
  }, [sessionSummary]);

  // Request Exit from Sprint (handles minimum attempt threshold)
  const handleRequestExit = useCallback(() => {
    if (attemptsRef.current.length < 3) {
      setExitModalState("discard");
    } else {
      setExitModalState("finish_early");
    }
  }, []);

  // Android Hardware Back Navigation Handler
  useEffect(() => {
    const onBackPress = () => {
      if (exitModalState !== "none") {
        setExitModalState("none");
        return true;
      }
      if (screenState === "mistake_review_mode") {
        setScreenState("results");
        return true;
      }
      if (screenState === "results") {
        setScreenState("config");
        return true;
      }
      if (screenState === "training") {
        handleRequestExit();
        return true;
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/brain-gym" as any);
      }
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [exitModalState, screenState, handleRequestExit]);

  // Category Toggle in Configuration
  const toggleCategory = useCallback((cat: CalculationTrainerCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    setSelectedCategories(CALCULATION_TRAINER_CATEGORIES.map((c) => c.id));
  }, []);

  // Format time MM:SS
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // =========================================================================
  // VIEW 1: CONFIGURATION SCREEN
  // =========================================================================
  if (screenState === "config") {
    const lastSession = historyList[0] || null;
    const personalBest = historyList.reduce(
      (max, s) => Math.max(max, s.correctPerMinute || 0),
      0
    );

    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/brain-gym" as any);
              }
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Calculation Speed Trainer</Text>
            <Text style={styles.headerSubtitle}>Competitive Exam Mental Math</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.configContent}
          showsVerticalScrollIndicator={false}
        >
          {/* History Pill / Personal Best Banner */}
          {lastSession ? (
            <View style={styles.historyBanner}>
              <View style={styles.historyRow}>
                <View style={styles.historyStatBox}>
                  <Text style={styles.historyStatLabel}>LAST ACCURACY</Text>
                  <Text style={styles.historyStatValue}>{lastSession.accuracyPercentage}%</Text>
                </View>
                <View style={styles.historyStatBox}>
                  <Text style={styles.historyStatLabel}>AVG TIME</Text>
                  <Text style={styles.historyStatValue}>
                    {(lastSession.avgResponseTimeMs / 1000).toFixed(1)}s
                  </Text>
                </View>
                <View style={styles.historyStatBox}>
                  <Text style={styles.historyStatLabel}>PERSONAL BEST</Text>
                  <Text style={[styles.historyStatValue, { color: "#f59e0b" }]}>
                    {personalBest} cpm
                  </Text>
                </View>
                <View style={styles.historyStatBox}>
                  <Text style={styles.historyStatLabel}>SESSIONS</Text>
                  <Text style={styles.historyStatValue}>{historyList.length}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.introCard}>
              <View style={styles.introHeader}>
                <Zap size={20} color="#2563eb" />
                <Text style={styles.introTitle}>Timed Competitive Mental Math</Text>
              </View>
              <Text style={styles.introDesc}>
                10-minute structured sprint calibrated for OSSC CGL, OSSSC & OPSC prelims. Solve calculations with speed & accuracy without scratching on paper.
              </Text>
            </View>
          )}

          {/* Section A: Session Duration */}
          <View style={styles.configSection}>
            <View style={styles.sectionTitleRow}>
              <Timer size={16} color="#2563eb" />
              <Text style={styles.configSectionTitle}>Session Duration</Text>
              <Text style={styles.defaultPill}>
                {selectedDuration === 10 && !isCustomDuration
                  ? "Default: 10 mins"
                  : `${selectedDuration} min${selectedDuration === 1 ? "" : "s"}`}
              </Text>
            </View>
            <View style={styles.durationGrid}>
              {[
                { mins: 1, label: "1 Min", sub: "Blitz Drill" },
                { mins: 2, label: "2 Mins", sub: "Speed Drill" },
                { mins: 5, label: "5 Mins", sub: "Quick Drill" },
                { mins: 10, label: "10 Mins", sub: "Standard Sprint" },
                { mins: 15, label: "15 Mins", sub: "Full Endurance" },
              ].map((p) => {
                const isActive = selectedDuration === p.mins && !isCustomDuration;
                return (
                  <TouchableOpacity
                    key={p.mins}
                    style={[
                      styles.durationCard,
                      isActive && styles.durationCardActive,
                    ]}
                    onPress={() => {
                      setIsCustomDuration(false);
                      setSelectedDuration(p.mins);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        isActive && styles.durationButtonTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                    <Text
                      style={[
                        styles.durationSubtext,
                        isActive && styles.durationSubtextActive,
                      ]}
                    >
                      {p.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.durationCard,
                  isCustomDuration && styles.durationCardActive,
                ]}
                onPress={() => {
                  setIsCustomDuration(true);
                  const parsed = parseInt(customMinutesText, 10);
                  const nextVal = !isNaN(parsed) && parsed >= 1 && parsed <= 60 ? parsed : 3;
                  setSelectedDuration(nextVal);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    isCustomDuration && styles.durationButtonTextActive,
                  ]}
                >
                  Custom
                </Text>
                <Text
                  style={[
                    styles.durationSubtext,
                    isCustomDuration && styles.durationSubtextActive,
                  ]}
                >
                  {isCustomDuration ? `${selectedDuration} Mins` : "1–60 Mins"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Minutes Stepper Row */}
            {isCustomDuration && (
              <View style={styles.customDurationBox}>
                <View>
                  <Text style={styles.customDurationLabel}>Custom Sprint Time</Text>
                  <Text style={styles.customDurationSub}>Enter any duration from 1 to 60 mins</Text>
                </View>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const next = Math.max(1, selectedDuration - 1);
                      setSelectedDuration(next);
                      setCustomMinutesText(next.toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Minus size={15} color="#0f172a" />
                  </TouchableOpacity>
                  <View style={styles.customInputWrap}>
                    <TextInput
                      style={styles.customInput}
                      value={selectedDuration.toString()}
                      onChangeText={(t) => {
                        const clean = t.replace(/[^0-9]/g, "");
                        setCustomMinutesText(clean);
                        const val = parseInt(clean, 10);
                        if (!isNaN(val) && val >= 1 && val <= 60) {
                          setSelectedDuration(val);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                    />
                    <Text style={styles.customInputSuffix}>min</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const next = Math.min(60, selectedDuration + 1);
                      setSelectedDuration(next);
                      setCustomMinutesText(next.toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={15} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Section B: Manual Difficulty Selection */}
          <View style={styles.configSection}>
            <View style={styles.sectionTitleRow}>
              <Target size={16} color="#7c3aed" />
              <Text style={styles.configSectionTitle}>Manual Difficulty Level</Text>
            </View>
            <View style={styles.diffGrid}>
              {[
                {
                  id: "beginner",
                  name: "Beginner",
                  desc: "48 + 37, 12 × 6, 10% of 250",
                  purpose: "Build calculation fluency",
                  color: "#059669",
                  bg: "#ecfdf5",
                },
                {
                  id: "intermediate",
                  name: "Intermediate",
                  desc: "125 × 16, 15% of 240, 864 ÷ 24",
                  purpose: "Mental shortcuts & efficiency",
                  color: "#2563eb",
                  bg: "#eff6ff",
                },
                {
                  id: "advanced",
                  name: "Advanced",
                  desc: "96 × 104, 37.5% of 640, 48²",
                  purpose: "Vedic formulas & speed tricks",
                  color: "#7c3aed",
                  bg: "#f5f3ff",
                },
                {
                  id: "exam_challenge",
                  name: "Exam Challenge",
                  desc: "Mixed BODMAS, DI Multi-Sums, missing ?",
                  purpose: "Full competitive exam pressure",
                  color: "#dc2626",
                  bg: "#fef2f2",
                },
              ].map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <TouchableOpacity
                    key={diff.id}
                    style={[
                      styles.diffCard,
                      { borderColor: isSelected ? diff.color : "#e2e8f0" },
                      isSelected && { backgroundColor: diff.bg },
                    ]}
                    onPress={() => {
                      console.log("[CALC-TRAINER] Setting difficulty to:", diff.id);
                      setSelectedDifficulty(diff.id as CalculationTrainerDifficulty);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.diffCardHeader}>
                      <Text style={[styles.diffName, { color: diff.color }]}>
                        {diff.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: diff.color }]}>
                          <Check size={12} color="#ffffff" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.diffExamples}>{diff.desc}</Text>
                    <Text style={styles.diffPurpose}>{diff.purpose}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section C: Calculation Categories */}
          <View style={styles.configSection}>
            <View style={styles.sectionHeaderBetween}>
              <View style={styles.sectionTitleRow}>
                <Hash size={16} color="#ea580c" />
                <Text style={styles.configSectionTitle}>
                  Calculation Categories ({selectedCategories.length}/15)
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCategories(["addition", "subtraction", "multiplication", "division", "percentages", "bodmas"])}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.linkText, { color: "#64748b" }]}>Core 6</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={selectAllCategories} activeOpacity={0.7}>
                  <Text style={styles.linkText}>Select All</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.categoryChipsWrap}>
              {CALCULATION_TRAINER_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section D: Input Mode Selection */}
          <View style={styles.configSection}>
            <View style={styles.sectionTitleRow}>
              <Brain size={16} color="#0891b2" />
              <Text style={styles.configSectionTitle}>Answer Input Mode</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.inputModeButton, inputMode === "mcq" && styles.inputModeButtonActive]}
                onPress={() => setInputMode("mcq")}
                activeOpacity={0.8}
              >
                <Text style={[styles.inputModeText, inputMode === "mcq" && styles.inputModeTextActive]}>
                  Multiple Choice (4 Options)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputModeButton, inputMode === "numpad" && styles.inputModeButtonActive]}
                onPress={() => setInputMode("numpad")}
                activeOpacity={0.8}
              >
                <Text style={[styles.inputModeText, inputMode === "numpad" && styles.inputModeTextActive]}>
                  Numeric Keypad
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Start Training Action Footer */}
        <View style={styles.footerWrap}>
          <TouchableOpacity
            style={[
              styles.startActionButton,
              selectedCategories.length === 0 && styles.startActionButtonDisabled,
            ]}
            onPress={handleStartTraining}
            disabled={selectedCategories.length === 0}
            activeOpacity={0.85}
          >
            <Play size={18} color="#ffffff" fill="#ffffff" />
            <Text style={styles.startActionText}>
              Start {selectedDuration}-Minute Training Session
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE TRAINING SCREEN
  // =========================================================================
  if (screenState === "training" && currentQuestion) {
    const accuracy = attempts.length > 0
      ? Math.round((attempts.filter((a) => a.isCorrect).length / attempts.length) * 100)
      : 100;

    return (
      <SafeAreaView style={styles.trainingContainer} edges={["top", "bottom"]}>
        {/* Top HUD */}
        <View style={styles.trainingHeader}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleRequestExit}
            activeOpacity={0.7}
          >
            <X size={18} color="#64748b" />
          </TouchableOpacity>

          {/* Phase Pill */}
          <View style={[styles.phasePill, { backgroundColor: `${sessionPhase.color}18`, borderColor: sessionPhase.color }]}>
            <Text style={[styles.phaseText, { color: sessionPhase.color }]}>
              {sessionPhase.name} • {sessionPhase.desc}
            </Text>
          </View>

          {/* Pause / Resume */}
          <TouchableOpacity style={styles.iconCircle} onPress={togglePause}>
            {isPaused ? <Play size={18} color="#22c55e" /> : <Pause size={18} color="#64748b" />}
          </TouchableOpacity>
        </View>

        {/* Live Metrics Row */}
        <View style={styles.metricsBar}>
          <View style={styles.metricItem}>
            <Timer size={14} color="#2563eb" />
            <Text style={[styles.metricNumber, remainingSeconds <= 60 && { color: "#dc2626" }]}>
              {formatTimer(remainingSeconds)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Q: </Text>
            <Text style={styles.metricNumber}>#{questionIndex}</Text>
          </View>
          <View style={styles.metricItem}>
            <CheckCircle2 size={14} color="#16a34a" />
            <Text style={styles.metricNumber}>
              {attempts.filter((a) => a.isCorrect).length}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Target size={14} color="#7c3aed" />
            <Text style={styles.metricNumber}>{accuracy}%</Text>
          </View>
        </View>

        <View style={styles.questionContainer}>
          {/* Category Tag */}
          <View style={styles.categoryBadgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {CALCULATION_TRAINER_CATEGORIES.find((c) => c.id === currentQuestion.category)?.name || currentQuestion.category}
              </Text>
            </View>
            <Text style={styles.difficultyTag}>
              {currentQuestion.difficulty.replace("_", " ").toUpperCase()}
            </Text>
          </View>

          {/* Question Expression */}
          <View style={styles.questionCard}>
            {currentQuestion.subtext && (
              <Text style={styles.questionSubtext}>{currentQuestion.subtext}</Text>
            )}
            <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>
            {currentQuestion.isApproximation && (
              <Text style={styles.approxNotice}>≈ Round to nearest integer</Text>
            )}
          </View>

          {/* Instant Feedback Notice */}
          {feedbackState !== "idle" && lastFeedback && (
            <TouchableOpacity
              style={[
                styles.feedbackBanner,
                lastFeedback.isCorrect ? styles.feedbackBannerCorrect : styles.feedbackBannerWrong,
              ]}
              onPress={advanceToNextQuestion}
              activeOpacity={0.8}
            >
              <View style={styles.feedbackTitleRow}>
                {lastFeedback.isCorrect ? (
                  <CheckCircle2 size={16} color="#16a34a" />
                ) : (
                  <XCircle size={16} color="#dc2626" />
                )}
                <Text
                  style={[
                    styles.feedbackTitle,
                    { color: lastFeedback.isCorrect ? "#16a34a" : "#dc2626" },
                  ]}
                >
                  {lastFeedback.isCorrect ? "Correct!" : `Correct Answer: ${currentQuestion.answer}`}
                </Text>
              </View>
              {lastFeedback.shortcut && (
                <Text style={styles.feedbackShortcutText}>⚡ {lastFeedback.shortcut}</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Answer Area: MCQ Options or Numpad */}
          {inputMode === "mcq" ? (
            <View style={styles.optionsGrid}>
              {currentQuestion.options.map((opt, i) => {
                const isPicked = selectedOption === opt;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionButton,
                      isPicked && feedbackState === "correct" && styles.optionButtonCorrect,
                      isPicked && feedbackState === "wrong" && styles.optionButtonWrong,
                    ]}
                    onPress={() => {
                      if (feedbackState !== "idle") {
                        advanceToNextQuestion();
                      } else {
                        handleSubmitAnswer(opt);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        isPicked && styles.optionButtonTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.numpadWrap}>
              <View style={styles.numpadDisplay}>
                <Text style={styles.numpadDisplayText}>{numpadValue || "_"}</Text>
              </View>
              <View style={styles.numpadGrid}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "GO"].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.numpadKey, key === "GO" && styles.numpadKeyGo]}
                    onPress={() => {
                      if (key === "DEL") setNumpadValue((p) => p.slice(0, -1));
                      else if (key === "GO") {
                        if (numpadValue.trim().length > 0) handleSubmitAnswer(numpadValue);
                      } else {
                        setNumpadValue((p) => (p.length < 8 ? p + key : p));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.numpadKeyText, key === "GO" && styles.numpadKeyTextGo]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleSubmitAnswer("", true)}
            disabled={feedbackState !== "idle"}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip Question →</Text>
          </TouchableOpacity>
        </View>

        {/* Pause Overlay */}
        {isPaused && exitModalState === "none" && (
          <View style={styles.pauseOverlay} pointerEvents="auto">
            <View style={styles.exitModalCard}>
              <Text style={styles.pauseTitle}>Session Paused</Text>
              <Text style={[styles.pauseDesc, { textAlign: "center" }]}>Timer is frozen. Ready to resume?</Text>
              <TouchableOpacity style={[styles.resumeButton, { marginTop: 12 }]} onPress={togglePause} activeOpacity={0.85}>
                <Play size={18} color="#ffffff" fill="#ffffff" />
                <Text style={styles.resumeButtonText}>Resume Sprint</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* In-App Exit Confirmation Overlay */}
        {exitModalState !== "none" && (
          <View style={styles.pauseOverlay} pointerEvents="auto">
            <View style={styles.exitModalCard}>
              <Text style={styles.pauseTitle}>
                {exitModalState === "discard" ? "Exit Sprint?" : "Finish Early?"}
              </Text>
              <Text style={[styles.pauseDesc, { textAlign: "center", lineHeight: 20 }]}>
                {exitModalState === "discard"
                  ? "You have completed fewer than 3 questions. Exiting now will discard this session without recording it."
                  : `You have completed ${attempts.length} questions. Would you like to finish and view your performance analysis?`}
              </Text>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setExitModalState("none")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonCancelText}>
                    {exitModalState === "discard" ? "Keep Training" : "Continue"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    exitModalState === "discard" ? styles.modalButtonDestructive : styles.modalButtonConfirm,
                  ]}
                  onPress={() => {
                    const action = exitModalState;
                    setExitModalState("none");
                    if (action === "discard") {
                      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                      setScreenState("config");
                    } else {
                      handleFinishSession();
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonConfirmText}>
                    {exitModalState === "discard" ? "Discard & Exit" : "Finish & Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW 3: RESULTS SCREEN & MISTAKE REVIEW
  // =========================================================================
  if (screenState === "results" && sessionSummary) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreenState("config")}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Session Performance</Text>
            <Text style={styles.headerSubtitle}>Verified Metrics & Analysis</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.configContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Score Card */}
          <View style={styles.resultHeroCard}>
            {sessionSummary.isPersonalBest && (
              <View style={styles.pbBadge}>
                <Trophy size={14} color="#ffffff" />
                <Text style={styles.pbBadgeText}>NEW PERSONAL BEST!</Text>
              </View>
            )}
            <Text style={styles.ratingText}>{sessionSummary.speedRating}</Text>
            <Text style={styles.accuracyHeroText}>{sessionSummary.accuracyPercentage}%</Text>
            <Text style={styles.accuracySubtext}>Overall Session Accuracy</Text>

            <View style={styles.resultGrid}>
              <View style={styles.resultStatBox}>
                <Text style={styles.resultStatLabel}>CORRECT / ATTEMPTS</Text>
                <Text style={styles.resultStatVal}>
                  {sessionSummary.correctCount} / {sessionSummary.totalAttempted}
                </Text>
              </View>
              <View style={styles.resultStatBox}>
                <Text style={styles.resultStatLabel}>AVG SPEED</Text>
                <Text style={styles.resultStatVal}>
                  {(sessionSummary.avgResponseTimeMs / 1000).toFixed(1)}s / q
                </Text>
              </View>
              <View style={styles.resultStatBox}>
                <Text style={styles.resultStatLabel}>CORRECT / MIN</Text>
                <Text style={[styles.resultStatVal, { color: "#2563eb" }]}>
                  {sessionSummary.correctPerMinute} cpm
                </Text>
              </View>
              <View style={styles.resultStatBox}>
                <Text style={styles.resultStatLabel}>ACTIVE TIME</Text>
                <Text style={styles.resultStatVal}>
                  {Math.floor(sessionSummary.activeSeconds / 60)}m {sessionSummary.activeSeconds % 60}s
                </Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.configSection}>
            <Text style={styles.configSectionTitle}>Performance by Category</Text>
            {Object.entries(sessionSummary.categoryBreakdown).map(([catId, stat]) => {
              const meta = CALCULATION_TRAINER_CATEGORIES.find((c) => c.id === catId);
              return (
                <View key={catId} style={styles.categoryResultRow}>
                  <View style={styles.categoryResultLeft}>
                    <Text style={styles.categoryResultName}>{meta?.name || catId}</Text>
                    <Text style={styles.categoryResultStats}>
                      {stat.correct}/{stat.total} correct • {(stat.avgTimeMs / 1000).toFixed(1)}s avg
                    </Text>
                  </View>
                  <View style={styles.categoryResultRight}>
                    <Text
                      style={[
                        styles.categoryAccuracyText,
                        stat.accuracy >= 80
                          ? { color: "#16a34a" }
                          : stat.accuracy >= 60
                          ? { color: "#ca8a04" }
                          : { color: "#dc2626" },
                      ]}
                    >
                      {stat.accuracy}%
                    </Text>
                    {stat.isWeakArea && (
                      <View style={styles.weakAreaBadge}>
                        <Text style={styles.weakAreaText}>Needs Practice</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Mistakes & Mental Shortcuts */}
          {sessionSummary.mistakes.length > 0 ? (
            <View style={styles.configSection}>
              <View style={styles.sectionHeaderBetween}>
                <Text style={styles.configSectionTitle}>
                  Mistakes & Shortcuts ({sessionSummary.mistakes.length})
                </Text>
                <TouchableOpacity onPress={handleStartMistakePractice} activeOpacity={0.7}>
                  <Text style={styles.linkText}>Practise Mistakes Again →</Text>
                </TouchableOpacity>
              </View>

              {sessionSummary.mistakes.map((m, idx) => (
                <View key={idx} style={styles.mistakeCard}>
                  <View style={styles.mistakeTopRow}>
                    <Text style={styles.mistakePrompt}>{m.prompt}</Text>
                    <Text style={styles.mistakeCatBadge}>
                      {CALCULATION_TRAINER_CATEGORIES.find((c) => c.id === m.category)?.name || m.category}
                    </Text>
                  </View>
                  <View style={styles.mistakeAnswersRow}>
                    <Text style={styles.userAnswerText}>Your answer: {m.userAnswer}</Text>
                    <Text style={styles.correctAnswerText}>Correct: {m.correctAnswer}</Text>
                  </View>
                  <Text style={styles.mistakeExplanation}>{m.explanation}</Text>
                  {m.shortcut && (
                    <Text style={styles.mistakeShortcut}>⚡ Shortcut: {m.shortcut}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.allCorrectCard}>
              <CheckCircle2 size={24} color="#16a34a" />
              <Text style={styles.allCorrectTitle}>Flawless Session!</Text>
              <Text style={styles.allCorrectDesc}>
                100% accuracy recorded. Increase difficulty or drill longer duration to continue challenging your limits.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Footer */}
        <View style={styles.footerWrap}>
          <TouchableOpacity
            style={styles.startActionButton}
            onPress={() => setScreenState("config")}
            activeOpacity={0.85}
          >
            <RotateCcw size={18} color="#ffffff" />
            <Text style={styles.startActionText}>Train Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // VIEW 4: MISTAKE REVIEW PRACTICE MODE
  // =========================================================================
  if (screenState === "mistake_review_mode") {
    const totalMistakes = sessionSummary?.mistakes.length || 0;
    const isFinished = activeMistakeReviewList.length === 0;

    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreenState("results")}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Mistake Targeted Practice</Text>
            <Text style={styles.headerSubtitle}>
              {isFinished
                ? "Review Complete"
                : `${activeMistakeReviewList.length} of ${totalMistakes} questions remaining`}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {isFinished ? (
            <View style={[styles.allCorrectCard, { paddingVertical: 28, gap: 12 }]}>
              <CheckCircle2 size={40} color="#16a34a" />
              <Text style={[styles.allCorrectTitle, { fontSize: 18 }]}>All Mistakes Reviewed!</Text>
              <Text style={[styles.allCorrectDesc, { fontSize: 13, lineHeight: 18, maxWidth: 300 }]}>
                Great job reviewing every missed calculation. Reinforcing shortcut techniques builds speed and eliminates recurring exam errors.
              </Text>

              <TouchableOpacity
                style={[styles.startActionButton, { marginTop: 16, width: "100%" }]}
                onPress={() => setScreenState("results")}
                activeOpacity={0.85}
              >
                <ArrowLeft size={18} color="#ffffff" />
                <Text style={styles.startActionText}>Back to Sprint Analysis</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.startActionButton, { marginTop: 8, width: "100%", backgroundColor: "#0f172a" }]}
                onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/brain-gym" as any);
              }
            }}
                activeOpacity={0.85}
              >
                <Text style={styles.startActionText}>Done — Return to Brain Gym</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.questionCard}>
                <Text style={styles.questionPrompt}>{activeMistakeReviewList[0].prompt}</Text>
                <Text style={styles.questionSubtext}>
                  {CALCULATION_TRAINER_CATEGORIES.find((c) => c.id === activeMistakeReviewList[0].category)?.name || activeMistakeReviewList[0].category}
                </Text>
              </View>

              <View style={styles.mistakeCard}>
                <View style={styles.mistakeAnswersRow}>
                  <Text style={styles.userAnswerText}>Your answer: {activeMistakeReviewList[0].userAnswer}</Text>
                  <Text style={styles.correctAnswerText}>Correct: {activeMistakeReviewList[0].correctAnswer}</Text>
                </View>
                <Text style={styles.mistakeExplanation}>{activeMistakeReviewList[0].explanation}</Text>
                {activeMistakeReviewList[0].shortcut && (
                  <Text style={styles.mistakeShortcut}>⚡ Shortcut: {activeMistakeReviewList[0].shortcut}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.startActionButton, { marginTop: 24 }]}
                onPress={() => {
                  const remaining = activeMistakeReviewList.slice(1);
                  setActiveMistakeReviewList(remaining);
                }}
                activeOpacity={0.85}
              >
                <Check size={18} color="#ffffff" />
                <Text style={styles.startActionText}>
                  {activeMistakeReviewList.length > 1 ? "Next Mistake →" : "Complete Mistake Review ✓"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.skipButton, { marginTop: 12 }]}
                onPress={() => setScreenState("results")}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipButtonText, { color: "#64748b" }]}>Back to Results</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  scrollArea: {
    flex: 1,
    overflow: "hidden",
  },
  configContent: {
    padding: 16,
    paddingBottom: 24,
  },
  historyBanner: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyStatBox: {
    alignItems: "center",
  },
  historyStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  historyStatValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  introCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 16,
  },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e40af",
  },
  introDesc: {
    fontSize: 12,
    color: "#3b82f6",
    lineHeight: 18,
  },
  configSection: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  configSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  defaultPill: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: "auto",
  },
  linkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationCard: {
    width: "31.5%",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  durationCardActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  durationButtonActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  durationButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  durationButtonTextActive: {
    color: "#2563eb",
  },
  durationSubtext: {
    fontSize: 8.5,
    color: "#64748b",
    marginTop: 2,
  },
  durationSubtextActive: {
    color: "#3b82f6",
  },
  customDurationBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customDurationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  customDurationSub: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 1,
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    overflow: "hidden",
  },
  stepperBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  customInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  customInput: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    minWidth: 20,
    textAlign: "center",
    paddingVertical: 2,
  },
  customInputSuffix: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginLeft: 2,
  },
  diffGrid: {
    gap: 8,
  },
  diffCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    backgroundColor: "#ffffff",
  },
  diffCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  diffName: {
    fontSize: 13,
    fontWeight: "700",
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  diffExamples: {
    fontSize: 11,
    color: "#0f172a",
    fontWeight: "500",
    marginBottom: 2,
  },
  diffPurpose: {
    fontSize: 10,
    color: "#64748b",
  },
  categoryChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  categoryChipTextActive: {
    color: "#ffffff",
  },
  inputModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  inputModeButtonActive: {
    borderColor: "#0891b2",
    backgroundColor: "#ecfeff",
  },
  inputModeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  inputModeTextActive: {
    color: "#0891b2",
    fontWeight: "700",
  },
  footerWrap: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 10,
    zIndex: 99,
  },
  startActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
  },
  startActionButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  startActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  // Training View
  trainingContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  trainingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  phasePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  phaseText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#1e293b",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  metricNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 999,
    elevation: 50,
  },
  pauseTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
  },
  pauseDesc: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 24,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#22c55e",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  resumeButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  exitModalCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#334155",
  },
  modalButtonCancelText: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: 14,
  },
  modalButtonDestructive: {
    backgroundColor: "#dc2626",
  },
  modalButtonConfirm: {
    backgroundColor: "#2563eb",
  },
  modalButtonConfirmText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  questionContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  categoryBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    backgroundColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38bdf8",
  },
  difficultyTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
  },
  questionCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginVertical: 12,
  },
  questionSubtext: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
    fontWeight: "600",
  },
  questionPrompt: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  approxNotice: {
    fontSize: 11,
    color: "#f59e0b",
    marginTop: 6,
    fontWeight: "600",
  },
  feedbackBanner: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
  },
  feedbackBannerCorrect: {
    backgroundColor: "#064e3b",
    borderColor: "#10b981",
  },
  feedbackBannerWrong: {
    backgroundColor: "#7f1d1d",
    borderColor: "#ef4444",
  },
  feedbackTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  feedbackShortcutText: {
    fontSize: 11,
    color: "#ffffff",
    marginTop: 4,
    fontWeight: "500",
  },
  optionsGrid: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  optionButtonCorrect: {
    backgroundColor: "#15803d",
    borderColor: "#22c55e",
  },
  optionButtonWrong: {
    backgroundColor: "#b91c1c",
    borderColor: "#ef4444",
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  optionButtonTextActive: {
    color: "#ffffff",
  },
  numpadWrap: {
    gap: 8,
  },
  numpadDisplay: {
    backgroundColor: "#1e293b",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  numpadDisplayText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  numpadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  numpadKey: {
    width: (width - 44) / 3,
    height: 48,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  numpadKeyGo: {
    backgroundColor: "#2563eb",
    borderColor: "#3b82f6",
  },
  numpadKeyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  numpadKeyTextGo: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  skipButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  // Results View
  resultHeroCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  pbBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  pbBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#38bdf8",
    marginBottom: 4,
  },
  accuracyHeroText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#ffffff",
  },
  accuracySubtext: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 16,
  },
  resultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: 8,
  },
  resultStatBox: {
    width: "48%",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  resultStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 4,
  },
  resultStatVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  categoryResultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  categoryResultLeft: {
    flex: 1,
  },
  categoryResultName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  categoryResultStats: {
    fontSize: 11,
    color: "#64748b",
  },
  categoryResultRight: {
    alignItems: "flex-end",
  },
  categoryAccuracyText: {
    fontSize: 14,
    fontWeight: "800",
  },
  weakAreaBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  weakAreaText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#dc2626",
  },
  mistakeCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
  },
  mistakeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mistakePrompt: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  mistakeCatBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mistakeAnswersRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 6,
  },
  userAnswerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dc2626",
  },
  correctAnswerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16a34a",
  },
  mistakeExplanation: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16,
  },
  mistakeShortcut: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 4,
  },
  allCorrectCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
    gap: 6,
  },
  allCorrectTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
  },
  allCorrectDesc: {
    fontSize: 12,
    color: "#15803d",
    textAlign: "center",
  },
});
