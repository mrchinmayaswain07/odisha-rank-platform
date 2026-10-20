import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, GraduationCap, ArrowLeftRight, Bell } from "lucide-react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";
import { useAuth } from "../lib/auth-context";
import { Logo } from "./Logo";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showCoursePill?: boolean;
  showNotificationBell?: boolean;
  unreadNotificationsCount?: number;
  onPressNotification?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showCoursePill = true,
  showNotificationBell = false,
  unreadNotificationsCount = 0,
  onPressNotification,
}) => {
  const { activeExam } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={BRAND_COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <Logo size={36} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.rightActions}>
          {showNotificationBell && (
            <TouchableOpacity
              style={styles.notifButton}
              activeOpacity={0.75}
              onPress={onPressNotification}
            >
              <Bell size={18} color={BRAND_COLORS.textPrimary} />
              {unreadNotificationsCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {showCoursePill && (
            <TouchableOpacity
              style={styles.coursePill}
              activeOpacity={0.8}
              onPress={() => router.push("/course-select")}
            >
              <GraduationCap size={14} color={BRAND_COLORS.primary} />
              <Text style={styles.courseText} numberOfLines={1}>
                {activeExam?.conducting_body || "Course"}
              </Text>
              <ArrowLeftRight size={12} color={BRAND_COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notifButton: {
    position: "relative",
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  notifBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  coursePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 5,
    maxWidth: 130,
  },
  courseText: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
});
