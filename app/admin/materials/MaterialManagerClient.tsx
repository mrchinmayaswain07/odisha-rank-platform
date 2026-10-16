"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StudyMaterial, Topic, Exam, ContentStatus } from "@/lib/types";
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
} from "lucide-react";

interface MaterialManagerClientProps {
  initialMaterials: StudyMaterial[];
  topics: Topic[];
  exams: Exam[];
}

export const MaterialManagerClient: React.FC<MaterialManagerClientProps> = ({
  initialMaterials,
  topics,
  exams,
}) => {
  const router = useRouter();
  const [materials, setMaterials] = useState<StudyMaterial[]>(initialMaterials);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("PDF Document");
  const [formType, setFormType] = useState<"pdf" | "text" | "summary" | "note">("pdf");
  const [formContent, setFormContent] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formTopicId, setFormTopicId] = useState(topics[0]?.id || "");
  const [formStatus, setFormStatus] = useState<ContentStatus>("published");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredMaterials = materials.filter((m) => {
    if (statusFilter !== "all" && (m.status || "published") !== statusFilter) return false;
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormTitle("");
    setFormDesc("");
    setFormCategory("PDF Document");
    setFormType("pdf");
    setFormContent("");
    setFormFileUrl("");
    setFormTopicId(topics[0]?.id || "");
    setFormStatus("published");
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formTopicId) {
      setFormError("Title and Topic selection are required.");
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
        content: formContent.trim() || "Official syllabus preparation notes",
        file_url: formFileUrl.trim() || null,
        topic_id: formTopicId,
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
          prev.map((item) => (item.id === editId ? { ...item, ...payload } : item))
        );
      } else {
        setMaterials((prev) => [data.data, ...prev]);
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
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>PDF & Study Material Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish official reference PDFs, revision guides, and curriculum summaries mapped to topic syllabus nodes.
          </p>
        </div>

        <Button onClick={openAddModal} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Upload / Add Material</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-950 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search materials by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
          >
            <option value="all">All States</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="PDF Document">PDF Documents</option>
            <option value="Chapter Summary">Chapter Summaries</option>
            <option value="Official Act">Official Acts / Gazette</option>
          </select>
        </div>
      </Card>

      {/* Materials Table */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Material Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Topic Node</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMaterials.map((mat) => {
                const topic = topics.find((t) => t.id === mat.topic_id);
                const status = mat.status || "published";

                return (
                  <tr key={mat.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{mat.title}</div>
                      {mat.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {mat.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {mat.category || "Notes"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300">{topic?.title || "Curriculum Node"}</span>
                    </td>
                    <td className="py-3.5 px-4 uppercase font-mono text-[10px] text-cyan-400 font-bold">
                      {mat.material_type}
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
                        <button
                          onClick={() => setPreviewMaterial(mat)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Preview Material"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {status !== "archived" ? (
                          <button
                            onClick={() => handleToggleStatus(mat, "archived")}
                            className="p-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-950/40 rounded transition-colors"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(mat, "published")}
                            className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors"
                            title="Publish"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No study materials registered matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload / Add Material Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Add Study Material / PDF Document</h3>
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

            <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Odisha Geography & Drainage Systems Summary"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Topic *</label>
                  <select
                    value={formTopicId}
                    onChange={(e) => setFormTopicId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="PDF Document">PDF Document</option>
                    <option value="Chapter Summary">Chapter Summary</option>
                    <option value="Official Act">Official Act / Gazette</option>
                    <option value="Solved Examples">Solved Examples</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  File URL or Storage Link
                </label>
                <input
                  type="text"
                  placeholder="https://.../notes.pdf or Supabase storage URI"
                  value={formFileUrl}
                  onChange={(e) => setFormFileUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Detailed Notes / Markdown Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Comprehensive study notes for students..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Publication Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="published">Published (Live for Students)</option>
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
                  {isSubmitting ? "Saving..." : "Save Material"}
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
              <Badge variant="emerald" size="sm">
                {previewMaterial.category || "Study Notes"}
              </Badge>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{previewMaterial.title}</h3>

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

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
              {previewMaterial.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
