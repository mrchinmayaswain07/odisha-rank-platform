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

  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");
  const status = searchParams.get("status");

  const client = getClient(supabase);

  let query = client
    .from("study_materials")
    .select("*, topics(title, chapters(title, subjects(name, exams(title))))")
    .order("created_at", { ascending: false });

  if (examId) query = query.eq("exam_id", examId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
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
      title,
      description,
      category,
      file_url,
      file_size,
      exam_id,
      subject_id,
      chapter_id,
      topic_id,
      status,
    } = body;

    if (!title || !file_url) {
      return NextResponse.json({ error: "Title and file URL are required" }, { status: 400 });
    }

    const client = getClient(supabase);

    const { data, error } = await client
      .from("study_materials")
      .insert({
        title,
        description: description || null,
        category: category || "notes",
        file_url,
        file_size: file_size || 0,
        exam_id: exam_id || null,
        subject_id: subject_id || null,
        chapter_id: chapter_id || null,
        topic_id: topic_id || null,
        status: status || "published",
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create study material" }, { status: 500 });
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

    if (!id) return NextResponse.json({ error: "Material ID is required" }, { status: 400 });

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      ...updates,
    };

    const client = getClient(supabase);

    const { data, error } = await client
      .from("study_materials")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update material" }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: "Material ID is required" }, { status: 400 });

    const client = getClient(supabase);

    const { error } = await client
      .from("study_materials")
      .update({ status: "archived" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Material archived successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to archive material" }, { status: 500 });
  }
}
