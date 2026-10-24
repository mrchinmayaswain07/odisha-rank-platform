import { MockTest, Question } from "./types";
import { getIndianDateStr, addDaysToIndianDate } from "./date-utils";

/**
 * Pure calculation for syllabus completion percentages.
 * Zero fabricated metrics: if total is 0, progress is 0.
 */
export function calculateProgress(completedCount: number, totalCount: number): number {
  if (totalCount <= 0 || completedCount <= 0) return 0;
  return Math.min(100, Math.round((completedCount / totalCount) * 100));
}

/**
 * Pure calculation for accuracy percentage based strictly on attempted questions.
 */
export function calculateAccuracy(correctCount: number, attemptedCount: number): number {
  if (attemptedCount <= 0 || correctCount <= 0) return 0;
  return Math.min(100, Math.round((correctCount / attemptedCount) * 100));
}

/**
 * Pure calculation for study streak days based on Indian calendar days (Asia/Kolkata).
 */
export function calculateStudyStreak(dates: string[], baseDate?: Date | string | null): number {
  if (!dates || dates.length === 0) return 0;

  // Convert each date / timestamp to Indian calendar date (YYYY-MM-DD)
  const dateSet = new Set(
    dates.map((d) => {
      if (d.length === 10 && d.includes("-")) return d;
      return getIndianDateStr(d);
    })
  );

  let streak = 0;
  const todayStr = getIndianDateStr(baseDate);

  for (let i = 0; i < 365; i++) {
    const dateStr = addDaysToIndianDate(todayStr, -i);

    if (dateSet.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      // Today in India might not have a session logged yet; continue checking backwards from yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Server-authoritative evaluation of mock test answers.
 * Applies negative marking per incorrect answer, zero floor on final score, and evaluates passing criteria.
 */
export interface EvaluatedAnswer {
  question_id: string;
  question_text: string;
  options: string[];
  selected_option_index: number | null;
  correct_option_index: number;
  explanation: string | null;
  is_correct: boolean;
  marks_awarded: number;
}

export interface MockTestEvaluationResult {
  score: number;
  total_marks: number;
  pass_percentage: number;
  passed: boolean;
  accuracy: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  time_spent_seconds: number;
  answers: EvaluatedAnswer[];
}

export function evaluateMockTestScoring(
  test: Pick<MockTest, "total_marks" | "negative_marking" | "pass_percentage">,
  questions: Pick<Question, "id" | "question_text" | "options" | "correct_option_index" | "explanation">[],
  answers: Record<string, number | null | undefined> = {},
  timeSpentSeconds: number = 0
): MockTestEvaluationResult {
  const totalQuestions = questions.length || 1;
  const marksPerQuestion = test.total_marks / totalQuestions;
  const negativeMark = test.negative_marking || 0.25;

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let rawScore = 0;

  const evaluatedAnswers: EvaluatedAnswer[] = questions.map((q) => {
    const selected = answers[q.id];
    const isAnswered = selected !== undefined && selected !== null && selected >= 0;

    let isCorrect = false;
    let marksAwarded = 0;

    if (!isAnswered) {
      unansweredCount++;
      marksAwarded = 0;
    } else if (selected === q.correct_option_index) {
      isCorrect = true;
      correctCount++;
      marksAwarded = marksPerQuestion;
      rawScore += marksPerQuestion;
    } else {
      incorrectCount++;
      marksAwarded = -negativeMark;
      rawScore -= negativeMark;
    }

    return {
      question_id: q.id,
      question_text: q.question_text,
      options: q.options,
      selected_option_index: isAnswered ? selected : null,
      correct_option_index: q.correct_option_index,
      explanation: q.explanation || null,
      is_correct: isCorrect,
      marks_awarded: Math.round(marksAwarded * 100) / 100,
    };
  });

  // Final score cannot be negative overall
  const finalScore = Math.max(0, Math.round(rawScore * 100) / 100);
  const attemptedCount = correctCount + incorrectCount;
  const accuracy = calculateAccuracy(correctCount, attemptedCount);
  const percentage = test.total_marks > 0 ? (finalScore / test.total_marks) * 100 : 0;
  const passed = percentage >= test.pass_percentage;

  return {
    score: finalScore,
    total_marks: test.total_marks,
    pass_percentage: test.pass_percentage,
    passed,
    accuracy,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unanswered_count: unansweredCount,
    time_spent_seconds: timeSpentSeconds,
    answers: evaluatedAnswers,
  };
}

/**
 * Open Redirect Vulnerability Prevention
 * Restricts redirects strictly to relative local application routes.
 */
export function sanitizeRedirect(url: string | null | undefined): string {
  if (!url) return "/dashboard";
  const trimmed = url.trim();

  // Reject protocol-relative or backslash-escaped URL manipulation
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes("://")) {
    return "/dashboard";
  }

  // Allow standard relative routes
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return "/dashboard";
}
