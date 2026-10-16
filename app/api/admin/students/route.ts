import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/admin-auth";
import { getStudentsList } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized: Administrator access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const targetExamId = searchParams.get("targetExamId") || undefined;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 15;

  const result = await getStudentsList({ search, targetExamId, page, pageSize });
  return NextResponse.json(result);
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
    const { userId, newRole } = body;

    if (!userId || !newRole || !["student", "admin", "moderator"].includes(newRole)) {
      return NextResponse.json({ error: "Valid userId and role are required" }, { status: 400 });
    }

    // Upsert role into user_roles
    const { data, error } = await supabase
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role: newRole,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update role" }, { status: 500 });
  }
}
