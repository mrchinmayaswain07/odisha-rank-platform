"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { TodayGoalModal } from "@/components/TodayGoalModal";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam } from "@/lib/types";
import {
  DailyGoal,
  GoalTask,
  getStoredDailyGoal,
  saveStoredDailyGoal,
  getTodayDateString,
} from "@/lib/goal-storage";

interface PlannerClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

export const PlannerClient: React.FC<PlannerClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(getStoredDailyGoal());
  const [todayHours, setTodayHours] = useState(metrics.study_hours_today || 0);
  const [todayQuestions, setTodayQuestions] = useState(metrics.questions_practiced_today || 0);

  // Quick stopwatch state on planner page
  const [quickTimerRunning, setQuickTimerRunning] = useState(false);
  const [quickSeconds, setQuickSeconds] = useState(0);

  // Daily task form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<GoalTask["category"]>("study");

  useEffect(() => {
    const handleGoalUpdate = (e: any) => {
      if (e.detail) setDailyGoal(e.detail);
    };
    const handleSessionLogged = (e: any) => {
      if (e.detail?.minutes) {
        const addedHours = Math.round((e.detail.minutes / 60) * 10) / 10;
        setTodayHours((prev) => Math.round((prev + addedHours) * 10) / 10);
      }
    };

    window.addEventListener("daily-goal-updated", handleGoalUpdate);
    window.addEventListener("study-session-logged", handleSessionLogged);

    return () => {
      window.removeEventListener("daily-goal-updated", handleGoalUpdate);
      window.removeEventListener("study-session-logged", handleSessionLogged);
    };
  }, []);

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

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = dailyGoal.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updated = { ...dailyGoal, tasks: updatedTasks };
    setDailyGoal(updated);
    saveStoredDailyGoal(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: GoalTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      category: newTaskCategory,
      durationMinutes: 30,
    };

    const updated = { ...dailyGoal, tasks: [...dailyGoal.tasks, newTask] };
    setDailyGoal(updated);
    saveStoredDailyGoal(updated);
    setNewTaskTitle("");
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = { ...dailyGoal, tasks: dailyGoal.tasks.filter((t) => t.id !== taskId) };
    setDailyGoal(updated);
    saveStoredDailyGoal(updated);
  };

  const completedTasksCount = dailyGoal.tasks.filter((t) => t.completed).length;
  const hoursPct = Math.min(100, Math.round((todayHours / (dailyGoal.targetStudyHours || 1)) * 100));
  const questionsPct = Math.min(
    100,
    Math.round((todayQuestions / (dailyGoal.targetQuestions || 1)) * 100)
  );

  // Weekly Schedule Grid
  const weeklySchedule = [
    {
      day: "Monday",
      subject: "General Studies & Odisha History",
      time: "2 Hours",
      topic: "Ancient & Medieval Odisha Dynasties (Ganga & Gajapati)",
      isToday: new Date().getDay() === 1,
    },
    {
      day: "Tuesday",
      subject: "Arithmetic & Quantitative Aptitude",
      time: "2 Hours",
      topic: "Ratio & Proportion, Percentage & Profit-Loss",
      isToday: new Date().getDay() === 2,
    },
    {
      day: "Wednesday",
      subject: "Reasoning & Mental Ability",
      time: "1.5 Hours",
      topic: "Coding-Decoding, Blood Relations & Syllogism",
      isToday: new Date().getDay() === 3,
    },
    {
      day: "Thursday",
      subject: "Odisha & National Current Affairs",
      time: "1.5 Hours",
      topic: "State Schemes, Mo Sarkar initiatives & Awards",
      isToday: new Date().getDay() === 4,
    },
    {
      day: "Friday",
      subject: "Computer & Internet Awareness",
      time: "1.5 Hours",
      topic: "MS Office shortcuts, Networking & Cyber Security",
      isToday: new Date().getDay() === 5,
    },
    {
      day: "Saturday",
      subject: "Sectional Speed Practice",
      time: "2 Hours",
      topic: "50 Timed MCQs on High-Yield exam topics",
      isToday: new Date().getDay() === 6,
    },
    {
      day: "Sunday",
      subject: "Full-Length Mock Test & Revision",
      time: "2.5 Hours",
      topic: "Complete Simulation Test + Error Log Analysis",
      isToday: new Date().getDay() === 0,
    },
  ];

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
          <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-blue-500/10 border border-amber-200/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 font-bold text-xs mb-3">
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <span>Study Planner & Daily Consistency</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Daily Goal & Study Schedule
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Set and conquer daily preparation targets tailored for {targetExamTitle}. Regularity is the true difference maker in Odisha competitive ranks.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setShowGoalModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" />
                <span>Customize Goals</span>
              </button>
              <button
                onClick={() => setShowTimerModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Timer className="w-4 h-4" />
                <span>Open Stopwatch</span>
              </button>
            </div>
          </div>

          {/* Today's Target Cards Row */}
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
                      Study Time
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
                      Active Streak
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
                Keep studying daily to maintain your consistency multiplier.
              </p>
            </div>
          </div>

          {/* Main 2-Column Section: Today's Action Checklist & Quick Stopwatch */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Action Checklist */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Today&apos;s Checklist ({completedTasksCount}/{dailyGoal.tasks.length} Completed)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Check off completed study tasks as you progress today
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowGoalModal(true)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Edit Goals
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5">
                {dailyGoal.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      task.completed
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span
                        className={`text-xs sm:text-sm font-semibold select-none ${
                          task.completed
                            ? "line-through text-slate-400"
                            : "text-slate-800"
                        }`}
                      >
                        {task.title}
                      </span>
                    </label>

                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 uppercase tracking-wider">
                        {task.category}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a new study task (e.g. Solve 20 Arithmetic Questions)..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="study">Study</option>
                  <option value="practice">Practice</option>
                  <option value="mock">Mock</option>
                  <option value="revision">Revision</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
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
                    Pomodoro Mode
                  </button>
                </div>

                {/* Clock Face */}
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                    {formatTime(quickSeconds)}
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

          {/* Weekly Timetable Schedule */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Recommended Weekly Timetable ({targetExamTitle})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Structured routine to cover 100% of the official syllabus
                  </p>
                </div>
              </div>

              <Link
                href="/syllabus"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View Full Syllabus</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {weeklySchedule.map((item) => (
                <div
                  key={item.day}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.isToday
                      ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                      : "bg-slate-50/50 border-slate-200/80 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>{item.day}</span>
                      {item.isToday && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 font-mono">
                      {item.time}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-blue-700 truncate">
                    {item.subject}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {item.topic}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <TodayGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        todayStudyHours={todayHours}
        todayQuestions={todayQuestions}
        activeCourseTitle={targetExamTitle}
        onGoalUpdated={(g) => setDailyGoal(g)}
      />

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExamTitle}
        onSessionSaved={(mins) => {
          const addedHours = Math.round((mins / 60) * 10) / 10;
          setTodayHours((prev) => Math.round((prev + addedHours) * 10) / 10);
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
