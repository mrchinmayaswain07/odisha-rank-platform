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

import {
  saveRuntimeMaterial,
  updateRuntimeMaterialStatus,
  deleteRuntimeMaterial,
  recordDeletedMaterialId,
} from "@/lib/data-service";

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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanTopicId = (topic_id && uuidRegex.test(topic_id)) ? topic_id : "c1111111-1111-1111-1111-111111111111";
    const cleanExamId = (exam_id && uuidRegex.test(exam_id)) ? exam_id : null;
    const cleanSubjectId = (subject_id && uuidRegex.test(subject_id)) ? subject_id : null;
    const cleanChapterId = (chapter_id && uuidRegex.test(chapter_id)) ? chapter_id : null;

    let mType = (material_type || "").toLowerCase();
    if (mType === "pdf" || category === "pdf" || file_url) {
      mType = "link";
    } else if (mType !== "link" && mType !== "summary" && mType !== "text" && mType !== "note") {
      mType = "note";
    }

    const cleanPayload = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description?.trim() || null,
      content: content?.trim() || description?.trim() || title.trim(),
      category: category || "notes",
      material_type: mType,
      url: file_url?.trim() || null,
      file_url: file_url?.trim() || null,
      file_size: file_size || 0,
      exam_id: cleanExamId,
      subject_id: cleanSubjectId,
      chapter_id: cleanChapterId,
      topic_id: cleanTopicId,
      status: status || "published",
      is_official: true,
      created_by: authData.user?.id || null,
      published_at: new Date().toISOString(),
    };

    const client = getClient(supabase);
    let createdItem: any = null;

    try {
      const { data, error } = await resilientInsert(client, "study_materials", cleanPayload);
      if (!error && data) {
        createdItem = data;
      } else if (error) {
        console.warn("[Materials POST] Supabase resilientInsert notice:", error.message || error);
      }
    } catch (insertErr: any) {
      console.warn("[Materials POST] Supabase insert exception:", insertErr?.message || insertErr);
    }

    const finalItem = {
      ...cleanPayload,
      ...(createdItem || {}),
      id: createdItem?.id || cleanPayload.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      ...(updatedData || {}),
    };

    saveRuntimeMaterial(finalItem as any);

    if (updates.status) {
      updateRuntimeMaterialStatus(id, updates.status);
    }

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
    const permanent = searchParams.get("permanent") === "true";
    if (!id) return NextResponse.json({ error: "Material ID is required" }, { status: 400 });

    const client = getClient(supabase);

    if (permanent) {
      // 1. Delete directly from Supabase database
      try {
        await client.from("study_materials").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase hard delete failed:", err);
      }

      // 2. Permanently record deletion tombstone in memory, local disk, and remote database
      await recordDeletedMaterialId(id);

      return NextResponse.json({ success: true, message: "Material permanently deleted successfully" });
    } else {
      // Soft archive
      try {
        await client
          .from("study_materials")
          .update({ status: "archived" })
          .eq("id", id);
      } catch {}

      updateRuntimeMaterialStatus(id, "archived");

      return NextResponse.json({ success: true, message: "Material archived successfully" });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process delete request" }, { status: 500 });
  }
}
