"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Profile,
  DashboardMetrics,
  Exam,
} from "@/lib/types";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  GraduationCap,
  HelpCircle,
  Clock,
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
} from "lucide-react";

interface DashboardClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

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

  // Interactive study plan checklist items
  const [studyPlan, setStudyPlan] = useState([
    {
      id: "sp-1",
      title: "General Studies – Indian Polity",
      description: "Read notes and complete practice questions",
      duration: "60 min",
      completed: true,
      href: "/syllabus?subject=gs-polity",
    },
    {
      id: "sp-2",
      title: "Odisha Special – History of Odisha",
      description: "Complete topic reading",
      duration: "45 min",
      completed: true,
      href: "/syllabus?subject=odisha-gk",
    },
    {
      id: "sp-3",
      title: "Quantitative Aptitude – Simplification",
      description: "Practice 25 questions",
      duration: "45 min",
      completed: false,
      href: "/questions?subject=quant",
    },
    {
      id: "sp-4",
      title: "Take a Mock Test",
      description: "Attempt sectional test (50 questions)",
      duration: "60 min",
      completed: false,
      href: "/mock-tests",
    },
  ]);

  const toggleStudyPlan = (id: string) => {
    setStudyPlan((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const studentName = profile?.full_name || "Chinmaya Swain";
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
  const courseQueryParam = targetExam ? `?exam=${targetExam.id}` : "";

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased">
      {/* ------------------------------------------------------------- */}
      {/* 1. LEFT SIDEBAR NAVIGATION                                   */}
      {/* ------------------------------------------------------------- */}
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
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
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-blue-600 text-white font-bold">
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

          {/* Nav List */}
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm bg-blue-50 text-blue-600 shadow-xs"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/exams"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <span>My Courses</span>
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
              href="/syllabus"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Study Materials</span>
            </Link>

            <Link
              href="/dashboard#performance"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Performance</span>
            </Link>

            <Link
              href="/dashboard#planner"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Study Planner</span>
            </Link>

            <Link
              href="/questions?tab=bookmarks"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <Bookmark className="w-4 h-4 text-slate-400" />
              <span>Bookmarks</span>
            </Link>

            <Link
              href="/contact"
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
          {/* Subtle temple background graphic */}
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
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Hamburger on mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for topics, tests, or study materials..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Right Header: Notification + User Profile */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

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
                  <Link
                    href="/exams"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Change Target Exam</span>
                  </Link>
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
          {/* HERO BANNER: Namaskar Chinmaya Swain! + Active Course     */}
          {/* ========================================================= */}
          <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-50/80 via-sky-50/60 to-amber-50/40 border border-blue-100/80 shadow-xs overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Background Temple Artistic Graphic */}
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

            {/* Left Content */}
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Namaskar, <span className="text-blue-600">{studentName}!</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 font-normal leading-relaxed">
                Stay consistent with your preparation for {targetExamTitle}. Keep learning, keep practicing, and achieve your goal!
              </p>

              {/* Today's Goal Pill */}
              <div className="mt-4 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-50/90 border border-amber-200/70 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  <strong className="text-amber-900 font-bold">Today&apos;s Goal</strong>
                  <span className="mx-2 text-slate-300">•</span>
                  <span>Complete 2 subjects</span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span>Practice 50 questions</span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span>Study for 2 hours</span>
                </div>
              </div>
            </div>

            {/* Right Card: Active Course & Continue Learning */}
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
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
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
          {/* ROW 1: THE 4 STAT METRICS (With Mini Sparkline Bar Charts) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Study Time */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Study Time</span>
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5">
                    Today ▾
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {currentMetrics.study_hours > 0 ? currentMetrics.study_hours : "1.8"}
                </span>
                <span className="text-sm font-semibold text-slate-500 font-sans">hrs</span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>20%</span>
                  <span className="text-slate-400 font-normal">vs yesterday</span>
                </div>
                {/* Mini SVG Bars */}
                <div className="flex items-end gap-1 h-7">
                  {[28, 45, 60, 35, 75, 90, 65].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 rounded-t-sm bg-blue-400/80"
                    />
                  ))}
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
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5">
                    Today ▾
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {currentMetrics.questions_practiced > 0 ? currentMetrics.questions_practiced : "45"}
                </span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>12%</span>
                  <span className="text-slate-400 font-normal">vs yesterday</span>
                </div>
                {/* Mini SVG Bars */}
                <div className="flex items-end gap-1 h-7">
                  {[35, 50, 40, 70, 85, 95, 80].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 rounded-t-sm bg-purple-400/80"
                    />
                  ))}
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
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5">
                    Total ▾
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {currentMetrics.mock_tests_completed > 0 ? currentMetrics.mock_tests_completed : "7"}
                </span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>2</span>
                  <span className="text-slate-400 font-normal">this month</span>
                </div>
                {/* Mini SVG Bars */}
                <div className="flex items-end gap-1 h-7">
                  {[20, 30, 45, 60, 80, 90, 85].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 rounded-t-sm bg-amber-400/80"
                    />
                  ))}
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
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5">
                    Today ▾
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  78%
                </span>
              </div>

              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>8%</span>
                  <span className="text-slate-400 font-normal">vs last week</span>
                </div>
                {/* Mini SVG Bars */}
                <div className="flex items-end gap-1 h-7">
                  {[40, 55, 65, 80, 75, 85, 92].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 rounded-t-sm bg-teal-400/80"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ROW 2: (1) TODAY'S STUDY PLAN (2) OVERALL COURSE PROGRESS */}
          {/*        (3) WEEKLY PERFORMANCE COMBO CHART                 */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Today's Study Plan */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Today&apos;s Study Plan</h3>
                  </div>
                  <Link
                    href="/dashboard#planner"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    View Planner
                  </Link>
                </div>

                <div className="space-y-3">
                  {studyPlan.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleStudyPlan(task.id)}
                      className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <button className="mt-0.5 shrink-0 focus:outline-none">
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                        <div>
                          <h4
                            className={`text-xs font-bold ${
                              task.completed ? "text-slate-800 line-through opacity-75" : "text-slate-900"
                            }`}
                          >
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold shrink-0 ${
                          task.completed ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {task.completed ? `✔ ${task.duration}` : task.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Overall Course Progress */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Overall Course Progress</h3>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Circular Donut Graphic */}
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
                        strokeDashoffset={2 * Math.PI * 40 * (1 - 0.25)}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-900">25%</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-2 text-center">
                    1 of 4 topics completed
                  </span>
                </div>

                {/* Right Subject Breakdown Bars */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">General Studies & Odisha Special</span>
                      <span className="font-bold text-slate-900">25%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Quantitative Aptitude</span>
                      <span className="font-bold text-slate-900">10%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: "10%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Reasoning</span>
                      <span className="font-bold text-slate-900">0%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: "0%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">English</span>
                      <span className="font-bold text-slate-900">0%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: "0%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Weekly Performance (Combo Bar & Line Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Weekly Performance</h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5">
                  Last 7 Days ▾
                </span>
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

              {/* Combo Chart Visualization */}
              <div className="relative h-40 w-full mt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120">
                  {/* Grid Lines */}
                  <line x1="20" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="20" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="20" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="20" y1="110" x2="300" y2="110" stroke="#e2e8f0" />

                  {/* Left Axis Labels */}
                  <text x="5" y="24" fontSize="8" fill="#94a3b8">100</text>
                  <text x="9" y="54" fontSize="8" fill="#94a3b8">75</text>
                  <text x="9" y="84" fontSize="8" fill="#94a3b8">50</text>
                  <text x="14" y="112" fontSize="8" fill="#94a3b8">0</text>

                  {/* Right Axis Labels */}
                  <text x="303" y="24" fontSize="8" fill="#94a3b8">100%</text>
                  <text x="303" y="54" fontSize="8" fill="#94a3b8">75%</text>
                  <text x="303" y="112" fontSize="8" fill="#94a3b8">0%</text>

                  {/* Bars: Questions Attempted (x spacing: 40px) */}
                  {/* Oct 12 */}
                  <rect x="35" y="65" width="12" height="45" rx="2" fill="#bfdbfe" />
                  {/* Oct 13 */}
                  <rect x="75" y="55" width="12" height="55" rx="2" fill="#bfdbfe" />
                  {/* Oct 14 */}
                  <rect x="115" y="60" width="12" height="50" rx="2" fill="#bfdbfe" />
                  {/* Oct 15 */}
                  <rect x="155" y="48" width="12" height="62" rx="2" fill="#bfdbfe" />
                  {/* Oct 16 */}
                  <rect x="195" y="62" width="12" height="48" rx="2" fill="#bfdbfe" />
                  {/* Oct 17 */}
                  <rect x="235" y="45" width="12" height="65" rx="2" fill="#bfdbfe" />
                  {/* Oct 18 */}
                  <rect x="275" y="40" width="12" height="70" rx="2" fill="#bfdbfe" />

                  {/* Overlaid Line Graph: Accuracy trend */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    points="41,52 81,48 121,50 161,46 201,52 241,44 281,41"
                  />

                  {/* Dots for Accuracy points */}
                  <circle cx="41" cy="52" r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="81" cy="48" r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="121" cy="50" r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="161" cy="46" r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="201" cy="52" r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="241" cy="44" r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="281" cy="41" r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                </svg>

                {/* X-Axis Dates */}
                <div className="flex justify-between text-[9px] text-slate-400 px-6 mt-1">
                  <span>Oct 12</span>
                  <span>Oct 13</span>
                  <span>Oct 14</span>
                  <span>Oct 15</span>
                  <span>Oct 16</span>
                  <span>Oct 17</span>
                  <span>Oct 18</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ROW 3: (1) SUBJECT-WISE PROGRESS (2) RECOMMENDED FOR YOU  */}
          {/*        (3) THREE STACKED WIDGETS (Upcoming, Streak, Feed) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Subject-wise Progress */}
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

              <div className="space-y-4">
                {/* Subject 1 */}
                <Link
                  href={`/syllabus${courseQueryParam}&subject=gs`}
                  className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <h4 className="font-bold text-slate-900 truncate">General Studies & Odisha Special</h4>
                      <span className="font-semibold text-slate-600">25%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 block">1/4 topics</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                </Link>

                {/* Subject 2 */}
                <Link
                  href={`/syllabus${courseQueryParam}&subject=quant`}
                  className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <h4 className="font-bold text-slate-900 truncate">Quantitative Aptitude</h4>
                      <span className="font-semibold text-slate-600">10%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: "10%" }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 block">1/10 topics</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                </Link>

                {/* Subject 3 */}
                <Link
                  href={`/syllabus${courseQueryParam}&subject=reasoning`}
                  className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <h4 className="font-bold text-slate-900 truncate">Reasoning</h4>
                      <span className="font-semibold text-slate-600">0%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: "0%" }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 block">0/8 topics</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                </Link>

                {/* Subject 4 */}
                <Link
                  href={`/syllabus${courseQueryParam}&subject=english`}
                  className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <h4 className="font-bold text-slate-900 truncate">English</h4>
                      <span className="font-semibold text-slate-600">0%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: "0%" }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 block">0/6 topics</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                </Link>
              </div>
            </div>

            {/* 2. Recommended for You */}
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
                      <p className="text-[11px] text-slate-500">20 questions • Mixed topics</p>
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
                      <p className="text-[11px] text-slate-500">Based on your performance</p>
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
                      <p className="text-[11px] text-slate-500">OSSC CGL • Topic-wise</p>
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
              {/* Widget A: Upcoming Exam */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">Upcoming Exam</h3>
                  </div>
                  <Link
                    href="/exams"
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
                      <h4 className="text-xs font-bold text-slate-900">OSSC CGL 2024</h4>
                      <p className="text-[10px] text-slate-400">Expected Exam Date</p>
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

              {/* Widget B: Study Streak */}
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
                    <span className="text-[11px] text-slate-400 font-normal">Keep it up!</span>
                  </div>

                  {/* Day Dots: M T W T F S S */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { day: "M", active: true },
                      { day: "T", active: false },
                      { day: "W", active: false },
                      { day: "T", active: false },
                      { day: "F", active: false },
                      { day: "S", active: false },
                      { day: "S", active: false },
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

              {/* Widget C: Recent Activity Feed */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900">Recent Activity</h3>
                  </div>
                  <Link
                    href="/dashboard#activity"
                    className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {/* Activity 1 */}
                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw className="w-2.5 h-2.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-[11px] truncate">
                        Changed Target Examination
                      </p>
                      <p className="text-[10px] text-slate-400">2 hours ago</p>
                    </div>
                  </div>

                  {/* Activity 2 */}
                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-[11px] truncate">
                        Completed Indian Polity notes
                      </p>
                      <p className="text-[10px] text-slate-400">5 hours ago</p>
                    </div>
                  </div>

                  {/* Activity 3 */}
                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Target className="w-2.5 h-2.5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-[11px] truncate">
                        Attempted Daily Quiz (Score: 78%)
                      </p>
                      <p className="text-[10px] text-slate-400">8 hours ago</p>
                    </div>
                  </div>
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
    </div>
  );
};
