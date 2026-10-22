export type UserRole = "student" | "admin" | "moderator";

export type ContentStatus = "draft" | "published" | "archived";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  target_exam_id: string | null;
  target_year: number;
  district: string | null;
  phone: string | null;
  bio: string | null;
  is_profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamStage {
  name: string;
  marks: number;
  type: string;
}

export interface Exam {
  id: string;
  slug: string;
  title: string;
  conducting_body: string;
  description: string;
  eligibility: string | null;
  stages: ExamStage[];
  is_active: boolean;
  status?: ContentStatus;
  students_count?: number;
  created_at: string;
}

export interface Subject {
  id: string;
  exam_id: string;
  name: string;
  code: string | null;
  description: string | null;
  order_index: number;
  status?: ContentStatus;
  created_at: string;
  chapters_count?: number;
  topics_count?: number;
  completed_topics_count?: number;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_official: boolean;
  status?: ContentStatus;
  created_by: string | null;
  created_at: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  order_index: number;
  is_official: boolean;
  status?: ContentStatus;
  created_by: string | null;
  created_at: string;
  user_progress?: {
    status: "not_started" | "in_progress" | "completed";
    completed_at: string | null;
    last_studied_at: string;
    confidence_rating: number | null;
  };
}

export interface StudyMaterial {
  id: string;
  topic_id: string;
  title: string;
  material_type: "text" | "link" | "summary" | "note" | "pdf";
  content: string;
  url: string | null;
  file_url?: string | null;
  file_size?: number;
  category?: string;
  description?: string | null;
  status?: ContentStatus;
  is_official: boolean;
  created_by: string | null;
  exam_id?: string | null;
  subject_id?: string | null;
  chapter_id?: string | null;
  published_at?: string;
  created_at: string;
}

export interface StudentTopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  status: "not_started" | "in_progress" | "completed";
  completed_at: string | null;
  last_studied_at: string;
  confidence_rating: number | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  topic_id: string | null;
  subject_id: string | null;
  duration_minutes: number;
  notes: string | null;
  session_date: string;
  created_at: string;
}

export interface Question {
  id: string;
  exam_id: string | null;
  subject_id: string | null;
  chapter_id?: string | null;
  topic_id: string | null;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  marks?: number;
  negative_marks?: number;
  status?: ContentStatus;
  is_sample: boolean;
  created_by: string | null;
  created_at: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_index: number;
  is_correct: boolean;
  time_taken_seconds: number;
  created_at: string;
}

export interface MockTest {
  id: string;
  exam_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  negative_marking: number;
  pass_percentage: number;
  is_published: boolean;
  status?: ContentStatus;
  created_at: string;
  questions_count?: number;
}

export interface MockTestAttempt {
  id: string;
  mock_test_id: string;
  user_id: string;
  status: "in_progress" | "completed" | "abandoned";
  score: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  accuracy: number;
  time_spent_seconds: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface MockTestAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_index: number | null;
  is_correct: boolean | null;
  marks_awarded: number;
}

export interface StudentActivity {
  id: string;
  user_id: string;
  activity_type: "topic_completed" | "question_attempted" | "mock_test_completed" | "study_session_logged" | "profile_updated";
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface DashboardMetrics {
  study_hours: number;
  study_hours_today?: number;
  study_hours_yesterday?: number;
  study_hours_delta_pct?: number;
  questions_practiced: number;
  questions_practiced_today?: number;
  questions_practiced_yesterday?: number;
  questions_delta_pct?: number;
  accuracy_percentage?: number;
  accuracy_today?: number;
  accuracy_this_week?: number;
  accuracy_last_week?: number;
  accuracy_delta_pct?: number;
  mock_tests_completed: number;
  mock_tests_this_month?: number;
  mock_tests_sparkline?: number[];
  sparkline_study_hours?: number[];
  sparkline_questions?: number[];
  study_streak_days: number;
  official_progress_percentage: number;
  personal_progress_percentage: number;
  total_official_topics: number;
  completed_official_topics: number;
  total_personal_topics: number;
  completed_personal_topics: number;
  recent_activities: StudentActivity[];
  subject_progress: {
    subject_id: string;
    subject_name: string;
    total_topics: number;
    completed_topics: number;
    progress_percentage: number;
  }[];
  weekly_stats?: {
    date: string;
    dayLabel: string;
    questionsCount: number;
    accuracyPercentage: number;
  }[];
  monthly_stats?: {
    date: string;
    dayLabel: string;
    questionsCount: number;
    accuracyPercentage: number;
  }[];
  recommended_topics?: {
    topic_id: string;
    topic_title: string;
    subject_id: string;
    subject_name: string;
    estimated_minutes: number;
  }[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminDashboardStats {
  total_students: number;
  total_courses: number;
  total_subjects: number;
  total_chapters: number;
  total_topics: number;
  total_materials: number;
  total_questions: number;
  total_mock_tests: number;
  recent_activities: StudentActivity[];
}

export interface StudentListItem {
  id: string;
  email: string | null;
  full_name: string;
  target_exam_id: string | null;
  target_exam_title?: string;
  target_year: number;
  district: string | null;
  phone: string | null;
  role: UserRole;
  is_profile_completed: boolean;
  created_at: string;
}

export type DoubtStatus = "pending" | "answered" | "resolved";

export interface StudentDoubt {
  id: string;
  user_id: string;
  student_name: string;
  student_email?: string;
  subject: string;
  exam_id?: string | null;
  question: string;
  answer?: string | null;
  answered_by?: string | null;
  answered_at?: string | null;
  status: DoubtStatus;
  is_private: boolean;
  upvotes: number;
  is_notified?: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CUSTOMIZABLE STUDY PLANNER & EXAM PREPARATION SYSTEM TYPES
// ============================================================

export type GoalStatus = "active" | "paused" | "completed" | "reset";
export type TaskCategory = "study" | "practice" | "mock" | "revision" | "braingym" | "custom";
export type TaskStatus = "not_started" | "in_progress" | "completed" | "skipped";
export type TaskPriority = "high" | "medium" | "low";
export type TopicDifficulty = "easy" | "medium" | "hard";
export type ExamStageType = "prelims" | "mains" | "both";

export interface PlannerTask {
  id: string;
  user_id?: string;
  task_date: string; // YYYY-MM-DD
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  duration_minutes: number;
  target_duration_minutes: number;
  exam_id?: string | null;
  subject_id?: string | null;
  subject_name?: string | null;
  chapter_id?: string | null;
  topic_id?: string | null;
  topic_title?: string | null;
  notes?: string | null;
  deadline_time?: string | null;
  order_index?: number;
  rescheduled_from?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TimetableSlot {
  id: string;
  day: string; // "Monday", "Tuesday", etc. or "Weekday" | "Weekend"
  slot_type: "morning" | "afternoon" | "evening" | "late_night";
  start_time: string; // "06:00"
  end_time: string;   // "08:30"
  subject_id?: string;
  subject_name?: string;
  category: TaskCategory | "rest";
  label: string;
  is_auto_generated: boolean;
}

export interface TimetableConfig {
  preferred_slots: ("morning" | "afternoon" | "evening" | "late_night")[];
  slot_timings: {
    morning: { start: string; end: string };
    afternoon: { start: string; end: string };
    evening: { start: string; end: string };
    late_night: { start: string; end: string };
  };
  commitments: {
    office_college_hours: number;
    days: string[];
    notes?: string;
  };
  rest_days: string[];
  break_minutes: number;
  overtime_allowed: boolean;
  weekly_schedule: Record<string, TimetableSlot[]>;
  weekly_slots?: Record<string, TimetableSlot[]>;
}

export interface SubjectPriority {
  subject_id: string;
  subject_name: string;
  priority: TaskPriority;
  weekly_hours: number;
  suggested_hours?: number;
  accuracy_pct?: number | null;
  needs_attention?: boolean;
}

export interface TopicCustomization {
  topic_id: string;
  difficulty: TopicDifficulty;
  priority: TaskPriority;
  stage: ExamStageType;
  estimated_hours: number;
  personal_notes?: string;
  needs_revision: boolean;
  last_revised_at?: string | null;
  next_revision_date?: string | null;
}

export interface LearningPreferences {
  language: "en" | "or" | "bilingual";
  revision_system: "spaced_repetition" | "weekly" | "custom";
  spaced_intervals: number[]; // e.g. [1, 3, 7, 21]
  daily_reminder_enabled: boolean;
  reminder_time: string; // "07:00"
  quiet_hours: { start: string; end: string };
}

export interface NotificationSettings {
  task_reminders: boolean;
  revision_alerts: boolean;
  daily_goal_prompt: boolean;
  streak_warning: boolean;
  sound_enabled: boolean;
  reminder_time: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface StudentStudyGoal {
  id?: string;
  user_id: string;
  exam_id?: string | null;
  target_total_hours: number;      // e.g. 300, 500, 1000
  daily_target_hours: number;      // e.g. 3, 4
  weekly_target_hours: number;     // e.g. 20
  daily_topics_target: number;     // e.g. 3
  exam_date?: string | null;       // YYYY-MM-DD
  completed_hours?: number;        // total recorded study hours
  status: GoalStatus;
  timetable_config?: TimetableConfig;
  subject_priorities?: SubjectPriority[];
  learning_preferences?: LearningPreferences;
  notification_settings?: NotificationSettings;
  created_at?: string;
  updated_at?: string;
}

export interface StudyPaceEstimate {
  has_enough_data: boolean;
  avg_daily_hours: number;
  completed_hours: number;
  remaining_hours: number;
  target_total_hours: number;
  progress_pct: number;
  estimated_completion_date: string | null;
  days_to_exam: number | null;
  required_daily_hours: number | null;
  pace_status: "ahead" | "on_track" | "behind" | "insufficient_data";
  message: string;
}
