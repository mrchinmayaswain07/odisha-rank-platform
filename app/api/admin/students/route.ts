import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIsAdmin, ROOT_ADMIN_EMAIL } from "@/lib/admin-auth";
import { getStudentsList } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
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

  const isCallerRootAdmin =
    authData.user?.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

  const isAdmin = await checkIsAdmin(authData.user?.id, authData.user?.email);
  if (!isAdmin || !isCallerRootAdmin) {
    return NextResponse.json(
      { error: "Unauthorized: Only the root platform administrator can modify platform roles" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, newRole } = body;

    if (!userId || !newRole || !["student", "admin", "moderator"].includes(newRole)) {
      return NextResponse.json({ error: "Valid userId and role are required" }, { status: 400 });
    }

    let client: any;
    try {
      client = createAdminClient();
    } catch {
      client = supabase;
    }

    // Immutable root administrator guard: never allow demoting or removing root admin
    const { data: targetProfile } = await client
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    const isTargetRootAdmin =
      targetProfile?.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase() ||
      userId === authData.user?.id;

    if (isTargetRootAdmin && newRole !== "admin") {
      return NextResponse.json(
        {
          error:
            "Forbidden: The root platform administrator profile is permanent and cannot be demoted or removed.",
        },
        { status: 403 }
      );
    }

    // Upsert role into user_roles
    const { data, error } = await client
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
