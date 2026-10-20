"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MockTest, Exam, ContentStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  Plus,
  Eye,
  Archive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  X,
  Loader2,
  ListPlus,
  Upload,
  FileSpreadsheet,
  Trash2,
  HelpCircle,
  FileText,
  Search,
  Download,
  Check,
} from "lucide-react";

interface MockTestManagerClientProps {
  initialTests: MockTest[];
  exams: Exam[];
}

export const MockTestManagerClient: React.FC<MockTestManagerClientProps> = ({
  initialTests,
  exams,
}) => {
  const router = useRouter();
  const [tests, setTests] = useState<MockTest[]>(initialTests);
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create Mock Test Modal State
  const [showModal, setShowModal] = useState(false);
  const [formExamId, setFormExamId] = useState(exams[0]?.id || "");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDuration, setFormDuration] = useState(120);
  const [formTotalMarks, setFormTotalMarks] = useState(150);
  const [formNegative, setFormNegative] = useState(0.25);
  const [formPass, setFormPass] = useState(40);
  const [formStatus, setFormStatus] = useState<ContentStatus>("published");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Manage Questions Modal State
  const [activeTestForQuestions, setActiveTestForQuestions] = useState<MockTest | null>(null);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsModalTab, setQuestionsModalTab] = useState<"list" | "single" | "bulk">("list");
  const [questionSearch, setQuestionSearch] = useState("");

  // Single Question Form State
  const [qText, setQText] = useState("");
  const [qOptA, setQOptA] = useState("");
  const [qOptB, setQOptB] = useState("");
  const [qOptC, setQOptC] = useState("");
  const [qOptD, setQOptD] = useState("");
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState("");
  const [qDifficulty, setQDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [qMarks, setQMarks] = useState(1.0);
  const [qNegativeMarks, setQNegativeMarks] = useState(0.25);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [singleQuestionError, setSingleQuestionError] = useState<string | null>(null);
  const [singleQuestionSuccess, setSingleQuestionSuccess] = useState<string | null>(null);

  // Bulk Upload Form State
  const [bulkText, setBulkText] = useState("");
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  const filteredTests = tests.filter((t) => {
    if (selectedExamId !== "all" && t.exam_id !== selectedExamId) return false;
    if (statusFilter !== "all" && (t.status || "published") !== statusFilter) return false;
    return true;
  });

  const openCreateModal = () => {
    setFormExamId(exams[0]?.id || "");
    setFormTitle("");
    setFormDesc("");
    setFormDuration(120);
    setFormTotalMarks(150);
    setFormNegative(0.25);
    setFormPass(40);
    setFormStatus("published");
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim() || !formExamId) {
      setFormError("Course, Title, and Description are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        exam_id: formExamId,
        title: formTitle.trim(),
        description: formDesc.trim(),
        duration_minutes: Number(formDuration),
        total_marks: Number(formTotalMarks),
        negative_marking: Number(formNegative),
        pass_percentage: Number(formPass),
        status: formStatus,
      };

      const res = await fetch("/api/admin/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create mock test");

      const createdTest = data.data;
      setTests((prev) => [createdTest, ...prev]);
      setShowModal(false);
      router.refresh();

      // Open manage questions modal directly for the newly created test
      openManageQuestions(createdTest);
    } catch (err: any) {
      setFormError(err.message || "Failed to create mock test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (test: MockTest, newStatus: ContentStatus) => {
    try {
      const res = await fetch("/api/admin/mock-tests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: test.id, status: newStatus }),
      });

      if (res.ok) {
        setTests((prev) =>
          prev.map((item) => (item.id === test.id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Manage Questions Modal
  const openManageQuestions = async (test: MockTest) => {
    setActiveTestForQuestions(test);
    setQuestionsModalTab("list");
    setSingleQuestionError(null);
    setSingleQuestionSuccess(null);
    setBulkError(null);
    setBulkSuccessMsg(null);
    setQMarks(1.0);
    setQNegativeMarks(Number(test.negative_marking || 0.25));
    setIsLoadingQuestions(true);

    try {
      const res = await fetch(`/api/admin/mock-tests/${test.id}/questions`);
      const data = await res.json();
      if (res.ok && data.data) {
        setTestQuestions(data.data);
      } else {
        setTestQuestions([]);
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
      setTestQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Reset Single Question Form
  const resetSingleForm = () => {
    setQText("");
    setQOptA("");
    setQOptB("");
    setQOptC("");
    setQOptD("");
    setQCorrectIndex(0);
    setQExplanation("");
    setQDifficulty("medium");
    setSingleQuestionError(null);
    setSingleQuestionSuccess(null);
  };

  // Submit Single Question
  const handleSaveSingleQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTestForQuestions) return;

    if (!qText.trim() || !qOptA.trim() || !qOptB.trim() || !qOptC.trim() || !qOptD.trim()) {
      setSingleQuestionError("Question text and all 4 options (A, B, C, D) are required.");
      return;
    }

    try {
      setIsSavingQuestion(true);
      setSingleQuestionError(null);
      setSingleQuestionSuccess(null);

      const payload = {
        question_text: qText.trim(),
        options: [qOptA.trim(), qOptB.trim(), qOptC.trim(), qOptD.trim()],
        correct_option_index: qCorrectIndex,
        explanation: qExplanation.trim() || null,
        difficulty: qDifficulty,
        marks: Number(qMarks || 1.0),
        negative_marks: Number(qNegativeMarks || 0.25),
        exam_id: activeTestForQuestions.exam_id,
      };

      const res = await fetch(`/api/admin/mock-tests/${activeTestForQuestions.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add question");

      setSingleQuestionSuccess("Question successfully added to mock test simulation!");
      resetSingleForm();

      // Refresh questions list
      const refreshed = await fetch(`/api/admin/mock-tests/${activeTestForQuestions.id}/questions`);
      const refreshedData = await refreshed.json();
      if (refreshedData.data) {
        setTestQuestions(refreshedData.data);
        // Update questions count in main test table
        setTests((prev) =>
          prev.map((t) =>
            t.id === activeTestForQuestions.id
              ? {
                  ...t,
                  mock_test_questions: [{ count: refreshedData.data.length }],
                  questions_count: refreshedData.data.length,
                }
              : t
          )
        );
      }
    } catch (err: any) {
      setSingleQuestionError(err.message || "Failed to add question");
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // Parse Bulk Text into Question Objects
  const parseBulkInput = (raw: string): any[] => {
    if (!raw.trim()) return [];

    // Try parsing as JSON array
    try {
      const parsedJson = JSON.parse(raw);
      if (Array.isArray(parsedJson)) {
        return parsedJson
          .filter((item: any) => item.question_text && Array.isArray(item.options) && item.options.length === 4)
          .map((item: any) => ({
            question_text: item.question_text,
            options: item.options,
            correct_option_index: Number(item.correct_option_index ?? 0),
            explanation: item.explanation || "",
            difficulty: item.difficulty || "medium",
            marks: Number(item.marks || 1.0),
            negative_marks: Number(item.negative_marks || activeTestForQuestions?.negative_marking || 0.25),
          }));
      }
    } catch {
      // Not JSON, continue with line-based CSV / pipe parsing
    }

    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results: any[] = [];

    for (let line of lines) {
      // Skip header lines
      if (
        line.toLowerCase().startsWith("question") ||
        line.toLowerCase().startsWith("#") ||
        line.toLowerCase().startsWith("//")
      ) {
        continue;
      }

      // Check delimiter: pipe '|' or comma ','
      let parts: string[] = [];
      if (line.includes("|")) {
        parts = line.split("|").map((p) => p.trim());
      } else {
        // Simple CSV splitter handling quoted cells
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (matches) {
          parts = matches.map((m) => m.replace(/^"|"$/g, "").trim());
        } else {
          parts = line.split(",").map((p) => p.trim());
        }
      }

      if (parts.length >= 6) {
        const question_text = parts[0];
        const options = [parts[1], parts[2], parts[3], parts[4]];
        
        let correct_option_index = 0;
        const rawAns = parts[5].toUpperCase();
        if (rawAns === "A" || rawAns === "0") correct_option_index = 0;
        else if (rawAns === "B" || rawAns === "1") correct_option_index = 1;
        else if (rawAns === "C" || rawAns === "2") correct_option_index = 2;
        else if (rawAns === "D" || rawAns === "3") correct_option_index = 3;

        const explanation = parts[6] || "";
        const marks = parts[7] ? Number(parts[7]) : 1.0;
        const difficulty = parts[8] && ["easy", "medium", "hard"].includes(parts[8].toLowerCase())
          ? parts[8].toLowerCase()
          : "medium";

        results.push({
          question_text,
          options,
          correct_option_index,
          explanation,
          difficulty,
          marks: isNaN(marks) ? 1.0 : marks,
          negative_marks: activeTestForQuestions?.negative_marking || 0.25,
        });
      }
    }

    return results;
  };

  // Submit Bulk Upload
  const handleBulkUpload = async () => {
    if (!activeTestForQuestions) return;

    const parsed = parseBulkInput(bulkText);
    if (parsed.length === 0) {
      setBulkError("No valid questions parsed. Please follow the sample format: Question | Opt A | Opt B | Opt C | Opt D | Correct (A-D) | Explanation");
      return;
    }

    try {
      setIsUploadingBulk(true);
      setBulkError(null);
      setBulkSuccessMsg(null);

      const payload = {
        bulk: true,
        questions: parsed.map((q) => ({
          ...q,
          exam_id: activeTestForQuestions.exam_id,
        })),
      };

      const res = await fetch(`/api/admin/mock-tests/${activeTestForQuestions.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload bulk questions");

      setBulkSuccessMsg(`Successfully uploaded ${data.count || parsed.length} questions to this mock test!`);
      setBulkText("");

      // Refresh questions list
      const refreshed = await fetch(`/api/admin/mock-tests/${activeTestForQuestions.id}/questions`);
      const refreshedData = await refreshed.json();
      if (refreshedData.data) {
        setTestQuestions(refreshedData.data);
        // Update questions count in main test table
        setTests((prev) =>
          prev.map((t) =>
            t.id === activeTestForQuestions.id
              ? {
                  ...t,
                  mock_test_questions: [{ count: refreshedData.data.length }],
                  questions_count: refreshedData.data.length,
                }
              : t
          )
        );
      }
    } catch (err: any) {
      setBulkError(err.message || "Failed to upload bulk questions");
    } finally {
      setIsUploadingBulk(false);
    }
  };

  // Delete Question from Mock Test
  const handleDeleteQuestion = async (qId: string) => {
    if (!activeTestForQuestions) return;
    if (!confirm("Are you sure you want to remove this question from this mock test?")) return;

    try {
      const res = await fetch(
        `/api/admin/mock-tests/${activeTestForQuestions.id}/questions?questionId=${qId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        const nextList = testQuestions.filter((q) => q.id !== qId);
        setTestQuestions(nextList);
        setTests((prev) =>
          prev.map((t) =>
            t.id === activeTestForQuestions.id
              ? {
                  ...t,
                  mock_test_questions: [{ count: nextList.length }],
                  questions_count: nextList.length,
                }
              : t
          )
        );
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  // Sample CSV template loader
  const loadSampleBulkTemplate = () => {
    const sample = `Which river is known as the "Sorrow of Odisha" before the construction of the Hirakud Dam? | Mahanadi River | Brahmani River | Baitarani River | Subarnarekha River | A | Mahanadi caused devastating seasonal floods in coastal Odisha before Hirakud. | 1.0 | medium
Who was the first President of the Utkal Sammilani held in 1903 in Cuttack? | Madhusudan Das | Maharaja Sriram Chandra Bhanja Deo | Gopabandhu Das | Fakir Mohan Senapati | B | Maharaja Sriram Chandra Bhanja Deo of Mayurbhanj presided over the historic first session. | 1.0 | hard
The famous Sun Temple of Konark was built during the reign of which Eastern Ganga Dynasty ruler? | Anantavarman Chodaganga | Narasimhadeva I | Bhanudeva I | Rajaraja I | B | King Narasimhadeva I built Konark Sun Temple in the 13th century (circa 1250 CE). | 1.0 | easy`;
    setBulkText(sample);
  };

  // Download Sample CSV
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent(
        `question,option_a,option_b,option_c,option_d,correct_option,explanation,marks,difficulty\n` +
          `"Which river is known as the Sorrow of Odisha before Hirakud Dam?","Mahanadi River","Brahmani River","Baitarani River","Subarnarekha River","A","Mahanadi caused seasonal floods.",1.0,"medium"\n` +
          `"Who was the first President of the Utkal Sammilani in 1903?","Madhusudan Das","Maharaja Sriram Chandra Bhanja Deo","Gopabandhu Das","Fakir Mohan Senapati","B","Presided over the first session.",1.0,"hard"\n` +
          `"The famous Sun Temple of Konark was built by which king?","Anantavarman Chodaganga","Narasimhadeva I","Bhanudeva I","Rajaraja I","B","King Narasimhadeva I built Konark.",1.0,"easy"`
      );
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `sample_mock_questions_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkText(content);
      }
    };
    reader.readAsText(file);
  };

  const parsedBulkPreview = parseBulkInput(bulkText);
  const filteredQuestions = testQuestions.filter((q) =>
    questionSearch ? q.question_text?.toLowerCase().includes(questionSearch.toLowerCase()) : true
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-rose-500" />
            <span>Mock Test Simulations Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build timed official pattern simulations, configure passing thresholds, upload single/bulk questions, and manage negative-marking rules.
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Create New Mock Test</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-950 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Layers className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Filter by Exam:
          </span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All Exams ({tests.length})</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.conducting_body}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
          >
            <option value="all">All States</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Card>

      {/* Mock Tests Table */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Test Simulation</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Duration & Marks</th>
                <th className="py-3 px-4">Negative Marking</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTests.map((test) => {
                const exam = exams.find((e) => e.id === test.exam_id);
                const status = test.status || "published";
                const qCount =
                  (test as any).mock_test_questions?.[0]?.count ??
                  (test as any).questions_count ??
                  0;

                return (
                  <tr key={test.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{test.title}</div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {test.description}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                        {exam?.conducting_body || "OSSC"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openManageQuestions(test)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-slate-900 hover:bg-blue-950/80 border border-slate-700 hover:border-blue-600 text-blue-300 transition-colors"
                        title="Click to view & add questions"
                      >
                        <ListPlus className="w-3.5 h-3.5 text-blue-400" />
                        <span>{qCount} {qCount === 1 ? "Question" : "Questions"}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span>{test.duration_minutes} mins</span> &bull;{" "}
                      <strong className="text-white">{test.total_marks} Marks</strong>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-400">
                      -{test.negative_marking} (Pass: {test.pass_percentage}%)
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          status === "published"
                            ? "emerald"
                            : status === "draft"
                            ? "amber"
                            : "slate"
                        }
                        size="sm"
                        className="capitalize"
                      >
                        {status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openManageQuestions(test)}
                          className="h-7 text-xs px-2.5 gap-1.5 bg-blue-950/50 hover:bg-blue-900/60 border-blue-800 text-blue-300 hover:text-white"
                          title="Manage & Upload Questions"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Questions</span>
                        </Button>

                        <Link
                          href={`/mock-tests/${test.id}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Preview Test as Student"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {status !== "archived" ? (
                          <button
                            onClick={() => handleToggleStatus(test, "archived")}
                            className="p-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-950/40 rounded transition-colors"
                            title="Archive Test"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(test, "published")}
                            className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors"
                            title="Publish Test"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No mock tests found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MANAGE QUESTIONS MODAL (Single + Bulk + List) */}
      {activeTestForQuestions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col text-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 bg-blue-950 border border-blue-800 rounded text-blue-400 font-bold">
                    Mock Test Questions Manager
                  </span>
                  <Badge variant="slate" size="sm">
                    {testQuestions.length} Attached
                  </Badge>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                  {activeTestForQuestions.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total Marks: {activeTestForQuestions.total_marks} &bull; Negative: -{activeTestForQuestions.negative_marking} &bull; Duration: {activeTestForQuestions.duration_minutes}m
                </p>
              </div>

              <button
                onClick={() => setActiveTestForQuestions(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-4 sm:px-5 py-2.5 border-b border-slate-800 flex items-center gap-2 bg-slate-950/30">
              <button
                onClick={() => setQuestionsModalTab("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  questionsModalTab === "list"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Questions List ({testQuestions.length})</span>
              </button>

              <button
                onClick={() => setQuestionsModalTab("single")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  questionsModalTab === "single"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Single Add Question</span>
              </button>

              <button
                onClick={() => setQuestionsModalTab("bulk")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  questionsModalTab === "bulk"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk Upload Questions</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* TAB 1: QUESTIONS LIST */}
              {questionsModalTab === "list" && (
                <div className="space-y-4">
                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search questions in this test..."
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setQuestionsModalTab("single")}
                        className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Single</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQuestionsModalTab("bulk")}
                        className="text-xs gap-1.5 border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Bulk Upload</span>
                      </Button>
                    </div>
                  </div>

                  {isLoadingQuestions ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-xs">Loading questions...</span>
                    </div>
                  ) : filteredQuestions.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl p-8 space-y-3 bg-slate-950/40">
                      <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-300">No Questions Added Yet</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This mock test has no attached questions yet. Add questions one by one or upload in bulk using a CSV / structured text.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => setQuestionsModalTab("single")}
                          className="text-xs gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Single Question</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuestionsModalTab("bulk")}
                          className="text-xs gap-1.5 border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Bulk Upload</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredQuestions.map((q, idx) => {
                        const correctIdx = Number(q.correct_option_index ?? 0);
                        return (
                          <div
                            key={q.id || idx}
                            className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                                  #{idx + 1}
                                </span>
                                <Badge
                                  variant={
                                    q.difficulty === "easy"
                                      ? "emerald"
                                      : q.difficulty === "hard"
                                      ? "rose"
                                      : "blue"
                                  }
                                  size="sm"
                                  className="capitalize text-[10px]"
                                >
                                  {q.difficulty || "medium"}
                                </Badge>
                                <span className="text-[11px] font-mono text-slate-400">
                                  +{q.marks || 1.0}m / -{q.negative_marks || activeTestForQuestions.negative_marking}m
                                </span>
                              </div>

                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                                title="Remove question from mock test"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="text-sm font-semibold text-white leading-relaxed">
                              {q.question_text}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {Array.isArray(q.options) &&
                                q.options.map((opt: string, optIdx: number) => {
                                  const isCorrect = optIdx === correctIdx;
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                                        isCorrect
                                          ? "bg-emerald-950/40 border-emerald-600/80 text-emerald-200 font-semibold"
                                          : "bg-slate-900/60 border-slate-800 text-slate-300"
                                      }`}
                                    >
                                      <span>
                                        <strong className="mr-1.5">{String.fromCharCode(65 + optIdx)}.</strong>
                                        {opt}
                                      </span>
                                      {isCorrect && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1.5" />
                                      )}
                                    </div>
                                  );
                                })}
                            </div>

                            {q.explanation && (
                              <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-lg text-xs text-slate-400 flex items-start gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-slate-300">Explanation: </strong>
                                  <span>{q.explanation}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SINGLE ADD QUESTION */}
              {questionsModalTab === "single" && (
                <form onSubmit={handleSaveSingleQuestion} className="space-y-4 max-w-2xl mx-auto">
                  {singleQuestionError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{singleQuestionError}</span>
                    </div>
                  )}

                  {singleQuestionSuccess && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{singleQuestionSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Question Text *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Near which river bank was the historic Kalinga War fought in 261 BCE?"
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Options & Correct Answer *
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Fill in all 4 options and click the radio icon to select which option is correct.
                    </p>

                    <div className="space-y-2">
                      {[
                        { label: "Option A", val: qOptA, setVal: setQOptA, idx: 0 },
                        { label: "Option B", val: qOptB, setVal: setQOptB, idx: 1 },
                        { label: "Option C", val: qOptC, setVal: setQOptC, idx: 2 },
                        { label: "Option D", val: qOptD, setVal: setQOptD, idx: 3 },
                      ].map((item) => (
                        <div
                          key={item.idx}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                            qCorrectIndex === item.idx
                              ? "bg-emerald-950/30 border-emerald-600/80"
                              : "bg-slate-950 border-slate-800"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setQCorrectIndex(item.idx)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              qCorrectIndex === item.idx
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                            title="Click to mark as correct answer"
                          >
                            {String.fromCharCode(65 + item.idx)}
                          </button>

                          <input
                            type="text"
                            required
                            placeholder={`Enter text for ${item.label}`}
                            value={item.val}
                            onChange={(e) => item.setVal(e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-600"
                          />

                          {qCorrectIndex === item.idx && (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase pr-2 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={qDifficulty}
                        onChange={(e) => setQDifficulty(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Marks (+m)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        value={qMarks}
                        onChange={(e) => setQMarks(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Negative Marks (-m)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={qNegativeMarks}
                        onChange={(e) => setQNegativeMarks(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Explanation (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detailed rationale and reference for the correct answer..."
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuestionsModalTab("list")}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSavingQuestion}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSavingQuestion ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Add Question to Test</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 3: BULK UPLOAD QUESTIONS */}
              {questionsModalTab === "bulk" && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {bulkError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{bulkError}</span>
                    </div>
                  )}

                  {bulkSuccessMsg && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{bulkSuccessMsg}</span>
                    </div>
                  )}

                  {/* Actions & Helpers */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-300">
                        Bulk Question Importer
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors">
                        <Upload className="w-3 h-3 text-blue-400" />
                        <span>Upload CSV File</span>
                        <input
                          type="file"
                          accept=".csv,text/csv,text/plain"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={loadSampleBulkTemplate}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Insert Sample Data</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadCsvTemplate}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download CSV Template</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Paste CSV, Pipe-Separated, or JSON Questions
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Format: Question | Option A | Option B | Option C | Option D | Correct (A-D) | Explanation
                      </span>
                    </div>

                    <textarea
                      rows={8}
                      placeholder="Paste questions here... You can click 'Insert Sample Data' above to see the exact structure."
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Live Parsed Preview */}
                  {parsedBulkPreview.length > 0 && (
                    <div className="p-3 bg-slate-950 border border-blue-900/60 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
                        <span>Preview: {parsedBulkPreview.length} Valid Questions Detected</span>
                        <Badge variant="blue" size="sm">
                          Ready to Upload
                        </Badge>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-800/60">
                        {parsedBulkPreview.slice(0, 5).map((q, idx) => (
                          <div key={idx} className="pt-1.5 text-[11px] text-slate-300">
                            <span className="font-bold text-white mr-1">#{idx + 1}.</span>
                            <span className="font-medium text-slate-200">{q.question_text}</span>
                            <span className="text-emerald-400 font-mono ml-2 font-bold">
                              [Correct: {String.fromCharCode(65 + q.correct_option_index)}]
                            </span>
                          </div>
                        ))}
                        {parsedBulkPreview.length > 5 && (
                          <div className="pt-2 text-center text-xs text-slate-500 italic">
                            ... and {parsedBulkPreview.length - 5} more questions
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuestionsModalTab("list")}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Back to List
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleBulkUpload}
                      disabled={isUploadingBulk || parsedBulkPreview.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isUploadingBulk ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          <span>Uploading Batch...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          <span>Upload {parsedBulkPreview.length} Questions</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MOCK TEST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Create New Mock Test Simulation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Course *</label>
                <select
                  value={formExamId}
                  onChange={(e) => setFormExamId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.conducting_body} — {ex.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mock Test Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OSSC CGL 2026 Preliminary Full Length Mock #1"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Official pattern test instructions and section distributions..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Negative Marking</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formNegative}
                    onChange={(e) => setFormNegative(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pass Percentage (%)</label>
                  <input
                    type="number"
                    min={20}
                    max={100}
                    value={formPass}
                    onChange={(e) => setFormPass(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="published">Published (Visible to Students)</option>
                  <option value="draft">Draft (Review Stage)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? "Creating..." : "Create & Manage Questions"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
