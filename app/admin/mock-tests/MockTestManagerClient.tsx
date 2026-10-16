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

  // Modal State
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

      setTests((prev) => [data.data, ...prev]);
      setShowModal(false);
      router.refresh();
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
            Build timed official pattern simulations, configure passing thresholds, and manage negative-marking rules.
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm" className="gap-1.5">
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
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No mock tests found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Mock Test Modal */}
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
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Mock Test"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
