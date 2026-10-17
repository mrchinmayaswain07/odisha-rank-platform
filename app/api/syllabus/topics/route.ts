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
    const { chapter_id, title, description, estimated_minutes } = body;

    if (!chapter_id || !title || !title.trim()) {
      return NextResponse.json(
        { error: "chapter_id and title are required" },
        { status: 400 }
      );
    }

    const customTopic = {
      id: `custom-top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chapter_id,
      title: title.trim(),
      description: description?.trim() || null,
      estimated_minutes: Number(estimated_minutes) || 45,
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
          .from("topics")
          .insert({
            chapter_id,
            title: title.trim(),
            description: description?.trim() || null,
            estimated_minutes: Number(estimated_minutes) || 45,
            is_official: false,
            created_by: user.id,
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, topic: data });
        }
      } catch (err: any) {
        console.warn("Supabase topic insert error:", err);
      }
    }

    return NextResponse.json({ success: true, topic: customTopic });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create topic", details: error.message },
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
    const topicId = searchParams.get("id");

    if (!topicId) {
      return NextResponse.json({ error: "Topic id is required" }, { status: 400 });
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
          .from("topics")
          .delete()
          .eq("id", topicId)
          .eq("created_by", user.id)
          .eq("is_official", false);
      } catch (err: any) {
        console.warn("Supabase topic delete error:", err);
      }
    }

    return NextResponse.json({ success: true, deletedId: topicId });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete topic", details: error.message },
      { status: 500 }
    );
  }
}
