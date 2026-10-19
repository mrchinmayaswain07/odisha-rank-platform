import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  Bell,
  X,
  CheckCheck,
  MessageSquare,
  Award,
  BookOpen,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react-native";
import { router } from "expo-router";
import { BRAND_COLORS } from "@odisha-rank/shared";
import {
  AppNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../lib/notification-service";

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  userId: string;
  onRefreshNotifications: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  notifications,
  userId,
  onRefreshNotifications,
}) => {
  const [filter, setFilter] = useState<"all" | "doubt" | "mock" | "material">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  const handlePressItem = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(userId, notif.id);
      onRefreshNotifications();
    }
    onClose();
    if (notif.actionRoute) {
      router.push(notif.actionRoute as any);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAllNotificationsAsRead(userId, unreadIds);
      onRefreshNotifications();
    }
  };

  const getCategoryIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "doubt":
        return <MessageSquare size={16} color="#7c3aed" />;
      case "mock":
        return <Award size={16} color="#2563eb" />;
      case "material":
        return <BookOpen size={16} color="#0284c7" />;
      case "goal":
      default:
        return <Target size={16} color="#059669" />;
    }
  };

  const getCategoryBg = (type: AppNotification["type"]) => {
    switch (type) {
      case "doubt":
        return "rgba(124, 58, 237, 0.12)";
      case "mock":
        return "rgba(37, 99, 235, 0.12)";
      case "material":
        return "rgba(2, 132, 199, 0.12)";
      case "goal":
      default:
        return "rgba(5, 150, 105, 0.12)";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.bellIconBox}>
                <Bell size={18} color={BRAND_COLORS.primary} />
                {unreadCount > 0 && (
                  <View style={styles.headerUnreadBadge}>
                    <Text style={styles.headerUnreadText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <View>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Text style={styles.headerSubtitle}>
                  {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllRead}
                  style={styles.markAllBtn}
                  activeOpacity={0.7}
                >
                  <CheckCheck size={14} color={BRAND_COLORS.primary} />
                  <Text style={styles.markAllText}>Mark Read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {[
              { id: "all", label: `All (${notifications.length})` },
              { id: "doubt", label: "Doubts" },
              { id: "mock", label: "Mocks" },
              { id: "material", label: "Materials" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
                style={[
                  styles.filterPill,
                  filter === tab.id && styles.filterPillActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filter === tab.id && styles.filterPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notifications List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filtered.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Sparkles size={28} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptySub}>
                  You have no updates in this category. We&apos;ll notify you when new mocks, study notes, or doubt answers are posted!
                </Text>
              </View>
            ) : (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notifCard,
                    !item.isRead && styles.notifCardUnread,
                  ]}
                  onPress={() => handlePressItem(item)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.notifIconBox,
                      { backgroundColor: getCategoryBg(item.type) },
                    ]}
                  >
                    {getCategoryIcon(item.type)}
                  </View>

                  <View style={styles.notifBody}>
                    <View style={styles.notifTopRow}>
                      <Text
                        style={[
                          styles.notifTitle,
                          !item.isRead && styles.notifTitleBold,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.notifTime}>{item.timeAgo}</Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                      </View>
                    </View>

                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {item.message}
                    </Text>

                    {item.actionLabel && (
                      <View style={styles.actionRow}>
                        <Text style={styles.actionLabel}>{item.actionLabel}</Text>
                        <ArrowRight size={11} color={BRAND_COLORS.primary} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "82%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellIconBox: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerUnreadBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  headerUnreadText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: BRAND_COLORS.textSecondary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  filterPillActive: {
    backgroundColor: BRAND_COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  scrollView: {
    maxHeight: 450,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 10,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  notifCardUnread: {
    backgroundColor: "#f8faff",
    borderColor: "#bfdbfe",
  },
  notifIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  notifBody: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    flex: 1,
  },
  notifTitleBold: {
    color: "#0f172a",
    fontWeight: "800",
  },
  notifTime: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS.primary,
  },
  notifMessage: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
});
