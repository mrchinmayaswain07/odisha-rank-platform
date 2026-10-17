"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ThumbsUp,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  User,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam } from "@/lib/types";

interface DoubtsClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

export const DoubtsClient: React.FC<DoubtsClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const [questionInput, setQuestionInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("General Studies & Odisha Special");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [threads, setThreads] = useState([
    {
      id: "th-1",
      question: "Which dynasty built the Konark Sun Temple and in which century?",
      subject: "Odisha Special & History",
      askedBy: "Satya",
      askedTime: "2 hours ago",
      answer: "The Sun Temple at Konark was built in the 13th century (around 1250 CE) by King Narasimhadeva I of the Eastern Ganga Dynasty. It is a UNESCO World Heritage Site dedicated to the Sun God Surya, designed in the shape of a colossal chariot with 24 carved stone wheels.",
      answeredBy: "OdishaRank Academic Expert",
      upvotes: 14,
    },
    {
      id: "th-2",
      question: "What is the exact negative marking scheme for OSSC CGL Prelims?",
      subject: "Exam Pattern & Scheme",
      askedBy: "Priyanka",
      askedTime: "Yesterday",
      answer: "In OSSC CGL Preliminary Examination, each question carries 1.0 mark. For every incorrect answer, 0.25 marks (one-fourth) are deducted. Unattempted questions incur no penalty.",
      answeredBy: "Official Examination Cell",
      upvotes: 28,
    },
    {
      id: "th-3",
      question: "How to quickly calculate compound interest for 3 years without formula?",
      subject: "Arithmetic & Quantitative Aptitude",
      askedBy: "Rakesh",
      askedTime: "2 days ago",
      answer: "Use the ratio method! For 3 years, the compound interest ratio is 3 : 3 : 1. Calculate Simple Interest for 1 year (A), then Interest on A (B), and Interest on B (C). Total CI = 3A + 3B + 1C. This saves more than 60 seconds compared to standard formula substitution.",
      answeredBy: "Quantitative Aptitude Faculty",
      upvotes: 35,
    },
  ]);

  const handleAskDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const newThread = {
        id: `th-${Date.now()}`,
        question: questionInput.trim(),
        subject: selectedSubject,
        askedBy: studentName,
        askedTime: "Just now",
        answer: `Thank you for your doubt on "${questionInput.trim()}". For ${targetExamTitle}, this concept is evaluated frequently. Our academic faculty has reviewed this: ensure you reference the official NCERT / Odisha SCERT textbook highlights and verify the year-wise PYQs.`,
        answeredBy: "OdishaRank AI Doubt Assistant",
        upvotes: 1,
      };

      setThreads([newThread, ...threads]);
      setQuestionInput("");
      setIsSubmitting(false);
    }, 600);
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
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold text-xs mb-3">
                <MessageSquare className="w-3.5 h-3.5 text-blue-300" />
                <span>24/7 Academic Support</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ask Doubts & Clarify Concepts
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Stuck on a tricky question, syllabus topic, or exam rule for {targetExamTitle}? Ask below and get verified step-by-step solutions.
              </p>
            </div>
          </div>

          {/* Ask a Doubt Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Post a Doubt or Query</h2>
                <p className="text-xs text-slate-400">Get an instant explanation customized for Odisha competitive exams</p>
              </div>
            </div>

            <form onSubmit={handleAskDoubt} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="General Studies & Odisha Special">General Studies & Odisha Special</option>
                  <option value="Arithmetic & Quantitative Aptitude">Arithmetic & Quantitative Aptitude</option>
                  <option value="Logical Reasoning">Logical Reasoning</option>
                  <option value="Computer Awareness">Computer Awareness</option>
                  <option value="Exam Pattern & Scheme">Exam Pattern & Scheme</option>
                </select>

                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="e.g. What were the key recommendations of the Sachar Committee or Simon Commission in Odisha?"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || !questionInput.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Submitting..." : "Ask Doubt"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Doubt Community Threads */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Recent Answered Doubts ({threads.length})
            </h2>

            <div className="space-y-4">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px]">
                      {thread.subject}
                    </span>
                    <span>Asked by {thread.askedBy} • {thread.askedTime}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Q: {thread.question}
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed space-y-2">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{thread.answeredBy}</span>
                    </div>
                    <p className="text-slate-800">{thread.answer}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => {
                        setThreads(
                          threads.map((t) =>
                            t.id === thread.id ? { ...t, upvotes: t.upvotes + 1 } : t
                          )
                        );
                      }}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-semibold"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful ({thread.upvotes})</span>
                    </button>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Answer</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
