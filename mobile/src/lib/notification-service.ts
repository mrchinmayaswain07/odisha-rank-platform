import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { getStudentDoubts, getStudyMaterials } from "./data-service";

export interface AppNotification {
  id: string;
  type: "doubt" | "mock" | "material" | "goal" | "system";
  title: string;
  message: string;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  actionRoute?: string;
  actionLabel?: string;
  meta?: Record<string, any>;
}

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

const READ_KEY_PREFIX = "odisharank_read_notifs_";

export async function getReadNotificationIds(userId: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(`${READ_KEY_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (err) {
    console.warn("Failed to load read notifications:", err);
  }
  return new Set();
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    const readSet = await getReadNotificationIds(userId);
    readSet.add(notificationId);
    await AsyncStorage.setItem(
      `${READ_KEY_PREFIX}${userId}`,
      JSON.stringify(Array.from(readSet))
    );
  } catch (err) {
    console.warn("Failed to save read notification:", err);
  }
}

export async function markAllNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
  try {
    const readSet = await getReadNotificationIds(userId);
    notificationIds.forEach((id) => readSet.add(id));
    await AsyncStorage.setItem(
      `${READ_KEY_PREFIX}${userId}`,
      JSON.stringify(Array.from(readSet))
    );
  } catch (err) {
    console.warn("Failed to mark all as read:", err);
  }
}

export async function fetchStudentNotifications(
  userId: string,
  examId?: string
): Promise<AppNotification[]> {
  const notifications: AppNotification[] = [];
  const readSet = await getReadNotificationIds(userId || "guest_student");

  // 1. Safe Doubt Notifications
  try {
    const allDoubts = await getStudentDoubts(userId || "demo-student-id");
    if (allDoubts && allDoubts.length > 0) {
      const answeredDoubts = allDoubts.filter(
        (d) => d.status === "answered" || Boolean(d.answer)
      );

      // Prioritize doubts submitted by this student, or top answered community questions
      const userDoubts = answeredDoubts.filter((d) => d.user_id === userId);
      const listToDisplay = userDoubts.length > 0 ? userDoubts : answeredDoubts;

      listToDisplay.slice(0, 3).forEach((d) => {
        const time = d.answered_at || d.updated_at || d.created_at || new Date().toISOString();
        const notifId = `notif-doubt-${d.id}`;
        notifications.push({
          id: notifId,
          type: "doubt",
          title: "Doubt Answered by Faculty",
          message: `Faculty responded to: "${(d.question || "").slice(0, 50)}..."`,
          timestamp: time,
          timeAgo: formatTimeAgo(time),
          isRead: readSet.has(notifId),
          actionRoute: "/doubts",
          actionLabel: "View Solution",
        });
      });
    }
  } catch (doubtErr) {
    console.warn("Error processing doubt notifications:", doubtErr);
  }

  // 2. Safe New Mock Tests Notifications
  try {
    let mockQuery = supabase
      .from("mock_tests")
      .select("id, title, duration_minutes, created_at, exam_id, status, is_published")
      .order("created_at", { ascending: false })
      .limit(6);

    const { data: mocks } = await mockQuery;
    if (mocks && Array.isArray(mocks)) {
      const activeMocks = mocks.filter((m: any) => {
        if (m.status === "archived") return false;
        if (m.is_published === false) return false;
        if (examId && m.exam_id && m.exam_id !== examId) return false;
        return true;
      });

      activeMocks.slice(0, 3).forEach((m: any) => {
        const notifId = `notif-mock-${m.id}`;
        notifications.push({
          id: notifId,
          type: "mock",
          title: "New Mock Test Available",
          message: `"${m.title}" is live. Take full timed exam simulation.`,
          timestamp: m.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(m.created_at || new Date().toISOString()),
          isRead: readSet.has(notifId),
          actionRoute: "/(tabs)/mock-tests",
          actionLabel: "Take Mock",
        });
      });
    }
  } catch (mockErr) {
    console.warn("Error processing mock test notifications:", mockErr);
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
        const notifId = `notif-mat-${mat.id}`;
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
          id: notifId,
          type: "material",
          title,
          message: `Admin published: "${mat.title}" (${(mat.category || "notes").toUpperCase()}).`,
          timestamp: mat.created_at || new Date().toISOString(),
          timeAgo: formatTimeAgo(mat.created_at || new Date().toISOString()),
          isRead: readSet.has(notifId),
          actionRoute: "/materials",
          actionLabel,
        });
      });
    }
  } catch (matErr) {
    console.warn("Error processing study material notifications:", matErr);
  }

  // 4. Daily Study Goal Reminder
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const goalNotifId = `notif-goal-${todayStr}`;
    notifications.push({
      id: goalNotifId,
      type: "goal",
      title: "Daily Goal Ready",
      message: "Set your chapter targets and start your study stopwatch for today's revision.",
      timestamp: new Date().toISOString(),
      timeAgo: "Today",
      isRead: readSet.has(goalNotifId),
      actionRoute: "/(tabs)/dashboard",
      actionLabel: "Plan Day",
    });
  } catch (goalErr) {
    console.warn("Error processing goal notification:", goalErr);
  }

  // Sort: Unread first, then newest timestamp
  notifications.sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return notifications;
}
