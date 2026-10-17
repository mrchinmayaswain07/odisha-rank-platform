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
  code?: string;
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
  // Computed / joined fields
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
  // User progress join
  user_progress?: {
    status: "not_started" | "in_progress" | "completed";
    completed_at: string | null;
    last_studied_at: string;
    confidence_rating: number | null;
  };
}

export interface StudyMaterial {
  id: string;
  topic_id?: string | null;
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
  questions_practiced: number;
  questions_practiced_today?: number;
  accuracy_percentage?: number;
  mock_tests_completed: number;
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

export interface SubjectPerformance {
  subject_id: string;
  name: string;
  questions: number;
  correct: number;
  accuracy: number;
  strength: "Strong" | "Moderate" | "Needs Practice" | "Unattempted";
}

export interface RecommendedFocusItem {
  title: string;
  description: string;
  type: "subject" | "topic";
  variant: "amber" | "blue";
}

export interface PerformanceAnalyticsData {
  overall_accuracy: number | null; // null if 0 attempts
  total_questions_attempted: number;
  total_correct: number;
  exam_readiness_score: number;
  readiness_label: string;
  avg_speed_seconds: number | null; // null if 0 attempts with duration
  speed_label: string;
  total_study_hours: number;
  study_hours_label: string;
  estimated_state_rank: string | null; // null if insufficient data
  rank_subtitle: string;
  has_sufficient_data: boolean;
  subject_breakdown: SubjectPerformance[];
  recommended_focus: RecommendedFocusItem[];
}

