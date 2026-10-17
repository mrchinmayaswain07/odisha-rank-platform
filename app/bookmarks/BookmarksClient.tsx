"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  HelpCircle,
  BookOpen,
  Trash2,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Search,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam } from "@/lib/types";

interface BookmarksClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

export const BookmarksClient: React.FC<BookmarksClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "notes">("questions");
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

  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([
    {
      id: "bm-q1",
      questionText: "Who among the following was the founder of the Somavamshi dynasty in Odisha?",
      subject: "General Studies & Odisha Special",
      difficulty: "Medium",
      options: ["Janmejaya I", "Yayati I", "Bhimaratha", "Dharmaratha"],
      correctAnswer: "Janmejaya I",
      explanation: "Janmejaya I (Mahasivagupta I) established the Somavamshi dynasty in South Kosala and extended rule over Utkala.",
      savedDate: "Yesterday",
    },
    {
      id: "bm-q2",
      questionText: "A boat travels 24 km upstream in 6 hours and 28 km downstream in 4 hours. What is the speed of the current?",
      subject: "Arithmetic & Quantitative Aptitude",
      difficulty: "Hard",
      options: ["1.5 km/h", "2 km/h", "2.5 km/h", "3 km/h"],
      correctAnswer: "1.5 km/h",
      explanation: "Upstream speed = 24/6 = 4 km/h. Downstream speed = 28/4 = 7 km/h. Speed of current = (7 - 4)/2 = 1.5 km/h.",
      savedDate: "2 days ago",
    },
    {
      id: "bm-q3",
      questionText: "Under which Article of the Constitution of India is the Governor of a State appointed by the President?",
      subject: "Indian Polity",
      difficulty: "Easy",
      options: ["Article 153", "Article 155", "Article 156", "Article 161"],
      correctAnswer: "Article 155",
      explanation: "Article 155 states that the Governor of a State shall be appointed by the President by warrant under his hand and seal.",
      savedDate: "3 days ago",
    },
  ]);

  const [bookmarkedNotes, setBookmarkedNotes] = useState([
    {
      id: "bm-n1",
      title: "Paika Rebellion of 1817 - Causes and Key Personalities",
      subject: "Odisha History",
      snippet: "Bakshi Jagabandhu led the armed rebellion against British East India Company extortionate land revenue policies in Khurda.",
      href: "/syllabus",
      savedDate: "Yesterday",
    },
    {
      id: "bm-n2",
      title: "Vedic Math Multiplication Shortcuts for 2-digit and 3-digit numbers",
      subject: "Quantitative Aptitude",
      snippet: "Urdhva-Tiryakbhyam cross-multiplication technique saves up to 40 seconds per question in competitive prelims.",
      href: "/materials",
      savedDate: "4 days ago",
    },
  ]);

  const handleRemoveQuestion = (id: string) => {
    setBookmarkedQuestions(bookmarkedQuestions.filter((q) => q.id !== id));
  };

  const handleRemoveNote = (id: string) => {
    setBookmarkedNotes(bookmarkedNotes.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
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
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold text-xs mb-3">
                <Bookmark className="w-3.5 h-3.5 text-blue-300" />
                <span>Personal Revision Bank</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Saved Bookmarks & Challenging Questions
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Review questions you bookmarked during practice or mock tests. Regular revision of tricky concepts boosts accuracy on exam day.
              </p>
            </div>

            <Link
              href="/questions"
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Practice Bookmarked MCQs</span>
            </Link>
          </div>

          {/* Tab Filter */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => setActiveTab("questions")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "questions"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Bookmarked MCQs ({bookmarkedQuestions.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "notes"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Saved Notes ({bookmarkedNotes.length})</span>
              </button>
            </div>
          </div>

          {/* Bookmarked Questions List */}
          {activeTab === "questions" && (
            <div className="space-y-4">
              {bookmarkedQuestions.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
                  <Bookmark className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No bookmarked questions yet</p>
                  <p className="text-xs text-slate-400">
                    Bookmark challenging questions while solving MCQs to review them here.
                  </p>
                </div>
              ) : (
                bookmarkedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                          {q.subject}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {q.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {q.questionText}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl text-xs font-semibold border ${
                            opt === q.correctAnswer
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
                      <strong className="font-bold">Explanation: </strong>
                      {q.explanation}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Bookmarked Notes List */}
          {activeTab === "notes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarkedNotes.map((n) => (
                <div
                  key={n.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                        {n.subject}
                      </span>
                      <button
                        onClick={() => handleRemoveNote(n.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{n.snippet}</p>
                  </div>

                  <Link
                    href={n.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline pt-2 border-t border-slate-100"
                  >
                    <span>Read Topic in Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
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
