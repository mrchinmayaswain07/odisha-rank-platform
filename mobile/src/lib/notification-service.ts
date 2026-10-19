import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

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
  const readSet = await getReadNotificationIds(userId);

  try {
    // 1. Personalized Doubt Notifications
    if (userId) {
      const { data: doubts } = await supabase
        .from("doubts")
        .select("id, subject, question_text, status, updated_at, created_at, answers(id, answer_text, created_at)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (doubts && doubts.length > 0) {
        doubts.forEach((d: any) => {
          const hasAnswer = d.status === "answered" || (d.answers && d.answers.length > 0);
          if (hasAnswer) {
            const time = d.updated_at || d.created_at;
            notifications.push({
              id: `notif-doubt-${d.id}`,
              type: "doubt",
              title: "Doubt Answered",
              message: `Faculty responded to your ${d.subject || "exam"} question: "${d.question_text.slice(0, 55)}..."`,
              timestamp: time,
              timeAgo: formatTimeAgo(time),
              isRead: readSet.has(`notif-doubt-${d.id}`),
              actionRoute: "/doubts",
              actionLabel: "View Solution",
            });
          }
        });
      }
    }

    // 2. New Mock Tests Released
    let mockQuery = supabase
      .from("mock_tests")
      .select("id, title, duration_minutes, created_at, exam_id")
      .eq("is_published", true)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(3);

    if (examId) {
      mockQuery = mockQuery.eq("exam_id", examId);
    }

    const { data: mocks } = await mockQuery;
    if (mocks && mocks.length > 0) {
      mocks.forEach((m: any) => {
        notifications.push({
          id: `notif-mock-${m.id}`,
          type: "mock",
          title: "New Mock Test Published",
          message: `"${m.title}" is now active with full time-bound exam simulation.`,
          timestamp: m.created_at,
          timeAgo: formatTimeAgo(m.created_at),
          isRead: readSet.has(`notif-mock-${m.id}`),
          actionRoute: "/(tabs)/mock-tests",
          actionLabel: "Take Mock",
        });
      });
    }

    // 3. New Study Notes & PDFs
    let matQuery = supabase
      .from("study_materials")
      .select("id, title, category, created_at, exam_id")
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(2);

    if (examId) {
      matQuery = matQuery.eq("exam_id", examId);
    }

    const { data: materials } = await matQuery;
    if (materials && materials.length > 0) {
      materials.forEach((mat: any) => {
        if (!mat.title.startsWith("[SYSTEM_")) {
          notifications.push({
            id: `notif-mat-${mat.id}`,
            type: "material",
            title: "Study Material Added",
            message: `New official notes added: "${mat.title}" (${mat.category?.toUpperCase() || "PDF"}).`,
            timestamp: mat.created_at,
            timeAgo: formatTimeAgo(mat.created_at),
            isRead: readSet.has(`notif-mat-${mat.id}`),
            actionRoute: "/materials",
            actionLabel: "Open PDF",
          });
        }
      });
    }

    // 4. Personalized Daily Goal Reminder
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

    // Sort by unread first, then latest timestamp
    notifications.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  } catch (err) {
    console.warn("Failed to build notifications:", err);
  }

  return notifications;
}
