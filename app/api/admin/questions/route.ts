import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/admin-auth";
import { getPaginatedQuestions } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId") || undefined;
  const subjectId = searchParams.get("subjectId") || undefined;
  const difficulty = searchParams.get("difficulty") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 10;

  const result = await getPaginatedQuestions({
    examId,
    subjectId,
    difficulty,
    status,
    search,
    page,
    pageSize,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Check if this is a bulk import batch
    if (body.bulk && Array.isArray(body.questions)) {
      const questionsToInsert = body.questions.map((q: any) => ({
        exam_id: q.exam_id || null,
        subject_id: q.subject_id || null,
        topic_id: q.topic_id || null,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: Number(q.correct_option_index),
        explanation: q.explanation || null,
        difficulty: q.difficulty || "medium",
        marks: Number(q.marks || 1.0),
        negative_marks: Number(q.negative_marks || 0.25),
        status: q.status || "published",
        is_sample: false,
        created_by: authData.user?.id || null,
      }));

      const { data, error } = await supabase
        .from("questions")
        .insert(questionsToInsert)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: data.length, data });
    }

    // Single Question Create
    const {
      exam_id,
      subject_id,
      topic_id,
      question_text,
      options,
      correct_option_index,
      explanation,
      difficulty,
      marks,
      negative_marks,
      status,
    } = body;

    if (!question_text || !Array.isArray(options) || options.length !== 4) {
      return NextResponse.json({ error: "Question text and exactly 4 options are required" }, { status: 400 });
    }

    if (correct_option_index < 0 || correct_option_index > 3) {
      return NextResponse.json({ error: "Correct option index must be between 0 and 3" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("questions")
      .insert({
        exam_id: exam_id || null,
        subject_id: subject_id || null,
        topic_id: topic_id || null,
        question_text,
        options,
        correct_option_index,
        explanation: explanation || null,
        difficulty: difficulty || "medium",
        marks: marks || 1.0,
        negative_marks: negative_marks || 0.25,
        status: status || "published",
        is_sample: false,
        created_by: authData.user?.id || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create question" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.question_text !== undefined) updatePayload.question_text = updates.question_text;
    if (updates.options !== undefined) updatePayload.options = updates.options;
    if (updates.correct_option_index !== undefined) updatePayload.correct_option_index = updates.correct_option_index;
    if (updates.explanation !== undefined) updatePayload.explanation = updates.explanation;
    if (updates.difficulty !== undefined) updatePayload.difficulty = updates.difficulty;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.exam_id !== undefined) updatePayload.exam_id = updates.exam_id;
    if (updates.subject_id !== undefined) updatePayload.subject_id = updates.subject_id;
    if (updates.marks !== undefined) updatePayload.marks = updates.marks;
    if (updates.negative_marks !== undefined) updatePayload.negative_marks = updates.negative_marks;

    const { data, error } = await supabase
      .from("questions")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Question ID is required" }, { status: 400 });

    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete question" }, { status: 500 });
  }
}
