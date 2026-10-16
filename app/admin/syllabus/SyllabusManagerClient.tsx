"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Exam, Subject, Chapter, Topic, ContentStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  BookOpen,
  Plus,
  Edit2,
  Archive,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  ChevronDown,
  Clock,
  X,
  Loader2,
  FolderTree,
} from "lucide-react";

interface SyllabusManagerClientProps {
  exams: Exam[];
  initialSubjects: Subject[];
  initialChapters: Chapter[];
  initialTopics: Topic[];
}

export const SyllabusManagerClient: React.FC<SyllabusManagerClientProps> = ({
  exams,
  initialSubjects,
  initialChapters,
  initialTopics,
}) => {
  const router = useRouter();
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || "");
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [topics, setTopics] = useState<Topic[]>(initialTopics);

  // Expanded tree states
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(initialSubjects.map((s) => s.id))
  );
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(initialChapters.map((c) => c.id))
  );

  // Modal State
  const [modalType, setModalType] = useState<"subject" | "chapter" | "topic" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [parentId, setParentId] = useState<string>("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formMins, setFormMins] = useState(45);
  const [formStatus, setFormStatus] = useState<ContentStatus>("published");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeSubjects = subjects.filter((s) => s.exam_id === selectedExamId);

  // Open modals
  const openAddSubject = () => {
    setModalType("subject");
    setIsEditing(false);
    setEditId(null);
    setParentId(selectedExamId);
    setFormTitle("");
    setFormDesc("");
    setFormStatus("published");
    setFormError(null);
  };

  const openAddChapter = (subjectId: string) => {
    setModalType("chapter");
    setIsEditing(false);
    setEditId(null);
    setParentId(subjectId);
    setFormTitle("");
    setFormDesc("");
    setFormStatus("published");
    setFormError(null);
  };

  const openAddTopic = (chapterId: string) => {
    setModalType("topic");
    setIsEditing(false);
    setEditId(null);
    setParentId(chapterId);
    setFormTitle("");
    setFormDesc("");
    setFormMins(45);
    setFormStatus("published");
    setFormError(null);
  };

  const handleSaveEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const endpoint = "/api/admin/syllabus";
      const method = isEditing ? "PATCH" : "POST";

      const payload: Record<string, any> = {
        entityType: modalType,
        status: formStatus,
      };

      if (isEditing) {
        payload.id = editId;
        payload.name = formTitle.trim();
        payload.title = formTitle.trim();
        payload.description = formDesc.trim() || null;
        if (modalType === "topic") payload.estimated_minutes = formMins;
      } else {
        if (modalType === "subject") {
          payload.exam_id = parentId;
          payload.name = formTitle.trim();
          payload.description = formDesc.trim() || null;
        } else if (modalType === "chapter") {
          payload.subject_id = parentId;
          payload.title = formTitle.trim();
          payload.description = formDesc.trim() || null;
        } else if (modalType === "topic") {
          payload.chapter_id = parentId;
          payload.title = formTitle.trim();
          payload.description = formDesc.trim() || null;
          payload.estimated_minutes = formMins;
        }
      }

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      if (modalType === "subject") {
        if (isEditing) {
          setSubjects((prev) => prev.map((s) => (s.id === editId ? { ...s, name: formTitle, description: formDesc, status: formStatus } : s)));
        } else {
          setSubjects((prev) => [...prev, data.data]);
        }
      } else if (modalType === "chapter") {
        if (isEditing) {
          setChapters((prev) => prev.map((c) => (c.id === editId ? { ...c, title: formTitle, description: formDesc, status: formStatus } : c)));
        } else {
          setChapters((prev) => [...prev, data.data]);
        }
      } else if (modalType === "topic") {
        if (isEditing) {
          setTopics((prev) => prev.map((t) => (t.id === editId ? { ...t, title: formTitle, description: formDesc, status: formStatus, estimated_minutes: formMins } : t)));
        } else {
          setTopics((prev) => [...prev, data.data]);
        }
      }

      setModalType(null);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to save syllabus entity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (entityType: "subject" | "chapter" | "topic", id: string, newStatus: ContentStatus) => {
    try {
      const res = await fetch("/api/admin/syllabus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, id, status: newStatus }),
      });

      if (res.ok) {
        if (entityType === "subject") {
          setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
        } else if (entityType === "chapter") {
          setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
        } else {
          setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
        }
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
            <FolderTree className="w-6 h-6 text-emerald-500" />
            <span>Syllabus Hierarchy Architecture</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain strict curriculum hierarchy: Course &rarr; Subject &rarr; Chapter &rarr; Topic. Students access only the syllabus scoped to their selected course.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openAddSubject} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </Button>
        </div>
      </div>

      {/* Course Switcher Selector */}
      <Card className="p-4 bg-slate-950 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Layers className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Course:
          </span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.conducting_body} — {ex.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong>{activeSubjects.length}</strong> official subject streams for selected exam
        </div>
      </Card>

      {/* Syllabus Interactive Tree */}
      <div className="space-y-4">
        {activeSubjects.map((sub) => {
          const subChapters = chapters.filter((c) => c.subject_id === sub.id);
          const isExpanded = expandedSubjects.has(sub.id);

          return (
            <Card key={sub.id} className="bg-slate-950 border-slate-800 overflow-hidden">
              {/* Subject Bar */}
              <div className="p-4 bg-slate-900/80 flex items-center justify-between border-b border-slate-800/80">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleSubject(sub.id)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">
                        SUBJECT
                      </span>
                      <h3 className="text-sm font-bold text-white">{sub.name}</h3>
                      <Badge
                        variant={sub.status === "published" ? "emerald" : "amber"}
                        size="sm"
                      >
                        {sub.status || "published"}
                      </Badge>
                    </div>
                    {sub.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{sub.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => openAddChapter(sub.id)}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Chapter</span>
                  </Button>
                </div>
              </div>

              {/* Chapters & Topics (If expanded) */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {subChapters.map((chap) => {
                    const chapTopics = topics.filter((t) => t.chapter_id === chap.id);
                    const isChapExpanded = expandedChapters.has(chap.id);

                    return (
                      <div
                        key={chap.id}
                        className="rounded-xl border border-slate-800/90 bg-slate-900/40 p-3 space-y-3"
                      >
                        {/* Chapter Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => toggleChapter(chap.id)}
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              {isChapExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
                                  CHAPTER
                                </span>
                                <h4 className="text-xs font-bold text-slate-200">{chap.title}</h4>
                                <Badge
                                  variant={chap.status === "published" ? "emerald" : "amber"}
                                  size="sm"
                                >
                                  {chap.status || "published"}
                                </Badge>
                              </div>
                              {chap.description && (
                                <p className="text-[11px] text-slate-400 mt-0.5">{chap.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => openAddTopic(chap.id)}
                              size="sm"
                              variant="outline"
                              className="text-[11px] h-6 px-2 gap-1 border-slate-700 text-slate-400 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Topic</span>
                            </Button>
                          </div>
                        </div>

                        {/* Topics (If Chapter expanded) */}
                        {isChapExpanded && (
                          <div className="pl-6 space-y-2 border-l border-slate-800 ml-4">
                            {chapTopics.map((top) => (
                              <div
                                key={top.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/60 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded">
                                    TOPIC
                                  </span>
                                  <span className="font-medium text-slate-200">{top.title}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {top.estimated_minutes} mins
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={top.status === "published" ? "emerald" : "amber"}
                                    size="sm"
                                  >
                                    {top.status || "published"}
                                  </Badge>
                                  {top.status !== "archived" ? (
                                    <button
                                      onClick={() => handleToggleStatus("topic", top.id, "archived")}
                                      className="text-slate-500 hover:text-amber-400 p-1"
                                      title="Archive Topic"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleStatus("topic", top.id, "published")}
                                      className="text-slate-500 hover:text-emerald-400 p-1"
                                      title="Publish Topic"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {chapTopics.length === 0 && (
                              <div className="text-[11px] text-slate-500 italic py-1">
                                No topics added yet in this chapter.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {subChapters.length === 0 && (
                    <div className="text-xs text-slate-500 italic py-2">
                      No chapters registered for this subject yet.
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {activeSubjects.length === 0 && (
          <Card className="p-8 text-center bg-slate-950 border-slate-800">
            <p className="text-xs text-slate-400">
              No subjects currently configured for this examination. Click &quot;Add Subject&quot; above to create the curriculum stream.
            </p>
          </Card>
        )}
      </div>

      {/* Create / Edit Entity Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold capitalize">
                {isEditing ? `Edit ${modalType}` : `Add New ${modalType}`}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEntity} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {modalType === "subject" ? "Subject Name *" : "Title *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${modalType === "subject" ? "General Studies" : "Odisha History"}`}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of syllabus coverage..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {modalType === "topic" && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Estimated Study Minutes
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={360}
                    value={formMins}
                    onChange={(e) => setFormMins(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Workflow Publication Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="published">Published (Visible to Enrolled Students)</option>
                  <option value="draft">Draft (Review Stage)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalType(null)}
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
                    <span>Save {modalType}</span>
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
