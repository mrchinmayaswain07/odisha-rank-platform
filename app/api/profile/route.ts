import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { profileSchema } from "@/lib/validation";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (error && error.message.includes("permission denied")) {
      const admin = createAdminClient();
      const res = await admin.from("profiles").select("*").eq("id", authData.user.id).maybeSingle();
      profile = res.data;
      error = res.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = profileSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;
    const isCompleted = Boolean(parsed.data.full_name && parsed.data.target_exam_id);

    const profileData = {
      id: userId,
      email: authData.user.email,
      ...parsed.data,
      is_profile_completed: isCompleted,
      updated_at: new Date().toISOString(),
    };

    // 1. Try with user client
    let { data: updated, error } = await supabase
      .from("profiles")
      .upsert(profileData)
      .select()
      .single();

    // 2. Fallback to admin client if standard role table grant was omitted in PostgreSQL
    if (error && error.message.includes("permission denied")) {
      try {
        const admin = createAdminClient();
        const res = await admin.from("profiles").upsert(profileData).select().single();
        updated = res.data;
        error = res.error;
      } catch (adminErr: any) {
        error = adminErr;
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record student activity
    try {
      await supabase.from("student_activity").insert({
        user_id: userId,
        activity_type: "profile_updated",
        title: "Updated Student Profile",
        description: "Profile information and exam target refreshed.",
        metadata: {},
      });
    } catch {
      // Activity logging optional
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
