"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StudyMaterial, Topic, Subject, Exam, ContentStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Plus,
  Upload,
  Search,
  Filter,
  Eye,
  Archive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Loader2,
  FileCode,
  GraduationCap,
  BookOpen,
  Edit,
  Trash2,
} from "lucide-react";

interface MaterialManagerClientProps {
  initialMaterials: StudyMaterial[];
  topics: Topic[];
  subjects: Subject[];
  exams: Exam[];
}

export const MaterialManagerClient: React.FC<MaterialManagerClientProps> = ({
  initialMaterials,
  topics,
  subjects,
  exams,
}) => {
  const router = useRouter();
  const [materials, setMaterials] = useState<StudyMaterial[]>(initialMaterials);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields: Examination, Subject, Topic, Category, and Details
  const [formExamId, setFormExamId] = useState<string>(exams[0]?.id || "");
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || "");
  const [formTopicId, setFormTopicId] = useState<string>(topics[0]?.id || "");
  const [formCategory, setFormCategory] = useState<string>("notes");
  const [formType, setFormType] = useState<"pdf" | "text" | "summary" | "note">("note");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formStatus, setFormStatus] = useState<ContentStatus>("published");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cascading Subjects for the selected Examination
  const availableSubjects = useMemo(() => {
    if (!formExamId) return subjects;
    const filtered = subjects.filter((s) => s.exam_id === formExamId);
    return filtered.length > 0 ? filtered : subjects;
  }, [formExamId, subjects]);

  // Cascading Topics for the selected Subject
  const availableTopics = useMemo(() => {
    if (!formSubjectId) return topics;
    return topics;
  }, [formSubjectId, topics]);

  // Handle Exam change in form
  const handleExamChange = (examId: string) => {
    setFormExamId(examId);
    const relatedSubs = subjects.filter((s) => s.exam_id === examId);
    if (relatedSubs.length > 0) {
      setFormSubjectId(relatedSubs[0].id);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (statusFilter !== "all" && (m.status || "published") !== statusFilter) return false;
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (examFilter !== "all" && m.exam_id && m.exam_id !== examFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.content && m.content.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [materials, statusFilter, categoryFilter, examFilter, search]);

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormExamId(exams[0]?.id || "");
    setFormSubjectId(subjects[0]?.id || "");
    setFormTopicId(topics[0]?.id || "");
    setFormTitle("");
    setFormDesc("");
    setFormCategory("notes");
    setFormType("note");
    setFormContent("");
    setFormFileUrl("");
    setFormStatus("published");
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (mat: StudyMaterial) => {
    setIsEditing(true);
    setEditId(mat.id);
    setFormExamId(mat.exam_id || exams[0]?.id || "");
    setFormSubjectId(mat.subject_id || subjects[0]?.id || "");
    setFormTopicId(mat.topic_id || topics[0]?.id || "");
    setFormTitle(mat.title || "");
    setFormDesc(mat.description || "");
    setFormCategory(mat.category || "notes");
    setFormType((mat.material_type as any) || "note");
    setFormContent(mat.content || "");
    setFormFileUrl(mat.file_url || mat.url || "");
    setFormStatus(mat.status || "published");
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        category: formCategory,
        material_type: formType,
        content: formContent.trim() || formDesc.trim() || formTitle.trim(),
        file_url: formFileUrl.trim() || null,
        exam_id: formExamId || null,
        subject_id: formSubjectId || null,
        topic_id: formTopicId || null,
        status: formStatus,
      };

      const res = await fetch("/api/admin/materials", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editId, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save material");

      if (isEditing) {
        setMaterials((prev) =>
          prev.map((item) => (item.id === editId ? ({ ...item, ...payload } as StudyMaterial) : item))
        );
      } else {
        setMaterials((prev) => [data.data as StudyMaterial, ...prev]);
      }

      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to save study material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (mat: StudyMaterial, newStatus: ContentStatus) => {
    try {
      const res = await fetch("/api/admin/materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mat.id, status: newStatus }),
      });

      if (res.ok) {
        setMaterials((prev) =>
          prev.map((item) => (item.id === mat.id ? { ...item, status: newStatus } : item))
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (matId: string) => {
    if (!confirm("Are you sure you want to archive this material? It will be hidden from students.")) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/materials?id=${matId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMaterials((prev) =>
          prev.map((item) => (item.id === matId ? { ...item, status: "archived" } : item))
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (mat: StudyMaterial) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${mat.title}"?\n\nThis will remove the file, document, or notes completely. This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/materials?id=${mat.id}&permanent=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete material");

      setMaterials((prev) => prev.filter((item) => item.id !== mat.id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete material");
    }
  };

  // Helpers to resolve names
  const getExamName = (examId?: string | null) => {
    if (!examId) return "All Exams";
    return exams.find((e) => e.id === examId)?.title || "General Odisha Exam";
  };

  const getSubjectName = (subId?: string | null) => {
    if (!subId) return "General Subject";
    return subjects.find((s) => s.id === subId)?.name || "General Studies";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Materials, Notes & PYQ Papers Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish official reference PDFs, revision notes, and solved PYQ papers assigned to examinations, subjects, and topics.
          </p>
        </div>

        <Button onClick={openAddModal} size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Upload / Create Material</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-950 border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search materials by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Exam Filter */}
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.conducting_body} - {ex.title}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="notes">Notes & Summaries</option>
            <option value="formulas">Formula Sheets</option>
            <option value="pyq">PYQ Papers (Solved)</option>
            <option value="current_affairs">Current Affairs</option>
            <option value="pdf">PDF Documents</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Card>

      {/* Materials Table */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Document / Note Title</th>
                <th className="py-3 px-4">Examination & Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No study materials found matching filters.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const status = mat.status || "published";
                  return (
                    <tr key={mat.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{mat.title}</div>
                        {mat.description && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {mat.description}
                          </div>
                        )}
                        {mat.file_url && (
                          <div className="text-[10px] text-cyan-400 mt-0.5 font-mono truncate max-w-sm">
                            {mat.file_url}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                          <span>{getExamName(mat.exam_id)}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3 text-slate-500" />
                          <span>{getSubjectName(mat.subject_id)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            mat.category === "pyq"
                              ? "indigo"
                              : mat.category === "formulas"
                              ? "amber"
                              : mat.category === "current_affairs"
                              ? "blue"
                              : "blue"
                          }
                          size="sm"
                        >
                          {mat.category || "notes"}
                        </Badge>
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
                        >
                          {status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewMaterial(mat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="Preview Content"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(mat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Material"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {status === "published" ? (
                            <button
                              onClick={() => handleToggleStatus(mat, "draft")}
                              className="px-2 py-1 rounded-md text-[10px] font-bold text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Set to Draft (Hide from students)"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(mat, "published")}
                              className="px-2 py-1 rounded-md text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Publish (Make visible to students)"
                            >
                              Publish
                            </button>
                          )}

                          {status !== "archived" && (
                            <button
                              onClick={() => handleArchive(mat.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              title="Archive Document (Hide from students)"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(mat)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                            title="Delete Material (Permanent)"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Material Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>{isEditing ? "Edit Study Material" : "Upload / Create Study Material"}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs">
              {/* 1. Examination & Subject Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Examination *
                  </label>
                  <select
                    value={formExamId}
                    onChange={(e) => handleExamChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="all">All Odisha Examinations (Universal Guide)</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.conducting_body} - {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Subject *
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Topic & Category Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Syllabus Topic Node
                  </label>
                  <select
                    value={formTopicId}
                    onChange={(e) => setFormTopicId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {availableTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="notes">Notes & Summaries (notes)</option>
                    <option value="formulas">Formula Sheets (formulas)</option>
                    <option value="pyq">PYQ Papers - Solved (pyq)</option>
                    <option value="current_affairs">Current Affairs Digest</option>
                    <option value="pdf">Official PDF Document</option>
                  </select>
                </div>
              </div>

              {/* 3. Document Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Document / Note Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. OSSC CGL 2024 Prelims Solved Question Paper with Official Key"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              {/* 4. Short Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Short Description / Summary
                </label>
                <input
                  type="text"
                  placeholder="Brief 1-line overview of syllabus topics covered"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none"
                />
              </div>

              {/* 5. Material Type & File URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Material Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="note">Study Notes</option>
                    <option value="pdf">PDF Document</option>
                    <option value="summary">Summary</option>
                    <option value="text">Formula Sheet / Text</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">
                      File URL or Google Drive Link (Optional)
                    </label>
                    <span className="text-[10px] text-cyan-400 font-medium">Google Drive links fully supported</span>
                  </div>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/.../view or /docs/paper.pdf"
                    value={formFileUrl}
                    onChange={(e) => setFormFileUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter Google Drive share link, PDF URL, or document link. Students can view directly online or open in browser.
                  </p>
                </div>
              </div>

              {/* 6. Detailed Content / Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Notes / Markdown Content (Available in &quot;Read Online&quot;)
                </label>
                <textarea
                  rows={5}
                  placeholder="Enter formatted study notes, solved questions, formulas, or markdown text..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono text-xs"
                />
              </div>

              {/* 7. Publication Status */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Publication Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="published">Published (Immediately visible to eligible students)</option>
                  <option value="draft">Draft (Hidden from students)</option>
                  <option value="archived">Archived (Retired content)</option>
                </select>
              </div>

              {/* Actions */}
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
                  {isSubmitting ? "Saving..." : isEditing ? "Update Material" : "Publish Material"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Material Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="blue" size="sm">
                  {previewMaterial.category || "notes"}
                </Badge>
                <Badge variant="emerald" size="sm">
                  {previewMaterial.status || "published"}
                </Badge>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{previewMaterial.title}</h3>

            {previewMaterial.description && (
              <p className="text-xs text-slate-400 mb-3">{previewMaterial.description}</p>
            )}

            {previewMaterial.file_url && (
              <div className="mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 truncate max-w-xs">
                  {previewMaterial.file_url}
                </span>
                <a
                  href={previewMaterial.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open File</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
              {previewMaterial.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
