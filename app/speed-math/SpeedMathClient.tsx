"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
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
  ArrowLeft,
  Trophy,
  Sparkles,
  HelpCircle,
  Play,
  Pause,
  ChevronRight,
  Check,
  Delete,
  Hash,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam } from "@/lib/types";
import {
  SpeedMathCategory,
  SpeedMathDifficulty,
  SpeedMathQuestion,
  SpeedMathResult,
  SpeedMathAttemptRecord,
  SPEED_MATH_CATEGORIES,
  generateSpeedMathQuestions,
  calculateSpeedMathResult,
} from "@/lib/speed-math";

interface SpeedMathClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

export const SpeedMathClient: React.FC<SpeedMathClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
  const targetExamTitle = targetExam?.title || "OSSC Combined Graduate Level (CGL)";

  // Setup Modal State
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
  const [isPaused, setIsPaused] = useState(false);

  // Feedback Animation
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [lastFeedbackAnswer, setLastFeedbackAnswer] = useState("");

  // Final Results
  const [drillResult, setDrillResult] = useState<SpeedMathResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isDrillActive && !isPaused && !drillResult) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => Math.round((prev + 0.1) * 10) / 10);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isDrillActive, isPaused, drillResult]);

  // Focus input on each new question
  useEffect(() => {
    if (isDrillActive && !drillResult) {
      setUserInputValue("");
      setQuestionStartTimestamp(Date.now());
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [currentIndex, isDrillActive, drillResult]);

  const handleOpenDrillConfig = (catId: SpeedMathCategory) => {
    setSelectedCategory(catId);
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
        // Completed Drill!
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
    const props = { className: "w-6 h-6 text-white" };
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
        return <span className="text-xl font-black text-white leading-none">√</span>;
      case "Cuboid":
        return <span className="text-xl font-black text-white leading-none">∛</span>;
      case "Superscript":
        return <span className="text-lg font-black text-white leading-none">x²</span>;
      case "RotateCcw":
        return <span className="text-lg font-black text-white leading-none">x√</span>;
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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.badge.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedCategoryMeta = SPEED_MATH_CATEGORIES.find((c) => c.id === selectedCategory);

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
          onOpenCourseModal={() => setShowCourseModal(true)}
          studentName={studentName}
          initials={initials}
          isUserAdmin={isUserAdmin}
          email={profile?.email}
          allExams={allExams}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* VIEW A: RESULTS VIEW */}
          {drillResult && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Drill Completed Successfully
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {selectedCategoryMeta?.name} Performance Summary
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 capitalize">
                  {drillResult.difficulty} Mode • {drillResult.totalQuestions} Questions Completed
                </p>

                {/* Big Speed Rating Badge */}
                <div className="my-6 inline-flex flex-col items-center p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Calculation Speed Rating
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {drillResult.speedRating}
                  </span>
                </div>

                {/* 4 Key Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                      Accuracy
                    </span>
                    <span className="text-2xl font-black text-blue-900 mt-1 block">
                      {drillResult.accuracyPercentage}%
                    </span>
                    <span className="text-[11px] text-blue-600/80">
                      {drillResult.correctAnswers} / {drillResult.totalQuestions} correct
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                      Avg Speed
                    </span>
                    <span className="text-2xl font-black text-emerald-900 mt-1 block">
                      {drillResult.averageSecondsPerQuestion}s
                    </span>
                    <span className="text-[11px] text-emerald-600/80">per question</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                      Total Time
                    </span>
                    <span className="text-2xl font-black text-amber-900 mt-1 block">
                      {drillResult.totalTimeSeconds}s
                    </span>
                    <span className="text-[11px] text-amber-600/80">drill duration</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                      Max Streak
                    </span>
                    <span className="text-2xl font-black text-rose-900 mt-1 block">
                      🔥 {maxStreak}
                    </span>
                    <span className="text-[11px] text-rose-600/80">in a row</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleStartDrill}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restart This Drill
                  </button>
                  <button
                    onClick={() => {
                      setDrillResult(null);
                      setIsDrillActive(false);
                      setShowConfigModal(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition"
                  >
                    Change Difficulty / Count
                  </button>
                  <button
                    onClick={() => {
                      setDrillResult(null);
                      setIsDrillActive(false);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
                  >
                    Back to All Drills
                  </button>
                </div>
              </div>

              {/* Review Breakdown Table */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Detailed Question Breakdown ({drillResult.records.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {drillResult.records.map((rec, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-sm transition ${
                        rec.isCorrect
                          ? "bg-emerald-50/50 border-emerald-100 text-slate-800"
                          : "bg-rose-50/50 border-rose-100 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-400 w-5">#{i + 1}</span>
                        <span className="font-bold text-slate-900 font-mono text-base">
                          {rec.prompt}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold block ${
                              rec.isCorrect ? "text-emerald-700" : "text-rose-600 line-through"
                            }`}
                          >
                            {rec.userAnswer || "—"}
                          </span>
                          {!rec.isCorrect && (
                            <span className="text-[11px] font-mono text-slate-500 block">
                              Correct: {rec.correctAnswer}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono w-12 text-right">
                          {rec.timeSeconds}s
                        </span>
                        {rec.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: ACTIVE DRILL RUNNER */}
          {isDrillActive && !drillResult && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
              {/* Drill Navigation Top Bar */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (window.confirm("Exit current speed calculation drill?")) {
                        setIsDrillActive(false);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      {selectedCategoryMeta?.name}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600">
                        {selectedDifficulty}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Question {currentIndex + 1} of {questions.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Streak Indicator */}
                  {streak > 1 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold animate-bounce">
                      <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{streak} Streak!</span>
                    </div>
                  )}

                  {/* Stopwatch */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 text-white font-mono text-sm font-bold shadow-xs">
                    <Timer className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span>{elapsedSeconds.toFixed(1)}s</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Main Math Question Card */}
              <div
                className={`bg-white rounded-3xl p-6 sm:p-10 shadow-sm border transition-all relative overflow-hidden text-center ${
                  feedbackState === "correct"
                    ? "border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/20"
                    : feedbackState === "incorrect"
                    ? "border-rose-500 ring-4 ring-rose-500/20 bg-rose-50/20"
                    : "border-slate-200"
                }`}
              >
                {questions[currentIndex]?.subtext && (
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    {questions[currentIndex].subtext}
                  </span>
                )}

                <div className="my-6">
                  <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono select-none">
                    {questions[currentIndex]?.prompt}
                  </h1>
                </div>

                {/* Multiple Choice Options if applicable (e.g. % to Fraction) */}
                {questions[currentIndex]?.options && questions[currentIndex].options!.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto my-6">
                    {questions[currentIndex].options!.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswerSubmit(opt)}
                        className="py-4 px-6 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border-2 border-slate-200 font-mono text-xl font-black text-slate-800 transition active:scale-95"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Standard Numeric Input Box */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAnswerSubmit();
                    }}
                    className="max-w-md mx-auto space-y-4"
                  >
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9.-]*"
                        autoFocus
                        value={userInputValue}
                        onChange={(e) => setUserInputValue(e.target.value)}
                        placeholder="Type answer..."
                        className="w-full text-center text-3xl sm:text-4xl font-mono font-black py-4 px-6 rounded-2xl bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!userInputValue.trim()}
                      className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-lg shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                    >
                      <span>Submit Answer</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                )}

                {/* On-Screen Touch Numpad for mobile / fast clicking */}
                <div className="mt-8 pt-6 border-t border-slate-100 max-w-xs mx-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "ENTER"].map(
                      (key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleNumpadPress(key)}
                          className={`py-3 rounded-xl font-mono font-black text-lg transition active:scale-95 ${
                            key === "ENTER"
                              ? "bg-blue-600 text-white text-sm"
                              : key === "DEL"
                              ? "bg-rose-50 text-rose-600 text-sm hover:bg-rose-100"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                          }`}
                        >
                          {key === "DEL" ? "⌫" : key === "ENTER" ? "Submit" : key}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Instant Feedback Banner */}
                {feedbackState === "incorrect" && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-100 text-rose-800 text-sm font-bold animate-in fade-in">
                    Wrong! Correct answer was: <span className="font-mono text-base">{lastFeedbackAnswer}</span>
                  </div>
                )}
                {feedbackState === "correct" && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-bold animate-in fade-in">
                    ✓ Correct!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW C: 16 DRILL CATEGORIES CATALOG */}
          {!isDrillActive && !drillResult && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-blue-950/20">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Quantitative Aptitude & Speed Drills
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                    Speed Math & BODMAS Practice
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Master rapid mental calculations, speed arithmetic, squares, cubes, tables, percentage
                    fractions, and DI row-column additions for OSSC CGL, OSSSC RI/AMIN, and OPSC examinations.
                  </p>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: "ALL", label: "All Drills (16)" },
                    { id: "CORE", label: "Core Operations" },
                    { id: "MEMORY", label: "Memory (Squares & Cubes)" },
                    { id: "CONCEPT", label: "Roots & Exponents" },
                    { id: "PERCENT", label: "Percentages" },
                    { id: "EXAM_DI", label: "Exam & DI" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                        activeFilter === tab.id
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search calculation drill..."
                    className="w-full px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* 16 Drill Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCategories.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDrillConfig(item.id)}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Squircle Icon & Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition group-hover:scale-105"
                          style={{ backgroundColor: item.color }}
                        >
                          {renderDrillIcon(item.iconName, item.color)}
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                        {item.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                      <span>Practice Speed Drill</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DRILL SETUP CONFIG MODAL */}
          {showConfigModal && selectedCategoryMeta && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: selectedCategoryMeta.color }}
                    >
                      {renderDrillIcon(selectedCategoryMeta.iconName, selectedCategoryMeta.color)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {selectedCategoryMeta.name} Setup
                      </h3>
                      <p className="text-xs text-slate-400">Configure your speed practice</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 1. Select Difficulty: Easy | Mid | Hard */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    1. Select Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "easy" as SpeedMathDifficulty, label: "Easy", desc: "Basic drills" },
                      { id: "medium" as SpeedMathDifficulty, label: "Mid", desc: "Standard exam" },
                      { id: "hard" as SpeedMathDifficulty, label: "Hard", desc: "Advanced speed" },
                    ].map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff.id)}
                        className={`p-3 rounded-2xl border-2 text-center transition ${
                          selectedDifficulty === diff.id
                            ? "border-blue-600 bg-blue-50/60 text-blue-900 font-black"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold"
                        }`}
                      >
                        <span className="text-sm block">{diff.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                          {diff.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Select Number of Questions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    2. Choose Number of Questions
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 30, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedQuestionCount(num)}
                        className={`py-3 rounded-2xl border-2 font-mono text-sm font-black transition ${
                          selectedQuestionCount === num
                            ? "border-blue-600 bg-blue-50/60 text-blue-900"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Drill Button */}
                <div className="pt-2">
                  <button
                    onClick={handleStartDrill}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Practice Session ⚡</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExamTitle}
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
