"use client";

import React, { useState, useEffect } from "react";
import { StudentDoubt, DoubtStatus, Exam, Subject } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  User,
  Shield,
  Eye,
  Edit3,
  X,
  AlertCircle,
  HelpCircle,
  Lock,
  Globe,
  RefreshCw,
} from "lucide-react";

interface StudentQuestionsManagerProps {
  initialDoubts: StudentDoubt[];
  exams: Exam[];
  subjects: Subject[];
}

export const StudentQuestionsManager: React.FC<StudentQuestionsManagerProps> = ({
  initialDoubts,
  exams,
  subjects,
}) => {
  const [doubts, setDoubts] = useState<StudentDoubt[]>(initialDoubts);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync latest doubts from server on mount and regularly
  const fetchLatestDoubts = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/admin/doubts");
      if (res.ok) {
        const data = await res.json();
        if (data.doubts && Array.isArray(data.doubts)) {
          setDoubts(data.doubts);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLatestDoubts();
    const interval = setInterval(fetchLatestDoubts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Answering Modal State
  const [activeDoubt, setActiveDoubt] = useState<StudentDoubt | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [facultyName, setFacultyName] = useState("OdishaRank Academic Expert");
  const [answerStatus, setAnswerStatus] = useState<DoubtStatus>("answered");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered doubts
  const filteredDoubts = doubts.filter((d) => {
    if (selectedStatus !== "all" && d.status !== selectedStatus) return false;
    if (selectedSubject !== "all" && d.subject !== selectedSubject) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchQuestion = d.question.toLowerCase().includes(q);
      const matchStudent = d.student_name.toLowerCase().includes(q);
      const matchEmail = (d.student_email || "").toLowerCase().includes(q);
      const matchAnswer = (d.answer || "").toLowerCase().includes(q);
      if (!matchQuestion && !matchStudent && !matchEmail && !matchAnswer) return false;
    }
    return true;
  });

  const pendingCount = doubts.filter((d) => d.status === "pending").length;
  const answeredCount = doubts.filter((d) => d.status === "answered").length;
  const resolvedCount = doubts.filter((d) => d.status === "resolved").length;

  const handleOpenAnswerModal = (doubt: StudentDoubt) => {
    setActiveDoubt(doubt);
    setAnswerText(doubt.answer || "");
    setFacultyName(doubt.answered_by || "OdishaRank Academic Expert");
    setAnswerStatus(doubt.status === "pending" ? "answered" : doubt.status);
    setSubmitError(null);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoubt) return;
    if (!answerText.trim()) {
      setSubmitError("Answer text cannot be blank.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/admin/doubts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeDoubt.id,
          answer: answerText.trim(),
          answered_by: facultyName.trim() || "OdishaRank Academic Expert",
          status: answerStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update answer");
      }

      // Update local doubts list
      setDoubts((prev) =>
        prev.map((d) => (d.id === activeDoubt.id ? data.doubt : d))
      );

      showToast(`Answer submitted and student notified successfully!`);
      setActiveDoubt(null);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to save answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (doubt: StudentDoubt, newStatus: DoubtStatus) => {
    try {
      const res = await fetch("/api/admin/doubts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doubt.id,
          answer: doubt.answer || "",
          answered_by: doubt.answered_by || "OdishaRank Academic Expert",
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDoubts((prev) =>
          prev.map((d) => (d.id === doubt.id ? data.doubt : d))
        );
        showToast(`Status updated to "${newStatus}"`);
      }
    } catch {
      // offline error
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedStatus("all")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === "all"
              ? "bg-slate-800/90 border-blue-500 shadow-md"
              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-xs text-slate-400 font-semibold">Total Doubts</div>
          <div className="text-2xl font-black text-white mt-1">{doubts.length}</div>
        </div>

        <div
          onClick={() => setSelectedStatus("pending")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === "pending"
              ? "bg-amber-950/40 border-amber-500 shadow-md"
              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-xs text-amber-400 font-semibold flex items-center justify-between">
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</div>
        </div>

        <div
          onClick={() => setSelectedStatus("answered")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === "answered"
              ? "bg-emerald-950/40 border-emerald-500 shadow-md"
              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-xs text-emerald-400 font-semibold">Answered</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{answeredCount}</div>
        </div>

        <div
          onClick={() => setSelectedStatus("resolved")}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === "resolved"
              ? "bg-blue-950/40 border-blue-500 shadow-md"
              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="text-xs text-blue-400 font-semibold">Resolved</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-950 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doubts or student name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects</option>
            <option value="General Studies & Odisha Special">General Studies & Odisha Special</option>
            <option value="Arithmetic & Quantitative Aptitude">Arithmetic & Quantitative Aptitude</option>
            <option value="Logical Reasoning">Logical Reasoning</option>
            <option value="Computer Awareness">Computer Awareness</option>
            <option value="Exam Pattern & Scheme">Exam Pattern & Scheme</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredDoubts.length} of {doubts.length} student questions
        </div>
      </Card>

      {/* Student Questions List */}
      <div className="space-y-4">
        {filteredDoubts.length === 0 ? (
          <Card className="p-12 text-center bg-slate-950 border-slate-800 text-slate-500 space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No student doubts found matching filters.</p>
            <p className="text-xs text-slate-500">Try adjusting status, subject, or search term.</p>
          </Card>
        ) : (
          filteredDoubts.map((doubt) => (
            <Card
              key={doubt.id}
              className={`p-5 sm:p-6 bg-slate-950 border transition-all ${
                doubt.status === "pending"
                  ? "border-amber-500/40 bg-gradient-to-r from-amber-950/10 to-slate-950"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                {/* Student Details */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                    {doubt.student_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{doubt.student_name}</span>
                      {doubt.is_private ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Private</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Public</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{doubt.student_email || "Verified Student"}</span>
                      <span>•</span>
                      <span className="text-slate-500">
                        {new Date(doubt.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges & Status */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    {doubt.subject}
                  </span>

                  <Badge
                    variant={
                      doubt.status === "answered"
                        ? "emerald"
                        : doubt.status === "resolved"
                        ? "blue"
                        : "amber"
                    }
                    size="sm"
                  >
                    {doubt.status === "pending"
                      ? "Pending Review"
                      : doubt.status === "answered"
                      ? "Answered"
                      : "Resolved"}
                  </Badge>
                </div>
              </div>

              {/* Question Body */}
              <div className="py-4 space-y-2">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Student Query</span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                  {doubt.question}
                </p>
              </div>

              {/* Existing Answer if present */}
              {doubt.answer && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2 my-2">
                  <div className="flex items-center justify-between text-blue-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{doubt.answered_by || "OdishaRank Faculty"}</span>
                    </div>
                    {doubt.answered_at && (
                      <span className="text-[11px] text-slate-500 font-normal">
                        Answered on {new Date(doubt.answered_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap">{doubt.answer}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs">
                <div className="flex items-center gap-2">
                  {doubt.status === "pending" ? (
                    <span className="text-amber-400 text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Awaiting Faculty Answer</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleQuickStatusChange(
                            doubt,
                            doubt.status === "resolved" ? "answered" : "resolved"
                          )
                        }
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Mark as {doubt.status === "resolved" ? "Answered" : "Resolved"}
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => handleOpenAnswerModal(doubt)}
                  className={
                    doubt.status === "pending"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  <span>{doubt.answer ? "Edit Faculty Answer" : "Answer Student Question"}</span>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Answer Modal */}
      {activeDoubt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl relative space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Answer Student Question</h3>
                  <p className="text-xs text-slate-400">
                    Response will appear instantly in {activeDoubt.student_name}&apos;s Doubts dashboard
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveDoubt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Details Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-blue-400">{activeDoubt.student_name}</span>
                <span>{activeDoubt.subject}</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">{activeDoubt.question}</p>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Answer Form */}
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Faculty Solution & Explanation (Markdown supported) *
                </label>
                <textarea
                  rows={5}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Provide a clear, accurate, step-by-step solution tailored for Odisha competitive exams..."
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Faculty Title / Designee
                  </label>
                  <input
                    type="text"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Updated Question Status
                  </label>
                  <select
                    value={answerStatus}
                    onChange={(e) => setAnswerStatus(e.target.value as DoubtStatus)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="answered">Answered (Visible to student)</option>
                    <option value="resolved">Resolved (Completed query)</option>
                    <option value="pending">Pending Further Review</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDoubt(null)}
                  className="border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !answerText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Answer & Notify"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
