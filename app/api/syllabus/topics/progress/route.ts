import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ completed_topic_ids: [] });
    }

    let client: any;
    try {
      client = createAdminClient();
    } catch {
      client = supabase;
    }

    const { data, error } = await client
      .from("student_topic_progress")
      .select("topic_id")
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (error) {
      return NextResponse.json({ completed_topic_ids: [] });
    }

    const completedIds = (data || []).map((row: any) => row.topic_id);
    return NextResponse.json({ completed_topic_ids: completedIds });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch topic progress", details: error.message },
      { status: 500 }
    );
  }
}

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
    const { topic_id, status, completed, topic_title } = body;

    if (!topic_id) {
      return NextResponse.json({ error: "topic_id is required" }, { status: 400 });
    }

    const newStatus = status ? status : completed ? "completed" : "not_started";
    const isCompleted = newStatus === "completed";
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured()) {
      let client: any;
      try {
        client = createAdminClient();
      } catch {
        client = supabase;
      }

      try {
        const { error } = await client.from("student_topic_progress").upsert(
          {
            user_id: user.id,
            topic_id,
            status: newStatus,
            completed_at: isCompleted ? nowIso : null,
            last_studied_at: nowIso,
          },
          { onConflict: "user_id,topic_id" }
        );

        if (!error && isCompleted) {
          try {
            await client.from("student_activity").insert({
              user_id: user.id,
              activity_type: "topic_completed",
              title: topic_title ? `Completed: ${topic_title}` : "Completed a syllabus topic",
              description: "Marked topic as completed in study plan",
              metadata: { topic_id },
              created_at: nowIso,
            });
          } catch {
            // Non-blocking activity insert
          }
        }
      } catch (err: any) {
        console.warn("Supabase student_topic_progress upsert warning:", err);
      }
    }

    return NextResponse.json({
      success: true,
      topic_id,
      status: newStatus,
      completed: isCompleted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update topic progress", details: error.message },
      { status: 500 }
    );
  }
}
