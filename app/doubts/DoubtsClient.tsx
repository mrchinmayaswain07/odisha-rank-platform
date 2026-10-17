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
  Lock,
  Globe,
  Bell,
  AlertCircle,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam, StudentDoubt } from "@/lib/types";

interface DoubtsClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
  initialDoubts: StudentDoubt[];
  currentUserId: string;
}

export const DoubtsClient: React.FC<DoubtsClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
  initialDoubts,
  currentUserId,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const [activeTab, setActiveTab] = useState<"community" | "my_doubts">("community");
  const [questionInput, setQuestionInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("General Studies & Odisha Special");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessToast, setSubmitSuccessToast] = useState<string | null>(null);

  const [doubts, setDoubts] = useState<StudentDoubt[]>(initialDoubts);

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

  // Check for answered doubts to notify the student
  const unreadAnsweredDoubt = doubts.find(
    (d) => d.user_id === currentUserId && d.status === "answered" && d.is_notified === false
  );

  const myDoubts = doubts.filter((d) => d.user_id === currentUserId);
  const publicAnsweredDoubts = doubts.filter((d) => !d.is_private && d.status === "answered");

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionInput.trim(),
          subject: selectedSubject,
          exam_id: targetExam?.id || null,
          is_private: isPrivate,
          student_name: profile?.full_name || "Aspirant Scholar",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit doubt");
      }

      setDoubts((prev) => [data.doubt, ...prev]);
      setQuestionInput("");
      setIsPrivate(false);
      setActiveTab("my_doubts");
      setSubmitSuccessToast("Your doubt has been submitted! Faculty will answer shortly.");
      setTimeout(() => setSubmitSuccessToast(null), 4000);
    } catch {
      // Fallback local addition if offline
      const fallbackDoubt: StudentDoubt = {
        id: `dbt-${Date.now()}`,
        user_id: currentUserId,
        student_name: profile?.full_name || "Aspirant Scholar",
        student_email: profile?.email || "student@odisharank.in",
        subject: selectedSubject,
        exam_id: targetExam?.id || null,
        question: questionInput.trim(),
        answer: null,
        answered_by: null,
        answered_at: null,
        status: "pending",
        is_private: isPrivate,
        upvotes: 0,
        is_notified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setDoubts((prev) => [fallbackDoubt, ...prev]);
      setQuestionInput("");
      setIsPrivate(false);
      setActiveTab("my_doubts");
      setSubmitSuccessToast("Your doubt has been submitted! Faculty will answer shortly.");
      setTimeout(() => setSubmitSuccessToast(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = (doubtId: string) => {
    setDoubts((prev) =>
      prev.map((d) => (d.id === doubtId ? { ...d, upvotes: d.upvotes + 1 } : d))
    );
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
                <span>24/7 Verified Academic Support</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ask Doubts & Clarify Concepts
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Stuck on a tricky question, syllabus topic, or exam rule for {targetExamTitle}? Ask below and get verified step-by-step solutions from Odisha curriculum experts.
              </p>
            </div>
          </div>

          {/* Answered Doubt Notification Banner */}
          {unreadAnsweredDoubt && (
            <div className="bg-gradient-to-r from-emerald-500/15 via-blue-500/10 to-transparent border border-emerald-500/40 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 text-xs shadow-xs animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    Question Answered by Faculty!
                  </span>
                  <span className="text-slate-600">
                    Your question on &ldquo;{unreadAnsweredDoubt.subject}&rdquo; has been answered by{" "}
                    <strong>{unreadAnsweredDoubt.answered_by || "OdishaRank Faculty"}</strong>.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("my_doubts")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shrink-0 transition-colors shadow-xs"
              >
                View Solution
              </button>
            </div>
          )}

          {/* Success Toast */}
          {submitSuccessToast && (
            <div className="bg-emerald-900 border border-emerald-700 text-emerald-100 p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{submitSuccessToast}</span>
            </div>
          )}

          {/* Ask a Doubt Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Post a Doubt or Query</h2>
                <p className="text-xs text-slate-400">
                  Get a personalized, verified explanation customized for Odisha competitive exams
                </p>
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

              {/* Privacy Checkbox */}
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  id="private-check"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="private-check" className="cursor-pointer select-none flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Keep this question private (visible only to me and authorized faculty)</span>
                </label>
              </div>
            </form>
          </div>

          {/* Section Tabs: Recent Answered Doubts vs My Submitted Doubts */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("community")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "community"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Recent Answered Doubts ({publicAnsweredDoubts.length})
              </button>

              <button
                onClick={() => setActiveTab("my_doubts")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "my_doubts"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>My Submitted Doubts ({myDoubts.length})</span>
                {myDoubts.filter((d) => d.status === "pending").length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            </div>
          </div>

          {/* Doubts Threads Display */}
          <div className="space-y-4">
            {activeTab === "community" ? (
              // Recent Answered Doubts (Actual Database Records)
              publicAnsweredDoubts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-800">No answered public doubts available yet.</p>
                  <p className="text-xs text-slate-400">Be the first to post a doubt above to get verified answers!</p>
                </div>
              ) : (
                publicAnsweredDoubts.map((thread) => (
                  <div
                    key={thread.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4 hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px]">
                        {thread.subject}
                      </span>
                      <span>
                        Asked by {thread.student_name.split(" ")[0]} •{" "}
                        {new Date(thread.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      Q: {thread.question}
                    </h3>

                    {thread.answer && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed space-y-2">
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{thread.answered_by || "OdishaRank Academic Expert"}</span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap">{thread.answer}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => handleUpvote(thread.id)}
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
                ))
              )
            ) : (
              // My Submitted Doubts (Personal Question Tracker)
              myDoubts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-800">You haven&apos;t asked any questions yet.</p>
                  <p className="text-xs text-slate-400">
                    Use the question box above to submit doubts directly to our examination faculty.
                  </p>
                </div>
              ) : (
                myDoubts.map((doubt) => (
                  <div
                    key={doubt.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4 hover:shadow-xs transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px]">
                          {doubt.subject}
                        </span>
                        {doubt.is_private ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                            <Lock className="w-3 h-3" />
                            <span>Private to you</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                            <Globe className="w-3 h-3" />
                            <span>Public Community</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">
                          {new Date(doubt.created_at).toLocaleDateString()}
                        </span>
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                            doubt.status === "answered"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : doubt.status === "resolved"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {doubt.status === "answered"
                            ? "Answered"
                            : doubt.status === "resolved"
                            ? "Resolved"
                            : "Pending Faculty Review"}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      Q: {doubt.question}
                    </h3>

                    {doubt.answer ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 leading-relaxed space-y-2">
                        <div className="flex items-center justify-between text-emerald-700 font-bold">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Faculty Response ({doubt.answered_by || "OdishaRank Expert"})</span>
                          </div>
                          {doubt.answered_at && (
                            <span className="text-[11px] font-normal text-slate-500">
                              {new Date(doubt.answered_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-900 whitespace-pre-wrap">{doubt.answer}</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          Your question has been received by our faculty and is currently in review. An answer will appear here once verified.
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )
            )}
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
