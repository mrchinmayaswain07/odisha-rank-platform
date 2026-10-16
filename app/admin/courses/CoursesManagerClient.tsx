"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Exam, ContentStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Layers,
  Plus,
  Edit2,
  Archive,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface CoursesManagerClientProps {
  initialExams: Exam[];
}

export const CoursesManagerClient: React.FC<CoursesManagerClientProps> = ({
  initialExams,
}) => {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("OSSC");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEligibility, setFormEligibility] = useState("");
  const [formStatus, setFormStatus] = useState<ContentStatus>("published");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredExams = exams.filter((ex) => {
    if (statusFilter !== "all" && (ex.status || "published") !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ex.title.toLowerCase().includes(q) ||
        ex.conducting_body.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentExamId(null);
    setFormTitle("");
    setFormBody("OSSC");
    setFormSlug("");
    setFormDesc("");
    setFormEligibility("");
    setFormStatus("published");
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (ex: Exam) => {
    setIsEditing(true);
    setCurrentExamId(ex.id);
    setFormTitle(ex.title);
    setFormBody(ex.conducting_body);
    setFormSlug(ex.slug);
    setFormDesc(ex.description);
    setFormEligibility(ex.eligibility || "");
    setFormStatus(ex.status || "published");
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim() || !formDesc.trim()) {
      setFormError("Title, Conducting Body, and Description are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const endpoint = "/api/admin/courses";
      const method = isEditing ? "PATCH" : "POST";
      const payload: Record<string, any> = {
        title: formTitle.trim(),
        conducting_body: formBody.trim(),
        slug: formSlug.trim() || undefined,
        description: formDesc.trim(),
        eligibility: formEligibility.trim() || null,
        status: formStatus,
        is_active: formStatus === "published",
      };

      if (isEditing) {
        payload.id = currentExamId;
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save course");
      }

      if (isEditing) {
        setExams((prev) =>
          prev.map((item) => (item.id === currentExamId ? { ...item, ...payload } : item))
        );
      } else {
        setExams((prev) => [data.data, ...prev]);
      }

      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (exam: Exam, newStatus: ContentStatus) => {
    try {
      const res = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: exam.id,
          status: newStatus,
          is_active: newStatus === "published",
        }),
      });

      if (res.ok) {
        setExams((prev) =>
          prev.map((item) =>
            item.id === exam.id ? { ...item, status: newStatus, is_active: newStatus === "published" } : item
          )
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
            <Layers className="w-6 h-6 text-blue-500" />
            <span>Courses & Competitive Examinations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage official state recruitments (OSSC, OSSSC, OPSC), publication states, and monitor student enrollments.
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span>New Examination Course</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-950 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title or body..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All States ({exams.length})</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Card>

      {/* Courses Table */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Exam / Course</th>
                <th className="py-3 px-4">Conducting Body</th>
                <th className="py-3 px-4">Enrolled Students</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExams.map((exam) => {
                const status = exam.status || "published";
                return (
                  <tr key={exam.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{exam.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        slug: /{exam.slug}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-400 bg-blue-950/60 border border-blue-900/60 px-2 py-0.5 rounded text-[11px]">
                        {exam.conducting_body}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.students_count || 0} students</span>
                      </div>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(exam)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Edit Course"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {status !== "archived" ? (
                          <button
                            onClick={() => handleToggleStatus(exam, "archived")}
                            className="p-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-950/40 rounded transition-colors"
                            title="Archive Course"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(exam, "published")}
                            className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors"
                            title="Publish Course"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No courses found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {isEditing ? "Edit Examination Course" : "Create New Course"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Examination Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OSSC Combined Graduate Level (CGL)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Conducting Body *
                  </label>
                  <select
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OSSC">OSSC</option>
                    <option value="OSSSC">OSSSC</option>
                    <option value="OPSC">OPSC</option>
                    <option value="OTHER">Other State Body</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ossc-cgl"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Course Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Official recruitment syllabus summary..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Eligibility Criteria
                </label>
                <input
                  type="text"
                  placeholder="e.g. Graduation with Odia up to ME standard"
                  value={formEligibility}
                  onChange={(e) => setFormEligibility(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Publication Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Update Course" : "Create Course"}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
