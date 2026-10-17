import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIsAdmin } from "@/lib/admin-auth";
import { resilientInsert, resilientUpdate } from "@/lib/db-resilient";

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

import { saveRuntimeMaterial, updateRuntimeMaterialStatus } from "@/lib/data-service";

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
      content,
      category,
      material_type,
      file_url,
      file_size,
      exam_id,
      subject_id,
      chapter_id,
      topic_id,
      status,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Material title is required" }, { status: 400 });
    }

    const payload = {
      title: title.trim(),
      description: description?.trim() || null,
      content: content?.trim() || description?.trim() || title.trim(),
      category: category || "notes",
      material_type: material_type || (category === "pdf" ? "pdf" : "note"),
      url: file_url?.trim() || null,
      file_url: file_url?.trim() || null,
      file_size: file_size || 0,
      exam_id: exam_id || null,
      subject_id: subject_id || null,
      chapter_id: chapter_id || null,
      topic_id: topic_id || null,
      status: status || "published",
      is_official: true,
      created_by: authData.user?.id || null,
      published_at: new Date().toISOString(),
    };

    const client = getClient(supabase);
    let createdItem: any = null;

    try {
      const { data, error } = await resilientInsert(client, "study_materials", payload);
      if (!error && data) {
        createdItem = data;
      }
    } catch {}

    const finalItem = {
      id: createdItem?.id || `mat-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...payload,
    };

    saveRuntimeMaterial(finalItem as any);

    return NextResponse.json({ success: true, data: finalItem });
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

    if (updates.file_url !== undefined) {
      updatePayload.url = updates.file_url;
    }
    if (updates.description && !updates.content) {
      updatePayload.content = updates.description;
    }

    const client = getClient(supabase);
    let updatedData: any = null;

    try {
      const { data, error } = await resilientUpdate(client, "study_materials", id, updatePayload);
      if (!error && data) updatedData = data;
    } catch {}

    const finalItem = {
      id,
      ...updatePayload,
    };

    saveRuntimeMaterial(finalItem as any);

    return NextResponse.json({ success: true, data: finalItem });
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

    try {
      await client
        .from("study_materials")
        .update({ status: "archived" })
        .eq("id", id);
    } catch {}

    updateRuntimeMaterialStatus(id, "archived");

    return NextResponse.json({ success: true, message: "Material archived successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to archive material" }, { status: 500 });
  }
}
