"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Trophy,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Check,
  X,
  Keyboard,
  Sliders,
  Award,
  TrendingUp,
  Target,
  Plus,
  Minus,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { Profile, DashboardMetrics, Exam } from "@/lib/types";
import {
  CalculationTrainerCategory,
  CalculationTrainerDifficulty,
  CalculationTrainerConfig,
  CalculationTrainerQuestion,
  CalculationTrainerAttempt,
  CalculationTrainerSessionSummary,
  CALCULATION_TRAINER_CATEGORIES,
  generateTrainerQuestion,
  evaluateTrainerSession,
  getIndianDateStr,
} from "@odisha-rank/shared";

interface CalculationTrainerClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

type ViewMode = "config" | "training" | "results" | "mistake_review";

const STORAGE_KEY_HISTORY = "odisha_rank_calc_trainer_history";
const STORAGE_KEY_PREFS = "odisha_rank_calc_trainer_prefs";
const STORAGE_KEY_RECENT_PROMPTS = "odisha_rank_calc_trainer_recent_prompts";

const DEFAULT_CONFIG: CalculationTrainerConfig = {
  durationMinutes: 10,
  difficulty: "intermediate",
  categories: [
    "addition",
    "subtraction",
    "multiplication",
    "division",
    "percentages",
    "bodmas",
  ],
  inputMode: "mcq",
};

export const CalculationTrainerClient: React.FC<CalculationTrainerClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

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

  // Flow State
  const [viewMode, setViewMode] = useState<ViewMode>("config");
  const [config, setConfig] = useState<CalculationTrainerConfig>(DEFAULT_CONFIG);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>("3");
  const [history, setHistory] = useState<CalculationTrainerSessionSummary[]>([]);

  // Active Sprint State
  const [currentQuestion, setCurrentQuestion] = useState<CalculationTrainerQuestion | null>(null);
  const [attempts, setAttempts] = useState<CalculationTrainerAttempt[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [userNumInput, setUserNumInput] = useState<string>("");
  const [useNumpadInput, setUseNumpadInput] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Time & Pause Management
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [totalPausedMs, setTotalPausedMs] = useState<number>(0);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(config.durationMinutes * 60);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Feedback State
  const [feedback, setFeedback] = useState<{
    status: "idle" | "correct" | "incorrect";
    selectedAnswer: string;
    correctAnswer: string;
    shortcut: string;
  }>({
    status: "idle",
    selectedAnswer: "",
    correctAnswer: "",
    shortcut: "",
  });

  // Results State
  const [lastResult, setLastResult] = useState<CalculationTrainerSessionSummary | null>(null);
  const [isPersonalBest, setIsPersonalBest] = useState<boolean>(false);
  const hasAwardedRewardRef = useRef<boolean>(false);
  const attemptsRef = useRef<CalculationTrainerAttempt[]>([]);
  const finishSprintRef = useRef<() => void>(() => {});

  // Mistake Review State
  const [mistakeList, setMistakeList] = useState<CalculationTrainerAttempt[]>([]);
  const [mistakeIndex, setMistakeIndex] = useState<number>(0);
  const [mistakeRetryFeedback, setMistakeRetryFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [mistakesCompleted, setMistakesCompleted] = useState<boolean>(false);

  // Deduplication & Balanced Category Deck State
  const seenPromptsRef = useRef<Set<string>>(new Set());
  const recentPromptsRef = useRef<string[]>([]);
  const categoryDeckRef = useRef<CalculationTrainerCategory[]>([]);

  const numInputRef = useRef<HTMLInputElement>(null);

  const drawCategory = (pool: CalculationTrainerCategory[]) => {
    if (categoryDeckRef.current.length === 0) {
      categoryDeckRef.current = [...pool].sort(() => Math.random() - 0.5);
    }
    return categoryDeckRef.current.pop() || pool[0] || "addition";
  };

  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);

  // Load preferences and history from localStorage
  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        if (parsed.durationMinutes && parsed.difficulty && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          setConfig(parsed);
          if (![1, 2, 5, 10, 15].includes(parsed.durationMinutes)) {
            setIsCustomDuration(true);
            setCustomMinutesInput(parsed.durationMinutes.toString());
          }
        }
      }
      const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      const storedRecent = localStorage.getItem(STORAGE_KEY_RECENT_PROMPTS);
      if (storedRecent) {
        const parsedRecent = JSON.parse(storedRecent);
        if (Array.isArray(parsedRecent)) recentPromptsRef.current = parsedRecent;
      }
    } catch (e) {
      console.warn("Could not load trainer localStorage:", e);
    }
  }, []);

  // Save prefs on config change
  const updateConfig = (newCfg: CalculationTrainerConfig) => {
    setConfig(newCfg);
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(newCfg));
    } catch {}
  };

  // Keyboard shortcut listener for active sprint
  useEffect(() => {
    if (viewMode !== "training" || isPaused || isSubmitting || !currentQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in the numeric text box
      if (document.activeElement === numInputRef.current) return;

      if (e.key === "1" && currentQuestion.options[0]) {
        submitAnswer(currentQuestion.options[0]);
      } else if (e.key === "2" && currentQuestion.options[1]) {
        submitAnswer(currentQuestion.options[1]);
      } else if (e.key === "3" && currentQuestion.options[2]) {
        submitAnswer(currentQuestion.options[2]);
      } else if (e.key === "4" && currentQuestion.options[3]) {
        submitAnswer(currentQuestion.options[3]);
      } else if (e.key === "Escape") {
        setShowExitModal(true);
      } else if (e.key === " " && !useNumpadInput) {
        // Space to toggle pause
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, isPaused, isSubmitting, currentQuestion, useNumpadInput]);

  // Main countdown timer effect
  useEffect(() => {
    if (viewMode !== "training" || isPaused) return;

    const totalSessionSeconds = config.durationMinutes * 60;
    const interval = setInterval(() => {
      const now = Date.now();
      const effectiveElapsedMs = now - sessionStartTime - totalPausedMs;
      const leftSec = Math.max(0, totalSessionSeconds - Math.floor(effectiveElapsedMs / 1000));
      setRemainingSeconds(leftSec);

      if (leftSec <= 0) {
        clearInterval(interval);
        finishSprintRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [viewMode, isPaused, sessionStartTime, totalPausedMs, config.durationMinutes]);

  // Pause / Resume handler
  const togglePause = () => {
    if (isPaused) {
      if (pausedAt) {
        setTotalPausedMs((prev) => prev + (Date.now() - pausedAt));
        setPausedAt(null);
      }
      setIsPaused(false);
    } else {
      setPausedAt(Date.now());
      setIsPaused(true);
    }
  };

  // Start Sprint
  const handleStartSprint = () => {
    if (config.categories.length === 0) {
      alert("Please select at least one calculation category to begin.");
      return;
    }

    seenPromptsRef.current = new Set();
    categoryDeckRef.current = [...config.categories].sort(() => Math.random() - 0.5);
    const cat = drawCategory(config.categories);
    const excludeSet = new Set([...Array.from(seenPromptsRef.current), ...recentPromptsRef.current]);
    const firstQ = generateTrainerQuestion(cat, config.difficulty, 1, {
      excludePrompts: excludeSet,
    });
    seenPromptsRef.current.add(firstQ.prompt);
    const now = Date.now();

    hasAwardedRewardRef.current = false;
    setAttempts([]);
    setCurrentQuestion(firstQ);
    setSessionStartTime(now);
    setTotalPausedMs(0);
    setPausedAt(null);
    setRemainingSeconds(config.durationMinutes * 60);
    setIsPaused(false);
    setQuestionStartTime(now);
    setUserNumInput("");
    setIsSubmitting(false);
    setFeedback({ status: "idle", selectedAnswer: "", correctAnswer: "", shortcut: "" });
    setViewMode("training");
  };

  // Submit Answer
  const submitAnswer = useCallback(
    (answerGiven: string) => {
      if (isSubmitting || !currentQuestion || isPaused) return;
      setIsSubmitting(true);

      const now = Date.now();
      const timeMs = Math.max(150, now - questionStartTime);
      const isCorrect = answerGiven.trim() === currentQuestion.answer.trim();

      const attempt: CalculationTrainerAttempt = {
        questionId: currentQuestion.id,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        prompt: currentQuestion.prompt,
        userAnswer: answerGiven.trim(),
        correctAnswer: currentQuestion.answer,
        isCorrect,
        isSkipped: false,
        timeMs,
        explanation: currentQuestion.explanation,
        shortcut: currentQuestion.shortcut,
      };

      setAttempts((prev) => [...prev, attempt]);

      setFeedback({
        status: isCorrect ? "correct" : "incorrect",
        selectedAnswer: answerGiven,
        correctAnswer: currentQuestion.answer,
        shortcut: currentQuestion.shortcut || currentQuestion.explanation,
      });

      const delayMs = isCorrect ? 250 : 800;
      setTimeout(() => {
        const nextCat = drawCategory(config.categories);
        const excludeSet = new Set([...Array.from(seenPromptsRef.current), ...recentPromptsRef.current]);
        const nextQ = generateTrainerQuestion(
          nextCat,
          config.difficulty,
          attemptsRef.current.length + 1,
          { excludePrompts: excludeSet }
        );
        seenPromptsRef.current.add(nextQ.prompt);
        setCurrentQuestion(nextQ);
        setQuestionStartTime(Date.now());
        setUserNumInput("");
        setFeedback({ status: "idle", selectedAnswer: "", correctAnswer: "", shortcut: "" });
        setIsSubmitting(false);

        if (useNumpadInput && numInputRef.current) {
          numInputRef.current.focus();
        }
      }, delayMs);
    },
    [isSubmitting, currentQuestion, isPaused, questionStartTime, config, useNumpadInput]
  );

  // Finish Sprint & Evaluate
  const finishSprint = useCallback(() => {
    const totalSessionSeconds = config.durationMinutes * 60;
    const finalElapsedSeconds = Math.max(1, totalSessionSeconds - remainingSeconds);

    const previousBestCPM = history.reduce((max, h) => Math.max(max, h.correctPerMinute), 0);
    const result = evaluateTrainerSession(attempts, config, finalElapsedSeconds, previousBestCPM);

    setIsPersonalBest(result.isPersonalBest);

    // Save history
    const updatedHistory = [result, ...history].slice(0, 50);
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    } catch {}

    // Update cross-session rolling recent prompts buffer
    const updatedRecent = Array.from(new Set([...Array.from(seenPromptsRef.current), ...recentPromptsRef.current])).slice(0, 50);
    recentPromptsRef.current = updatedRecent;
    try {
      localStorage.setItem(STORAGE_KEY_RECENT_PROMPTS, JSON.stringify(updatedRecent));
    } catch {}

    // Update web Brain Score via progress API (only for eligible >= 3 attempts sprint and strictly once)
    if (attempts.length >= 3 && !hasAwardedRewardRef.current) {
      hasAwardedRewardRef.current = true;
      fetch("/api/games/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: "calculation-speed-trainer",
          category: "math",
          difficulty: config.difficulty,
          score: result.correctCount * 10,
          timeSeconds: finalElapsedSeconds,
          moves: result.totalAttempted,
          accuracy: result.accuracyPercentage,
          won: result.accuracyPercentage >= 70,
          explanation: `Completed ${config.durationMinutes}m sprint with ${result.correctPerMinute.toFixed(1)} CPM`,
        }),
      }).catch((e) => console.warn("Failed to update Brain Score on web:", e));
    }

    setLastResult(result);
    setViewMode("results");
  }, [config, attempts, remainingSeconds, history]);

  useEffect(() => {
    finishSprintRef.current = finishSprint;
  }, [finishSprint]);

  // Exit Sprint confirmation
  const handleConfirmExit = () => {
    setShowExitModal(false);
    if (attempts.length >= 3) {
      finishSprint();
    } else {
      setViewMode("config");
    }
  };

  // Start Mistake Practice Mode
  const startMistakeReview = () => {
    if (!lastResult || lastResult.mistakes.length === 0) return;
    setMistakeList(lastResult.mistakes);
    setMistakeIndex(0);
    setMistakeRetryFeedback("idle");
    setMistakesCompleted(false);
    setViewMode("mistake_review");
  };

  // Retry single mistake question
  const handleMistakeAnswer = (chosen: string) => {
    const currentMistake = mistakeList[mistakeIndex];
    if (!currentMistake) return;

    const isCorrect = chosen.trim() === currentMistake.correctAnswer.trim();
    setMistakeRetryFeedback(isCorrect ? "correct" : "incorrect");

    setTimeout(() => {
      if (mistakeIndex + 1 < mistakeList.length) {
        setMistakeIndex((prev) => prev + 1);
        setMistakeRetryFeedback("idle");
      } else {
        setMistakesCompleted(true);
      }
    }, isCorrect ? 500 : 1200);
  };

  // Helpers
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const totalSessionSecs = config.durationMinutes * 60;
  const elapsedSecs = totalSessionSecs - remainingSeconds;
  const sprintPhase =
    elapsedSecs <= totalSessionSecs * 0.25
      ? "warmup"
      : elapsedSecs <= totalSessionSecs * 0.75
      ? "sprint"
      : "final";

  // Live sprint stats
  const liveCorrect = attempts.filter((a) => a.isCorrect).length;
  const liveTotal = attempts.length;
  const liveAccuracy = liveTotal > 0 ? Math.round((liveCorrect / liveTotal) * 100) : 0;
  const elapsedMinutes = Math.max(0.05, elapsedSecs / 60);
  const liveCPM = (liveCorrect / elapsedMinutes).toFixed(1);

  // Best historical metrics
  const bestSpeed = history.reduce((max, h) => Math.max(max, h.correctPerMinute), 0);
  const bestAccuracy = history.reduce((max, h) => Math.max(max, h.accuracyPercentage), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <StudentSidebar />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <StudentSidebar isMobile onCloseMobile={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenTimer={() => setShowTimerModal(true)}
          studentName={studentName}
          initials={initials}
          isUserAdmin={isUserAdmin}
          email={profile?.email}
          allExams={allExams}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* ============================================================ */}
          {/* VIEW 1: CONFIGURATION & SPRINT LAUNCHER */}
          {/* ============================================================ */}
          {viewMode === "config" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Hero Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-blue-950/20">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    OdishaRank Brain Gym &bull; Speed Arithmetic
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                    Calculation Speed Trainer
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Designed for OSSC CGL, OSSSC, and OPSC competitive aspirants to drastically reduce
                    per-question calculation time while maintaining 90%+ accuracy through targeted mental
                    sprints and Vedic shortcuts.
                  </p>
                </div>

                {/* History Quick Stats */}
                {history.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 sm:gap-6">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <p className="text-xs text-slate-400 font-semibold">Sprints Completed</p>
                      <p className="text-xl sm:text-2xl font-black text-white">{history.length}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <p className="text-xs text-slate-400 font-semibold">Best Speed</p>
                      <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                        {bestSpeed.toFixed(1)} <span className="text-xs font-normal">CPM</span>
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <p className="text-xs text-slate-400 font-semibold">Best Accuracy</p>
                      <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                        {bestAccuracy}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Training Setup Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h2 className="text-base">Sprint Duration</h2>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {config.durationMinutes === 10 && !isCustomDuration
                        ? "Default: 10 mins"
                        : `${config.durationMinutes} min${config.durationMinutes === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Select quick drill or set custom minutes (1–60 mins) for your sprint.
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { mins: 1, label: "1m", sub: "Blitz" },
                      { mins: 2, label: "2m", sub: "Speed" },
                      { mins: 5, label: "5m", sub: "Quick" },
                      { mins: 10, label: "10m", sub: "Standard" },
                      { mins: 15, label: "15m", sub: "Endurance" },
                    ].map((p) => {
                      const isSelected = config.durationMinutes === p.mins && !isCustomDuration;
                      return (
                        <button
                          key={p.mins}
                          type="button"
                          onClick={() => {
                            setIsCustomDuration(false);
                            updateConfig({ ...config, durationMinutes: p.mins });
                          }}
                          className={`py-3 px-3 rounded-2xl font-bold text-sm transition-all border-2 text-left ${
                            isSelected
                              ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="font-mono text-base font-extrabold">{p.label}</div>
                          <div className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? "text-blue-500" : "text-slate-400"}`}>
                            {p.sub}
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom Duration Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDuration(true);
                        const parsed = parseInt(customMinutesInput, 10);
                        const nextVal = !isNaN(parsed) && parsed >= 1 && parsed <= 60 ? parsed : 3;
                        updateConfig({ ...config, durationMinutes: nextVal });
                      }}
                      className={`py-3 px-3 rounded-2xl font-bold text-sm transition-all border-2 text-left ${
                        isCustomDuration
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-mono text-base font-extrabold">Custom</div>
                      <div className={`text-[10px] font-semibold uppercase tracking-wider ${isCustomDuration ? "text-blue-500" : "text-slate-400"}`}>
                        {isCustomDuration ? `${config.durationMinutes}m` : "1–60m"}
                      </div>
                    </button>
                  </div>

                  {/* Custom Minutes Stepper Row */}
                  {isCustomDuration && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Custom Duration</div>
                        <div className="text-[10px] text-slate-400">Choose between 1 and 60 minutes</div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(1, config.durationMinutes - 1);
                            setCustomMinutesInput(next.toString());
                            updateConfig({ ...config, durationMinutes: next });
                          }}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100 transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="flex items-center px-2">
                          <input
                            type="text"
                            value={config.durationMinutes}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, "");
                              setCustomMinutesInput(clean);
                              const val = parseInt(clean, 10);
                              if (!isNaN(val) && val >= 1 && val <= 60) {
                                updateConfig({ ...config, durationMinutes: val });
                              }
                            }}
                            className="w-8 text-center font-mono font-black text-sm bg-transparent outline-hidden"
                            maxLength={2}
                          />
                          <span className="text-xs font-bold text-slate-500 ml-0.5">min</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.min(60, config.durationMinutes + 1);
                            setCustomMinutesInput(next.toString());
                            updateConfig({ ...config, durationMinutes: next });
                          }}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Difficulty Tier Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Sliders className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-base">Difficulty Tier</h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Select tier matching your current exam stage.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "beginner", label: "Beginner", desc: "1-2 digit core" },
                      { id: "intermediate", label: "Intermediate", desc: "Exam standard" },
                      { id: "advanced", label: "Advanced", desc: "Speed shortcuts" },
                      { id: "exam_challenge", label: "Exam Challenge", desc: "OSSC CGL Tier-II" },
                    ].map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => updateConfig({ ...config, difficulty: diff.id as CalculationTrainerDifficulty })}
                        className={`p-3 rounded-2xl text-left border-2 transition-all ${
                          config.difficulty === diff.id
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="text-xs font-bold capitalize">{diff.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{diff.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Picker Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-500" />
                      Calculation Categories ({config.categories.length}/{CALCULATION_TRAINER_CATEGORIES.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Choose categories to test or hit Select All for comprehensive practice.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig({
                          ...config,
                          categories: CALCULATION_TRAINER_CATEGORIES.map((c) => c.id),
                        })
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition"
                    >
                      Select All ({CALCULATION_TRAINER_CATEGORIES.length})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateConfig({
                          ...config,
                          categories: ["addition", "multiplication", "bodmas", "percentages"],
                        })
                      }
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Core 4
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {CALCULATION_TRAINER_CATEGORIES.map((cat) => {
                    const isSelected = config.categories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? config.categories.filter((c) => c !== cat.id)
                            : [...config.categories, cat.id];
                          if (updated.length > 0) {
                            updateConfig({ ...config, categories: updated });
                          }
                        }}
                        className={`p-3 rounded-2xl text-left border-2 flex items-start gap-3 transition-all ${
                          isSelected
                            ? "bg-blue-50/60 border-blue-500 text-slate-900 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/80"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border text-xs font-bold ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-900">{cat.name}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {cat.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartSprint}
                  className="w-full py-4 sm:py-5 rounded-3xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-3"
                >
                  <Play className="w-6 h-6 fill-white" />
                  <span>Start {config.durationMinutes}-Minute Sprint</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: ACTIVE SPRINT WITH REAL-TIME HUD & FEEDBACK */}
          {/* ============================================================ */}
          {viewMode === "training" && currentQuestion && (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-200">
              {/* Header HUD Bar */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExitModal(true)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Exit sprint"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {config.difficulty.replace("_", " ")}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          sprintPhase === "warmup"
                            ? "bg-amber-100 text-amber-800"
                            : sprintPhase === "sprint"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {sprintPhase === "warmup"
                          ? "Warm-Up"
                          : sprintPhase === "sprint"
                          ? "Main Sprint"
                          : "Final Push"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Countdown & Pause */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
                    title={isPaused ? "Resume sprint" : "Pause sprint"}
                  >
                    {isPaused ? (
                      <Play className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                    ) : (
                      <Pause className="w-5 h-5 text-slate-600" />
                    )}
                  </button>

                  <div
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-mono text-base font-black shadow-inner transition ${
                      remainingSeconds <= 30
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>{formatTime(remainingSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Live Metric Strip */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white rounded-2xl p-2.5 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Questions</p>
                  <p className="text-base font-black text-slate-900 font-mono">{liveTotal}</p>
                </div>
                <div className="bg-white rounded-2xl p-2.5 border border-slate-200 text-center">
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase">Correct</p>
                  <p className="text-base font-black text-emerald-600 font-mono">{liveCorrect}</p>
                </div>
                <div className="bg-white rounded-2xl p-2.5 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</p>
                  <p className="text-base font-black text-slate-900 font-mono">{liveAccuracy}%</p>
                </div>
                <div className="bg-white rounded-2xl p-2.5 border border-slate-200 text-center">
                  <p className="text-[10px] text-blue-600 font-semibold uppercase">CPM</p>
                  <p className="text-base font-black text-blue-600 font-mono">{liveCPM}</p>
                </div>
              </div>

              {/* Pause Overlay */}
              {isPaused ? (
                <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Pause className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Sprint Paused</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Take a deep breath. Timers and accuracy tracking are frozen. Press resume to
                    continue your sprint.
                  </p>
                  <button
                    type="button"
                    onClick={togglePause}
                    className="py-3 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
                  >
                    Resume Sprint
                  </button>
                </div>
              ) : (
                /* Question & Answer Card */
                <div
                  className={`bg-white rounded-3xl p-6 sm:p-10 border transition-all text-center relative overflow-hidden shadow-sm ${
                    feedback.status === "correct"
                      ? "border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/20"
                      : feedback.status === "incorrect"
                      ? "border-rose-500 ring-4 ring-rose-500/20 bg-rose-50/20"
                      : "border-slate-200"
                  }`}
                >
                  {/* Category Pill */}
                  <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">
                    {CALCULATION_TRAINER_CATEGORIES.find((c) => c.id === currentQuestion.category)?.name ||
                      currentQuestion.category}
                  </div>

                  {currentQuestion.subtext && (
                    <p className="text-xs text-slate-400 font-medium mb-1">
                      {currentQuestion.subtext}
                    </p>
                  )}

                  {/* Prompt */}
                  <div className="my-6">
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono select-none">
                      {currentQuestion.prompt}
                    </h1>
                  </div>

                  {/* Mode Toggle: MCQ vs Numeric Numpad */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setUseNumpadInput(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        !useNumpadInput
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      4 Options
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseNumpadInput(true);
                        setTimeout(() => numInputRef.current?.focus(), 50);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        useNumpadInput
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Type / Numpad
                    </button>
                  </div>

                  {/* Input Mechanism */}
                  {!useNumpadInput ? (
                    /* 4 Multiple Choice Options */
                    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto my-4">
                      {currentQuestion.options.map((option: string, idx: number) => {
                        const isChosen = feedback.selectedAnswer === option;
                        const isAnswerCorrect = feedback.correctAnswer === option;
                        let btnStyle = "bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border-slate-200 text-slate-800";

                        if (feedback.status === "correct" && isChosen) {
                          btnStyle = "bg-emerald-600 border-emerald-600 text-white";
                        } else if (feedback.status === "incorrect" && isChosen) {
                          btnStyle = "bg-rose-600 border-rose-600 text-white";
                        } else if (feedback.status === "incorrect" && isAnswerCorrect) {
                          btnStyle = "bg-emerald-100 border-emerald-400 text-emerald-800";
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => submitAnswer(option)}
                            className={`py-4 px-6 rounded-2xl border-2 font-mono text-xl sm:text-2xl font-black transition-all active:scale-95 relative flex items-center justify-center ${btnStyle}`}
                          >
                            <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400 uppercase">
                              {idx + 1}
                            </span>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Direct Numeric Input with Touch Numpad */
                    <div className="max-w-xs mx-auto space-y-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (userNumInput.trim()) submitAnswer(userNumInput.trim());
                        }}
                      >
                        <input
                          ref={numInputRef}
                          type="text"
                          inputMode="decimal"
                          value={userNumInput}
                          onChange={(e) => setUserNumInput(e.target.value)}
                          placeholder="Answer..."
                          className="w-full text-center text-3xl font-mono font-black py-3 px-4 rounded-2xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none transition"
                        />
                        <button
                          type="submit"
                          disabled={!userNumInput.trim() || isSubmitting}
                          className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm shadow-md transition"
                        >
                          Submit (Enter)
                        </button>
                      </form>

                      {/* Touch Numpad */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "OK"].map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              if (key === "DEL") {
                                setUserNumInput((prev) => prev.slice(0, -1));
                              } else if (key === "OK") {
                                if (userNumInput.trim()) submitAnswer(userNumInput.trim());
                              } else {
                                setUserNumInput((prev) => prev + key);
                              }
                            }}
                            className={`py-2.5 rounded-xl font-mono font-black text-base transition active:scale-95 ${
                              key === "OK"
                                ? "bg-blue-600 text-white"
                                : key === "DEL"
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                            }`}
                          >
                            {key === "DEL" ? "⌫" : key === "OK" ? "✓" : key}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback Banner with Mental Shortcut */}
                  {feedback.status !== "idle" && (
                    <div
                      className={`mt-4 p-3.5 rounded-2xl text-left flex items-start gap-3 animate-in fade-in duration-150 ${
                        feedback.status === "correct"
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                          : "bg-rose-50 border border-rose-200 text-rose-900"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {feedback.status === "correct" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="font-bold">
                          {feedback.status === "correct"
                            ? "Correct!"
                            : `Incorrect! Answer: ${feedback.correctAnswer}`}
                        </div>
                        <div className="text-slate-600 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            <strong className="text-slate-800">Technique: </strong>
                            {feedback.shortcut}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 3: RESULTS & WEAK AREA DIAGNOSTICS */}
          {/* ============================================================ */}
          {viewMode === "results" && lastResult && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
              {/* Summary Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden text-center space-y-4">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

                {isPersonalBest && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-bounce">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
                    New Personal Best Speed!
                  </div>
                )}

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Sprint Complete!</h1>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {lastResult.accuracyPercentage >= 90
                    ? "Outstanding speed and accuracy! You are operating at competitive examination Tier-I speed."
                    : lastResult.accuracyPercentage >= 70
                    ? "Solid performance. Review the weak areas flagged below to push towards 90%+ accuracy."
                    : "Focus on mental shortcuts rather than rushing. Accuracy comes before speed."}
                </p>

                {/* Score Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Brain Score +5 &bull; Rating: {lastResult.speedRating}</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Accuracy</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1">
                      {lastResult.accuracyPercentage}%
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lastResult.correctCount}/{lastResult.totalAttempted} correct
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Speed (CPM)</p>
                    <p className="text-2xl sm:text-3xl font-black text-blue-600 font-mono mt-1">
                      {lastResult.correctPerMinute.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">correct / minute</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Avg Response</p>
                    <p className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono mt-1">
                      {(lastResult.avgResponseTimeMs / 1000).toFixed(1)}s
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">per question</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Duration</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-800 font-mono mt-1">
                      {formatTime(lastResult.activeSeconds)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">total sprint time</p>
                  </div>
                </div>
              </div>

              {/* Category Breakdown & Weak Area Diagnostics */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Category Breakdown & Weak Area Diagnostics
                  </h2>
                  <span className="text-xs text-slate-400">
                    Weak areas flagged at &lt; 70% accuracy (&ge; 3 attempts)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(lastResult.categoryBreakdown).map(([catKey, catStat]) => {
                    const catMeta = CALCULATION_TRAINER_CATEGORIES.find((c) => c.id === catKey);
                    return (
                      <div
                        key={catKey}
                        className={`p-4 rounded-2xl border transition-all ${
                          catStat.isWeakArea
                            ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-200/50"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900">
                                {catMeta?.name || catKey}
                              </p>
                              {catStat.isWeakArea && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Needs Focus
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {catStat.correct}/{catStat.total} correct &bull; avg{" "}
                              {(catStat.avgTimeMs / 1000).toFixed(1)}s
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-lg font-black font-mono ${
                                catStat.accuracy >= 80
                                  ? "text-emerald-600"
                                  : catStat.accuracy >= 60
                                  ? "text-amber-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {catStat.accuracy}%
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              catStat.accuracy >= 80
                                ? "bg-emerald-500"
                                : catStat.accuracy >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${catStat.accuracy}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mistake Review Section */}
              {lastResult.mistakes.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        Mistake Analysis ({lastResult.mistakes.length})
                      </h2>
                      <p className="text-xs text-slate-500">
                        Review missed questions with their corresponding mental shortcuts.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={startMistakeReview}
                      className="py-2.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Practise Mistakes Again</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {lastResult.mistakes.map((m: CalculationTrainerAttempt, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-lg font-black text-slate-900">
                            {m.prompt}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                            {m.category}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-rose-100/70 text-rose-900">
                            <span className="font-semibold">Your Answer: </span>
                            <span className="font-mono font-bold">{m.userAnswer}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-900">
                            <span className="font-semibold">Correct Answer: </span>
                            <span className="font-mono font-bold">{m.correctAnswer}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Mental Shortcut: </span>
                            {m.shortcut || m.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("config")}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Train Again</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/speed-math")}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition flex items-center justify-center gap-2"
                >
                  <span>Return to Brain Gym</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 4: TARGETED MISTAKE PRACTICE MODE */}
          {/* ============================================================ */}
          {viewMode === "mistake_review" && mistakeList.length > 0 && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
              {mistakesCompleted ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Mistakes Mastered!
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have successfully reviewed and re-attempted every missed calculation. Regular
                    mistake correction is key to high competitive scores.
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewMode("results")}
                    className="py-3 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
                  >
                    Back to Results
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewMode("results")}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-bold text-slate-500">
                      Mistake {mistakeIndex + 1} of {mistakeList.length}
                    </span>
                    <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-md bg-rose-50 text-rose-700">
                      Targeted Practice
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                      {mistakeList[mistakeIndex]?.category}
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
                      {mistakeList[mistakeIndex]?.prompt}
                    </h1>
                  </div>

                  {/* Mental Shortcut Guidance */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Mental Shortcut: </span>
                      {mistakeList[mistakeIndex]?.shortcut || mistakeList[mistakeIndex]?.explanation}
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    {[
                      mistakeList[mistakeIndex]?.correctAnswer,
                      mistakeList[mistakeIndex]?.userAnswer,
                      // Generate 2 quick plausible alternatives
                      String(Number(mistakeList[mistakeIndex]?.correctAnswer) + 2 || 12),
                      String(Number(mistakeList[mistakeIndex]?.correctAnswer) - 2 || 8),
                    ]
                      .filter((val, idx, arr) => arr.indexOf(val) === idx && Boolean(val))
                      .sort(() => 0.5 - Math.random())
                      .map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleMistakeAnswer(opt)}
                          className="py-4 px-6 rounded-2xl border-2 border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 font-mono text-xl font-black text-slate-800 transition active:scale-95"
                        >
                          {opt}
                        </button>
                      ))}
                  </div>

                  {/* Retry Feedback */}
                  {mistakeRetryFeedback === "correct" && (
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm animate-in fade-in">
                      ✓ Correct! Well done!
                    </div>
                  )}
                  {mistakeRetryFeedback === "incorrect" && (
                    <div className="p-3 rounded-xl bg-rose-100 text-rose-800 font-bold text-sm animate-in fade-in">
                      Incorrect! Correct answer is {mistakeList[mistakeIndex]?.correctAnswer}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* EXIT CONFIRMATION MODAL */}
          {/* ============================================================ */}
          {showExitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Exit Current Sprint?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to exit? If you have completed at least 3 questions, your
                  progress will be saved to your summary history.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExitModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    Resume Sprint
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmExit}
                    className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
                  >
                    Exit & Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Timer Modal */}
          {showTimerModal && (
            <StudyTimerModal
              isOpen={showTimerModal}
              onClose={() => setShowTimerModal(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
};
