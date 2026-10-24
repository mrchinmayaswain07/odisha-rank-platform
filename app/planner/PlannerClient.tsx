"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Target,
  Clock,
  HelpCircle,
  BookOpen,
  Plus,
  Trash2,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  ChevronRight,
  CheckCircle2,
  Check,
  Coffee,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  Settings,
  RefreshCw,
  Sliders,
  Zap,
  Brain,
  Filter,
  Layers,
  ListChecks,
  GraduationCap,
  AlertTriangle,
  Clock3,
  CalendarDays,
  X,
  Shuffle,
  BookmarkCheck,
  CheckSquare,
  Square,
  Repeat,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { TodayGoalModal } from "@/components/TodayGoalModal";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam, Subject } from "@/lib/types";
import {
  StudentStudyGoal,
  TimetableConfig,
  TimetableSlot,
  SubjectPriority,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  calculateStudyPace,
  generateSuggestedTimetable,
  calculateNextRevisionDate,
  analyzeSubjectPriorities,
  rescheduleMissedTasks,
} from "@odisha-rank/shared";
import {
  DailyGoal,
  GoalTask,
  getStoredDailyGoal,
  saveStoredDailyGoal,
  getStoredStudyGoal,
  saveStoredStudyGoal,
  getStoredTimetableConfig,
  saveStoredTimetableConfig,
  getStoredSubjectPriorities,
  saveStoredSubjectPriorities,
  getTodayDateString,
} from "@/lib/goal-storage";

interface PlannerClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
  initialSubjects?: Subject[];
}

type TabType = "overview" | "tasks" | "timetable" | "priorities" | "revision";

export const PlannerClient: React.FC<PlannerClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
  initialSubjects = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Core Goal and Task States
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(getStoredDailyGoal());
  const [studyGoal, setStudyGoal] = useState<StudentStudyGoal>(getStoredStudyGoal(profile?.id));
  const [customTotalHoursInput, setCustomTotalHoursInput] = useState<string>(String(studyGoal.target_total_hours || 300));
  const [timetableConfig, setTimetableConfig] = useState<TimetableConfig>(getStoredTimetableConfig());
  const [subjectPriorities, setSubjectPriorities] = useState<SubjectPriority[]>(getStoredSubjectPriorities());

  const [todayHours, setTodayHours] = useState(metrics.study_hours_today || 0);
  const [todayQuestions, setTodayQuestions] = useState(metrics.questions_practiced_today || 0);
  const [totalCompletedHours, setTotalCompletedHours] = useState(metrics.study_hours || 0);

  // Quick stopwatch state
  const [quickTimerRunning, setQuickTimerRunning] = useState(false);
  const [quickSeconds, setQuickSeconds] = useState(0);
  const [activeStopwatchLabel, setActiveStopwatchLabel] = useState<string>("Odisha Exam Deep Study");

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>("study");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("high");
  const [newTaskDuration, setNewTaskDuration] = useState<number>(30);
  const [newTaskSubjectId, setNewTaskSubjectId] = useState<string>("");

  // Timetable active day selector
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<string>(currentDayName);

  // Learning preferences state
  const [stageFocus, setStageFocus] = useState<"both" | "prelims" | "mains">("both");
  const [languagePref, setLanguagePref] = useState<"bilingual" | "english" | "odia">("bilingual");
  const [dailyReminder, setDailyReminder] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>("07:00");

  // Sync with custom events across pages
  useEffect(() => {
    const handleGoalUpdate = (e: any) => {
      if (e.detail) {
        setDailyGoal(e.detail);
        setStudyGoal(getStoredStudyGoal(profile?.id));
      }
    };
    const handleStudyGoalUpdate = (e: any) => {
      if (e.detail) setStudyGoal(e.detail);
    };
    const handleSessionLogged = (e: any) => {
      if (e.detail?.minutes) {
        const addedHours = Math.round((e.detail.minutes / 60) * 10) / 10;
        setTodayHours((prev) => Math.round((prev + addedHours) * 10) / 10);
        setTotalCompletedHours((prev) => Math.round((prev + addedHours) * 10) / 10);
      }
    };

    window.addEventListener("daily-goal-updated", handleGoalUpdate);
    window.addEventListener("study-goal-updated", handleStudyGoalUpdate);
    window.addEventListener("study-session-logged", handleSessionLogged);

    return () => {
      window.removeEventListener("daily-goal-updated", handleGoalUpdate);
      window.removeEventListener("study-goal-updated", handleStudyGoalUpdate);
      window.removeEventListener("study-session-logged", handleSessionLogged);
    };
  }, [profile?.id]);

  // Quick timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (quickTimerRunning) {
      interval = setInterval(() => {
        setQuickSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quickTimerRunning]);

  // Subjects list
  const subjectsList = useMemo(() => {
    if (initialSubjects && initialSubjects.length > 0) return initialSubjects;
    return [
      { id: "sub-1", exam_id: targetExam?.id || "e1", name: "General Studies & Odisha GK", code: "gs-gk", description: null, order_index: 1, created_at: new Date().toISOString() },
      { id: "sub-2", exam_id: targetExam?.id || "e1", name: "Quantitative Aptitude & Arithmetic", code: "math", description: null, order_index: 2, created_at: new Date().toISOString() },
      { id: "sub-3", exam_id: targetExam?.id || "e1", name: "Logical Reasoning & Mental Ability", code: "reasoning", description: null, order_index: 3, created_at: new Date().toISOString() },
      { id: "sub-4", exam_id: targetExam?.id || "e1", name: "Odia & English Language", code: "languages", description: null, order_index: 4, created_at: new Date().toISOString() },
      { id: "sub-5", exam_id: targetExam?.id || "e1", name: "Computer & Internet Awareness", code: "computer", description: null, order_index: 5, created_at: new Date().toISOString() },
    ];
  }, [initialSubjects, targetExam?.id]);

  // Subject priorities initialization & calculation
  useEffect(() => {
    const existing = getStoredSubjectPriorities();
    if (existing.length === 0 && subjectsList.length > 0) {
      const analyzed = analyzeSubjectPriorities({
        subjects: subjectsList,
        userPriorities: [],
        totalWeeklyHours: (studyGoal.daily_target_hours || 3) * 6,
      });
      setSubjectPriorities(analyzed);
      saveStoredSubjectPriorities(analyzed);
    } else if (existing.length > 0) {
      setSubjectPriorities(existing);
    }
  }, [subjectsList, studyGoal.daily_target_hours]);

  // Study Pace Estimation (pure client-side business logic)
  const studyPace = useMemo(() => {
    const activeDaysCount = Math.max(1, metrics.study_streak_days || 1);
    return calculateStudyPace({
      goal: studyGoal,
      completedHours: totalCompletedHours,
      sessionDaysCount: activeDaysCount,
      recentDailyHours: [todayHours, todayHours * 0.9, todayHours * 1.1],
    });
  }, [studyGoal, totalCompletedHours, metrics.study_streak_days, todayHours]);

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

  // Format seconds to mm:ss or hh:mm:ss
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Toggle single task completion
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = dailyGoal.tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          status: (nextCompleted ? "completed" : "not_started") as TaskStatus,
        };
      }
      return t;
    });
    const updated = { ...dailyGoal, tasks: updatedTasks };
    setDailyGoal(updated);
    saveStoredDailyGoal(updated);
  };

  // Cycle task status (not_started -> in_progress -> completed -> skipped)
  const handleCycleStatus = (taskId: string) => {
    const sequence: TaskStatus[] = ["not_started", "in_progress", "completed", "skipped"];
    const updatedTasks = dailyGoal.tasks.map((t) => {
      if (t.id === taskId) {
        const currentIdx = sequence.indexOf(t.status || (t.completed ? "completed" : "not_started"));
        const nextStatus = sequence[(currentIdx + 1) % sequence.length];
        return {
          ...t,
          status: nextStatus,
          completed: nextStatus === "completed",
        };
      }
      return t;
    });
    const updated = { ...dailyGoal, tasks: updatedTasks };
    setDailyGoal(updated);
    saveStoredDailyGoal(updated);
  };

  // Add a new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const matchedSubject = subjectsList.find((s) => s.id === newTaskSubjectId);

    const newTask: GoalTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      status: "not_started",
      priority: newTaskPriority,
      category: newTaskCategory,
      durationMinutes: newTaskDuration,
      targetDurationMinutes: newTaskDuration,
      subject_id: matchedSubject?.id || null,
      subject_name: matchedSubject?.name || null,
    };

    const updated = { ...dailyGoal, tasks: [newTask, ...dailyGoal.tasks] };
    setDailyGoal(updated);
    saveStoredDailyGoal(updated);
    setNewTaskTitle("");
  };

  // Delete a task
  const handleDeleteTask = (taskId: string) => {
    const updated = { ...dailyGoal, tasks: dailyGoal.tasks.filter((t) => t.id !== taskId) };
    setDailyGoal(updated);
    saveStoredDailyGoal(updated);
  };

  // Reschedule missed tasks from previous days to today without losing history
  const handleRescheduleMissed = () => {
    const todayStr = getTodayDateString();
    const plannerTasks: any[] = dailyGoal.tasks.map((t) => ({
      ...t,
      task_date: dailyGoal.date || todayStr,
      status: t.status || (t.completed ? "completed" : "not_started"),
    }));

    const rescheduled = rescheduleMissedTasks(plannerTasks, todayStr);
    const updatedGoalTasks: GoalTask[] = rescheduled.map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.status === "completed",
      status: t.status,
      priority: t.priority || "medium",
      category: t.category || "study",
      durationMinutes: t.target_duration_minutes || (t as any).durationMinutes || 30,
      targetDurationMinutes: t.target_duration_minutes || 30,
      subject_id: t.subject_id,
      subject_name: t.subject_name,
      rescheduled_from: t.rescheduled_from,
    }));

    const updated = { ...dailyGoal, tasks: updatedGoalTasks };
    setDailyGoal(updated);
    saveStoredDailyGoal(updated);
  };

  // Save quick stopwatch time to today's metrics
  const handleSaveQuickTimer = () => {
    if (quickSeconds < 30) return;
    const addedMinutes = Math.round(quickSeconds / 60);
    const addedHours = Math.round((addedMinutes / 60) * 10) / 10;
    setTodayHours((prev) => Math.round((prev + addedHours) * 10) / 10);
    setTotalCompletedHours((prev) => Math.round((prev + addedHours) * 10) / 10);
    setQuickTimerRunning(false);
    setQuickSeconds(0);

    // Dispatch event
    window.dispatchEvent(
      new CustomEvent("study-session-logged", {
        detail: {
          minutes: addedMinutes,
          session_type: "stopwatch",
          notes: activeStopwatchLabel,
        },
      })
    );
  };

  // Auto-generate suggested timetable based on student preferences & priorities
  const handleGenerateTimetable = () => {
    const subjectsForGen = subjectsList.map((s) => {
      const pri = subjectPriorities.find((p) => p.subject_id === s.id);
      return {
        id: s.id,
        name: s.name,
        priority: (pri?.priority || "medium") as "high" | "medium" | "low",
      };
    });

    const generated = generateSuggestedTimetable({
      dailyHours: studyGoal.daily_target_hours || 3,
      preferredSlots: timetableConfig.preferred_slots || ["morning", "evening"],
      commitments: {
        office_college_hours: timetableConfig.commitments?.office_college_hours || 0,
        days: timetableConfig.commitments?.days || [],
      },
      restDays: timetableConfig.rest_days || ["Sunday"],
      subjects: subjectsForGen,
    });

    const updatedCfg: TimetableConfig = {
      ...timetableConfig,
      weekly_schedule: generated,
      weekly_slots: generated,
    };

    setTimetableConfig(updatedCfg);
    saveStoredTimetableConfig(updatedCfg);
  };

  // Toggle subject priority
  const handleTogglePriority = (subjectId: string, newPriority: "high" | "medium" | "low") => {
    const updated = subjectPriorities.map((item) => {
      if (item.subject_id === subjectId) {
        return { ...item, priority: newPriority };
      }
      return item;
    });

    const recalculated = analyzeSubjectPriorities({
      subjects: subjectsList,
      userPriorities: updated,
      totalWeeklyHours: (studyGoal.daily_target_hours || 3) * 6,
    });

    setSubjectPriorities(recalculated);
    saveStoredSubjectPriorities(recalculated);
  };

  // Quick total target hours change
  const handleUpdateTotalHours = (newTotal: number) => {
    const valid = Math.max(1, Math.round(newTotal));
    setCustomTotalHoursInput(String(valid));
    const updated: StudentStudyGoal = {
      ...studyGoal,
      target_total_hours: valid,
      updated_at: new Date().toISOString(),
    };
    setStudyGoal(updated);
    saveStoredStudyGoal(updated);
  };

  // Update exam date
  const handleUpdateExamDate = (dateStr: string) => {
    const updated: StudentStudyGoal = {
      ...studyGoal,
      exam_date: dateStr || null,
      updated_at: new Date().toISOString(),
    };
    setStudyGoal(updated);
    saveStoredStudyGoal(updated);
  };

  // Status toggle for study goal (active / paused / completed / reset)
  const handleGoalStatusChange = (status: StudentStudyGoal["status"]) => {
    if (status === "reset") {
      if (confirm("Are you sure you want to reset your overall study progress count to 0?")) {
        const resetGoal: StudentStudyGoal = {
          ...studyGoal,
          completed_hours: 0,
          status: "active",
          updated_at: new Date().toISOString(),
        };
        setStudyGoal(resetGoal);
        saveStoredStudyGoal(resetGoal);
        setTotalCompletedHours(0);
      }
      return;
    }
    const updated: StudentStudyGoal = {
      ...studyGoal,
      status,
      updated_at: new Date().toISOString(),
    };
    setStudyGoal(updated);
    saveStoredStudyGoal(updated);
  };

  const completedTasksCount = dailyGoal.tasks.filter((t) => t.completed).length;
  const hoursPct = Math.min(100, Math.round((todayHours / (dailyGoal.targetStudyHours || 1)) * 100));
  const questionsPct = Math.min(100, Math.round((todayQuestions / (dailyGoal.targetQuestions || 1)) * 100));

  // Current day timetable slots
  const currentDaySlots: TimetableSlot[] = (timetableConfig.weekly_slots?.[selectedTimetableDay] || timetableConfig.weekly_schedule?.[selectedTimetableDay] || []) as TimetableSlot[];

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop & Mobile Sidebar */}
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

      {/* Main Content Area */}
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

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs mb-3 border border-blue-400/30">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>Customizable Study & Exam System</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Study Planner & Target Engine
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
                Tailored for <strong className="text-amber-400">{targetExamTitle}</strong>. Set custom preparation hours, pace projections, adaptive timetable routines, and high-yield subject priority diagnostics.
              </p>

              {/* Exam Countdown & Status Pills */}
              <div className="flex flex-wrap items-center gap-2.5 mt-4">
                {studyPace.days_to_exam !== null ? (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5" />
                    <span>⏳ {studyPace.days_to_exam} Days to Exam</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    + Set Exam Date
                  </button>
                )}

                <div className="px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Streak: {metrics.study_streak_days || 1} Days</span>
                </div>

                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  studyGoal.status === "paused"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : studyGoal.status === "completed"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="capitalize">Goal: {studyGoal.status || "Active"}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 w-full lg:w-auto">
              <button
                onClick={() => setShowGoalModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                <span>Customize Target</span>
              </button>
              <button
                onClick={() => setShowTimerModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Timer className="w-4 h-4" />
                <span>Stopwatch Timer</span>
              </button>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-2xs flex overflow-x-auto no-scrollbar gap-1">
            {[
              { id: "overview", label: "Overview & Pace", icon: Target },
              { id: "tasks", label: `Today's Tasks (${completedTasksCount}/${dailyGoal.tasks.length})`, icon: ListChecks },
              { id: "timetable", label: "Flexible Timetable", icon: CalendarDays },
              { id: "priorities", label: "Subject Priorities", icon: BarChart2 },
              { id: "revision", label: "Revision & Preferences", icon: Repeat },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW & STUDY PACE */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Pace Projection Diagnostic Banner */}
              <div className={`p-5 rounded-3xl border shadow-2xs transition-all ${
                studyPace.pace_status === "ahead"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : studyPace.pace_status === "on_track"
                  ? "bg-blue-50/80 border-blue-200 text-blue-950"
                  : studyPace.pace_status === "behind"
                  ? "bg-rose-50/80 border-rose-200 text-rose-950"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      studyPace.pace_status === "ahead"
                        ? "bg-emerald-600 text-white"
                        : studyPace.pace_status === "on_track"
                        ? "bg-blue-600 text-white"
                        : studyPace.pace_status === "behind"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {studyPace.pace_status === "insufficient_data" ? (
                        <HelpCircle className="w-5 h-5" />
                      ) : (
                        <TrendingUp className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base">
                          Study Pace Status:{" "}
                          <span className="capitalize font-black underline decoration-2">
                            {studyPace.pace_status.replace("_", " ")}
                          </span>
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed">
                        {studyPace.message}
                      </p>
                    </div>
                  </div>

                  {studyPace.estimated_completion_date && (
                    <div className="sm:text-right shrink-0 bg-white/60 backdrop-blur-xs px-4 py-2 rounded-2xl border border-current/10">
                      <div className="text-[11px] font-bold opacity-75 uppercase tracking-wider">
                        Projected Completion
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {studyPace.estimated_completion_date}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Preparation Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Hours Target
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {studyGoal.target_total_hours} <span className="text-xs text-slate-500 font-bold">hrs</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[150, 300, 500, 750, 1000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleUpdateTotalHours(preset)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                          studyGoal.target_total_hours === preset
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {preset}h
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="number"
                      min="1"
                      value={customTotalHoursInput}
                      onChange={(e) => {
                        setCustomTotalHoursInput(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          handleUpdateTotalHours(Math.round(val));
                        }
                      }}
                      placeholder="Custom"
                      className="w-20 px-2 py-0.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">hrs custom</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Completed Preparation
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {totalCompletedHours} <span className="text-xs text-slate-500 font-bold">hrs</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {studyPace.progress_pct}% of total target reached
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Remaining Study Hours
                  </div>
                  <div className="text-2xl font-black text-amber-600">
                    {studyPace.remaining_hours} <span className="text-xs text-slate-500 font-bold">hrs</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {studyPace.required_daily_hours !== null
                      ? `~${studyPace.required_daily_hours} hrs/day needed`
                      : "Set exam date to view daily pace"}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Goal Control
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => handleGoalStatusChange("active")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                        studyGoal.status === "active"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleGoalStatusChange("paused")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                        studyGoal.status === "paused"
                          ? "bg-amber-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => handleGoalStatusChange("reset")}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Reset progress"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Modify status without losing task records.
                  </div>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">Total Preparation Hour Goal Progress</span>
                  <span className="text-blue-600">{studyPace.progress_pct}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${studyPace.progress_pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>0 hrs</span>
                  <span>{studyGoal.target_total_hours} hrs target</span>
                </div>
              </div>

              {/* Today's Daily Target Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Target 1: Study Hours */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Today&apos;s Study Time
                        </h3>
                        <div className="text-lg font-black text-slate-900">
                          {todayHours} / {dailyGoal.targetStudyHours} hrs
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 font-mono">
                      {hoursPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${hoursPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {todayHours >= dailyGoal.targetStudyHours
                      ? "🎉 Daily study hour goal reached!"
                      : `${Math.max(0, Math.round((dailyGoal.targetStudyHours - todayHours) * 10) / 10)} hrs remaining to meet today's target.`}
                  </p>
                </div>

                {/* Target 2: Practice Questions */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Questions Practiced
                        </h3>
                        <div className="text-lg font-black text-slate-900">
                          {todayQuestions} / {dailyGoal.targetQuestions} MCQs
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-600 font-mono">
                      {questionsPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${questionsPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {todayQuestions >= dailyGoal.targetQuestions
                      ? "🔥 MCQ practice quota completed!"
                      : `${Math.max(0, dailyGoal.targetQuestions - todayQuestions)} MCQs left to practice today.`}
                  </p>
                </div>

                {/* Target 3: Daily Streak */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Flame className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Active Consistency Streak
                        </h3>
                        <div className="text-lg font-black text-slate-900">
                          {metrics.study_streak_days || 1} Days
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      On Fire
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                      <div
                        key={d}
                        className={`flex-1 py-1 text-center rounded-lg text-[10px] font-bold ${
                          i <= (metrics.study_streak_days % 7)
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {d[0]}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Regular daily study beats intermittent marathon sessions for Odisha competitive exams.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TODAY'S TASKS & STOPWATCH */}
          {activeTab === "tasks" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Action Checklist */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900">
                        Today&apos;s Study Tasks ({completedTasksCount}/{dailyGoal.tasks.length} Done)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Check off completed items or tap status to cycle
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRescheduleMissed}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                      title="Move overdue uncompleted tasks to today"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Reschedule Missed</span>
                    </button>
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 transition-colors"
                    >
                      Edit Target
                    </button>
                  </div>
                </div>

                {/* Planned Task Hours Summary & Exceed Warning */}
                {(() => {
                  const plannedMins = dailyGoal.tasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
                  const plannedHrs = Math.round((plannedMins / 60) * 10) / 10;
                  const targetHrs = dailyGoal.targetStudyHours || 3;
                  const isExceeding = plannedHrs > targetHrs;

                  return (
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Today&apos;s Planned Hours: <strong className="text-slate-900 font-mono">{plannedHrs} hrs</strong> ({dailyGoal.tasks.length} tasks)
                        </span>
                        <span className="text-slate-600 font-medium">
                          Daily Study Target: <strong className="text-blue-600 font-mono">{targetHrs} hrs</strong>
                        </span>
                      </div>
                      {isExceeding && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Planned durations exceed daily target:</span> Total planned tasks ({plannedHrs} hrs) exceed your {targetHrs} hrs daily target. You can still proceed or adjust task durations.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Tasks List */}
                <div className="space-y-2.5">
                  {dailyGoal.tasks.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <Target className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-sm font-bold text-slate-700">No tasks planned for today</div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Add a new task below or import topics from the Syllabus explorer.
                      </p>
                    </div>
                  ) : (
                    dailyGoal.tasks.map((task) => {
                      const isCompleted = task.completed || task.status === "completed";
                      return (
                        <div
                          key={task.id}
                          className={`flex items-start sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 ${
                            isCompleted
                              ? "bg-emerald-50/50 border-emerald-200"
                              : task.status === "in_progress"
                              ? "bg-blue-50/50 border-blue-200"
                              : task.status === "skipped"
                              ? "bg-slate-100/70 border-slate-200 opacity-60"
                              : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className="mt-0.5 sm:mt-0 shrink-0 text-slate-400 hover:text-emerald-600"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                              ) : (
                                <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-blue-500 transition-colors" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs sm:text-sm font-semibold select-none ${
                                    isCompleted
                                      ? "line-through text-slate-400"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {task.rescheduled_from && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                    Rescheduled
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <button
                                  onClick={() => handleCycleStatus(task.id)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:border-blue-400 capitalize transition-colors"
                                  title="Click to cycle status"
                                >
                                  {task.status?.replace("_", " ") || (task.completed ? "completed" : "not started")} 🔄
                                </button>

                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  task.priority === "high"
                                    ? "bg-rose-100 text-rose-700"
                                    : task.priority === "medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                                } uppercase tracking-wider`}>
                                  {task.priority || "medium"}
                                </span>

                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                                  {task.category || "study"}
                                </span>

                                {task.durationMinutes && (
                                  <span className="text-[11px] font-mono text-slate-400">
                                    ⏱️ {task.durationMinutes}m
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setActiveStopwatchLabel(task.title);
                                setQuickTimerRunning(true);
                              }}
                              className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Time this task with stopwatch"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Task Form */}
                <form onSubmit={handleAddTask} className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Create Custom Study Task</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Solve 30 Arithmetic MCQs on Percentage..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Task</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="study">Study</option>
                      <option value="practice">Practice</option>
                      <option value="mock">Mock Test</option>
                      <option value="revision">Revision</option>
                      <option value="braingym">Brain Gym</option>
                      <option value="custom">Custom</option>
                    </select>

                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>

                    <select
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                      <option value={90}>90 mins</option>
                    </select>

                    <select
                      value={newTaskSubjectId}
                      onChange={(e) => setNewTaskSubjectId(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none max-w-xs truncate"
                    >
                      <option value="">(Optional Subject)</option>
                      {subjectsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>

              {/* Right Col: Quick Study Timer Widget */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Study Stopwatch</h3>
                        <p className="text-[11px] text-slate-400">Track focus sessions in real time</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowTimerModal(true)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Full Timer
                    </button>
                  </div>

                  {/* Active Label */}
                  <div className="text-xs font-bold text-slate-600 truncate mb-2 text-center bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100">
                    🎯 {activeStopwatchLabel}
                  </div>

                  {/* Clock Face */}
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                      {formatTimer(quickSeconds)}
                    </div>
                    <div className="text-xs text-slate-400 font-semibold mt-1">
                      {quickTimerRunning ? "⏱️ Recording Study Time..." : "Ready to Start"}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <button
                      onClick={() => {
                        setQuickTimerRunning(false);
                        setQuickSeconds(0);
                      }}
                      className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setQuickTimerRunning(!quickTimerRunning)}
                      className={`px-6 py-3 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-2 ${
                        quickTimerRunning
                          ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                          : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
                      }`}
                    >
                      {quickTimerRunning ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start Study</span>
                        </>
                      )}
                    </button>

                    {quickSeconds >= 30 && (
                      <button
                        onClick={handleSaveQuickTimer}
                        className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                        title="Save to Daily Metrics"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Motivational Footer */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-950">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pro Tip for Aspirants</span>
                  </div>
                  <p className="text-blue-800/80 leading-relaxed text-[11px]">
                    Study in 45-minute focused blocks followed by a 5-minute break to maximize memory retention for Odisha GS & Arithmetic formulas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLEXIBLE TIMETABLE */}
          {activeTab === "timetable" && (
            <div className="space-y-6">
              {/* Availability & Commitment Controls */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Adaptive Timetable Settings & Commitments
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tell the system your work or college commitments. The algorithm will propose a realistic routine you can edit anytime.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateTimetable}
                    className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 shrink-0"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Generate Suggested Timetable</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Preferred Study Windows */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="text-xs font-bold text-slate-700">Preferred Study Windows</div>
                    <div className="space-y-1.5">
                      {[
                        { id: "morning", label: "Morning (06:00 - 12:00)" },
                        { id: "afternoon", label: "Afternoon (12:00 - 17:00)" },
                        { id: "evening", label: "Evening (17:00 - 21:00)" },
                        { id: "late_night", label: "Late Night (21:00 - 23:30)" },
                      ].map((slot) => {
                        const checked = timetableConfig.preferred_slots?.includes(slot.id as any);
                        return (
                          <label key={slot.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const curr = timetableConfig.preferred_slots || [];
                                const next = checked ? curr.filter((s) => s !== slot.id) : [...curr, slot.id as any];
                                const updated = { ...timetableConfig, preferred_slots: next };
                                setTimetableConfig(updated);
                                saveStoredTimetableConfig(updated);
                              }}
                              className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                            />
                            <span>{slot.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Office / College Hours */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="text-xs font-bold text-slate-700">Work / College Hours</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={timetableConfig.commitments?.office_college_hours || 0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const updated = {
                              ...timetableConfig,
                              commitments: {
                                ...(timetableConfig.commitments || { days: [] }),
                                office_college_hours: val,
                              },
                            };
                            setTimetableConfig(updated);
                            saveStoredTimetableConfig(updated);
                          }}
                          className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
                        />
                        <span className="text-xs text-slate-500 font-semibold">hrs / working day</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        The scheduler automatically reduces target hours on working days to prevent burnout.
                      </div>
                    </div>
                  </div>

                  {/* Rest Days */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="text-xs font-bold text-slate-700">Rest / Recovery Days</div>
                    <div className="flex flex-wrap gap-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
                        const fullName = daysOfWeek[i];
                        const isRest = timetableConfig.rest_days?.includes(fullName);
                        return (
                          <button
                            key={d}
                            onClick={() => {
                              const curr = timetableConfig.rest_days || [];
                              const next = isRest ? curr.filter((x) => x !== fullName) : [...curr, fullName];
                              const updated = { ...timetableConfig, rest_days: next };
                              setTimetableConfig(updated);
                              saveStoredTimetableConfig(updated);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                              isRest
                                ? "bg-amber-500 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Rest days focus on light review or Brain Gym workouts.
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {daysOfWeek.map((day) => {
                  const isToday = day === currentDayName;
                  const isSelected = day === selectedTimetableDay;
                  const slotCount = (timetableConfig.weekly_slots?.[day] || timetableConfig.weekly_schedule?.[day] || []).length;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedTimetableDay(day)}
                      className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-2 ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-xs"
                          : isToday
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span>{day}</span>
                      {isToday && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                          Today
                        </span>
                      )}
                      <span className="text-[10px] font-mono opacity-60">({slotCount})</span>
                    </button>
                  );
                })}
              </div>

              {/* Daily Timetable Slots */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Schedule for {selectedTimetableDay}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    All slots are 100% customizable
                  </span>
                </div>

                {currentDaySlots.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-sm font-bold text-slate-700">No slots defined for {selectedTimetableDay}</div>
                    <p className="text-xs text-slate-400">
                      Tap &quot;Generate Suggested Timetable&quot; above to create an automated schedule proposal.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {currentDaySlots.map((slot: TimetableSlot) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            slot.category === "study"
                              ? "bg-blue-100 text-blue-700"
                              : slot.category === "practice"
                              ? "bg-purple-100 text-purple-700"
                              : slot.category === "rest"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          } uppercase tracking-wider`}>
                            {slot.category}
                          </span>
                        </div>

                        {slot.subject_name && (
                          <div className="text-xs font-bold text-blue-700">
                            {slot.subject_name}
                          </div>
                        )}

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {slot.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUBJECT PRIORITIES */}
          {activeTab === "priorities" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Subject Priority Matrix & Weakness Diagnostics
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Identify weak subjects based on MCQ accuracy (&lt; 60% flags &quot;Needs Attention&quot;) and distribute weekly study hours effectively.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                    Weekly Budget: {(studyGoal.daily_target_hours || 3) * 6} Hours
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {subjectPriorities.map((item) => {
                    return (
                      <div key={item.subject_id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {item.subject_name}
                            </span>
                            {item.needs_attention && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Needs Attention</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3">
                            <span>
                              Accuracy: <strong>{item.accuracy_pct !== null ? `${item.accuracy_pct}%` : "Not enough data"}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Suggested: <strong>{item.suggested_hours || 3} hrs/week</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          {/* Priority Selector */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {(["high", "medium", "low"] as const).map((pri) => (
                              <button
                                key={pri}
                                onClick={() => handleTogglePriority(item.subject_id, pri)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                                  item.priority === pri
                                    ? pri === "high"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : pri === "medium"
                                      ? "bg-amber-600 text-white shadow-xs"
                                      : "bg-blue-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                {pri}
                              </button>
                            ))}
                          </div>

                          <Link
                            href={`/syllabus?subject=${item.subject_id}`}
                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>Syllabus</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REVISION & LEARNING PREFERENCES */}
          {activeTab === "revision" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spaced Repetition Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Spaced Repetition Schedule (1-3-7-21 Days)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scientifically proven intervals for Odisha exam fact retention
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { step: 1, interval: "Day 1", desc: "First 24-Hour Review (Concept lock-in)" },
                    { step: 2, interval: "Day 3", desc: "Active Recall & Quick MCQ Solving" },
                    { step: 3, interval: "Day 7", desc: "Weekly Synthesis & High-Yield Summary" },
                    { step: 4, interval: "Day 21", desc: "Long-Term Consolidation before Exam" },
                  ].map((rep) => (
                    <div
                      key={rep.step}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                          {rep.step}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{rep.interval}</div>
                          <div className="text-[11px] text-slate-500">{rep.desc}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Preferences Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Exam Preparation Preferences
                    </h3>
                    <p className="text-xs text-slate-500">
                      Customize language, stage focus, and notification alerts
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Stage Focus */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Exam Stage Focus</label>
                    <div className="flex gap-2">
                      {[
                        { id: "both", label: "Prelims & Mains" },
                        { id: "prelims", label: "Prelims Only" },
                        { id: "mains", label: "Mains Only" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setStageFocus(st.id as any)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                            stageFocus === st.id
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Content Language Mode</label>
                    <div className="flex gap-2">
                      {[
                        { id: "bilingual", label: "Bilingual (Eng + Odia)" },
                        { id: "english", label: "English" },
                        { id: "odia", label: "Odia" },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setLanguagePref(lang.id as any)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                            languagePref === lang.id
                              ? "bg-slate-900 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Reminder */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Daily Study Reminders</div>
                      <div className="text-[11px] text-slate-400">Receive morning notification of today&apos;s goal</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dailyReminder}
                        onChange={(e) => setDailyReminder(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <TodayGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        todayStudyHours={todayHours}
        totalCompletedHours={totalCompletedHours}
        todayQuestions={todayQuestions}
        activeCourseTitle={targetExamTitle}
        onGoalUpdated={(g) => {
          setDailyGoal(g);
          setStudyGoal(getStoredStudyGoal(profile?.id));
        }}
      />

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExamTitle}
        onSessionSaved={(mins) => {
          const addedHours = Math.round((mins / 60) * 10) / 10;
          setTodayHours((prev) => Math.round((prev + addedHours) * 10) / 10);
          setTotalCompletedHours((prev) => Math.round((prev + addedHours) * 10) / 10);
        }}
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
