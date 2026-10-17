export interface GoalTask {
  id: string;
  title: string;
  completed: boolean;
  category: "study" | "practice" | "mock" | "revision";
  durationMinutes?: number;
}

export interface DailyGoal {
  date: string; // YYYY-MM-DD
  targetStudyHours: number;
  targetQuestions: number;
  targetSubjects: number;
  notes?: string;
  tasks: GoalTask[];
}

const DEFAULT_TASKS: GoalTask[] = [
  {
    id: "task-1",
    title: "Review Indian Polity & Odisha Special Notes",
    completed: false,
    category: "study",
    durationMinutes: 45,
  },
  {
    id: "task-2",
    title: "Practice 25 MCQs on Quantitative Aptitude",
    completed: false,
    category: "practice",
    durationMinutes: 30,
  },
  {
    id: "task-3",
    title: "Read Odisha Current Affairs & GK Highlights",
    completed: false,
    category: "revision",
    durationMinutes: 30,
  },
  {
    id: "task-4",
    title: "Attempt 1 Daily Mini Mock Test",
    completed: false,
    category: "mock",
    durationMinutes: 20,
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function getDefaultDailyGoal(dateStr?: string): DailyGoal {
  return {
    date: dateStr || getTodayDateString(),
    targetStudyHours: 2,
    targetQuestions: 50,
    targetSubjects: 2,
    notes: "Stay consistent and score top rank in Odisha government examinations!",
    tasks: DEFAULT_TASKS,
  };
}

const STORAGE_KEY_PREFIX = "odisharank_daily_goal_";

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
  } catch (err) {
    console.error("Error saving daily goal:", err);
  }
}
