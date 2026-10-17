import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/data-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const body = await request.json();
    const { subject_id, title, description } = body;

    if (!subject_id || !title || !title.trim()) {
      return NextResponse.json(
        { error: "subject_id and title are required" },
        { status: 400 }
      );
    }

    const customChapter = {
      id: `custom-chap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subject_id,
      title: title.trim(),
      description: description?.trim() || null,
      is_official: false,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      let client: any;
      try {
        client = createAdminClient();
      } catch {
        client = supabase;
      }

      try {
        const { data, error } = await client
          .from("chapters")
          .insert({
            subject_id,
            title: title.trim(),
            description: description?.trim() || null,
            is_official: false,
            created_by: user.id,
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, chapter: data });
        }
      } catch (err: any) {
        console.warn("Supabase chapter insert error:", err);
      }
    }

    return NextResponse.json({ success: true, chapter: customChapter });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create chapter", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("id");

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter id is required" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      let client: any;
      try {
        client = createAdminClient();
      } catch {
        client = supabase;
      }

      try {
        await client
          .from("chapters")
          .delete()
          .eq("id", chapterId)
          .eq("created_by", user.id)
          .eq("is_official", false);
      } catch (err: any) {
        console.warn("Supabase chapter delete error:", err);
      }
    }

    return NextResponse.json({ success: true, deletedId: chapterId });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete chapter", details: error.message },
      { status: 500 }
    );
  }
}
