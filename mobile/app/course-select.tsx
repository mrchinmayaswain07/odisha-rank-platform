import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GraduationCap, CheckCircle2, X } from "lucide-react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";
import { useAuth } from "../src/lib/auth-context";
import { Badge } from "../src/components/Badge";

export default function CourseSelectModal() {
  const { allExams, activeExam, setActiveCourse } = useAuth();

  const handleSelect = async (exam: any) => {
    await setActiveCourse(exam);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modal Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Select Target Examination</Text>
          <Text style={styles.subtitle}>
            Your syllabus, question bank, and test simulations will align to this course.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={22} color={BRAND_COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {allExams.map((exam) => {
          const isSelected = activeExam?.id === exam.id;

          return (
            <TouchableOpacity
              key={exam.id}
              onPress={() => handleSelect(exam)}
              style={[styles.examCard, isSelected && styles.examCardSelected]}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Badge
                  label={exam.conducting_body}
                  variant={isSelected ? "blue" : "slate"}
                  size="sm"
                />
                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <CheckCircle2 size={16} color={BRAND_COLORS.primary} />
                    <Text style={styles.selectedText}>Active</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.examTitle}>{exam.title}</Text>
              <Text style={styles.examDesc} numberOfLines={2}>
                {exam.description}
              </Text>

              {/* Selection stages preview */}
              {exam.stages && exam.stages.length > 0 ? (
                <View style={styles.stagesBox}>
                  <Text style={styles.stagesHeading}>Stages:</Text>
                  <Text style={styles.stagesList}>
                    {exam.stages.map((s: any) => s.name).join(" • ")}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  examCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border,
  },
  examCardSelected: {
    borderColor: BRAND_COLORS.primary,
    backgroundColor: "#f8fbff",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 6,
  },
  examDesc: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  stagesBox: {
    backgroundColor: BRAND_COLORS.background,
    padding: 8,
    borderRadius: 8,
  },
  stagesHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  stagesList: {
    fontSize: 11,
    color: BRAND_COLORS.textPrimary,
    fontWeight: "500",
  },
});
