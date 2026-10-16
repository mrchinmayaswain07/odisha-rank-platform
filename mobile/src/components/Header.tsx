import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, GraduationCap, ArrowLeftRight } from "lucide-react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";
import { useAuth } from "../lib/auth-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showCoursePill?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showCoursePill = true,
}) => {
  const { activeExam } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={BRAND_COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

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
});
