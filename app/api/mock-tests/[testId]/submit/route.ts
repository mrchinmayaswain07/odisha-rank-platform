import { NextRequest, NextResponse } from "next/server";
import { getMockTestById } from "@/lib/data-service";
import { createClient } from "@/lib/supabase/server";
import { evaluateMockTestScoring } from "@odisha-rank/shared";

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

    const evaluation = evaluateMockTestScoring(
      test,
      questions,
      answers || {},
      time_spent_seconds || 0
    );

    const {
      score: totalScore,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: unansweredCount,
      accuracy,
      passed,
      answers: answerReviews,
    } = evaluation;

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
