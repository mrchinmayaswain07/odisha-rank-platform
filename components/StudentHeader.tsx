"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Timer,
  Bell,
  Menu,
  User,
  ShieldCheck,
  LogOut,
  GraduationCap,
  BookOpen,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "./NotificationBell";

interface StudentHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenTimer: () => void;
  onOpenCourseModal?: () => void;
  studentName?: string;
  initials?: string;
  isUserAdmin?: boolean;
  email?: string | null;
  allExams?: Array<{ id: string; title: string; conducting_body: string; slug: string }>;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  onOpenMobileMenu,
  onOpenTimer,
  onOpenCourseModal,
  studentName = "Student",
  initials = "OS",
  isUserAdmin = false,
  email = null,
  allExams = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{ title: string; subtitle: string; href: string; type: string }> = [];

    allExams.forEach((ex) => {
      if (
        ex.title.toLowerCase().includes(q) ||
        ex.conducting_body.toLowerCase().includes(q)
      ) {
        results.push({
          title: ex.title,
          subtitle: `${ex.conducting_body} • Official Exam`,
          href: `/exams/${ex.slug}`,
          type: "exam",
        });
      }
    });

    const common = [
      { title: "General Studies & Odisha Special", subtitle: "Official Syllabus Notes", href: "/syllabus", type: "subject" },
      { title: "Quantitative Aptitude & Arithmetic", subtitle: "200+ Practice MCQs", href: "/questions", type: "practice" },
      { title: "Odisha Current Affairs Digest", subtitle: "Study Material PDF", href: "/materials", type: "material" },
      { title: "Full Length Mock Test 1", subtitle: "Timed Simulation", href: "/mock-tests", type: "mock" },
    ];

    common.forEach((c) => {
      if (c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)) {
        results.push(c);
      }
    });

    return results.slice(0, 5);
  }, [searchQuery, allExams]);

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
    <header className="h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Menu Toggle + Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Live Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, questions, materials, or mock tests..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          {/* Search Dropdown */}
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
                      ) : (
                        <BookOpen className="w-3.5 h-3.5" />
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

      {/* Right: Stopwatch Trigger Pill + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
        {/* Stopwatch / Focus Timer Button */}
        <button
          onClick={onOpenTimer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200/70 shadow-2xs"
          title="Open Study Stopwatch & Pomodoro Timer"
        >
          <Timer className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Stopwatch</span>
        </button>

        {/* Live Dynamic Notification Bell */}
        <NotificationBell />

        {/* Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1e3a8a] text-white font-bold text-xs flex items-center justify-center shadow-xs">
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
                <p className="text-slate-400 text-[11px] truncate">
                  {email || "student@odisharank.in"}
                </p>
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

              {onOpenCourseModal && (
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenCourseModal();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-left"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Switch Target Course</span>
                </button>
              )}

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
