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

  const client = getClient(supabase);

  const { data: exams, error } = await client
    .from("exams")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Safely aggregate student counts per course without schema relationship fragility
  try {
    const { data: profiles } = await client
      .from("profiles")
      .select("target_exam_id");

    const countsMap: Record<string, number> = {};
    (profiles || []).forEach((p: any) => {
      if (p.target_exam_id) {
        countsMap[p.target_exam_id] = (countsMap[p.target_exam_id] || 0) + 1;
      }
    });

    const result = (exams || []).map((ex: any) => ({
      ...ex,
      students_count: countsMap[ex.id] || 0,
    }));

    return NextResponse.json({ data: result });
  } catch {
    const result = (exams || []).map((ex: any) => ({
      ...ex,
      students_count: 0,
    }));
    return NextResponse.json({ data: result });
  }
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
    const { title, conducting_body, description, eligibility, slug, status, is_active } = body;

    if (!title || !conducting_body || !description) {
      return NextResponse.json({ error: "Title, conducting body, and description are required" }, { status: 400 });
    }

    const finalSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const client = getClient(supabase);

    const { data, error } = await resilientInsert(client, "exams", {
      title,
      conducting_body,
      description,
      eligibility: eligibility || null,
      slug: finalSlug,
      status: status || "published",
      is_active: is_active ?? true,
      stages: body.stages || [],
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create course" }, { status: 500 });
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
    const { id, title, conducting_body, description, eligibility, status, is_active, stages } = body;

    if (!id) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updatePayload.title = title;
    if (conducting_body !== undefined) updatePayload.conducting_body = conducting_body;
    if (description !== undefined) updatePayload.description = description;
    if (eligibility !== undefined) updatePayload.eligibility = eligibility;
    if (status !== undefined) updatePayload.status = status;
    if (is_active !== undefined) updatePayload.is_active = is_active;
    if (stages !== undefined) updatePayload.stages = stages;

    const client = getClient(supabase);

    const { data, error } = await resilientUpdate(client, "exams", id, updatePayload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update course" }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const client = getClient(supabase);

    // Set status to archived rather than destroying historical attempts
    const { error } = await client
      .from("exams")
      .update({ status: "archived", is_active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Course archived successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to archive course" }, { status: 500 });
  }
}
