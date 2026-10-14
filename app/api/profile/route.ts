import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

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
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      // In offline mode return simulated update
      return NextResponse.json({
        success: true,
        profile: {
          id: "demo-user",
          ...parsed.data,
          is_profile_completed: true,
        },
      });
    }

    const isCompleted = Boolean(parsed.data.full_name && parsed.data.target_exam_id);

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        ...parsed.data,
        is_profile_completed: isCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("student_activity").insert({
      user_id: authData.user.id,
      activity_type: "profile_updated",
      title: "Updated Student Profile",
      description: "Profile information and exam target refreshed.",
      metadata: {},
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
