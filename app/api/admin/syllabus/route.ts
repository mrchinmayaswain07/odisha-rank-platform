import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { entityType } = body; // 'subject' | 'chapter' | 'topic'

    if (entityType === "subject") {
      const { exam_id, name, code, description, order_index, status } = body;
      if (!exam_id || !name) {
        return NextResponse.json({ error: "Exam ID and Subject Name are required" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("subjects")
        .insert({
          exam_id,
          name,
          code: code || null,
          description: description || null,
          order_index: order_index || 0,
          status: status || "published",
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    if (entityType === "chapter") {
      const { subject_id, title, description, order_index, status } = body;
      if (!subject_id || !title) {
        return NextResponse.json({ error: "Subject ID and Chapter Title are required" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("chapters")
        .insert({
          subject_id,
          title,
          description: description || null,
          order_index: order_index || 0,
          is_official: true,
          status: status || "published",
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    if (entityType === "topic") {
      const { chapter_id, title, description, estimated_minutes, order_index, status } = body;
      if (!chapter_id || !title) {
        return NextResponse.json({ error: "Chapter ID and Topic Title are required" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("topics")
        .insert({
          chapter_id,
          title,
          description: description || null,
          estimated_minutes: estimated_minutes || 45,
          order_index: order_index || 0,
          is_official: true,
          status: status || "published",
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create entity" }, { status: 500 });
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
    const { entityType, id } = body;

    if (!id || !entityType) {
      return NextResponse.json({ error: "ID and entityType are required" }, { status: 400 });
    }

    const table = entityType === "subject" ? "subjects" : entityType === "chapter" ? "chapters" : "topics";
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.order_index !== undefined) updatePayload.order_index = body.order_index;
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.estimated_minutes !== undefined) updatePayload.estimated_minutes = body.estimated_minutes;

    const { data, error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update entity" }, { status: 500 });
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
    const entityType = searchParams.get("entityType");

    if (!id || !entityType) {
      return NextResponse.json({ error: "ID and entityType are required" }, { status: 400 });
    }

    const table = entityType === "subject" ? "subjects" : entityType === "chapter" ? "chapters" : "topics";

    // Archive rather than delete to preserve consistency
    const { error } = await supabase
      .from(table)
      .update({ status: "archived" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: `${entityType} archived successfully` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to archive entity" }, { status: 500 });
  }
}
