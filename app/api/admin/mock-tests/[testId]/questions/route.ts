import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIsAdmin } from "@/lib/admin-auth";
import { resilientInsert } from "@/lib/db-resilient";

function getClient(userClient: any) {
  try {
    return createAdminClient();
  } catch {
    return userClient;
  }
}

interface RouteParams {
  params: { testId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  const { testId } = params;
  if (!testId) {
    return NextResponse.json({ error: "Mock test ID is required" }, { status: 400 });
  }

  const client = getClient(supabase);

  try {
    const { data: mtq, error } = await client
      .from("mock_test_questions")
      .select("id, mock_test_id, question_id, marks, order_index, questions(*)")
      .eq("mock_test_id", testId)
      .order("order_index", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (mtq || [])
      .map((row: any) => {
        if (!row.questions) return null;
        return {
          ...row.questions,
          mtq_id: row.id,
          marks: row.marks ?? row.questions.marks ?? 1.0,
          order_index: row.order_index ?? 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch mock test questions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  const { testId } = params;
  if (!testId) {
    return NextResponse.json({ error: "Mock test ID is required" }, { status: 400 });
  }

  const client = getClient(supabase);

  try {
    // 1. Verify mock test exists and fetch its details
    const { data: mockTest, error: testErr } = await client
      .from("mock_tests")
      .select("id, exam_id, negative_marking, total_marks")
      .eq("id", testId)
      .single();

    if (testErr || !mockTest) {
      return NextResponse.json({ error: "Mock test not found" }, { status: 404 });
    }

    // 2. Determine current highest order_index
    const { data: currentMtq } = await client
      .from("mock_test_questions")
      .select("order_index")
      .eq("mock_test_id", testId)
      .order("order_index", { ascending: false })
      .limit(1);

    let nextOrderIndex = (currentMtq?.[0]?.order_index ?? 0) + 1;

    const body = await request.json();

    // Check if bulk or single
    const incomingQuestions: any[] = body.bulk && Array.isArray(body.questions)
      ? body.questions
      : [body];

    if (incomingQuestions.length === 0) {
      return NextResponse.json({ error: "No questions provided" }, { status: 400 });
    }

    const insertedQuestions: any[] = [];
    const insertedLinks: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < incomingQuestions.length; i++) {
      const q = incomingQuestions[i];

      // Validate question text and options
      if (!q.question_text || !Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`Question #${i + 1}: Question text and exactly 4 options are required`);
        continue;
      }

      let correctIndex = Number(q.correct_option_index);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        // Fallback or attempt letter conversion
        if (typeof q.correct_option_index === "string") {
          const letter = q.correct_option_index.trim().toUpperCase();
          if (letter === "A") correctIndex = 0;
          else if (letter === "B") correctIndex = 1;
          else if (letter === "C") correctIndex = 2;
          else if (letter === "D") correctIndex = 3;
          else correctIndex = 0;
        } else {
          correctIndex = 0;
        }
      }

      const qPayload = {
        exam_id: q.exam_id || mockTest.exam_id || null,
        subject_id: q.subject_id || null,
        topic_id: q.topic_id || null,
        question_text: String(q.question_text).trim(),
        options: q.options.map((opt: any) => String(opt).trim()),
        correct_option_index: correctIndex,
        explanation: q.explanation ? String(q.explanation).trim() : null,
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
        marks: Number(q.marks || 1.0),
        negative_marks: Number(q.negative_marks ?? mockTest.negative_marking ?? 0.25),
        status: "published",
        is_sample: false,
        created_by: authData.user?.id || null,
      };

      const { data: qData, error: qInsertErr } = await resilientInsert(client, "questions", qPayload);
      if (qInsertErr || !qData) {
        errors.push(`Question #${i + 1}: ${qInsertErr?.message || "Failed to insert into question bank"}`);
        continue;
      }

      const createdQ = Array.isArray(qData) ? qData[0] : qData;
      insertedQuestions.push(createdQ);

      // Link to mock_test_questions
      const linkPayload = {
        mock_test_id: testId,
        question_id: createdQ.id,
        marks: qPayload.marks,
        order_index: nextOrderIndex++,
      };

      const { data: linkData, error: linkErr } = await resilientInsert(client, "mock_test_questions", linkPayload);
      if (linkErr) {
        errors.push(`Question #${i + 1} link: ${linkErr.message}`);
      } else {
        const createdLink = Array.isArray(linkData) ? linkData[0] : linkData;
        insertedLinks.push(createdLink);
      }
    }

    return NextResponse.json({
      success: insertedQuestions.length > 0,
      count: insertedQuestions.length,
      data: insertedQuestions,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add questions to mock test" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  const { testId } = params;
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get("questionId");
  const mtqId = searchParams.get("mtqId");

  if (!questionId && !mtqId) {
    return NextResponse.json({ error: "questionId or mtqId parameter is required" }, { status: 400 });
  }

  const client = getClient(supabase);

  try {
    let query = client.from("mock_test_questions").delete().eq("mock_test_id", testId);
    if (mtqId) {
      query = query.eq("id", mtqId);
    } else if (questionId) {
      query = query.eq("question_id", questionId);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Question removed from mock test" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove question" }, { status: 500 });
  }
}
