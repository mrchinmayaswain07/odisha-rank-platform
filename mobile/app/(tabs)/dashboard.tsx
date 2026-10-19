import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
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
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  Target,
  X,
  Play,
  Check,
  Zap,
  Gamepad2,
} from "lucide-react-native";
import { BRAND_COLORS, DashboardMetrics } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { getDashboardMetrics, logStudySession } from "../../src/lib/data-service";
import { supabase } from "../../src/lib/supabase";
import { Header } from "../../src/components/Header";
import { ProgressBar } from "../../src/components/ProgressBar";
import { Badge } from "../../src/components/Badge";

interface StudyTask {
  id: string;
  topic_id: string;
  title: string;
  subject: string;
  duration: string;
  completed: boolean;
}

export default function DashboardScreen() {
  const { user, profile, activeExam } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Study Session Logger Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMinutes, setLogMinutes] = useState(45);
  const [logNotes, setLogNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // Dynamic Study Plan
  const defaultTasks: StudyTask[] = useMemo(() => {
    const examCode = activeExam?.conducting_body || "OSSC";
    return [
      {
        id: "m-sp-1",
        topic_id: "m-sp-1",
        title: `${examCode} General Studies – Indian Polity`,
        subject: "Polity",
        duration: "45 min",
        completed: false,
      },
      {
        id: "m-sp-2",
        topic_id: "m-sp-2",
        title: "Odisha Special – History & Geography of Odisha",
        subject: "Odisha GK",
        duration: "45 min",
        completed: false,
      },
      {
        id: "m-sp-3",
        topic_id: "m-sp-3",
        title: "Quantitative Aptitude – Simplification & Number System",
        subject: "Math",
        duration: "30 min",
        completed: false,
      },
      {
        id: "m-sp-4",
        topic_id: "m-sp-4",
        title: `Attempt Mock Test (${examCode} Sectional)`,
        subject: "Simulation",
        duration: "60 min",
        completed: false,
      },
    ];
  }, [activeExam]);

  const [studyPlan, setStudyPlan] = useState<StudyTask[]>(defaultTasks);

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

  // Toggle study plan task
  const toggleTask = async (taskId: string) => {
    const task = studyPlan.find((t) => t.id === taskId);
    if (!task) return;

    const willBeCompleted = !task.completed;

    // Optimistic UI update
    setStudyPlan((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: willBeCompleted } : t))
    );

    // Update metrics count and percentage in real-time
    setMetrics((prev) => {
      if (!prev) return prev;
      const delta = willBeCompleted ? 1 : -1;
      const newCompleted = Math.max(0, (prev.completed_official_topics || 0) + delta);
      const total = Math.max(1, prev.total_official_topics || 1);
      const newPct = Math.min(100, Math.round((newCompleted / total) * 100));

      return {
        ...prev,
        completed_official_topics: newCompleted,
        official_progress_percentage: newPct,
      };
    });

    // Sync to Supabase
    if (user) {
      try {
        await supabase.from("student_topic_progress").upsert(
          {
            user_id: user.id,
            topic_id: task.topic_id,
            status: willBeCompleted ? "completed" : "not_started",
            completed_at: willBeCompleted ? new Date().toISOString() : null,
            last_studied_at: new Date().toISOString(),
          },
          { onConflict: "user_id,topic_id" }
        );
      } catch (err) {
        console.warn("Topic progress toggle error:", err);
      }
    }
  };

  // Log study session
  const handleSaveStudySession = async () => {
    if (!user) return;
    setIsLogging(true);
    try {
      const success = await logStudySession({
        userId: user.id,
        durationMinutes: logMinutes,
        notes: logNotes || "Mobile self-study revision",
      });

      if (success) {
        const addedHours = Math.round((logMinutes / 60) * 10) / 10;
        setMetrics((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            study_hours: Math.round(((prev.study_hours || 0) + addedHours) * 10) / 10,
            study_hours_today: Math.round(((prev.study_hours_today || 0) + addedHours) * 10) / 10,
            study_streak_days: prev.study_streak_days === 0 ? 1 : prev.study_streak_days,
          };
        });
        setShowLogModal(false);
        setLogNotes("");
        Alert.alert("Session Logged!", `Recorded ${logMinutes} minutes of focused study time.`);
      } else {
        Alert.alert("Log Notice", "Recorded study session locally.");
        setShowLogModal(false);
      }
    } catch {
      setShowLogModal(false);
    } finally {
      setIsLogging(false);
    }
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
            {/* 1. Target Course Progress Banner */}
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

            {/* 2. Today's Study Plan (Dynamic & Toggleable) */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planTitleGroup}>
                  <Target size={16} color={BRAND_COLORS.primary} />
                  <Text style={styles.planTitle}>Today&apos;s Study Plan</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowLogModal(true)}
                  style={styles.logSessionPill}
                  activeOpacity={0.7}
                >
                  <Plus size={12} color={BRAND_COLORS.primary} />
                  <Text style={styles.logSessionText}>Log Study</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.taskList}>
                {studyPlan.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskItem}
                    onPress={() => toggleTask(task.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxWrapper}>
                      {task.completed ? (
                        <CheckCircle2 size={18} color="#059669" />
                      ) : (
                        <Circle size={18} color="#cbd5e1" />
                      )}
                    </View>
                    <View style={styles.taskTextWrapper}>
                      <Text
                        style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted,
                        ]}
                      >
                        {task.title}
                      </Text>
                      <View style={styles.taskMetaRow}>
                        <Text style={styles.taskSubject}>{task.subject}</Text>
                        <Text style={styles.taskDot}>•</Text>
                        <Text style={styles.taskDuration}>{task.duration}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Key Metrics Grid (Authentic Real Data) */}
            <Text style={styles.sectionTitle}>Preparation Analytics</Text>
            <View style={styles.metricsGrid}>
              {/* Study Hours */}
              <TouchableOpacity
                style={styles.metricCard}
                onPress={() => setShowLogModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Study Time</Text>
                  <Clock size={16} color={BRAND_COLORS.primary} />
                </View>
                <Text style={styles.metricValue}>
                  {metrics?.study_hours || 0}{" "}
                  <Text style={styles.metricUnit}>hrs</Text>
                </Text>
                <Text style={styles.metricSub}>
                  {metrics?.study_hours_today ? `${metrics.study_hours_today} hrs today` : "Tap to log"}
                </Text>
              </TouchableOpacity>

              {/* Questions Practiced */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>MCQs Practiced</Text>
                  <HelpCircle size={16} color="#6366f1" />
                </View>
                <Text style={styles.metricValue}>
                  {metrics?.questions_practiced || 0}
                </Text>
                <Text style={styles.metricSub}>
                  {metrics?.questions_practiced_today
                    ? `${metrics.questions_practiced_today} today`
                    : "Actual attempts"}
                </Text>
              </View>

              {/* Accuracy */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>Accuracy</Text>
                  <Target size={16} color="#0d9488" />
                </View>
                <Text style={styles.metricValue}>
                  {metrics?.accuracy_percentage ?? 0}%
                </Text>
                <Text style={styles.metricSub}>Overall correct</Text>
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
                <Text style={styles.metricSub}>
                  {metrics?.mock_tests_this_month
                    ? `${metrics.mock_tests_this_month} this month`
                    : "Simulations submitted"}
                </Text>
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

            {/* 3. Dedicated BODMAS & Speed Calculation Zone */}
            <View style={styles.bodmasSection}>
              <View style={styles.bodmasHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.bodmasHeaderIconBadge}>
                    <Zap size={16} color="#f59e0b" fill="#f59e0b" />
                  </View>
                  <View>
                    <Text style={styles.bodmasSectionTitle}>BODMAS & Calculation Lab</Text>
                    <Text style={styles.bodmasSectionSub}>Speed training for OSSC & OSSSC exams</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/speed-math" as any)}
                  style={styles.bodmasViewAllBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bodmasViewAllText}>16 Drills</Text>
                  <ArrowRight size={12} color="#38bdf8" />
                </TouchableOpacity>
              </View>

              {/* Featured BODMAS Master Card */}
              <View style={styles.bodmasMainCard}>
                <View style={styles.bodmasBadgeRow}>
                  <View style={styles.bodmasPillTag}>
                    <Text style={styles.bodmasPillTagText}>CORE EXAM TOPIC</Text>
                  </View>
                  <Text style={styles.bodmasRuleFormula}>B → O → D → M → A → S</Text>
                </View>

                <Text style={styles.bodmasMainTitle}>BODMAS Fast Simplification</Text>
                <Text style={styles.bodmasMainDesc}>
                  Master bracket evaluation, divisions, and multiplications with live countdown & accuracy metrics.
                </Text>

                {/* Difficulty Quick Start Row */}
                <View style={styles.bodmasDiffRow}>
                  <TouchableOpacity
                    style={[styles.bodmasDiffBtn, { borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)" }]}
                    onPress={() =>
                      router.push({ pathname: "/speed-math", params: { category: "bodmas", difficulty: "easy" } } as any)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.bodmasDiffText, { color: "#34d399" }]}>Easy (2-Step)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bodmasDiffBtn, { borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.1)" }]}
                    onPress={() =>
                      router.push({ pathname: "/speed-math", params: { category: "bodmas", difficulty: "medium" } } as any)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.bodmasDiffText, { color: "#fbbf24" }]}>Medium (3-Step)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bodmasDiffBtn, { borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)" }]}
                    onPress={() =>
                      router.push({ pathname: "/speed-math", params: { category: "bodmas", difficulty: "hard" } } as any)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.bodmasDiffText, { color: "#f87171" }]}>Hard (Nested)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horizontal Drills Carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bodmasScrollCards}
              >
                <TouchableOpacity
                  style={styles.bodmasSubCard}
                  onPress={() =>
                    router.push({ pathname: "/speed-math", params: { category: "addition", difficulty: "medium" } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.bodmasSubIconBox, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#3b82f6" }}>＋</Text>
                  </View>
                  <Text style={styles.bodmasSubCardTitle}>Rapid Addition</Text>
                  <Text style={styles.bodmasSubCardSub}>2 & 3 Digit Fast Math</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bodmasSubCard}
                  onPress={() =>
                    router.push({ pathname: "/speed-math", params: { category: "tables", difficulty: "medium" } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.bodmasSubIconBox, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#10b981" }}>×</Text>
                  </View>
                  <Text style={styles.bodmasSubCardTitle}>Tables (1-30)</Text>
                  <Text style={styles.bodmasSubCardSub}>Instant Recall Speed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bodmasSubCard}
                  onPress={() =>
                    router.push({ pathname: "/speed-math", params: { category: "squares", difficulty: "medium" } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.bodmasSubIconBox, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#8b5cf6" }}>x²</Text>
                  </View>
                  <Text style={styles.bodmasSubCardTitle}>Squares (1-50)</Text>
                  <Text style={styles.bodmasSubCardSub}>Roots & Powers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bodmasSubCard}
                  onPress={() =>
                    router.push({ pathname: "/speed-math", params: { category: "percent_to_fraction", difficulty: "medium" } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.bodmasSubIconBox, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#f59e0b" }}>%</Text>
                  </View>
                  <Text style={styles.bodmasSubCardTitle}>DI Percentages</Text>
                  <Text style={styles.bodmasSubCardSub}>Fraction Shortcuts</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* 4. Quick Actions (With Doubts Feature) */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: BRAND_COLORS.primary }]}
                onPress={() => router.push("/(tabs)/questions")}
                activeOpacity={0.8}
              >
                <HelpCircle size={18} color="#ffffff" />
                <Text style={styles.actionCardTitle}>Practice MCQs</Text>
                <Text style={styles.actionCardSub}>Topic-wise questions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: "#7c3aed" }]}
                onPress={() => router.push("/doubts" as any)}
                activeOpacity={0.8}
              >
                <MessageSquare size={18} color="#ffffff" />
                <Text style={styles.actionCardTitle}>Ask Doubts</Text>
                <Text style={styles.actionCardSub}>Faculty Q&A support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: BRAND_COLORS.secondary }]}
                onPress={() => router.push("/(tabs)/mock-tests")}
                activeOpacity={0.8}
              >
                <Award size={18} color="#ffffff" />
                <Text style={styles.actionCardTitle}>Take Mock Test</Text>
                <Text style={styles.actionCardSub}>Timed simulation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: "#ea580c" }]}
                onPress={() => router.push("/games" as any)}
                activeOpacity={0.8}
              >
                <Gamepad2 size={18} color="#ffffff" />
                <Text style={styles.actionCardTitle}>Brain Games</Text>
                <Text style={styles.actionCardSub}>32 Mental Puzzles</Text>
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

      {/* Log Study Session Modal */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLogModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Study Session</Text>
                <Text style={styles.modalSub}>Record your self-study revision time</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLogModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={BRAND_COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Minute Quick Selectors */}
            <Text style={styles.inputLabel}>Duration (Minutes)</Text>
            <View style={styles.durationRow}>
              {[30, 45, 60, 90, 120].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.durationChip,
                    logMinutes === m && styles.durationChipActive,
                  ]}
                  onPress={() => setLogMinutes(m)}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      logMinutes === m && styles.durationChipTextActive,
                    ]}
                  >
                    {m}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.inputLabel}>Study Notes / Topics Covered</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Revised Odisha History & practiced 20 Simplification MCQs"
              placeholderTextColor={BRAND_COLORS.textMuted}
              value={logNotes}
              onChangeText={setLogNotes}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, isLogging && styles.saveBtnDisabled]}
              onPress={handleSaveStudySession}
              disabled={isLogging}
              activeOpacity={0.85}
            >
              {isLogging ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.saveBtnText}>
                    Save {logMinutes} Mins Session
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
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
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    fontWeight: "500",
  },
  changeCourseLink: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 14,
  },
  progressSection: {
    marginTop: 4,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    fontWeight: "500",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
  },
  progressNote: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 6,
  },
  // Today's Study Plan
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  planTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  logSessionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logSessionText: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.primary,
  },
  taskList: {
    gap: 10,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  checkboxWrapper: {
    marginTop: 2,
  },
  taskTextWrapper: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
    lineHeight: 18,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: BRAND_COLORS.textMuted,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  taskSubject: {
    fontSize: 11,
    color: BRAND_COLORS.primary,
    fontWeight: "500",
  },
  taskDot: {
    fontSize: 10,
    color: BRAND_COLORS.textMuted,
  },
  taskDuration: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
  },
  // Metrics Grid
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: "46%",
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
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
  },
  metricSub: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 4,
  },
  // Quick Action Grid
  actionGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  actionCardTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  actionCardSub: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 10,
    marginTop: 2,
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 10,
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  durationChipActive: {
    backgroundColor: "#eff6ff",
    borderColor: BRAND_COLORS.primary,
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
  },
  durationChipTextActive: {
    color: BRAND_COLORS.primary,
    fontWeight: "700",
  },
  notesInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: BRAND_COLORS.textPrimary,
    marginBottom: 18,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  // BODMAS & Calculation Lab Section
  bodmasSection: {
    backgroundColor: "#0b1222",
    borderRadius: 20,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  bodmasHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bodmasHeaderIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bodmasSectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  bodmasSectionSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 1,
  },
  bodmasViewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  bodmasViewAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38bdf8",
  },
  bodmasMainCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f59e0b44",
    marginBottom: 12,
  },
  bodmasBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bodmasPillTag: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bodmasPillTagText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  bodmasRuleFormula: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fbbf24",
    letterSpacing: 1,
  },
  bodmasMainTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  bodmasMainDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 17,
    marginBottom: 12,
  },
  bodmasDiffRow: {
    flexDirection: "row",
    gap: 8,
  },
  bodmasDiffBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bodmasDiffText: {
    fontSize: 11,
    fontWeight: "700",
  },
  bodmasScrollCards: {
    gap: 10,
    paddingVertical: 2,
  },
  bodmasSubCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    width: 130,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  bodmasSubIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  bodmasSubCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
  },
  bodmasSubCardSub: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  speedMathBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
  },
  speedMathBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  speedMathIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  speedMathBadgeRow: {
    alignSelf: "flex-start",
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  speedMathBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#0f172a",
  },
  speedMathTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
  },
  speedMathSub: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
});
