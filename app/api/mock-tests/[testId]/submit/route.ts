import { NextRequest, NextResponse } from "next/server";
import { getMockTestById } from "@/lib/data-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const body = await request.json();
    const { answers, time_spent_seconds } = body;

    const testData = await getMockTestById(params.testId);
    if (!testData) {
      return NextResponse.json({ error: "Mock test not found" }, { status: 404 });
    }

    const { test, questions } = testData;

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;

    const marksPerQuestion = test.total_marks / (questions.length || 1);
    const negativeMark = test.negative_marking || 0.25;

    const answerReviews = questions.map((q) => {
      const selectedIndex = answers ? answers[q.id] : undefined;
      const isAnswered = selectedIndex !== undefined && selectedIndex !== null;

      let isCorrect = false;
      let marksAwarded = 0;

      if (!isAnswered) {
        unansweredCount++;
        marksAwarded = 0;
      } else if (selectedIndex === q.correct_option_index) {
        isCorrect = true;
        correctCount++;
        marksAwarded = marksPerQuestion;
        totalScore += marksPerQuestion;
      } else {
        incorrectCount++;
        marksAwarded = -negativeMark;
        totalScore -= negativeMark;
      }

      return {
        question_id: q.id,
        question_text: q.question_text,
        options: q.options,
        selected_option_index: selectedIndex ?? null,
        correct_option_index: q.correct_option_index,
        explanation: q.explanation,
        is_correct: isCorrect,
        marks_awarded: marksAwarded,
      };
    });

    // Score cannot be negative overall
    totalScore = Math.max(0, Math.round(totalScore * 100) / 100);
    const totalAttempted = correctCount + incorrectCount;
    const accuracy =
      totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
    const passed = (totalScore / test.total_marks) * 100 >= test.pass_percentage;

    // Persist to Supabase if authenticated
    try {
      const supabase = await createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: attempt } = await supabase
          .from("mock_test_attempts")
          .insert({
            mock_test_id: test.id,
            user_id: authData.user.id,
            status: "completed",
            score: totalScore,
            correct_count: correctCount,
            incorrect_count: incorrectCount,
            unanswered_count: unansweredCount,
            accuracy: accuracy,
            time_spent_seconds: time_spent_seconds || 0,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (attempt) {
          // Log student activity
          await supabase.from("student_activity").insert({
            user_id: authData.user.id,
            activity_type: "mock_test_completed",
            title: `Completed ${test.title}`,
            description: `Scored ${totalScore}/${test.total_marks} with ${accuracy}% accuracy.`,
            metadata: { attempt_id: attempt.id, score: totalScore },
          });
        }
      }
    } catch {
      // Offline fallback handling
    }

    return NextResponse.json({
      success: true,
      result: {
        test_id: test.id,
        test_title: test.title,
        total_marks: test.total_marks,
        pass_percentage: test.pass_percentage,
        passed,
        score: totalScore,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unanswered_count: unansweredCount,
        accuracy,
        time_spent_seconds: time_spent_seconds || 0,
        questions_review: answerReviews,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Submission failed", details: error.message },
      { status: 500 }
    );
  }
}
