import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentDoubts, getMockTests, getStudyMaterials } from "@/lib/data-service";

function formatTimeAgo(timestamp: string): string {
  try {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recent";
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id || "demo-student-id";

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId") || undefined;

    const notifications: any[] = [];

    // 1. Safe Faculty Answered Doubts
    try {
      const allDoubts = await getStudentDoubts({
        userId,
        includePublicAnswered: true,
      });

      if (allDoubts && Array.isArray(allDoubts) && allDoubts.length > 0) {
        const answeredDoubts = allDoubts.filter(
          (d) => d.status === "answered" || Boolean(d.answer)
        );

        // Prioritize student's own doubts, or top community solutions
        const userDoubts = answeredDoubts.filter((d) => d.user_id === userId);
        const listToDisplay = userDoubts.length > 0 ? userDoubts : answeredDoubts;

        listToDisplay.slice(0, 3).forEach((d) => {
          const time = d.answered_at || d.updated_at || d.created_at || new Date().toISOString();
          notifications.push({
            id: `notif-doubt-${d.id}`,
            type: "doubt",
            title: "Doubt Answered by Faculty",
            message: `Faculty responded to: "${(d.question || "").slice(0, 60)}..."`,
            timestamp: time,
            timeAgo: formatTimeAgo(time),
            actionRoute: "/doubts",
            actionLabel: "View Solution",
          });
        });
      }
    } catch (doubtErr) {
      console.warn("[Notifications API] Error fetching doubts:", doubtErr);
    }

    // 2. Safe New Mock Tests
    try {
      const mocks = await getMockTests(examId);
      if (mocks && Array.isArray(mocks) && mocks.length > 0) {
        const activeMocks = mocks.filter((m) => {
          if (m.status === "archived") return false;
          if (m.is_published === false) return false;
          if (examId && m.exam_id && m.exam_id !== examId) return false;
          return true;
        });

        activeMocks.slice(0, 3).forEach((m) => {
          notifications.push({
            id: `notif-mock-${m.id}`,
            type: "mock",
            title: "New Mock Test Available",
            message: `"${m.title}" is live. Take full timed exam simulation.`,
            timestamp: m.created_at || new Date().toISOString(),
            timeAgo: formatTimeAgo(m.created_at || new Date().toISOString()),
            actionRoute: "/mock-tests",
            actionLabel: "Take Mock",
          });
        });
      }
    } catch (mockErr) {
      console.warn("[Notifications API] Error fetching mock tests:", mockErr);
    }

    // 3. Safe Admin Shared Study Materials, PDFs & Google Drive links
    try {
      const materials = await getStudyMaterials({ examId });
      if (materials && Array.isArray(materials) && materials.length > 0) {
        const realMaterials = materials.filter(
          (m) =>
            !m.title?.startsWith("[STUDENT_") &&
            !m.title?.startsWith("[SYSTEM_") &&
            m.category !== "doubt"
        );

        realMaterials.slice(0, 4).forEach((mat) => {
          const url = mat.file_url || mat.url || "";
          const isDrive = url.includes("drive.google.com") || url.includes("docs.google.com");
          const isPdf = mat.material_type === "pdf" || mat.category === "pdf" || url.endsWith(".pdf");

          let title = "New Study Material Shared";
          let actionLabel = "Read Notes";
          if (isDrive) {
            title = "Admin Shared Google Drive Link";
            actionLabel = "Open Drive";
          } else if (isPdf) {
            title = "Official Exam PDF Added";
            actionLabel = "View PDF";
          }

          notifications.push({
            id: `notif-mat-${mat.id}`,
            type: "material",
            title,
            message: `Admin published: "${mat.title}" (${(mat.category || "notes").toUpperCase()}).`,
            timestamp: mat.created_at || new Date().toISOString(),
            timeAgo: formatTimeAgo(mat.created_at || new Date().toISOString()),
            actionRoute: "/materials",
            actionLabel,
            url: url || undefined,
            isDrive,
          });
        });
      }
    } catch (matErr) {
      console.warn("[Notifications API] Error fetching materials:", matErr);
    }

    // 4. Daily Study Goal Reminder
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      notifications.push({
        id: `notif-goal-${todayStr}`,
        type: "goal",
        title: "Daily Goal Ready",
        message: "Set your chapter targets and start your study stopwatch for today's revision.",
        timestamp: new Date().toISOString(),
        timeAgo: "Today",
        actionRoute: "/planner",
        actionLabel: "Plan Day",
      });
    } catch (goalErr) {
      console.warn("[Notifications API] Error generating goal notification:", goalErr);
    }

    // Sort by latest timestamp
    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate student notifications", details: err?.message },
      { status: 500 }
    );
  }
}
