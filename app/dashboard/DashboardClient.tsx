"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Profile,
  DashboardMetrics,
  Exam,
} from "@/lib/types";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { TodayGoalModal } from "@/components/TodayGoalModal";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { getStoredDailyGoal, saveStoredDailyGoal, DailyGoal, GoalTask } from "@/lib/goal-storage";
import { TaskStatus } from "@odisha-rank/shared";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";
import {
  LayoutDashboard,
  GraduationCap,
  HelpCircle,
  Clock,
  Timer,
  Play,
  RotateCcw,
  BookOpen,
  BarChart3,
  Calendar,
  Bookmark,
  MessageSquare,
  User,
  Search,
  Bell,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronDown,
  Star,
  Flame,
  Zap,
  Menu,
  X,
  Target,
  Calculator,
  Brain,
  MessageCircle,
  ShieldCheck,
  LogOut,
  RefreshCw,
  FileText,
  Layers,
  Sparkles,
  Plus,
} from "lucide-react";

interface DashboardClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

const SUBJECT_COLOR_PALETTES = [
  { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50", fill: "#2563eb" },
  { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50", fill: "#f59e0b" },
  { bg: "bg-purple-600", text: "text-purple-600", light: "bg-purple-50", fill: "#9333ea" },
  { bg: "bg-sky-500", text: "text-sky-600", light: "bg-sky-50", fill: "#0ea5e9" },
  { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50", fill: "#10b981" },
  { bg: "bg-rose-500", text: "text-rose-600", light: "bg-rose-50", fill: "#f43f5e" },
];

export const DashboardClient: React.FC<DashboardClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const router = useRouter();
  const [currentMetrics, setCurrentMetrics] = useState<DashboardMetrics>(metrics);
  const [showCourseModal, setShowCourseModal] = useState(!targetExam);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Time & Metric filter dropdown states
  const [studyTimeFilter, setStudyTimeFilter] = useState<"Today" | "Total">("Today");
  const [questionsFilter, setQuestionsFilter] = useState<"Today" | "Total">("Today");
  const [mockFilter, setMockFilter] = useState<"Total" | "This Month">("Total");
  const [accuracyFilter, setAccuracyFilter] = useState<"Today" | "Total">("Today");
  const [weeklyFilter, setWeeklyFilter] = useState<"Last 7 Days" | "Last 30 Days">("Last 7 Days");

  // Modals state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(getStoredDailyGoal());

  const examDaysRemaining = useMemo(() => {
    if (!dailyGoal.examDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(dailyGoal.examDate);
    exam.setHours(0, 0, 0, 0);
    const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [dailyGoal.examDate]);

  // Listen for goal and study session updates
  React.useEffect(() => {
    const handleGoalUpdate = (e: any) => {
      if (e.detail) setDailyGoal(e.detail);
    };
    const handleSessionLogged = (e: any) => {
      if (e.detail?.minutes) {
        const addedHours = Math.round((e.detail.minutes / 60) * 10) / 10;
        setCurrentMetrics((prev) => ({
          ...prev,
          study_hours: Math.round((prev.study_hours + addedHours) * 10) / 10,
          study_hours_today: Math.round(((prev.study_hours_today || 0) + addedHours) * 10) / 10,
          study_streak_days: prev.study_streak_days === 0 ? 1 : prev.study_streak_days,
        }));
      }
    };

    window.addEventListener("daily-goal-updated", handleGoalUpdate);
    window.addEventListener("study-session-logged", handleSessionLogged);

    return () => {
      window.removeEventListener("daily-goal-updated", handleGoalUpdate);
      window.removeEventListener("study-session-logged", handleSessionLogged);
    };
  }, []);

  // Study Session Log Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMinutes, setLogMinutes] = useState(60);
  const [logNotes, setLogNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // Dynamic study plan checklist derived from active course topics
  // Dynamic study plan checklist derived from active course topics
  const initialStudyPlan = useMemo(() => {
    if (metrics.recommended_topics && metrics.recommended_topics.length > 0) {
      return metrics.recommended_topics.map((t) => ({
        id: `sp-${t.topic_id}`,
        topic_id: t.topic_id,
        subject_id: t.subject_id,
        title: `${t.subject_name} – ${t.topic_title}`,
        description: `Read official syllabus notes & complete practice questions`,
        duration: `${t.estimated_minutes} min`,
        completed: false,
        href: `/syllabus?subject=${t.subject_id}`,
      }));
    }
    // Fallback contextual plan based on target exam
    const examCode = targetExam?.code || targetExam?.conducting_body || "OSSC";
    return [
      {
        id: "sp-1",
        topic_id: "sp-1",
        subject_id: "s-1",
        title: `${examCode} General Studies – Indian Polity`,
        description: "Read notes and complete practice questions",
        duration: "60 min",
        completed: false,
        href: `/syllabus${targetExam ? `?exam=${targetExam.id}` : ""}`,
      },
      {
        id: "sp-2",
        topic_id: "sp-2",
        subject_id: "s-1",
        title: "Odisha Special – History & Geography of Odisha",
        description: "Complete topic reading and review key dates",
        duration: "45 min",
        completed: false,
        href: `/syllabus${targetExam ? `?exam=${targetExam.id}` : ""}`,
      },
      {
        id: "sp-3",
        topic_id: "sp-3",
        subject_id: "s-2",
        title: "Quantitative Aptitude – Simplification & Number System",
        description: "Practice 25 exam-pattern questions",
        duration: "45 min",
        completed: false,
        href: `/questions${targetExam ? `?exam=${targetExam.id}` : ""}`,
      },
      {
        id: "sp-4",
        topic_id: "sp-4",
        subject_id: "s-3",
        title: `Take a Mock Test (${examCode} Sectional)`,
        description: "Attempt full time-bound simulation test",
        duration: "60 min",
        completed: false,
        href: `/mock-tests${targetExam ? `?exam=${targetExam.id}` : ""}`,
      },
    ];
  }, [metrics.recommended_topics, targetExam]);

  const [studyPlan, setStudyPlan] = useState(initialStudyPlan);

  // Sync saved completions from localStorage on client load
  useEffect(() => {
    try {
      const storageKey = `odisha_study_plan_completed_${targetExam?.id || "global"}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const completedIds = new Set(JSON.parse(saved));
        setStudyPlan((prev) =>
          prev.map((item) => ({
            ...item,
            completed: completedIds.has(item.id) || completedIds.has(item.topic_id),
          }))
        );
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [targetExam]);

  const toggleStudyPlan = async (id: string) => {
    const item = studyPlan.find((i) => i.id === id);
    if (!item) return;

    const willBeCompleted = !item.completed;

    // 1. Optimistic UI update
    setStudyPlan((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: willBeCompleted } : t))
    );

    // 2. Persist in localStorage
    try {
      const storageKey = `odisha_study_plan_completed_${targetExam?.id || "global"}`;
      const currentCompleted = studyPlan
        .filter((t) => (t.id === id ? willBeCompleted : t.completed))
        .map((t) => t.id);
      localStorage.setItem(storageKey, JSON.stringify(currentCompleted));
    } catch {
      // Ignore storage errors
    }

    // 3. Dynamically update currentMetrics (Donut chart & Subject bars update instantly)
    setCurrentMetrics((prev) => {
      const delta = willBeCompleted ? 1 : -1;
      const newCompleted = Math.max(0, (prev.completed_official_topics || 0) + delta);
      const totalTopics = Math.max(1, prev.total_official_topics || 1);
      const newPct = Math.min(100, Math.round((newCompleted / totalTopics) * 100));

      const updatedSubjectProgress = (prev.subject_progress || []).map((s) => {
        if (item.subject_id && s.subject_id === item.subject_id) {
          const subCompleted = Math.max(0, (s.completed_topics || 0) + delta);
          return {
            ...s,
            completed_topics: subCompleted,
            progress_percentage: s.total_topics > 0 ? Math.round((subCompleted / s.total_topics) * 100) : 0,
          };
        }
        return s;
      });

      return {
        ...prev,
        completed_official_topics: newCompleted,
        official_progress_percentage: newPct,
        subject_progress: updatedSubjectProgress,
      };
    });

    // 4. Send background sync to backend
    try {
      await fetch("/api/syllabus/topics/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: item.topic_id,
          status: willBeCompleted ? "completed" : "not_started",
          topic_title: item.title,
        }),
      });
    } catch (err) {
      console.warn("Topic progress API sync error:", err);
    }
  };

  const studentName = profile?.full_name || "chinmaya swain";
  const initials = studentName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CS";

  const isUserAdmin =
    profile?.email?.toLowerCase() === "mrchinmayaswain07@gmail.com" ||
    (profile as any)?.role === "admin";

  const targetExamTitle =
    targetExam?.title || "OSSC Combined Graduate Level (CGL)";
  const targetExamCode = targetExam?.code || targetExam?.conducting_body || "OSSC";
  const courseQueryParam = targetExam ? `?exam=${targetExam.id}` : "";

  // Dynamic subjects from current exam
  const dynamicSubjects = useMemo(() => {
    if (currentMetrics.subject_progress && currentMetrics.subject_progress.length > 0) {
      return currentMetrics.subject_progress;
    }
    // Realistic fallback for active course
    return [
      {
        subject_id: "s-1",
        subject_name: "General Studies & Odisha Special",
        total_topics: 4,
        completed_topics: 1,
        progress_percentage: 25,
      },
      {
        subject_id: "s-2",
        subject_name: "Quantitative Aptitude",
        total_topics: 10,
        completed_topics: 1,
        progress_percentage: 10,
      },
      {
        subject_id: "s-3",
        subject_name: "Reasoning & Mental Ability",
        total_topics: 8,
        completed_topics: 0,
        progress_percentage: 0,
      },
      {
        subject_id: "s-4",
        subject_name: "English & Odia Language",
        total_topics: 6,
        completed_topics: 0,
        progress_percentage: 0,
      },
    ];
  }, [currentMetrics.subject_progress]);

  // Overall progress percentage
  const overallProgressPct = currentMetrics.official_progress_percentage ?? 0;

  const totalTopicsCount = currentMetrics.total_official_topics > 0
    ? currentMetrics.total_official_topics
    : dynamicSubjects.reduce((acc, s) => acc + s.total_topics, 0);

  const completedTopicsCount = currentMetrics.completed_official_topics ?? 0;

  // Search filter results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { title: string; subtitle: string; href: string; type: string }[] = [];

    // Match subjects
    dynamicSubjects.forEach((sub) => {
      if (sub.subject_name.toLowerCase().includes(q)) {
        results.push({
          title: sub.subject_name,
          subtitle: `Subject • ${sub.total_topics} topics`,
          href: `/syllabus${courseQueryParam}&subject=${sub.subject_id}`,
          type: "subject",
        });
      }
    });

    // Match exams
    allExams.forEach((ex) => {
      if (
        ex.title.toLowerCase().includes(q) ||
        (ex.code && ex.code.toLowerCase().includes(q)) ||
        (ex.conducting_body && ex.conducting_body.toLowerCase().includes(q))
      ) {
        results.push({
          title: ex.title,
          subtitle: `${ex.conducting_body} • Official Exam`,
          href: `/exams/${ex.slug}`,
          type: "exam",
        });
      }
    });

    // Match common topics
    const commonTopics = [
      "Indian Polity & Constitution",
      "History of Odisha",
      "Simplification & Arithmetic",
      "Logical Reasoning",
      "Current Affairs Odisha",
      "Grammar & Vocabulary",
    ];
    commonTopics.forEach((top) => {
      if (top.toLowerCase().includes(q)) {
        results.push({
          title: top,
          subtitle: "Topic in Active Course Syllabus",
          href: `/syllabus${courseQueryParam}`,
          type: "topic",
        });
      }
    });

    return results.slice(0, 6);
  }, [searchQuery, dynamicSubjects, allExams, courseQueryParam]);

  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("math") || lower.includes("quant") || lower.includes("arithmetic")) {
      return <Calculator className="w-4 h-4 text-amber-600" />;
    }
    if (lower.includes("reasoning") || lower.includes("logic") || lower.includes("mental")) {
      return <Brain className="w-4 h-4 text-purple-600" />;
    }
    if (lower.includes("odia") || lower.includes("english") || lower.includes("language")) {
      return <MessageCircle className="w-4 h-4 text-sky-600" />;
    }
    if (lower.includes("computer") || lower.includes("it")) {
      return <Layers className="w-4 h-4 text-emerald-600" />;
    }
    return <BookOpen className="w-4 h-4 text-blue-600" />;
  };

  const handleLogStudySession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      const res = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_minutes: logMinutes,
          notes: logNotes || "Self-study revision",
          session_date: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        const addedHours = Math.round((logMinutes / 60) * 10) / 10;
        setCurrentMetrics((prev) => ({
          ...prev,
          study_hours: Math.round((prev.study_hours + addedHours) * 10) / 10,
          study_hours_today: Math.round(((prev.study_hours_today || 0) + addedHours) * 10) / 10,
          study_streak_days: prev.study_streak_days === 0 ? 1 : prev.study_streak_days,
          recent_activities: [
            {
              id: `act-${Date.now()}`,
              user_id: profile?.id || "me",
              activity_type: "study_session_logged",
              title: `Logged ${logMinutes} mins study session`,
              description: logNotes || "Self-study revision",
              metadata: {},
              created_at: new Date().toISOString(),
            },
            ...prev.recent_activities.slice(0, 5),
          ],
        }));
        setShowLogModal(false);
        setLogNotes("");
      }
    } catch (err) {
      console.error("Log study error:", err);
    } finally {
      setIsLogging(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  // Dynamic Weekly Stats
  // Dynamic Weekly Stats (7 days)
  const weeklyData = useMemo(() => {
    if (currentMetrics.weekly_stats && currentMetrics.weekly_stats.length === 7) {
      return currentMetrics.weekly_stats;
    }
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const items = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      items.push({
        date: `${monthNames[d.getMonth()]} ${d.getDate()}`,
        dayLabel: dayNames[d.getDay()][0],
        questionsCount: 0,
        accuracyPercentage: 0,
      });
    }
    return items;
  }, [currentMetrics.weekly_stats]);

  // Dynamic Chart Data (7 Days vs 30 Days based on weeklyFilter)
  const chartData = useMemo(() => {
    if (weeklyFilter === "Last 30 Days") {
      if (currentMetrics.monthly_stats && currentMetrics.monthly_stats.length > 0) {
        return currentMetrics.monthly_stats;
      }
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const items = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        items.push({
          date: `${monthNames[d.getMonth()]} ${d.getDate()}`,
          dayLabel: dayNames[d.getDay()][0],
          questionsCount: 0,
          accuracyPercentage: 0,
        });
      }
      return items;
    }
    return weeklyData;
  }, [weeklyFilter, currentMetrics.monthly_stats, weeklyData]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased">
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT SIDEBAR NAVIGATION                                   */}
      {/* ------------------------------------------------------------- */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs flex items-center justify-center bg-blue-600 text-white font-bold">
                <Image
                  src="/logo.png"
                  alt="OdishaRank Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  Odisha<span className="text-blue-600">Rank</span>
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  Odisha Govt Exam Prep
                </p>
              </div>
            </Link>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm bg-blue-50 text-blue-600 shadow-2xs"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/courses"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <span>My Courses</span>
            </Link>

            <Link
              href="/speed-math"
              className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl font-medium text-sm text-amber-900 bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200/70 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="font-bold text-slate-900 truncate">Speed Math & BODMAS</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-amber-400 text-slate-950 shadow-2xs shrink-0">
                NEW
              </span>
            </Link>

            <Link
              href="/questions"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Practice Questions</span>
            </Link>

            <Link
              href="/mock-tests"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Mock Tests</span>
            </Link>

            <Link
              href="/materials"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Study Materials</span>
            </Link>

            <Link
              href="/performance"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Performance</span>
            </Link>

            <Link
              href="/planner"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Study Planner</span>
            </Link>

            <Link
              href="/bookmarks"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Bookmark className="w-4 h-4 text-slate-400" />
              <span>Bookmarks</span>
            </Link>

            <Link
              href="/doubts"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>Doubts</span>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Promo Card: Prepare Practice Achieve */}
        <div className="relative rounded-2xl overflow-hidden p-4 bg-gradient-to-br from-blue-100 via-sky-50 to-amber-100/70 border border-blue-200/60 shadow-xs">
          <div className="absolute right-0 bottom-0 w-24 h-24 opacity-25 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-blue-900">
              <path
                d="M50 5 L55 25 L65 28 L57 38 L62 55 L50 48 L38 55 L43 38 L35 28 L45 25 Z"
                fill="currentColor"
              />
              <path
                d="M30 60 L70 60 L65 95 L35 95 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <h3 className="text-base font-black text-slate-900 leading-snug">
              Prepare<br />
              Practice<br />
              Achieve
            </h3>
            <p className="text-[11px] text-slate-600 font-medium mt-1.5 leading-tight">
              Your Success in Odisha Government Exams
            </p>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN APPLICATION CANVAS                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl relative">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/dashboard" className="lg:hidden flex items-center gap-1.5 shrink-0">
              <Image
                src="/logo.png"
                alt="OdishaRank"
                width={28}
                height={28}
                className="rounded-lg object-contain shadow-xs"
              />
            </Link>

            {/* Live Search Input with Dropdown */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for topics, tests, or study materials..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />

              {/* Live Search Suggestions Dropdown */}
              {searchFocused && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-11 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="text-[10px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                    Quick Search Results ({searchResults.length})
                  </div>
                  {searchResults.map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          {item.type === "exam" ? (
                            <GraduationCap className="w-3.5 h-3.5" />
                          ) : item.type === "subject" ? (
                            <BookOpen className="w-3.5 h-3.5" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.title}</div>
                          <div className="text-[10px] text-slate-400">{item.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Header: Stopwatch + Notification + User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Stopwatch & Study Focus Timer Button */}
            <button
              onClick={() => setShowTimerModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200/70 shadow-2xs"
              title="Open Study Stopwatch & Focus Timer"
            >
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Stopwatch</span>
            </button>

            {/* Live Dynamic Notification Bell */}
            <NotificationBell userId={profile?.id} examId={targetExam?.id} />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-[#1e3a8a] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {studentName}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 leading-none mt-1 flex items-center gap-1">
                    <span>{isUserAdmin ? "Admin" : "Student"}</span>
                    {isUserAdmin && <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />}
                  </div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-bold text-slate-900 truncate">{studentName}</p>
                    <p className="text-slate-400 text-[11px] truncate">{profile?.email || "student@odisharank.in"}</p>
                  </div>
                  {isUserAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 font-semibold"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setShowCourseModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-left"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Change Target Course</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-left mt-1 border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ----------------------------------------------------------- */}
        {/* 3. DASHBOARD MAIN CANVAS CONTENT                            */}
        {/* ----------------------------------------------------------- */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* ========================================================= */}
          {/* HERO BANNER: Dynamic Active Course + Greeting            */}
          {/* ========================================================= */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-50/80 via-sky-50/60 to-amber-50/40 border border-blue-100/80 shadow-xs overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Background Temple Graphic */}
            <div className="absolute right-32 sm:right-64 bottom-0 w-72 h-44 opacity-20 pointer-events-none hidden md:block">
              <svg viewBox="0 0 200 120" fill="none" className="w-full h-full text-blue-900">
                <path
                  d="M100 10 L108 40 L125 45 L112 60 L118 85 L100 75 L82 85 L88 60 L75 45 L92 40 Z"
                  fill="currentColor"
                />
                <circle cx="100" cy="95" r="22" stroke="currentColor" strokeWidth="3" />
                <path d="M70 95 L130 95 M100 65 L100 125" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            {/* Left Greeting & Target Exam */}
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Namaskar, <span className="text-blue-600">{studentName}!</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal leading-relaxed">
                Stay consistent with your preparation for {targetExamTitle}. Keep learning, keep practicing, and achieve your goal!
              </p>

              {/* Today's Goal Pill (Dynamic & Clickable to Set/Customize) */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <div
                  onClick={() => setShowGoalModal(true)}
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/70 shadow-2xs cursor-pointer transition-all group"
                  title="Click to customize today's goal"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Target className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-xs text-slate-700 font-medium flex items-center flex-wrap gap-y-1">
                    <strong className="text-amber-900 font-bold">Today&apos;s Goal</strong>
                    <span className="mx-2 text-slate-300">•</span>
                    <span>{dailyGoal.tasks.filter((t) => t.completed).length}/{dailyGoal.tasks.length} tasks done</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span>Study {currentMetrics.study_hours_today || 0} / {dailyGoal.targetStudyHours}h</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span>Practice {currentMetrics.questions_practiced_today || 0} / {dailyGoal.targetQuestions} MCQs</span>
                    <span className="ml-2 text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md hover:bg-amber-300/60 transition-colors">
                      Customize ⚙️
                    </span>
                  </div>
                </div>

                {examDaysRemaining !== null && (
                  <div
                    onClick={() => setShowGoalModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50/90 hover:bg-blue-100 border border-blue-200/70 text-blue-800 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                    title="Target Exam Countdown"
                  >
                    <span>⏳ {examDaysRemaining} Days to Exam</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Card: Dynamic Active Course with Change Action */}
            <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 w-full lg:w-auto">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-200/80 p-3 sm:p-4 shadow-sm flex items-center gap-3.5 w-full sm:w-auto min-w-[280px]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Active Course
                    </span>
                    <button
                      onClick={() => setShowCourseModal(true)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5" title={targetExamTitle}>
                    {targetExamTitle}
                  </h2>
                </div>
              </div>

              <Link
                href={`/syllabus${courseQueryParam}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all hover:shadow-blue-500/25"
              >
                <span>Continue Learning</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ROW 1: THE 4 STAT METRICS (Dynamic & Interactive Filters)  */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Study Time */}
            <div
              onClick={() => setShowLogModal(true)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Study Time</span>
                  <select
                    value={studyTimeFilter}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setStudyTimeFilter(e.target.value as any)}
                    className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Today">Today ▾</option>
                    <option value="Total">Total ▾</option>
                  </select>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {studyTimeFilter === "Today"
                    ? (currentMetrics.study_hours_today ?? 0)
                    : (currentMetrics.study_hours ?? 0)}
                </span>
                <span className="text-sm font-semibold text-slate-500 font-sans">hrs</span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  (currentMetrics.study_hours_delta_pct ?? 0) >= 0 ? "text-emerald-600" : "text-amber-600"
                }`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {(currentMetrics.study_hours_delta_pct ?? 0) >= 0
                      ? `+${currentMetrics.study_hours_delta_pct ?? 0}%`
                      : `${currentMetrics.study_hours_delta_pct}%`}
                  </span>
                  <span className="text-slate-400 font-normal">vs yesterday</span>
                </div>
                {/* Dynamic Mini Sparkline Bar Chart for Study Hours */}
                <div className="flex items-end gap-1 h-7">
                  {(currentMetrics.sparkline_study_hours || [0, 0, 0, 0, 0, 0, 0]).map((h, i) => {
                    const maxH = Math.max(1, ...(currentMetrics.sparkline_study_hours || [1]));
                    const barHeightPct = h > 0 ? Math.max(15, Math.min(100, (h / maxH) * 100)) : 0;
                    return (
                      <div
                        key={i}
                        style={{ height: `${barHeightPct}%` }}
                        className={`w-1.5 rounded-t-sm transition-colors ${
                          h > 0 ? "bg-blue-400/80 group-hover:bg-blue-600" : "bg-slate-100 h-1"
                        }`}
                        title={weeklyData[i] ? `${weeklyData[i].date}: ${h} hrs` : `${h} hrs`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Questions Solved */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Questions Solved</span>
                  <select
                    value={questionsFilter}
                    onChange={(e) => setQuestionsFilter(e.target.value as any)}
                    className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Today">Today ▾</option>
                    <option value="Total">Total ▾</option>
                  </select>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {questionsFilter === "Today"
                    ? (currentMetrics.questions_practiced_today ?? 0)
                    : (currentMetrics.questions_practiced ?? 0)}
                </span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  (currentMetrics.questions_delta_pct ?? 0) >= 0 ? "text-emerald-600" : "text-amber-600"
                }`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {(currentMetrics.questions_delta_pct ?? 0) >= 0
                      ? `+${currentMetrics.questions_delta_pct ?? 0}%`
                      : `${currentMetrics.questions_delta_pct}%`}
                  </span>
                  <span className="text-slate-400 font-normal">vs yesterday</span>
                </div>
                {/* Dynamic Mini Sparkline Bar Chart for Question Attempts */}
                <div className="flex items-end gap-1 h-7">
                  {weeklyData.map((d, i) => {
                    const maxQ = Math.max(1, ...weeklyData.map((w) => w.questionsCount));
                    const barHeightPct = d.questionsCount > 0 ? Math.max(15, Math.min(100, (d.questionsCount / maxQ) * 100)) : 0;
                    return (
                      <div
                        key={i}
                        style={{ height: `${barHeightPct}%` }}
                        className={`w-1.5 rounded-t-sm ${
                          d.questionsCount > 0 ? "bg-purple-400/80" : "bg-slate-100 h-1"
                        }`}
                        title={`${d.date}: ${d.questionsCount} questions`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Mock Tests */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Mock Tests</span>
                  <select
                    value={mockFilter}
                    onChange={(e) => setMockFilter(e.target.value as any)}
                    className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Total">Total ▾</option>
                    <option value="This Month">This Month ▾</option>
                  </select>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {mockFilter === "This Month"
                    ? (currentMetrics.mock_tests_this_month ?? 0)
                    : (currentMetrics.mock_tests_completed ?? 0)}
                </span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{currentMetrics.mock_tests_this_month ?? 0}</span>
                  <span className="text-slate-400 font-normal">this month</span>
                </div>
                {/* Dynamic Mini Sparkline Bar Chart for Mock Tests */}
                <div className="flex items-end gap-1 h-7">
                  {(currentMetrics.mock_tests_sparkline && currentMetrics.mock_tests_sparkline.some((v) => v > 0)
                    ? currentMetrics.mock_tests_sparkline
                    : [0, 0, 0, 0, 0, 0, 0]
                  ).map((score, i) => {
                    const barHeightPct = score > 0 ? Math.max(15, Math.min(100, score)) : 0;
                    return (
                      <div
                        key={i}
                        style={{ height: `${barHeightPct}%` }}
                        className={`w-1.5 rounded-t-sm ${score > 0 ? "bg-amber-400/80" : "bg-slate-100 h-1"}`}
                        title={score > 0 ? `Mock score: ${score}%` : "No mock test"}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Accuracy */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Target className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Accuracy</span>
                  <select
                    value={accuracyFilter}
                    onChange={(e) => setAccuracyFilter(e.target.value as any)}
                    className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Today">Today ▾</option>
                    <option value="Total">Total ▾</option>
                  </select>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {accuracyFilter === "Today"
                    ? (currentMetrics.questions_practiced_today ?? 0) > 0
                      ? `${currentMetrics.accuracy_today ?? 0}%`
                      : "0%"
                    : (currentMetrics.questions_practiced > 0
                      ? `${currentMetrics.accuracy_percentage ?? 0}%`
                      : "0%")}
                </span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  (currentMetrics.accuracy_delta_pct ?? 0) >= 0 ? "text-emerald-600" : "text-amber-600"
                }`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {(currentMetrics.accuracy_delta_pct ?? 0) >= 0
                      ? `+${currentMetrics.accuracy_delta_pct ?? 0}%`
                      : `${currentMetrics.accuracy_delta_pct}%`}
                  </span>
                  <span className="text-slate-400 font-normal">vs last week</span>
                </div>
                {/* Dynamic Mini Sparkline Bar Chart for Accuracy */}
                <div className="flex items-end gap-1 h-7">
                  {weeklyData.map((d, i) => {
                    const barHeightPct = d.questionsCount > 0 ? Math.max(15, Math.min(100, d.accuracyPercentage)) : 0;
                    return (
                      <div
                        key={i}
                        style={{ height: `${barHeightPct}%` }}
                        className={`w-1.5 rounded-t-sm ${d.questionsCount > 0 ? "bg-teal-400/80" : "bg-slate-100 h-1"}`}
                        title={`${d.date}: ${d.questionsCount > 0 ? `${d.accuracyPercentage}%` : "No attempts"}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SPEED CALCULATION & MENTAL MATH PRACTICE PROMO CARD        */}
          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* SPEED CALCULATION & MENTAL MATH PRACTICE PROMO CARD        */}
          {/* ========================================================= */}
          <Link
            href="/speed-math"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md shadow-blue-950/20 hover:shadow-lg hover:scale-[1.005] transition-all border border-blue-700/40 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                <Zap className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black tracking-tight">Speed Math & BODMAS Drills</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
                    NEW FEATURE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  16 mental math categories: BODMAS, Addition, Subtraction, Squares, Cubes, Tables, Roots, and DI fast calculations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold text-xs text-blue-200 group-hover:text-white transition-colors self-end sm:self-center shrink-0">
              <span>Start Speed Drill</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* ========================================================= */}
          {/* AVAILABLE COURSES & EXAMS STRIP (SWITCH OR EXPLORE)       */}
          {/* ========================================================= */}
          {allExams && allExams.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Available Courses & Target Exams</h3>
                    <p className="text-[11px] text-slate-400">Switch your target course anytime to personalize syllabus and tests</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>View All ({allExams.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {allExams.slice(0, 4).map((exam) => {
                  const isActive = exam.id === targetExam?.id;
                  return (
                    <div
                      key={exam.id}
                      onClick={() => {
                        if (!isActive) {
                          setShowCourseModal(true);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isActive
                          ? "bg-blue-50/80 border-blue-500/60 shadow-xs"
                          : "bg-slate-50/50 hover:bg-slate-50 border-slate-200/80 hover:border-blue-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                          }`}>
                            {exam.conducting_body || "Odisha Govt"}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-black text-blue-600 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              Active
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2" title={exam.title}>
                          {exam.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-400 font-medium">Batch {profile?.target_year || 2026}</span>
                        <span className={`font-bold ${isActive ? "text-blue-600" : "text-slate-600"}`}>
                          {isActive ? "Studying Now" : "Switch Course →"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ROW 2: (1) TODAY'S STUDY PLAN (2) OVERALL COURSE PROGRESS */}
          {/*        (3) WEEKLY PERFORMANCE COMBO CHART                 */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Today's Study Plan (Dynamic & Toggleable) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Today&apos;s Study Plan</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      + Add Task
                    </button>
                    <button
                      onClick={() => setShowLogModal(true)}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>+ Log Study</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(dailyGoal.tasks && dailyGoal.tasks.length > 0 ? dailyGoal.tasks : studyPlan).map((task: any) => {
                    const isCompleted = task.completed || task.status === "completed";
                    const isGoalTask = "category" in task;
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                          isCompleted
                            ? "bg-emerald-50/50 border-emerald-200"
                            : "bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-white"
                        }`}
                      >
                        <div
                          onClick={() => {
                            if (isGoalTask) {
                              const updatedTasks = dailyGoal.tasks.map((t) =>
                                t.id === task.id
                                  ? { ...t, completed: !t.completed, status: (!t.completed ? "completed" : "not_started") as TaskStatus }
                                  : t
                              );
                              const updated = { ...dailyGoal, tasks: updatedTasks };
                              setDailyGoal(updated);
                              saveStoredDailyGoal(updated);
                            } else {
                              toggleStudyPlan(task.id);
                            }
                          }}
                          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                        >
                          <button className="shrink-0 focus:outline-none">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4
                                className={`text-xs font-bold truncate ${
                                  isCompleted ? "text-slate-500 line-through" : "text-slate-900"
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.priority && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  task.priority === "high"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                                } uppercase`}>
                                  {task.priority}
                                </span>
                              )}
                              {task.category && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                  {task.category}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {task.description || (task.durationMinutes ? `${task.durationMinutes} min focus session` : "Target study task")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setShowTimerModal(true)}
                            className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Start study timer for this task"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Completed:{" "}
                  {dailyGoal.tasks && dailyGoal.tasks.length > 0
                    ? `${dailyGoal.tasks.filter((t) => t.completed).length} / ${dailyGoal.tasks.length}`
                    : `${studyPlan.filter((t) => t.completed).length} / ${studyPlan.length}`}
                </span>
                <Link href="/planner" className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                  <span>Open Full Planner</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* 2. Overall Course Progress (Dynamic Donut & Course Subjects) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Overall Course Progress</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  {targetExamCode} Syllabus
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Dynamic Circular Donut SVG */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#f1f5f9"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#2563eb"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - overallProgressPct / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-900">
                        {overallProgressPct}%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-2 text-center">
                    {completedTopicsCount} of {totalTopicsCount} topics completed
                  </span>
                </div>

                {/* Right Subject Breakdown Bars (Derived from Active Exam Subjects) */}
                <div className="flex-1 w-full space-y-3">
                  {dynamicSubjects.slice(0, 4).map((sub, idx) => {
                    const palette = SUBJECT_COLOR_PALETTES[idx % SUBJECT_COLOR_PALETTES.length];
                    return (
                      <div key={sub.subject_id || idx}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={sub.subject_name}>
                            {sub.subject_name}
                          </span>
                          <span className="font-bold text-slate-900">{sub.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`${palette.bg} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${Math.max(sub.progress_percentage, 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Weekly Performance (Dynamic Combo Bar & Line Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Weekly Performance</h3>
                </div>
                <select
                  value={weeklyFilter}
                  onChange={(e) => setWeeklyFilter(e.target.value as any)}
                  className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="Last 7 Days">Last 7 Days ▾</option>
                  <option value="Last 30 Days">Last 30 Days ▾</option>
                </select>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-4 text-[11px] text-slate-500 my-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-200" />
                  <span>Questions Attempted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Accuracy (%)</span>
                </div>
              </div>

              {/* Dynamic Combo Chart Visualization */}
              <div className="relative h-40 w-full mt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120">
                  <line x1="20" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="20" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="20" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="20" y1="110" x2="300" y2="110" stroke="#e2e8f0" />

                  <text x="5" y="24" fontSize="8" fill="#94a3b8">100</text>
                  <text x="9" y="54" fontSize="8" fill="#94a3b8">75</text>
                  <text x="9" y="84" fontSize="8" fill="#94a3b8">50</text>
                  <text x="14" y="112" fontSize="8" fill="#94a3b8">0</text>

                  <text x="303" y="24" fontSize="8" fill="#94a3b8">100%</text>
                  <text x="303" y="54" fontSize="8" fill="#94a3b8">75%</text>
                  <text x="303" y="112" fontSize="8" fill="#94a3b8">0%</text>

                  {/* Dynamic Bars for Questions Attempted */}
                  {chartData.map((d, i) => {
                    const step = 268 / Math.max(1, chartData.length);
                    const barW = Math.max(2.5, Math.min(14, step * 0.55));
                    const barX = 26 + i * step + (step - barW) / 2;
                    const maxQ = Math.max(1, ...chartData.map((c) => c.questionsCount));
                    const barHeight = d.questionsCount > 0 ? Math.max(8, Math.min(85, (d.questionsCount / maxQ) * 85)) : 0;
                    const barY = 110 - barHeight;
                    return (
                      <rect
                        key={i}
                        x={barX}
                        y={barY}
                        width={barW}
                        height={barHeight}
                        rx="1.5"
                        fill="#bfdbfe"
                      >
                        <title>{`${d.date}: ${d.questionsCount} questions`}</title>
                      </rect>
                    );
                  })}

                  {/* Overlaid Line Graph for Accuracy */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    points={chartData
                      .map((d, i) => {
                        const step = 268 / Math.max(1, chartData.length);
                        const px = 26 + i * step + step / 2;
                        const py = 110 - (d.accuracyPercentage / 100) * 80;
                        return `${px},${py}`;
                      })
                      .join(" ")}
                  />

                  {/* Line Dots */}
                  {chartData.map((d, i) => {
                    const step = 268 / Math.max(1, chartData.length);
                    const cx = 26 + i * step + step / 2;
                    const cy = 110 - (d.accuracyPercentage / 100) * 80;
                    if (chartData.length > 7 && d.questionsCount === 0) return null;
                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={chartData.length > 7 ? "2" : "3"}
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      >
                        <title>{`${d.date}: ${d.accuracyPercentage}% accuracy`}</title>
                      </circle>
                    );
                  })}
                </svg>

                {/* X-Axis Dates */}
                <div className="flex justify-between text-[9px] text-slate-400 px-6 mt-1">
                  {chartData.length <= 7
                    ? chartData.map((d, i) => (
                        <span key={i}>{d.date}</span>
                      ))
                    : chartData
                        .filter((_, idx) => idx % 6 === 0 || idx === chartData.length - 1)
                        .map((d, idx) => (
                          <span key={idx}>{d.date}</span>
                        ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ROW 3: (1) SUBJECT-WISE PROGRESS (2) RECOMMENDED FOR YOU  */}
          {/*        (3) THREE STACKED WIDGETS (Upcoming, Streak, Feed) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Subject-wise Progress (Derived Dynamically from Course) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Subject-wise Progress</h3>
                </div>
                <Link
                  href={`/syllabus${courseQueryParam}`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {dynamicSubjects.map((sub, idx) => {
                  const palette = SUBJECT_COLOR_PALETTES[idx % SUBJECT_COLOR_PALETTES.length];
                  return (
                    <Link
                      key={sub.subject_id || idx}
                      href={`/syllabus${courseQueryParam}&subject=${sub.subject_id}`}
                      className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className={`w-9 h-9 rounded-xl ${palette.light} flex items-center justify-center shrink-0`}>
                        {getSubjectIcon(sub.subject_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <h4 className="font-bold text-slate-900 truncate" title={sub.subject_name}>
                            {sub.subject_name}
                          </h4>
                          <span className="font-semibold text-slate-600">{sub.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`${palette.bg} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${Math.max(sub.progress_percentage, 0)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          {sub.completed_topics}/{sub.total_topics} topics
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 2. Recommended for You (Dynamic Actions Connected to Modules) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <h3 className="text-sm font-bold text-slate-900">Recommended for You</h3>
                </div>
                <Link
                  href={`/questions${courseQueryParam}`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {/* Rec 1: Daily Quiz */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Daily Quiz</h4>
                      <p className="text-[11px] text-slate-500">20 questions • {targetExamCode} Mixed Topics</p>
                    </div>
                  </div>
                  <Link
                    href={`/mock-tests${courseQueryParam}`}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    Start Quiz
                  </Link>
                </div>

                {/* Rec 2: Revise Weak Topics */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Revise Weak Topics</h4>
                      <p className="text-[11px] text-slate-500">Based on course completion</p>
                    </div>
                  </div>
                  <Link
                    href={`/syllabus${courseQueryParam}`}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    View Topics
                  </Link>
                </div>

                {/* Rec 3: Previous Year Questions */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Previous Year Questions</h4>
                      <p className="text-[11px] text-slate-500">{targetExamCode} • Topic-wise</p>
                    </div>
                  </div>
                  <Link
                    href={`/questions${courseQueryParam}`}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    Practice Now
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. Three Stacked Widgets: Upcoming Exam, Study Streak, Recent Activity */}
            <div className="space-y-4">
              {/* Widget A: Dynamic Upcoming Exam */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">Upcoming Exam</h3>
                  </div>
                  <Link
                    href={`/exams/${targetExam?.slug || "ossc-cgl"}`}
                    className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                        {targetExamCode} {profile?.target_year || 2026}
                      </h4>
                      <p className="text-[10px] text-slate-400">Target Recruitment Batch</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-600 font-mono leading-none block">
                      45
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                      Days Left
                    </span>
                  </div>
                </div>
              </div>

              {/* Widget B: Dynamic Study Streak */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <h3 className="text-xs font-bold text-slate-900">Study Streak</h3>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {currentMetrics.study_streak_days > 0 ? currentMetrics.study_streak_days : 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">day</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {currentMetrics.study_streak_days > 0 ? "Keep it up!" : "Start today!"}
                    </span>
                  </div>

                  {/* Day Dots: M T W T F S S (Derived from active streak) */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { day: "M", active: true },
                      { day: "T", active: currentMetrics.study_streak_days >= 2 },
                      { day: "W", active: currentMetrics.study_streak_days >= 3 },
                      { day: "T", active: currentMetrics.study_streak_days >= 4 },
                      { day: "F", active: currentMetrics.study_streak_days >= 5 },
                      { day: "S", active: currentMetrics.study_streak_days >= 6 },
                      { day: "S", active: currentMetrics.study_streak_days >= 7 },
                    ].map((d, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <span
                          className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                            d.active
                              ? "bg-emerald-500 text-white shadow-xs"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {d.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Widget C: Dynamic Recent Activity Feed */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900">Recent Activity</h3>
                  </div>
                  <Link
                    href={`/dashboard#activity`}
                    className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {currentMetrics.recent_activities && currentMetrics.recent_activities.length > 0 ? (
                    currentMetrics.recent_activities.slice(0, 3).map((act, i) => (
                      <div key={act.id || i} className="flex items-start gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          {act.activity_type === "mock_test_completed" ? (
                            <Award className="w-2.5 h-2.5 text-amber-600" />
                          ) : act.activity_type === "question_attempted" ? (
                            <Target className="w-2.5 h-2.5 text-purple-600" />
                          ) : act.activity_type === "topic_completed" ? (
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <RefreshCw className="w-2.5 h-2.5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-[11px] truncate">
                            {act.title}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {act.description || "Activity recorded"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <RefreshCw className="w-2.5 h-2.5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-[11px] truncate">
                            Active Course: {targetExamCode}
                          </p>
                          <p className="text-[10px] text-slate-400">Preparation space initialized</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-[11px] truncate">
                            Syllabus Tracking Ready
                          </p>
                          <p className="text-[10px] text-slate-400">Coverage calculation active</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Course Select Modal */}
      {showCourseModal && (
        <CourseSelectModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          currentExamId={targetExam?.id || null}
          exams={allExams}
        />
      )}

      {/* Log Study Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Log Study Session</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogStudySession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Duration (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setLogMinutes(mins)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        logMinutes === mins
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="5"
                  max="720"
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Session Notes / Topics Covered
                </label>
                <input
                  type="text"
                  placeholder="e.g. Revised Indian Polity notes & solved 25 questions"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLogging}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isLogging ? "Saving..." : "Save Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Today's Goal Modal */}
      <TodayGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        todayStudyHours={currentMetrics.study_hours_today || 0}
        todayQuestions={currentMetrics.questions_practiced_today || 0}
        activeCourseTitle={targetExamTitle}
        onGoalUpdated={(g) => setDailyGoal(g)}
      />

      {/* Study Stopwatch & Focus Timer Modal */}
      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExamTitle}
        onSessionSaved={(mins) => {
          const addedHours = Math.round((mins / 60) * 10) / 10;
          setCurrentMetrics((prev) => ({
            ...prev,
            study_hours: Math.round((prev.study_hours + addedHours) * 10) / 10,
            study_hours_today: Math.round(((prev.study_hours_today || 0) + addedHours) * 10) / 10,
            study_streak_days: prev.study_streak_days === 0 ? 1 : prev.study_streak_days,
          }));
        }}
      />
    </div>
  );
};
