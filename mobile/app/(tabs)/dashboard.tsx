import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Clock,
  HelpCircle,
  Award,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from "lucide-react-native";
import { BRAND_COLORS, DashboardMetrics } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { getDashboardMetrics } from "../../src/lib/data-service";
import { Header } from "../../src/components/Header";
import { ProgressBar } from "../../src/components/ProgressBar";
import { Badge } from "../../src/components/Badge";

export default function DashboardScreen() {
  const { user, profile, activeExam } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getDashboardMetrics(user.id, activeExam?.id);
      setMetrics(data);
    } catch (err) {
      console.warn("Failed to fetch dashboard metrics:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user, activeExam]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Aspirant";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="OdishaRank"
        subtitle={`Namaskar, ${displayName}!`}
        showCoursePill={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_COLORS.primary]}
          />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loaderText}>Loading your study progress...</Text>
          </View>
        ) : (
          <>
            {/* 1. Target Course Progress Card */}
            <View style={styles.courseBanner}>
              <View style={styles.courseHeader}>
                <View style={styles.badgeRow}>
                  <Badge
                    label={activeExam?.conducting_body || "Odisha State Cadre"}
                    variant="blue"
                    size="sm"
                  />
                  <Text style={styles.subtext}>Official Syllabus</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/course-select")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeCourseLink}>Switch</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.courseTitle}>
                {activeExam?.title || "Choose Your Target Exam"}
              </Text>

              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Official Syllabus Coverage</Text>
                  <Text style={styles.progressPercent}>
                    {metrics?.official_progress_percentage || 0}%
                  </Text>
                </View>
                <ProgressBar
                  progress={metrics?.official_progress_percentage || 0}
                  color="blue"
                  height={8}
                />
                <Text style={styles.progressNote}>
                  {metrics?.completed_official_topics || 0} of{" "}
                  {metrics?.total_official_topics || 0} topics completed
                </Text>
              </View>
            </View>

            {/* 2. Key Metrics 2x2 Grid */}
            <Text style={styles.sectionTitle}>Preparation Analytics</Text>
            <View style={styles.metricsGrid}>
              {/* Study Hours */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Study Time</Text>
                  <Clock size={16} color={BRAND_COLORS.primary} />
                </View>
                <Text style={styles.metricValue}>
                  {metrics?.study_hours || 0}{" "}
                  <Text style={styles.metricUnit}>hrs</Text>
                </Text>
                <Text style={styles.metricSub}>Logged sessions</Text>
              </View>

              {/* Questions Practiced */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>MCQs Practiced</Text>
                  <HelpCircle size={16} color="#6366f1" />
                </View>
                <Text style={styles.metricValue}>
                  {metrics?.questions_practiced || 0}
                </Text>
                <Text style={styles.metricSub}>Question attempts</Text>
              </View>

              {/* Mock Tests Completed */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Mocks Done</Text>
                  <Award size={16} color={BRAND_COLORS.warning} />
                </View>
                <Text style={styles.metricValue}>
                  {metrics?.mock_tests_completed || 0}
                </Text>
                <Text style={styles.metricSub}>Simulations submitted</Text>
              </View>

              {/* Study Streak */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Streak</Text>
                  <TrendingUp size={16} color={BRAND_COLORS.success} />
                </View>
                <Text style={styles.metricValue}>
                  {metrics?.study_streak_days || 0}{" "}
                  <Text style={styles.metricUnit}>days</Text>
                </Text>
                <Text style={styles.metricSub}>Daily consistency</Text>
              </View>
            </View>

            {/* 3. Dual-Track Progress Cards */}
            <View style={styles.dualTrackContainer}>
              <View style={styles.dualCard}>
                <Text style={styles.dualTitle}>Personal Study</Text>
                <Text style={styles.dualPercent}>
                  {metrics?.personal_progress_percentage || 0}%
                </Text>
                <ProgressBar
                  progress={metrics?.personal_progress_percentage || 0}
                  color="emerald"
                  height={6}
                />
                <Text style={styles.dualSub}>
                  {metrics?.completed_personal_topics || 0} of{" "}
                  {metrics?.total_personal_topics || 0} custom topics
                </Text>
              </View>
            </View>

            {/* 4. Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: BRAND_COLORS.primary }]}
                onPress={() => router.push("/(tabs)/questions")}
                activeOpacity={0.8}
              >
                <HelpCircle size={18} color="#ffffff" />
                <Text style={styles.actionBtnText}>Practice MCQs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: BRAND_COLORS.secondary }]}
                onPress={() => router.push("/(tabs)/mock-tests")}
                activeOpacity={0.8}
              >
                <Award size={18} color="#ffffff" />
                <Text style={styles.actionBtnText}>Take Mock Test</Text>
              </TouchableOpacity>
            </View>

            {/* 5. Subject Breakdown */}
            {metrics?.subject_progress && metrics.subject_progress.length > 0 ? (
              <View style={styles.subjectSection}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.sectionTitle}>Syllabus by Subject</Text>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/syllabus")}>
                    <Text style={styles.viewAllText}>View All &rarr;</Text>
                  </TouchableOpacity>
                </View>

                {metrics.subject_progress.slice(0, 4).map((sub) => (
                  <View key={sub.subject_id} style={styles.subjectCard}>
                    <View style={styles.subjectRow}>
                      <Text style={styles.subjectName}>{sub.subject_name}</Text>
                      <Text style={styles.subjectPercent}>{sub.progress_percentage}%</Text>
                    </View>
                    <ProgressBar
                      progress={sub.progress_percentage}
                      color="blue"
                      height={5}
                      style={styles.subBar}
                    />
                    <Text style={styles.subjectCount}>
                      {sub.completed_topics} / {sub.total_topics} topics completed
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
  },
  courseBanner: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtext: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    fontWeight: "600",
  },
  changeCourseLink: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 14,
  },
  progressSection: {
    backgroundColor: BRAND_COLORS.background,
    padding: 12,
    borderRadius: 10,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
  },
  progressNote: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: "48.5%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.textMuted,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "900",
    color: BRAND_COLORS.textPrimary,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: "500",
    color: BRAND_COLORS.textMuted,
  },
  metricSub: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 4,
  },
  dualTrackContainer: {
    marginBottom: 20,
  },
  dualCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  dualTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 4,
  },
  dualPercent: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.success,
    marginBottom: 6,
  },
  dualSub: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  subjectSection: {
    marginBottom: 20,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  subjectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 8,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  subjectPercent: {
    fontSize: 13,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
  },
  subBar: {
    marginVertical: 4,
  },
  subjectCount: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
  },
});
