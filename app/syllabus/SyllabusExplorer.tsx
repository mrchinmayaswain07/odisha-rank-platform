"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Subject,
  Chapter,
  Topic,
  StudyMaterial,
  Exam,
} from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  FileText,
  Trash2,
  Sparkles,
  ChevronRight,
  Layers,
  Lock,
  GraduationCap,
} from "lucide-react";

interface SyllabusExplorerProps {
  initialSubjects: Subject[];
  initialChapters: Chapter[];
  initialTopics: Topic[];
  initialMaterials: StudyMaterial[];
  allExams?: Exam[];
  activeExam?: Exam | null;
  userId?: string | null;
}

export const SyllabusExplorer: React.FC<SyllabusExplorerProps> = ({
  initialSubjects,
  initialChapters,
  initialTopics,
  initialMaterials,
  allExams = [],
  activeExam,
  userId,
}) => {
  const router = useRouter();
  const [subjects] = useState<Subject[]>(initialSubjects);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjects[0]?.id || ""
  );

  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    initialChapters[0]?.id || ""
  );

  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopics[0]?.id || ""
  );

  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());

  // Custom chapter modal state
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");

  // Custom topic modal state
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicMins, setNewTopicMins] = useState(45);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const activeChapters = chapters.filter((c) => c.subject_id === selectedSubjectId);
  const activeChapter = chapters.find((c) => c.id === selectedChapterId);
  const activeTopics = topics.filter((t) => t.chapter_id === selectedChapterId);
  const activeTopic = topics.find((t) => t.id === selectedTopicId);
  const activeMaterials = initialMaterials.filter((m) => m.topic_id === selectedTopicId);

  const handleToggleTopicCompletion = (topicId: string) => {
    setCompletedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleCreateCustomChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !selectedSubjectId) return;

    const newChap: Chapter = {
      id: `custom-chap-${Date.now()}`,
      subject_id: selectedSubjectId,
      title: newChapterTitle.trim(),
      description: newChapterDesc.trim() || null,
      order_index: activeChapters.length + 1,
      is_official: false,
      created_by: userId || "me",
      created_at: new Date().toISOString(),
    };

    setChapters((prev) => [...prev, newChap]);
    setSelectedChapterId(newChap.id);
    setNewChapterTitle("");
    setNewChapterDesc("");
    setShowAddChapter(false);
  };

  const handleDeleteChapter = (chapterId: string) => {
    const chap = chapters.find((c) => c.id === chapterId);
    if (!chap || chap.is_official) return; // Strict security check: cannot delete official chapters
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    setTopics((prev) => prev.filter((t) => t.chapter_id !== chapterId));
    if (selectedChapterId === chapterId) {
      const remaining = chapters.filter((c) => c.id !== chapterId && c.subject_id === selectedSubjectId);
      setSelectedChapterId(remaining[0]?.id || "");
    }
  };

  const handleCreateCustomTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !selectedChapterId) return;

    const newTop: Topic = {
      id: `custom-top-${Date.now()}`,
      chapter_id: selectedChapterId,
      title: newTopicTitle.trim(),
      description: newTopicDesc.trim() || null,
      estimated_minutes: newTopicMins,
      order_index: activeTopics.length + 1,
      is_official: false,
      created_by: userId || "me",
      created_at: new Date().toISOString(),
    };

    setTopics((prev) => [...prev, newTop]);
    setSelectedTopicId(newTop.id);
    setNewTopicTitle("");
    setNewTopicDesc("");
    setShowAddTopic(false);
  };

  const handleDeleteTopic = (topicId: string) => {
    const top = topics.find((t) => t.id === topicId);
    if (!top || top.is_official) return; // Strict security check: cannot delete official topics
    setTopics((prev) => prev.filter((t) => t.id !== topicId));
    if (selectedTopicId === topicId) {
      const remaining = topics.filter((t) => t.id !== topicId && t.chapter_id === selectedChapterId);
      setSelectedTopicId(remaining[0]?.id || "");
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Selector Bar */}
      {allExams && allExams.length > 0 && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Exam Course
              </span>
              <span className="text-xs font-bold text-slate-800">
                {activeExam?.title || "All Courses"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {allExams.map((ex) => (
              <button
                key={ex.id}
                onClick={() => router.push(`/syllabus?exam=${ex.id}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ex.id === activeExam?.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {ex.conducting_body}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {subjects.map((sub) => {
          const isSelected = sub.id === selectedSubjectId;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedSubjectId(sub.id);
                const subChaps = chapters.filter((c) => c.subject_id === sub.id);
                setSelectedChapterId(subChaps[0]?.id || "");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {sub.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chapters Column (Left: 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Chapters ({activeChapters.length})</span>
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="text-xs py-1 px-2.5 gap-1"
              onClick={() => setShowAddChapter(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chapter</span>
            </Button>
          </div>

          <div className="space-y-2">
            {activeChapters.map((chap) => {
              const isSelected = chap.id === selectedChapterId;
              const chapTopics = topics.filter((t) => t.chapter_id === chap.id);

              return (
                <div
                  key={chap.id}
                  onClick={() => {
                    setSelectedChapterId(chap.id);
                    const chTops = topics.filter((t) => t.chapter_id === chap.id);
                    setSelectedTopicId(chTops[0]?.id || "");
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-400"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-500">
                      {chap.is_official ? (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Lock className="w-3 h-3 text-slate-400" /> Official Chapter
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">Custom Student Chapter</span>
                      )}
                    </span>
                    {!chap.is_official && (
                      <button
                        title="Delete custom chapter"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(chap.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{chap.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span>{chapTopics.length} Topics</span>
                  </div>
                </div>
              );
            })}

            {activeChapters.length === 0 && (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-dashed">
                No chapters under this subject. Click "Add Chapter" to create your own!
              </div>
            )}
          </div>
        </div>

        {/* Topics Column (Center: 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Topics ({activeTopics.length})</span>
            </h3>
            {selectedChapterId && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs py-1 px-2.5 gap-1"
                onClick={() => setShowAddTopic(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Topic</span>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {activeTopics.map((top) => {
              const isSelected = top.id === selectedTopicId;
              const isCompleted = completedTopicIds.has(top.id);

              return (
                <div
                  key={top.id}
                  onClick={() => setSelectedTopicId(top.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {top.estimated_minutes} mins
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTopicCompletion(top.id);
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 transition-colors ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isCompleted ? "Completed" : "Mark Done"}</span>
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{top.title}</h4>

                  {!top.is_official && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                        Personal Study Topic
                      </span>
                      <button
                        title="Delete custom topic"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(top.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {activeTopics.length === 0 && (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-dashed">
                Select a chapter on the left to see topics.
              </div>
            )}
          </div>
        </div>

        {/* Study Materials & Notes Column (Right: 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Notes & Material</span>
            </h3>
          </div>

          {activeTopic ? (
            <Card className="p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <Badge variant={activeTopic.is_official ? "blue" : "amber"} size="sm" className="mb-2">
                  {activeTopic.is_official ? "Official Syllabus Topic" : "Student Custom Topic"}
                </Badge>
                <h4 className="text-base font-bold text-slate-900">{activeTopic.title}</h4>
                {activeTopic.description && (
                  <p className="text-xs text-slate-500 mt-1">{activeTopic.description}</p>
                )}
              </div>

              {activeMaterials.length > 0 ? (
                <div className="space-y-4">
                  {activeMaterials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{mat.title}</span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-white border rounded text-slate-600">
                          {mat.material_type}
                        </span>
                      </div>
                      <div className="text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                        {mat.content}
                      </div>
                      {mat.url && (
                        <a
                          href={mat.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline pt-1"
                        >
                          <span>Open Reference Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                  No reading notes uploaded for this topic yet. You can mark this topic complete after your self-study session.
                </div>
              )}
            </Card>
          ) : (
            <div className="p-8 bg-white rounded-xl border text-center text-xs text-slate-500">
              Select a topic to view structured study notes and reference materials.
            </div>
          )}
        </div>
      </div>

      {/* Add Chapter Modal */}
      {showAddChapter && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Create Custom Chapter</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add your own custom chapter to organize personal notes and revision topics under{" "}
              <span className="font-semibold text-slate-700">{activeSubject?.name}</span>.
            </p>
            <form onSubmit={handleCreateCustomChapter} className="space-y-4">
              <Input
                label="Chapter Title"
                required
                placeholder="e.g. Modern Odisha Personal Revision Notes"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
              />
              <Input
                label="Brief Description (Optional)"
                placeholder="Key highlights and reference chapters"
                value={newChapterDesc}
                onChange={(e) => setNewChapterDesc(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddChapter(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create Chapter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Add Custom Topic</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a personal study topic under chapter{" "}
              <span className="font-semibold text-slate-700">{activeChapter?.title}</span>.
            </p>
            <form onSubmit={handleCreateCustomTopic} className="space-y-4">
              <Input
                label="Topic Title"
                required
                placeholder="e.g. Odisha Economic Survey Summary"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
              />
              <Input
                label="Description"
                placeholder="Important points to memorize"
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
              />
              <Input
                label="Estimated Study Duration (Minutes)"
                type="number"
                min={5}
                max={360}
                value={newTopicMins}
                onChange={(e) => setNewTopicMins(Number(e.target.value))}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTopic(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create Topic
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
