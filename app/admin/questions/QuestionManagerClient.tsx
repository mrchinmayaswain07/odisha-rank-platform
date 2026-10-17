"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Question, Subject, Exam, PaginatedResult, ContentStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  HelpCircle,
  Plus,
  Upload,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { StudentDoubt } from "@/lib/types";
import { StudentQuestionsManager } from "./StudentQuestionsManager";

interface QuestionManagerClientProps {
  initialResult: PaginatedResult<Question>;
  exams: Exam[];
  subjects: Subject[];
  initialDoubts?: StudentDoubt[];
  initialTab?: "mcqs" | "doubts";
}

export const QuestionManagerClient: React.FC<QuestionManagerClientProps> = ({
  initialResult,
  exams,
  subjects,
  initialDoubts = [],
  initialTab = "mcqs",
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"mcqs" | "doubts">(initialTab);
  const [result, setResult] = useState<PaginatedResult<Question>>(initialResult);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Single Question Form State
  const [formExamId, setFormExamId] = useState(exams[0]?.id || "");
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || "");
  const [formText, setFormText] = useState("");
  const [formOptions, setFormOptions] = useState<string[]>(["", "", "", ""]);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formExplanation, setFormExplanation] = useState("");
  const [formDifficulty, setFormDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [formMarks, setFormMarks] = useState(1.0);
  const [formNegativeMarks, setFormNegativeMarks] = useState(0.25);
  const [formStatus, setFormStatus] = useState<ContentStatus>("published");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Import State
  const [csvContent, setCsvContent] = useState("");
  const [bulkExamId, setBulkExamId] = useState(exams[0]?.id || "");
  const [bulkSubjectId, setBulkSubjectId] = useState(subjects[0]?.id || "");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ count?: number; error?: string } | null>(null);

  const fetchQuestions = async (page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "10");
      if (search.trim()) params.set("search", search.trim());
      if (selectedExamId !== "all") params.set("examId", selectedExamId);
      if (selectedSubjectId !== "all") params.set("subjectId", selectedSubjectId);
      if (selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
      if (selectedStatus !== "all") params.set("status", selectedStatus);

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions(1);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormExamId(exams[0]?.id || "");
    setFormSubjectId(subjects[0]?.id || "");
    setFormText("");
    setFormOptions(["", "", "", ""]);
    setFormCorrectIndex(0);
    setFormExplanation("");
    setFormDifficulty("medium");
    setFormMarks(1.0);
    setFormNegativeMarks(0.25);
    setFormStatus("published");
    setFormError(null);
    setShowQuestionModal(true);
  };

  const openEditModal = (q: Question) => {
    setIsEditing(true);
    setEditId(q.id);
    setFormExamId(q.exam_id || exams[0]?.id || "");
    setFormSubjectId(q.subject_id || subjects[0]?.id || "");
    setFormText(q.question_text);
    setFormOptions(q.options.length === 4 ? [...q.options] : ["", "", "", ""]);
    setFormCorrectIndex(q.correct_option_index);
    setFormExplanation(q.explanation || "");
    setFormDifficulty(q.difficulty);
    setFormMarks(q.marks || 1.0);
    setFormNegativeMarks(q.negative_marks || 0.25);
    setFormStatus(q.status || "published");
    setFormError(null);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim() || formOptions.some((opt) => !opt.trim())) {
      setFormError("Question text and all 4 options are required.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const payload = {
        exam_id: formExamId,
        subject_id: formSubjectId,
        question_text: formText.trim(),
        options: formOptions.map((o) => o.trim()),
        correct_option_index: Number(formCorrectIndex),
        explanation: formExplanation.trim() || null,
        difficulty: formDifficulty,
        marks: Number(formMarks),
        negative_marks: Number(formNegativeMarks),
        status: formStatus,
      };

      const endpoint = "/api/admin/questions";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save question");

      setShowQuestionModal(false);
      fetchQuestions(currentPage);
    } catch (err: any) {
      setFormError(err.message || "Failed to save question");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchQuestions(currentPage);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkImport = async () => {
    if (!csvContent.trim()) {
      setImportStatus({ error: "Please enter or paste CSV formatted questions." });
      return;
    }

    try {
      setIsImporting(true);
      setImportStatus(null);

      // Parse CSV lines
      const lines = csvContent
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const parsedQuestions: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        // Skip header line if present
        if (i === 0 && lines[i].toLowerCase().includes("question_text")) continue;

        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length >= 6) {
          const [qText, optA, optB, optC, optD, corrIdx, diff, exp] = cols;
          parsedQuestions.push({
            exam_id: bulkExamId,
            subject_id: bulkSubjectId,
            question_text: qText,
            options: [optA, optB, optC, optD],
            correct_option_index: Number(corrIdx) || 0,
            difficulty: (diff as any) || "medium",
            explanation: exp || null,
            marks: 1.0,
            negative_marks: 0.25,
            status: "published",
          });
        }
      }

      if (parsedQuestions.length === 0) {
        setImportStatus({ error: "No valid question rows found in the CSV text." });
        return;
      }

      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulk: true,
          questions: parsedQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk import failed");

      setImportStatus({ count: data.count });
      setCsvContent("");
      fetchQuestions(1);
    } catch (err: any) {
      setImportStatus({ error: err.message || "Failed to process bulk import" });
    } finally {
      setIsImporting(false);
    }
  };

  const pendingDoubtsCount = initialDoubts.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Nav Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("mcqs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "mcqs"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Curated MCQ Question Bank</span>
        </button>

        <button
          onClick={() => setActiveTab("doubts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "doubts"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Student Questions & Doubts</span>
          {pendingDoubtsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse">
              {pendingDoubtsCount} Pending
            </span>
          )}
        </button>
      </div>

      {activeTab === "doubts" ? (
        <StudentQuestionsManager
          initialDoubts={initialDoubts}
          exams={exams}
          subjects={subjects}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-amber-500" />
                <span>Question Bank Management</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Curate MCQs with server-side validation, marks & negative marking, options, explanations, and bulk CSV ingestion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setImportStatus(null);
                  setShowBulkModal(true);
                }}
                variant="outline"
                size="sm"
                className="gap-1.5 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Bulk CSV Import</span>
              </Button>

              <Button onClick={openAddModal} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Add Single MCQ</span>
              </Button>
            </div>
          </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-950 border-slate-800">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search questions by text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Exams</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.conducting_body}
              </option>
            ))}
          </select>

          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <Button type="submit" size="sm" variant="primary" className="text-xs">
            Apply Filters
          </Button>
        </form>
      </Card>

      {/* Questions Table */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-1/2">Question Text</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Marks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {result.data.map((q) => {
                const sub = subjects.find((s) => s.id === q.subject_id);
                return (
                  <tr key={q.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-white line-clamp-2">{q.question_text}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                        <span>4 Options</span>
                        <span>&bull;</span>
                        <span className="text-emerald-400 font-bold">
                          Ans: Option {String.fromCharCode(65 + q.correct_option_index)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-semibold">{sub?.name || "General"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          q.difficulty === "easy"
                            ? "emerald"
                            : q.difficulty === "medium"
                            ? "blue"
                            : "rose"
                        }
                        size="sm"
                        className="capitalize"
                      >
                        {q.difficulty}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span>+{q.marks || 1}</span> /{" "}
                      <span className="text-rose-400">-{q.negative_marks || 0.25}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={q.status === "published" ? "emerald" : "amber"}
                        size="sm"
                        className="capitalize"
                      >
                        {q.status || "published"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Preview Question"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Edit Question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {result.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No questions found matching your filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong>{(result.page - 1) * result.pageSize + 1}</strong> to{" "}
            <strong>{Math.min(result.page * result.pageSize, result.total)}</strong> of{" "}
            <strong>{result.total}</strong> questions
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={result.page <= 1 || isLoading}
              onClick={() => fetchQuestions(result.page - 1)}
              className="text-xs h-7 px-2 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-slate-300">
              Page {result.page} of {result.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={result.page >= result.totalPages || isLoading}
              onClick={() => fetchQuestions(result.page + 1)}
              className="text-xs h-7 px-2 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
      </>
      )}

      {/* Add / Edit Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">
                {isEditing ? "Edit Multiple-Choice Question" : "Add Question to Catalog"}
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Course</label>
                  <select
                    value={formExamId}
                    onChange={(e) => setFormExamId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.conducting_body} — {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject Stream</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Statement *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the official question text clearly..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">
                  Multiple Choice Options & Correct Answer *
                </label>
                {formOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={formCorrectIndex === idx}
                      onChange={() => setFormCorrectIndex(idx)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-mono font-bold text-slate-400 w-5">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...formOptions];
                        next[idx] = e.target.value;
                        setFormOptions(next);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <p className="text-[11px] text-slate-400 italic">
                  Select the radio button beside the correct answer option.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Explanation & Reference Answer Key
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed breakdown explaining why the answer is correct..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formMarks}
                    onChange={(e) => setFormMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Negative</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formNegativeMarks}
                    onChange={(e) => setFormNegativeMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuestionModal(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Question</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>Bulk CSV Question Importer</span>
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Paste CSV text formatted as:{" "}
              <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-400 font-mono">
                question_text,option_a,option_b,option_c,option_d,correct_index(0-3),difficulty,explanation
              </code>
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Course</label>
                <select
                  value={bulkExamId}
                  onChange={(e) => setBulkExamId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.conducting_body} — {ex.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Subject</label>
                <select
                  value={bulkSubjectId}
                  onChange={(e) => setBulkSubjectId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              rows={8}
              placeholder="Who founded the Utkal Brahmo Samaj in 1869?,Harachand Ghosh,Fakir Mohan Senapati,Madhusudan Das,Gopabandhu Das,0,medium,Harachand Ghosh established the Utkal Brahmo Samaj in Cuttack in 1869."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />

            {importStatus?.error && (
              <div className="mb-3 p-2 bg-rose-950/60 border border-rose-800 rounded text-xs text-rose-300">
                {importStatus.error}
              </div>
            )}

            {importStatus?.count !== undefined && (
              <div className="mb-3 p-2 bg-emerald-950/60 border border-emerald-800 rounded text-xs text-emerald-300">
                Successfully imported {importStatus.count} questions into the catalog!
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBulkModal(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
              <Button size="sm" onClick={handleBulkImport} disabled={isImporting}>
                {isImporting ? "Importing Questions..." : "Execute Bulk Import"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Question Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="blue" size="sm">
                Student Preview Mode
              </Badge>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-white mb-4 leading-relaxed">
              {previewQuestion.question_text}
            </p>

            <div className="space-y-2 mb-4">
              {previewQuestion.options.map((opt, idx) => {
                const isCorrect = idx === previewQuestion.correct_option_index;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      isCorrect
                        ? "bg-emerald-950/40 border-emerald-700 text-emerald-300 font-semibold"
                        : "bg-slate-950 border-slate-800 text-slate-300"
                    }`}
                  >
                    <span>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </span>
                    {isCorrect && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        CORRECT ANSWER
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {previewQuestion.explanation && (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
                <strong className="text-white block mb-1">Answer Explanation:</strong>
                {previewQuestion.explanation}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
