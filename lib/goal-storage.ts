import {
  StudentStudyGoal,
  PlannerTask,
  TimetableConfig,
  SubjectPriority,
  TopicCustomization,
  GoalStatus,
  TaskCategory,
  TaskStatus,
  TaskPriority,
} from "@odisha-rank/shared";
import { createClient } from "./supabase/client";

export interface GoalTask {
  id: string;
  title: string;
  completed: boolean;
  category: TaskCategory;
  durationMinutes?: number;
  targetDurationMinutes?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  exam_id?: string | null;
  subject_id?: string | null;
  subject_name?: string | null;
  topic_id?: string | null;
  topic_title?: string | null;
  notes?: string | null;
  deadline_time?: string | null;
  rescheduled_from?: string | null;
}

export interface DailyGoal {
  date: string; // YYYY-MM-DD
  targetStudyHours: number;
  targetQuestions: number;
  targetSubjects: number;
  targetTotalHours?: number;
  dailyTopicsTarget?: number;
  examDate?: string | null;
  status?: GoalStatus;
  notes?: string;
  tasks: GoalTask[];
}

export const DEFAULT_TASKS: GoalTask[] = [
  {
    id: "task-1",
    title: "Review Indian Polity & Odisha Special Notes",
    completed: false,
    status: "not_started",
    priority: "high",
    category: "study",
    durationMinutes: 45,
    targetDurationMinutes: 45,
  },
  {
    id: "task-2",
    title: "Practice 25 MCQs on Quantitative Aptitude",
    completed: false,
    status: "not_started",
    priority: "high",
    category: "practice",
    durationMinutes: 30,
    targetDurationMinutes: 30,
  },
  {
    id: "task-3",
    title: "⚡ Speed Math & BODMAS Sprint (Brain Gym)",
    completed: false,
    status: "not_started",
    priority: "medium",
    category: "braingym",
    durationMinutes: 20,
    targetDurationMinutes: 20,
  },
  {
    id: "task-4",
    title: "Read Odisha Current Affairs & GK Highlights",
    completed: false,
    status: "not_started",
    priority: "medium",
    category: "revision",
    durationMinutes: 30,
    targetDurationMinutes: 30,
  },
  {
    id: "task-5",
    title: "Attempt 1 Daily Mini Mock Test",
    completed: false,
    status: "not_started",
    priority: "medium",
    category: "mock",
    durationMinutes: 25,
    targetDurationMinutes: 25,
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function getDefaultStudyGoal(userId: string = "local_student"): StudentStudyGoal {
  // Target date default: 60 days ahead
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 60);

  return {
    user_id: userId,
    target_total_hours: 300,
    daily_target_hours: 3,
    weekly_target_hours: 20,
    daily_topics_target: 3,
    exam_date: targetDate.toISOString().split("T")[0],
    status: "active",
    timetable_config: {
      preferred_slots: ["morning", "evening", "late_night"],
      slot_timings: {
        morning: { start: "06:00", end: "08:30" },
        afternoon: { start: "14:00", end: "16:00" },
        evening: { start: "18:30", end: "20:30" },
        late_night: { start: "21:30", end: "23:00" },
      },
      commitments: {
        office_college_hours: 8,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        notes: "College / Office schedule",
      },
      rest_days: ["Sunday"],
      break_minutes: 15,
      overtime_allowed: true,
      weekly_schedule: {},
    },
    learning_preferences: {
      language: "en",
      revision_system: "spaced_repetition",
      spaced_intervals: [1, 3, 7, 21],
      daily_reminder_enabled: true,
      reminder_time: "07:00",
      quiet_hours: { start: "23:00", end: "06:00" },
    },
    notification_settings: {
      task_reminders: true,
      revision_alerts: true,
      daily_goal_prompt: true,
      streak_warning: true,
      sound_enabled: true,
      reminder_time: "07:00",
      quiet_hours_start: "23:00",
      quiet_hours_end: "06:00",
    },
  };
}

export function getDefaultDailyGoal(dateStr?: string): DailyGoal {
  const goal = getDefaultStudyGoal();
  return {
    date: dateStr || getTodayDateString(),
    targetStudyHours: goal.daily_target_hours,
    targetQuestions: 50,
    targetSubjects: 2,
    targetTotalHours: goal.target_total_hours,
    dailyTopicsTarget: goal.daily_topics_target,
    examDate: goal.exam_date,
    status: goal.status,
    notes: "Stay consistent and score top rank in Odisha government examinations!",
    tasks: DEFAULT_TASKS,
  };
}

const STORAGE_KEY_PREFIX = "odisharank_daily_goal_";
const STUDY_GOAL_KEY = "odisharank_study_goal";
const TIMETABLE_KEY = "odisharank_timetable_config";
const PRIORITIES_KEY = "odisharank_subject_priorities";
const TOPIC_CUSTOM_KEY = "odisharank_topic_customizations";

export function getStoredDailyGoal(): DailyGoal {
  if (typeof window === "undefined") {
    return getDefaultDailyGoal();
  }

  const today = getTodayDateString();
  const key = `${STORAGE_KEY_PREFIX}${today}`;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today && Array.isArray(parsed.tasks)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading daily goal:", err);
  }

  const defaultGoal = getDefaultDailyGoal(today);
  try {
    localStorage.setItem(key, JSON.stringify(defaultGoal));
  } catch {}
  return defaultGoal;
}

export function saveStoredDailyGoal(goal: DailyGoal): void {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_KEY_PREFIX}${goal.date}`;
  try {
    localStorage.setItem(key, JSON.stringify(goal));
    // Dispatch custom event so other components on page react immediately
    window.dispatchEvent(new CustomEvent("daily-goal-updated", { detail: goal }));
    window.dispatchEvent(new CustomEvent("study-planner-updated", { detail: goal }));
  } catch (err) {
    console.error("Error saving daily goal:", err);
  }

  // Background sync with Supabase if online
  syncGoalToSupabase(goal);
}

export function getStoredStudyGoal(userId?: string): StudentStudyGoal {
  if (typeof window === "undefined") {
    return getDefaultStudyGoal(userId);
  }

  try {
    const raw = localStorage.getItem(STUDY_GOAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.target_total_hours) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading study goal:", err);
  }

  const def = getDefaultStudyGoal(userId);
  try {
    localStorage.setItem(STUDY_GOAL_KEY, JSON.stringify(def));
  } catch {}
  return def;
}

export function saveStoredStudyGoal(goal: StudentStudyGoal): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STUDY_GOAL_KEY, JSON.stringify(goal));
    window.dispatchEvent(new CustomEvent("study-goal-updated", { detail: goal }));
    window.dispatchEvent(new CustomEvent("study-planner-updated", { detail: goal }));
  } catch (err) {
    console.error("Error saving study goal:", err);
  }

  // Also update today's goal values
  const todayGoal = getStoredDailyGoal();
  todayGoal.targetStudyHours = goal.daily_target_hours;
  todayGoal.targetTotalHours = goal.target_total_hours;
  todayGoal.dailyTopicsTarget = goal.daily_topics_target;
  todayGoal.examDate = goal.exam_date;
  todayGoal.status = goal.status;
  saveStoredDailyGoal(todayGoal);
}

export function getStoredTimetableConfig(): TimetableConfig {
  const goal = getStoredStudyGoal();
  if (goal.timetable_config && Object.keys(goal.timetable_config).length > 0) {
    return goal.timetable_config;
  }
  return getDefaultStudyGoal().timetable_config!;
}

export function saveStoredTimetableConfig(cfg: TimetableConfig): void {
  const goal = getStoredStudyGoal();
  goal.timetable_config = cfg;
  saveStoredStudyGoal(goal);
}

export function getStoredSubjectPriorities(): SubjectPriority[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PRIORITIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveStoredSubjectPriorities(priorities: SubjectPriority[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRIORITIES_KEY, JSON.stringify(priorities));
    window.dispatchEvent(new CustomEvent("subject-priorities-updated", { detail: priorities }));
  } catch {}
}

export function getStoredTopicCustomizations(): Record<string, TopicCustomization> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TOPIC_CUSTOM_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveStoredTopicCustomization(customization: TopicCustomization): void {
  if (typeof window === "undefined") return;
  try {
    const map = getStoredTopicCustomizations();
    map[customization.topic_id] = customization;
    localStorage.setItem(TOPIC_CUSTOM_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("topic-customization-updated", { detail: customization }));
  } catch {}
}

/**
 * Background sync helper to save goal and tasks to Supabase when possible.
 * Fails silently to protect Supabase Free tier quota and offline usage.
 */
async function syncGoalToSupabase(goal: DailyGoal) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    const userId = session.user.id;

    // 1. Sync study goal
    await supabase.from("student_study_goals").upsert(
      {
        user_id: userId,
        target_total_hours: goal.targetTotalHours || 300,
        daily_target_hours: goal.targetStudyHours || 3,
        daily_topics_target: goal.dailyTopicsTarget || 3,
        exam_date: goal.examDate || null,
        status: goal.status || "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    // Non-blocking fallback
  }
}
