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
} from "lucide-react";
import {
  DailyGoal,
  GoalTask,
  getStoredDailyGoal,
  saveStoredDailyGoal,
  getTodayDateString,
} from "@/lib/goal-storage";

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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<GoalTask["category"]>("study");
  const [savedBadge, setSavedBadge] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGoal(getStoredDailyGoal());
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

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = goal.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updated = { ...goal, tasks: updatedTasks };
    handleSave(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: GoalTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      category: newTaskCategory,
      durationMinutes: 30,
    };

    const updated = { ...goal, tasks: [...goal.tasks, newTask] };
    handleSave(updated);
    setNewTaskTitle("");
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = { ...goal, tasks: goal.tasks.filter((t) => t.id !== taskId) };
    handleSave(updated);
  };

  // Calculations
  const hoursProgress = Math.min(100, Math.round((todayStudyHours / (goal.targetStudyHours || 1)) * 100));
  const questionsProgress = Math.min(
    100,
    Math.round((todayQuestions / (goal.targetQuestions || 1)) * 100)
  );
  const completedTasksCount = goal.tasks.filter((t) => t.completed).length;
  const tasksProgress =
    goal.tasks.length > 0
      ? Math.round((completedTasksCount / goal.tasks.length) * 100)
      : 0;

  const overallGoalAchieved =
    todayStudyHours >= goal.targetStudyHours &&
    todayQuestions >= goal.targetQuestions &&
    completedTasksCount >= Math.min(2, goal.tasks.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Set Today's Target Goal</h2>
                {savedBadge && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {activeCourseTitle} • Daily Consistency Tracker
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Target Targets Selectors */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Customize Today's Targets
            </h3>

            {/* Target Study Hours */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Target Study Hours
                </span>
                <span className="text-xs font-black text-blue-600 font-mono">
                  {goal.targetStudyHours} hrs
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 6].map((hrs) => (
                  <button
                    key={hrs}
                    onClick={() => handleSave({ ...goal, targetStudyHours: hrs })}
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
                  <span>Current: {todayStudyHours} hrs</span>
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
                  Target Practice Questions
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
              {/* Progress bar */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Current: {todayQuestions} solved</span>
                  <span>{questionsProgress}% completed</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${questionsProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Target Subjects to Complete */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Target Subjects / Topics
                </span>
                <span className="text-xs font-black text-emerald-600 font-mono">
                  {goal.targetSubjects} subjects
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleSave({ ...goal, targetSubjects: count })}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      goal.targetSubjects === count
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Action Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Today's Action Checklist ({completedTasksCount}/{goal.tasks.length})
              </h3>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                {tasksProgress}% Done
              </span>
            </div>

            <div className="space-y-2">
              {goal.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    task.completed
                      ? "bg-emerald-50/60 border-emerald-200 text-slate-400"
                      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span
                      className={`text-xs font-semibold select-none ${
                        task.completed ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {task.title}
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
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
              ))}
            </div>

            {/* Add Custom Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add custom task (e.g. Revise Computer Awareness Chapter 2)"
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as any)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="study">Study</option>
                <option value="practice">Practice</option>
                <option value="mock">Mock Test</option>
                <option value="revision">Revision</option>
              </select>
              <button
                type="submit"
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Motivational Quote & Streak Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-amber-950">
                ନିରନ୍ତର ଅଭ୍ୟାସ ହିଁ ସଫଳତାର ଚାବିକାଠି
              </div>
              <div className="text-amber-800/80 mt-0.5">
                "Continuous daily effort is the key to cracking Odisha civil and competitive ranks."
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Goal updates sync automatically to your dashboard banner.
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
