"use client";

import React, { useState, useEffect } from "react";
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
  Target,
  Filter,
} from "lucide-react";
import {
  getStoredDailyGoal,
  saveStoredDailyGoal,
  GoalTask,
  getStoredTopicCustomizations,
  saveStoredTopicCustomization,
} from "@/lib/goal-storage";

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

  // Stage & Status filters
  const [stageFilter, setStageFilter] = useState<"all" | "prelims" | "mains">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "incomplete" | "completed" | "difficult">("all");
  const [topicCustomMap, setTopicCustomMap] = useState<Record<string, any>>(getStoredTopicCustomizations());
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Custom chapter modal state
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");

  // Custom topic modal state
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicMins, setNewTopicMins] = useState(45);

  // Restore custom chapters & topics on mount from localStorage
  useEffect(() => {
    try {
      const storedChaps = localStorage.getItem(`odisharank_custom_chaps_${userId || "user"}`);
      if (storedChaps) {
        const parsed = JSON.parse(storedChaps);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChapters((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newChaps = parsed.filter((c: Chapter) => !existingIds.has(c.id));
            return [...prev, ...newChaps];
          });
        }
      }

      const storedTops = localStorage.getItem(`odisharank_custom_tops_${userId || "user"}`);
      if (storedTops) {
        const parsedTops = JSON.parse(storedTops);
        if (Array.isArray(parsedTops) && parsedTops.length > 0) {
          setTopics((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newTops = parsedTops.filter((t: Topic) => !existingIds.has(t.id));
            return [...prev, ...newTops];
          });
        }
      }
    } catch {
      // Local storage unreadable
    }
  }, [userId]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const activeChapters = chapters.filter((c) => c.subject_id === selectedSubjectId);
  const activeChapter = chapters.find((c) => c.id === selectedChapterId);
  const activeTopics = topics.filter((t) => t.chapter_id === selectedChapterId);
  const activeTopic = topics.find((t) => t.id === selectedTopicId);
  const activeMaterials = initialMaterials.filter((m) => m.topic_id === selectedTopicId);

  // Filter topics by examination stage and status
  const filteredActiveTopics = activeTopics.filter((t) => {
    const custom = topicCustomMap[t.id];
    if (stageFilter !== "all" && custom?.stage && custom.stage !== "both" && custom.stage !== stageFilter) {
      return false;
    }
    const isCompleted = completedTopicIds.has(t.id);
    if (statusFilter === "completed") return isCompleted;
    if (statusFilter === "incomplete") return !isCompleted;
    if (statusFilter === "difficult") return custom?.difficulty === "hard";
    return true;
  });

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

  const handleAddTopicToDailyGoal = (topic: Topic) => {
    const goal = getStoredDailyGoal();
    const existing = goal.tasks.find((t) => t.topic_id === topic.id);
    if (existing) {
      setActionMessage(`"${topic.title}" is already in today's study plan!`);
      setTimeout(() => setActionMessage(null), 3500);
      return;
    }
    const newTask: GoalTask = {
      id: `gt-${topic.id}-${Date.now()}`,
      title: `${activeSubject?.name || "Subject"}: ${topic.title}`,
      completed: false,
      status: "not_started",
      priority: "high",
      category: "study",
      durationMinutes: topic.estimated_minutes || 45,
      targetDurationMinutes: topic.estimated_minutes || 45,
      subject_id: activeSubject?.id,
      subject_name: activeSubject?.name,
      topic_id: topic.id,
      topic_title: topic.title,
    };
    const updated = { ...goal, tasks: [newTask, ...goal.tasks] };
    saveStoredDailyGoal(updated);
    setActionMessage(`✨ Added "${topic.title}" to Today's Goal!`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleToggleDifficulty = (topicId: string, currentDiff?: string) => {
    const nextDiff = currentDiff === "hard" ? "easy" : currentDiff === "easy" ? "medium" : "hard";
    const custom = {
      topic_id: topicId,
      difficulty: nextDiff,
      stage: "both",
      needs_revision: nextDiff === "hard",
      updated_at: new Date().toISOString(),
    };
    saveStoredTopicCustomization(custom as any);
    setTopicCustomMap((prev) => ({ ...prev, [topicId]: custom }));
  };

  const handleCreateCustomChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;

    const newChap: Chapter = {
      id: `custom-chap-${Date.now()}`,
      subject_id: selectedSubjectId,
      title: newChapterTitle.trim(),
      description: newChapterDesc.trim() || null,
      order_index: chapters.length + 1,
      is_official: false,
      created_by: userId || null,
      created_at: new Date().toISOString(),
    };

    setChapters((prev) => {
      const next = [...prev, newChap];
      try {
        const customOnly = next.filter((c) => !c.is_official);
        localStorage.setItem(`odisharank_custom_chaps_${userId || "user"}`, JSON.stringify(customOnly));
      } catch {}
      return next;
    });

    setSelectedChapterId(newChap.id);
    setNewChapterTitle("");
    setNewChapterDesc("");
    setShowAddChapter(false);
  };

  const handleDeleteChapter = (chapterId: string) => {
    const chap = chapters.find((c) => c.id === chapterId);
    if (!chap || chap.is_official) {
      alert("Official chapters cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to delete chapter "${chap.title}"?`)) return;

    setChapters((prev) => {
      const next = prev.filter((c) => c.id !== chapterId);
      try {
        const customOnly = next.filter((c) => !c.is_official);
        localStorage.setItem(`odisharank_custom_chaps_${userId || "user"}`, JSON.stringify(customOnly));
      } catch {}
      return next;
    });

    setTopics((prev) => {
      const next = prev.filter((t) => t.chapter_id !== chapterId);
      try {
        const customOnly = next.filter((t) => !t.is_official);
        localStorage.setItem(`odisharank_custom_tops_${userId || "user"}`, JSON.stringify(customOnly));
      } catch {}
      return next;
    });

    if (selectedChapterId === chapterId) {
      const remaining = chapters.filter((c) => c.id !== chapterId && c.subject_id === selectedSubjectId);
      setSelectedChapterId(remaining[0]?.id || "");
    }
  };

  const handleCreateCustomTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    const newTop: Topic = {
      id: `custom-topic-${Date.now()}`,
      chapter_id: selectedChapterId,
      title: newTopicTitle.trim(),
      description: newTopicDesc.trim() || null,
      estimated_minutes: newTopicMins || 45,
      order_index: topics.length + 1,
      is_official: false,
      created_by: userId || null,
      created_at: new Date().toISOString(),
    };

    setTopics((prev) => {
      const next = [...prev, newTop];
      try {
        const customOnly = next.filter((t) => !t.is_official);
        localStorage.setItem(`odisharank_custom_tops_${userId || "user"}`, JSON.stringify(customOnly));
      } catch {}
      return next;
    });

    setSelectedTopicId(newTop.id);
    setNewTopicTitle("");
    setNewTopicDesc("");
    setShowAddTopic(false);
  };

  const handleDeleteTopic = (topicId: string) => {
    const top = topics.find((t) => t.id === topicId);
    if (!top || top.is_official) {
      alert("Official topics cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to delete topic "${top.title}"?`)) return;

    setTopics((prev) => {
      const next = prev.filter((t) => t.id !== topicId);
      try {
        const customOnly = next.filter((t) => !t.is_official);
        localStorage.setItem(`odisharank_custom_tops_${userId || "user"}`, JSON.stringify(customOnly));
      } catch {}
      return next;
    });

    if (selectedTopicId === topicId) {
      const remaining = topics.filter((t) => t.id !== topicId && t.chapter_id === selectedChapterId);
      setSelectedTopicId(remaining[0]?.id || "");
    }
  };

  return (
    <div className="space-y-6">
      {/* Exam Context Selector Bar */}
      {allExams.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Official Examination Syllabus
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {activeExam ? `${activeExam.title} (${activeExam.code})` : "All Odisha State Examinations"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {allExams.map((ex) => (
              <button
                key={ex.id}
                onClick={() => router.push(`/syllabus?exam=${ex.id}`)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeExam?.id === ex.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {ex.code || ex.conducting_body}
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

      {/* Stage and Difficulty Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Stage:
          </span>
          {(["all", "prelims", "mains"] as const).map((stage) => (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors ${
                stageFilter === stage
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {stage === "all" ? "All Stages" : stage}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Status:
          </span>
          {(["all", "incomplete", "completed", "difficult"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-black">×</button>
        </div>
      )}

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
                No chapters under this subject. Click &quot;Add Chapter&quot; to create your own!
              </div>
            )}
          </div>
        </div>

        {/* Topics Column (Center: 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Topics ({filteredActiveTopics.length})</span>
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
            {filteredActiveTopics.map((top) => {
              const isSelected = top.id === selectedTopicId;
              const isCompleted = completedTopicIds.has(top.id);
              const custom = topicCustomMap[top.id];

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

                  {/* Difficulty Tag and Add to Goal Action */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDifficulty(top.id, custom?.difficulty);
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize ${
                        custom?.difficulty === "hard"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : custom?.difficulty === "medium"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                      title="Click to toggle difficulty tag"
                    >
                      {custom?.difficulty || "Medium"}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddTopicToDailyGoal(top);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to Goal</span>
                    </button>
                  </div>

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

            {filteredActiveTopics.length === 0 && (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-dashed">
                {activeTopics.length === 0
                  ? "Select a chapter on the left to see topics."
                  : "No topics match the selected stage/status filters."}
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
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={activeTopic.is_official ? "blue" : "amber"} size="sm">
                    {activeTopic.is_official ? "Official Syllabus Topic" : "Student Custom Topic"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs py-1 px-2.5 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => handleAddTopicToDailyGoal(activeTopic)}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>+ Add to Goal</span>
                  </Button>
                </div>
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
