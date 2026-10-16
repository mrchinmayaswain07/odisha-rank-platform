import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIsAdmin } from "@/lib/admin-auth";

function getClient(userClient: any) {
  try {
    return createAdminClient();
  } catch {
    return userClient;
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  const client = getClient(supabase);

  const { data, error } = await client
    .from("mock_tests")
    .select("*, exams(title, conducting_body), mock_test_questions(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      exam_id,
      title,
      description,
      duration_minutes,
      total_marks,
      negative_marking,
      pass_percentage,
      status,
    } = body;

    if (!exam_id || !title || !description || !duration_minutes || !total_marks) {
      return NextResponse.json({ error: "Exam ID, Title, Description, Duration, and Total Marks are required" }, { status: 400 });
    }

    const client = getClient(supabase);

    const { data, error } = await client
      .from("mock_tests")
      .insert({
        exam_id,
        title,
        description,
        duration_minutes: Number(duration_minutes),
        total_marks: Number(total_marks),
        negative_marking: Number(negative_marking ?? 0.25),
        pass_percentage: Number(pass_percentage ?? 40.0),
        status: status || "published",
        is_published: status === "published",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create mock test" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "Mock Test ID is required" }, { status: 400 });

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      ...updates,
    };

    if (updates.status !== undefined) {
      updatePayload.is_published = updates.status === "published";
    }

    const client = getClient(supabase);

    const { data, error } = await client
      .from("mock_tests")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update mock test" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Mock Test ID is required" }, { status: 400 });

    const client = getClient(supabase);

    // Set to archived rather than deleting so student history remains intact
    const { error } = await client
      .from("mock_tests")
      .update({ status: "archived", is_published: false })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Mock test archived successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to archive mock test" }, { status: 500 });
  }
}
