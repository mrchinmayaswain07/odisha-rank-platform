/**
 * OdishaRank - Customizable Study Planner & Scheduling Logic
 * Pure business logic functions shared across Web and Mobile.
 * Completely client-side, zero paid dependencies, Supabase Free Tier friendly.
 */

import {
  StudentStudyGoal,
  PlannerTask,
  TimetableConfig,
  TimetableSlot,
  SubjectPriority,
  StudyPaceEstimate,
  Subject,
} from "./types";
import { getIndianDateStr, addDaysToIndianDate, getDaysDifference } from "./date-utils";

/**
 * Calculate accurate study pace, completed/remaining hours, and completion estimates.
 * Clearly indicates when data is insufficient (< 3 recorded study days).
 */
export function calculateStudyPace(params: {
  goal: StudentStudyGoal;
  completedHours: number;
  sessionDaysCount: number;
  recentDailyHours?: number[]; // e.g. last 7-14 days study hours
}): StudyPaceEstimate {
  const { goal, completedHours, sessionDaysCount, recentDailyHours = [] } = params;
  const targetTotal = Math.max(1, goal.target_total_hours || 300);
  const remainingHours = Math.max(0, Math.round((targetTotal - completedHours) * 10) / 10);
  const progressPct = Math.min(100, Math.round((completedHours / targetTotal) * 100));

  // Exam Countdown (IST calendar days)
  let daysToExam: number | null = null;
  if (goal.exam_date) {
    daysToExam = getDaysDifference(goal.exam_date);
  }

  // Required Daily Hours to hit exam deadline
  let requiredDailyHours: number | null = null;
  if (daysToExam !== null && daysToExam > 0) {
    requiredDailyHours = Math.round((remainingHours / daysToExam) * 10) / 10;
  }

  // Check if we have sufficient data to project (minimum 3 recorded active study days)
  const hasEnoughData = sessionDaysCount >= 3;

  if (!hasEnoughData) {
    return {
      has_enough_data: false,
      avg_daily_hours: 0,
      completed_hours: completedHours,
      remaining_hours: remainingHours,
      target_total_hours: targetTotal,
      progress_pct: progressPct,
      estimated_completion_date: null,
      days_to_exam: daysToExam,
      required_daily_hours: requiredDailyHours,
      pace_status: "insufficient_data",
      message: `Log at least 3 active study days to estimate completion date reliably (${sessionDaysCount}/3 days logged so far).`,
    };
  }

  // Calculate actual pace
  const validDays = recentDailyHours.filter((h) => h > 0);
  const avgPace =
    validDays.length > 0
      ? validDays.reduce((a, b) => a + b, 0) / validDays.length
      : completedHours / Math.max(1, sessionDaysCount);

  const roundedAvgPace = Math.round(avgPace * 10) / 10;

  if (roundedAvgPace <= 0.1) {
    return {
      has_enough_data: true,
      avg_daily_hours: roundedAvgPace,
      completed_hours: completedHours,
      remaining_hours: remainingHours,
      target_total_hours: targetTotal,
      progress_pct: progressPct,
      estimated_completion_date: null,
      days_to_exam: daysToExam,
      required_daily_hours: requiredDailyHours,
      pace_status: "behind",
      message: "Current pace is very low. Increase daily sessions to project a completion date.",
    };
  }

  // Projected Completion Date (Indian calendar days)
  const daysNeeded = Math.ceil(remainingHours / roundedAvgPace);
  const estimatedCompletionDate = addDaysToIndianDate(getIndianDateStr(), daysNeeded);

  // Pace status comparison
  let paceStatus: StudyPaceEstimate["pace_status"] = "on_track";
  let message = `At your current pace of ${roundedAvgPace} hrs/day, estimated completion is ${estimatedCompletionDate}.`;

  if (requiredDailyHours !== null) {
    if (roundedAvgPace >= requiredDailyHours * 1.05) {
      paceStatus = "ahead";
      message = `Ahead of schedule! Studying ${roundedAvgPace} hrs/day (required: ${requiredDailyHours} hrs/day).`;
    } else if (roundedAvgPace >= requiredDailyHours * 0.9) {
      paceStatus = "on_track";
      message = `On track for exam! Studying ${roundedAvgPace} hrs/day (required: ${requiredDailyHours} hrs/day).`;
    } else {
      paceStatus = "behind";
      message = `Behind target pace. Current pace is ${roundedAvgPace} hrs/day, but you need ${requiredDailyHours} hrs/day to finish before your exam date.`;
    }
  }

  return {
    has_enough_data: true,
    avg_daily_hours: roundedAvgPace,
    completed_hours: completedHours,
    remaining_hours: remainingHours,
    target_total_hours: targetTotal,
    progress_pct: progressPct,
    estimated_completion_date: estimatedCompletionDate,
    days_to_exam: daysToExam,
    required_daily_hours: requiredDailyHours,
    pace_status: paceStatus,
    message,
  };
}

/**
 * Generate editable timetable suggestions based on student commitments and preferred study windows.
 * Never forces a timetable; outputs a proposal for student review and customization.
 */
export function generateSuggestedTimetable(params: {
  dailyHours: number;
  preferredSlots: ("morning" | "afternoon" | "evening" | "late_night")[];
  commitments: { office_college_hours: number; days: string[] };
  restDays: string[];
  subjects: { id: string; name: string; priority: "high" | "medium" | "low" }[];
}): Record<string, TimetableSlot[]> {
  const { dailyHours, preferredSlots, commitments, restDays, subjects } = params;
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const result: Record<string, TimetableSlot[]> = {};

  const highPrioritySubs = subjects.filter((s) => s.priority === "high");
  const medPrioritySubs = subjects.filter((s) => s.priority === "medium");
  const lowPrioritySubs = subjects.filter((s) => s.priority === "low");
  const pool = [...highPrioritySubs, ...highPrioritySubs, ...medPrioritySubs, ...lowPrioritySubs, ...subjects];

  let poolIdx = 0;

  daysOfWeek.forEach((day) => {
    if (restDays.includes(day)) {
      result[day] = [
        {
          id: `slot-${day}-rest`,
          day,
          slot_type: "morning",
          start_time: "09:00",
          end_time: "10:00",
          category: "rest",
          label: "Rest & Active Recovery (Light revision or Brain Gym optional)",
          is_auto_generated: true,
        },
      ];
      return;
    }

    const isOfficeDay = commitments.days.includes(day) && commitments.office_college_hours > 0;
    const effectiveDailyHours = isOfficeDay ? Math.min(dailyHours, 4) : dailyHours;
    const slots: TimetableSlot[] = [];

    // Allocate across preferred slots
    if (preferredSlots.includes("morning")) {
      const sub = pool[poolIdx % pool.length];
      poolIdx++;
      slots.push({
        id: `slot-${day}-morning`,
        day,
        slot_type: "morning",
        start_time: "06:00",
        end_time: "07:30",
        subject_id: sub?.id,
        subject_name: sub?.name,
        category: "study",
        label: `Fresh Mind Deep Study • ${sub ? sub.name : "Concept Mastery"}`,
        is_auto_generated: true,
      });
    }

    if (preferredSlots.includes("afternoon") && !isOfficeDay) {
      const sub = pool[poolIdx % pool.length];
      poolIdx++;
      slots.push({
        id: `slot-${day}-afternoon`,
        day,
        slot_type: "afternoon",
        start_time: "14:00",
        end_time: "15:30",
        subject_id: sub?.id,
        subject_name: sub?.name,
        category: "practice",
        label: `Active MCQ Practice • ${sub ? sub.name : "Timed Questions"}`,
        is_auto_generated: true,
      });
    }

    if (preferredSlots.includes("evening")) {
      const sub = pool[poolIdx % pool.length];
      poolIdx++;
      slots.push({
        id: `slot-${day}-evening`,
        day,
        slot_type: "evening",
        start_time: "18:30",
        end_time: "20:00",
        subject_id: sub?.id,
        subject_name: sub?.name,
        category: "practice",
        label: `Topic Drills & PYQ Solving • ${sub ? sub.name : "High Yield"}`,
        is_auto_generated: true,
      });
    }

    if (preferredSlots.includes("late_night")) {
      slots.push({
        id: `slot-${day}-night`,
        day,
        slot_type: "late_night",
        start_time: "21:30",
        end_time: "22:30",
        category: "revision",
        label: "Day Recap, Brain Gym & Flashcard Revision",
        is_auto_generated: true,
      });
    }

    result[day] = slots;
  });

  return result;
}

/**
 * Spaced Repetition Next Date Calculator
 * Intervals: Day 1 (immediate), Day 3, Day 7, Day 21
 */
export function calculateNextRevisionDate(lastRevisedDate: string, currentStep: number): string {
  const intervals = [1, 3, 7, 21];
  const daysToAdd = intervals[Math.min(currentStep, intervals.length - 1)] || 7;
  const baseDateStr = lastRevisedDate ? getIndianDateStr(lastRevisedDate) : getIndianDateStr();
  return addDaysToIndianDate(baseDateStr, daysToAdd);
}

/**
 * Analyze subject performance to diagnose strengths, weaknesses, and recommend weekly study hour allocations.
 * Optional recommendations only: never overwrites user's manual priorities.
 */
export function analyzeSubjectPriorities(params: {
  subjects: Subject[];
  userPriorities?: SubjectPriority[];
  questionAttempts?: { subject_id?: string | null; is_correct: boolean }[];
  totalWeeklyHours?: number;
}): SubjectPriority[] {
  const { subjects, userPriorities = [], questionAttempts = [], totalWeeklyHours = 20 } = params;

  // Compute accuracy per subject
  const subjectAccuracyMap = new Map<string, { total: number; correct: number }>();
  questionAttempts.forEach((att) => {
    if (!att.subject_id) return;
    const curr = subjectAccuracyMap.get(att.subject_id) || { total: 0, correct: 0 };
    curr.total += 1;
    if (att.is_correct) curr.correct += 1;
    subjectAccuracyMap.set(att.subject_id, curr);
  });

  const priorityWeights = { high: 1.5, medium: 1.0, low: 0.6 };
  const userPriorityMap = new Map(userPriorities.map((p) => [p.subject_id, p]));

  // Build baseline list
  const evaluated = subjects.map((sub) => {
    const existing = userPriorityMap.get(sub.id);
    const stats = subjectAccuracyMap.get(sub.id);
    let accuracyPct: number | null = null;
    let needsAttention = false;

    if (stats && stats.total >= 5) {
      accuracyPct = Math.round((stats.correct / stats.total) * 100);
      if (accuracyPct < 60) {
        needsAttention = true;
      }
    }

    const priority = existing?.priority || (needsAttention ? "high" : "medium");

    return {
      subject_id: sub.id,
      subject_name: sub.name,
      priority,
      weekly_hours: existing?.weekly_hours || 0,
      accuracy_pct: accuracyPct,
      needs_attention: needsAttention,
    };
  });

  // Calculate suggested hours distribution based on priorities
  const totalWeight = evaluated.reduce((sum, item) => sum + (priorityWeights[item.priority] || 1), 0);
  const baseHoursPerWeight = totalWeight > 0 ? totalWeeklyHours / totalWeight : 2;

  return evaluated.map((item) => {
    const suggested = Math.round(baseHoursPerWeight * (priorityWeights[item.priority] || 1) * 2) / 2;
    return {
      ...item,
      weekly_hours: item.weekly_hours > 0 ? item.weekly_hours : suggested,
      suggested_hours: suggested,
    };
  });
}

/**
 * Reschedule missed tasks from previous dates to today or tomorrow without deleting progress.
 */
export function rescheduleMissedTasks(tasks: PlannerTask[], targetDate: string): PlannerTask[] {
  return tasks.map((task) => {
    if (task.status === "completed" || task.status === "skipped") {
      return task;
    }
    if (task.task_date < targetDate) {
      return {
        ...task,
        task_date: targetDate,
        rescheduled_from: task.rescheduled_from || task.task_date,
        updated_at: new Date().toISOString(),
      };
    }
    return task;
  });
}

/**
 * Filter syllabus topics by examination stage, completion status, or difficulty.
 */
export function filterSyllabusTopics<T extends { id: string; user_progress?: { status: string } }>(params: {
  topics: T[];
  customizations?: Map<string, { difficulty: string; stage: string; needs_revision: boolean }>;
  stageFilter?: "all" | "prelims" | "mains";
  statusFilter?: "all" | "incomplete" | "in_progress" | "completed" | "needs_revision" | "difficult";
}): T[] {
  const { topics, customizations = new Map(), stageFilter = "all", statusFilter = "all" } = params;

  return topics.filter((t) => {
    const custom = customizations.get(t.id);

    // Stage check
    if (stageFilter !== "all" && custom?.stage && custom.stage !== "both" && custom.stage !== stageFilter) {
      return false;
    }

    // Status / Difficulty check
    if (statusFilter === "all") return true;

    const isCompleted = t.user_progress?.status === "completed";
    const isInProgress = t.user_progress?.status === "in_progress";

    if (statusFilter === "completed") return isCompleted;
    if (statusFilter === "in_progress") return isInProgress;
    if (statusFilter === "incomplete") return !isCompleted;
    if (statusFilter === "needs_revision") return custom?.needs_revision === true;
    if (statusFilter === "difficult") return custom?.difficulty === "hard";

    return true;
  });
}
