import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentDoubts, createStudentDoubt } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id || "demo-student-id";

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const subject = searchParams.get("subject") || undefined;
    const status = searchParams.get("status") || undefined;

    const doubts = await getStudentDoubts({
      userId,
      includePublicAnswered: true,
      search,
      subject,
      status,
    });

    return NextResponse.json({ success: true, doubts });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch doubts", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const body = await request.json();
    const { question, subject, exam_id, is_private, student_name } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    const userId = authData.user?.id || "demo-student-id";
    const userEmail = authData.user?.email || "student@odisharank.in";
    const name = student_name || authData.user?.user_metadata?.full_name || "Aspirant Scholar";

    const created = await createStudentDoubt({
      user_id: userId,
      student_name: name,
      student_email: userEmail,
      subject: subject || "General Studies & Odisha Special",
      exam_id: exam_id || null,
      question: question.trim(),
      is_private: Boolean(is_private),
    });

    return NextResponse.json({ success: true, doubt: created });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to submit question", details: error.message },
      { status: 500 }
    );
  }
}
