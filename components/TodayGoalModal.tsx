"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  X,
  CheckCircle2,
  Clock,
  HelpCircle,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Check,
  Calendar,
  Zap,
  RotateCcw,
  Pause,
  Play,
  ArrowRight,
  Brain,
  AlertCircle,
} from "lucide-react";
import {
  DailyGoal,
  GoalTask,
  getStoredDailyGoal,
  saveStoredDailyGoal,
  getTodayDateString,
  getStoredStudyGoal,
  saveStoredStudyGoal,
} from "@/lib/goal-storage";
import { calculateStudyPace, rescheduleMissedTasks } from "@odisha-rank/shared";

interface TodayGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayStudyHours?: number;
  todayQuestions?: number;
  activeCourseTitle?: string;
  onGoalUpdated?: (newGoal: DailyGoal) => void;
}

export const TodayGoalModal: React.FC<TodayGoalModalProps> = ({
  isOpen,
  onClose,
  todayStudyHours = 0,
  todayQuestions = 0,
  activeCourseTitle = "OSSC Combined Graduate Level",
  onGoalUpdated,
}) => {
  const [goal, setGoal] = useState<DailyGoal>(getStoredDailyGoal());
  const [studyGoal, setStudyGoal] = useState(getStoredStudyGoal());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<GoalTask["category"]>("study");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskDuration, setNewTaskDuration] = useState<number>(30);
  const [savedBadge, setSavedBadge] = useState(false);
  const [activeTab, setActiveTab] = useState<"daily" | "overall">("daily");

  useEffect(() => {
    if (isOpen) {
      setGoal(getStoredDailyGoal());
      setStudyGoal(getStoredStudyGoal());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (updatedGoal: DailyGoal) => {
    setGoal(updatedGoal);
    saveStoredDailyGoal(updatedGoal);
    if (onGoalUpdated) onGoalUpdated(updatedGoal);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  const handleSaveOverallGoal = (updates: Partial<typeof studyGoal>) => {
    const updated = { ...studyGoal, ...updates, updated_at: new Date().toISOString() };
    setStudyGoal(updated);
    saveStoredStudyGoal(updated);
    const updatedDaily = {
      ...goal,
      targetStudyHours: updated.daily_target_hours,
      targetTotalHours: updated.target_total_hours,
      dailyTopicsTarget: updated.daily_topics_target,
      examDate: updated.exam_date,
      status: updated.status,
    };
    handleSave(updatedDaily);
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = goal.tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          status: (nextCompleted ? "completed" : "in_progress") as GoalTask["status"],
        };
      }
      return t;
    });
    handleSave({ ...goal, tasks: updatedTasks });
  };

  const handleCycleStatus = (taskId: string) => {
    const statuses: GoalTask["status"][] = ["not_started", "in_progress", "completed", "skipped"];
    const updatedTasks = goal.tasks.map((t) => {
      if (t.id === taskId) {
        const curr = t.status || (t.completed ? "completed" : "not_started");
        const nextIdx = (statuses.indexOf(curr) + 1) % statuses.length;
        const nextStatus = statuses[nextIdx];
        return {
          ...t,
          status: nextStatus,
          completed: nextStatus === "completed",
        };
      }
      return t;
    });
    handleSave({ ...goal, tasks: updatedTasks });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: GoalTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      status: "not_started",
      priority: newTaskPriority,
      category: newTaskCategory,
      durationMinutes: newTaskDuration,
      targetDurationMinutes: newTaskDuration,
    };

    handleSave({ ...goal, tasks: [...goal.tasks, newTask] });
    setNewTaskTitle("");
  };

  const handleDeleteTask = (taskId: string) => {
    handleSave({ ...goal, tasks: goal.tasks.filter((t) => t.id !== taskId) });
  };

  const handleReschedule = () => {
    const today = getTodayDateString();
    const rescheduled = rescheduleMissedTasks(
      goal.tasks.map((t) => ({
        ...t,
        task_date: goal.date,
        duration_minutes: t.durationMinutes || 30,
        target_duration_minutes: t.targetDurationMinutes || 30,
        status: t.status || (t.completed ? "completed" : "not_started"),
        priority: t.priority || "medium",
        order_index: 0,
      })),
      today
    );
    const convertedTasks: GoalTask[] = rescheduled.map((t) => ({
      ...t,
      durationMinutes: t.duration_minutes,
      targetDurationMinutes: t.target_duration_minutes,
      completed: t.status === "completed",
    }));
    handleSave({ ...goal, tasks: convertedTasks });
  };

  // Calculations & Study Pace
  const paceEstimate = calculateStudyPace({
    goal: studyGoal,
    completedHours: todayStudyHours + 12.5, // Total historical study hours
    sessionDaysCount: 4, // Multi-day baseline
    recentDailyHours: [2.5, 3.0, 3.5, todayStudyHours],
  });

  const hoursProgress = Math.min(100, Math.round((todayStudyHours / (goal.targetStudyHours || 1)) * 100));
  const questionsProgress = Math.min(
    100,
    Math.round((todayQuestions / (goal.targetQuestions || 1)) * 100)
  );
  const completedTasksCount = goal.tasks.filter((t) => t.completed || t.status === "completed").length;
  const tasksProgress =
    goal.tasks.length > 0
      ? Math.round((completedTasksCount / goal.tasks.length) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-xl max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Customizable Study Goal Planner</h2>
                {savedBadge && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {activeCourseTitle} • Tailored to your availability
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Daily Plan vs Overall Goals */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/50 gap-4">
          <button
            onClick={() => setActiveTab("daily")}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === "daily" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Today's Target & Tasks
            {activeTab === "daily" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("overall")}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === "overall" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Total Goal & Exam Deadline
            {activeTab === "overall" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "daily" ? (
            <>
              {/* Daily Target Selectors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    1. Daily Target Targets
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Goal Status:</span>
                    <select
                      value={goal.status || "active"}
                      onChange={(e) => handleSaveOverallGoal({ status: e.target.value as any })}
                      className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="reset">Reset</option>
                    </select>
                  </div>
                </div>

                {/* Target Study Hours */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Daily Target Study Hours
                    </span>
                    <span className="text-xs font-black text-blue-600 font-mono">
                      {goal.targetStudyHours} hrs / day
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 6, 8].map((hrs) => (
                      <button
                        key={hrs}
                        onClick={() => {
                          handleSave({ ...goal, targetStudyHours: hrs });
                          handleSaveOverallGoal({ daily_target_hours: hrs });
                        }}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          goal.targetStudyHours === hrs
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {hrs}h
                      </button>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Logged today: {todayStudyHours} hrs</span>
                      <span>{hoursProgress}% completed</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${hoursProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Target Questions to Practice */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                      Daily Target Questions (MCQs)
                    </span>
                    <span className="text-xs font-black text-purple-600 font-mono">
                      {goal.targetQuestions} MCQs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[20, 30, 50, 75, 100].map((count) => (
                      <button
                        key={count}
                        onClick={() => handleSave({ ...goal, targetQuestions: count })}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          goal.targetQuestions === count
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    2. Today's Action Tasks ({completedTasksCount}/{goal.tasks.length})
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReschedule}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      title="Move uncompleted tasks to today"
                    >
                      <RotateCcw className="w-3 h-3" /> Reschedule
                    </button>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      {tasksProgress}% Done
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {goal.tasks.map((task) => {
                    const isDone = task.completed || task.status === "completed";
                    const isSkipped = task.status === "skipped";
                    const isInProgress = task.status === "in_progress";

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isDone
                            ? "bg-emerald-50/60 border-emerald-200 text-slate-400"
                            : isSkipped
                            ? "bg-slate-100/60 border-slate-200 text-slate-400"
                            : isInProgress
                            ? "bg-blue-50/60 border-blue-200 text-slate-800"
                            : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTask(task.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-xs font-semibold select-none block truncate ${
                                isDone
                                  ? "line-through text-slate-400"
                                  : isSkipped
                                  ? "italic text-slate-400"
                                  : "text-slate-800"
                              }`}
                            >
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {task.durationMinutes && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  ⏱ {task.durationMinutes}m
                                </span>
                              )}
                              {task.priority && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    task.priority === "high"
                                      ? "bg-rose-100 text-rose-700"
                                      : task.priority === "medium"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              )}
                              {task.status && (
                                <button
                                  type="button"
                                  onClick={() => handleCycleStatus(task.id)}
                                  className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                                >
                                  {task.status.replace("_", " ")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider">
                            {task.category}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Task Form */}
                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title (e.g. OSSC CGL History Chapter 3 revision)"
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value as any)}
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="study">Study</option>
                      <option value="practice">Practice MCQs</option>
                      <option value="mock">Mock Test</option>
                      <option value="revision">Revision</option>
                      <option value="braingym">Brain Gym</option>
                    </select>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="high">High</option>
                      <option value="medium">Med</option>
                      <option value="low">Low</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* Overall Goals Tab */
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-600" />
                    Total Preparation Hours Target
                  </span>
                  <span className="text-xs font-black text-blue-600 font-mono">
                    {studyGoal.target_total_hours} Hours Total
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[150, 300, 500, 750, 1000].map((tot) => (
                    <button
                      key={tot}
                      onClick={() => handleSaveOverallGoal({ target_total_hours: tot })}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        studyGoal.target_total_hours === tot
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {tot}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Exam Date */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Target Exam Date
                  </span>
                  {paceEstimate.days_to_exam !== null && (
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {paceEstimate.days_to_exam} Days Left
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={studyGoal.exam_date || ""}
                  onChange={(e) => handleSaveOverallGoal({ exam_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Study Pace Calculation Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Estimated Completion Projection
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      paceEstimate.pace_status === "ahead"
                        ? "bg-emerald-100 text-emerald-800"
                        : paceEstimate.pace_status === "on_track"
                        ? "bg-blue-100 text-blue-800"
                        : paceEstimate.pace_status === "insufficient_data"
                        ? "bg-slate-200 text-slate-600"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {paceEstimate.pace_status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{paceEstimate.message}</p>
                {paceEstimate.required_daily_hours && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
                    <span>Required to finish by exam:</span>
                    <strong className="text-slate-800">{paceEstimate.required_daily_hours} hrs/day</strong>
                  </div>
                )}
              </div>

              {/* Reset or Pause Goal Controls */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSaveOverallGoal({
                      status: studyGoal.status === "paused" ? "active" : "paused",
                    })
                  }
                  className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  {studyGoal.status === "paused" ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-600" /> Resume Goal
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-600" /> Pause Goal
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset your study goal? Your logged session history will remain intact.")) {
                      handleSaveOverallGoal({
                        target_total_hours: 300,
                        daily_target_hours: 3,
                        status: "reset",
                      });
                    }
                  }}
                  className="py-2 px-3 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Changes save instantly to your personal study plan.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
