import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveRuntimeQuestionAttempt } from "@/lib/data-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question_id, selected_option_index, is_correct, time_taken_seconds } = body;

    if (!question_id || selected_option_index === undefined || is_correct === undefined) {
      return NextResponse.json({ error: "Missing attempt parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id || "demo-student-id";

    // 1. Save in memory runtime cache
    const runtimeRecord = saveRuntimeQuestionAttempt({
      user_id: userId,
      question_id,
      selected_option_index,
      is_correct,
      time_taken_seconds: time_taken_seconds || 42,
    });

    // 2. Persist to Supabase if available
    try {
      if (authData.user) {
        await supabase.from("question_attempts").insert({
          user_id: authData.user.id,
          question_id,
          selected_option_index,
          is_correct,
          time_taken_seconds: time_taken_seconds || 42,
        });

        // Also log activity occasionally
        await supabase.from("student_activity").insert({
          user_id: authData.user.id,
          activity_type: "question_attempted",
          title: is_correct ? "Correct MCQ Answer" : "MCQ Practice Attempt",
          description: `Attempted question with ${time_taken_seconds || 42}s speed.`,
          metadata: { question_id, is_correct },
        });
      }
    } catch {
      // offline fallback
    }

    return NextResponse.json({ success: true, attempt: runtimeRecord });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to record attempt", details: error.message },
      { status: 500 }
    );
  }
}
