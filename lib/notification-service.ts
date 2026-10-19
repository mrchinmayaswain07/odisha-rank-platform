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
  url?: string;
  isDrive?: boolean;
}

const READ_KEY_PREFIX = "odisharank_read_notifs_";

export function getReadNotificationIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${READ_KEY_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (err) {
    console.warn("Failed to load read notifications from storage:", err);
  }
  return new Set();
}

export function markNotificationAsRead(userId: string, notificationId: string): void {
  if (typeof window === "undefined") return;
  try {
    const readSet = getReadNotificationIds(userId);
    readSet.add(notificationId);
    localStorage.setItem(
      `${READ_KEY_PREFIX}${userId}`,
      JSON.stringify(Array.from(readSet))
    );
  } catch (err) {
    console.warn("Failed to save read notification to storage:", err);
  }
}

export function markAllNotificationsAsRead(userId: string, notificationIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const readSet = getReadNotificationIds(userId);
    notificationIds.forEach((id) => readSet.add(id));
    localStorage.setItem(
      `${READ_KEY_PREFIX}${userId}`,
      JSON.stringify(Array.from(readSet))
    );
  } catch (err) {
    console.warn("Failed to mark all notifications as read:", err);
  }
}

export async function fetchStudentNotifications(
  userId: string,
  examId?: string
): Promise<AppNotification[]> {
  try {
    const targetUserId = userId || "guest_student";
    const readSet = getReadNotificationIds(targetUserId);

    const url = new URL("/api/notifications", window.location.origin);
    if (examId && examId !== "all") {
      url.searchParams.set("examId", examId);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch notifications: ${res.statusText}`);
    }

    const json = await res.json();
    const rawList: any[] = json.notifications || [];

    const enriched: AppNotification[] = rawList.map((item) => ({
      ...item,
      isRead: readSet.has(item.id),
    }));

    // Sort: unread first, then newest timestamp
    enriched.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return enriched;
  } catch (err) {
    console.warn("fetchStudentNotifications error:", err);
    return [];
  }
}
