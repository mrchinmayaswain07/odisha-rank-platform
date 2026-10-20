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
  Brain,
  BookOpen,
  Timer,
  Trash2,
  Flame,
  Calculator,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BRAND_COLORS, DashboardMetrics } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { getDashboardMetrics, logStudySession } from "../../src/lib/data-service";
import { supabase } from "../../src/lib/supabase";
import { Header } from "../../src/components/Header";
import { ProgressBar } from "../../src/components/ProgressBar";
import { Badge } from "../../src/components/Badge";
import { AddGoalModal, TodayGoalItem } from "../../src/components/AddGoalModal";
import { StopwatchModal } from "../../src/components/StopwatchModal";
import { NotificationsModal } from "../../src/components/NotificationsModal";
import { fetchStudentNotifications, AppNotification } from "../../src/lib/notification-service";

const TODAY_GOALS_KEY = "odisharank_today_goals_";
const TARGET_HOURS_KEY = "odisharank_target_hours_";
const DELETED_GOALS_KEY = "odisharank_deleted_goals_";
const METRICS_CACHE_KEY = "odisharank_metrics_cache_";
const getTodayDateStr = () => new Date().toISOString().split("T")[0];

export default function DashboardScreen() {
  const { user, profile, activeExam } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Today's Goal State
  const [targetHours, setTargetHours] = useState<number>(3);
  const [todayGoals, setTodayGoals] = useState<TodayGoalItem[]>([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState<boolean>(false);
  const [showStopwatchModal, setShowStopwatchModal] = useState<boolean>(false);
  const [activeStopwatchTopic, setActiveStopwatchTopic] = useState<string>("Focused Preparation");

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

  // Study Session Logger Modal (Manual)
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMinutes, setLogMinutes] = useState(45);
  const [logNotes, setLogNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // Load Today's Goals from AsyncStorage with dynamic syllabus fallbacks and tombstone tracking
  const loadTodayGoals = useCallback(async () => {
    const uid = user?.id || "student_user";
    const today = getTodayDateStr();
    try {
      const savedHours = await AsyncStorage.getItem(`${TARGET_HOURS_KEY}${uid}`);
      if (savedHours) setTargetHours(Number(savedHours) || 3);

      // 1. Load tombstone deleted IDs
      const deletedRaw = await AsyncStorage.getItem(`${DELETED_GOALS_KEY}${uid}`);
      const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      const deletedSet = new Set(deletedIds);

      // 2. Check stored goals for today
      const raw = await AsyncStorage.getItem(`${TODAY_GOALS_KEY}${uid}_${today}`);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out any tombstoned items
          const filtered = parsed.filter((g: TodayGoalItem) => !deletedSet.has(g.id));
          setTodayGoals(filtered);
          return;
        }
      }

      // 3. Fallback dynamic goals based on active exam (only when no storage for today exists)
      const examCode = activeExam?.conducting_body || "OSSC";
      const initialGoals: TodayGoalItem[] = [
        {
          id: "tg-1",
          title: `${examCode} General Studies – Indian Polity`,
          subject: "Polity",
          chapter: "Constitution & Governance",
          durationMinutes: 45,
          completed: false,
        },
        {
          id: "tg-2",
          title: "Odisha Special – History & Geography of Odisha",
          subject: "Odisha GK",
          chapter: "Historical Heritage",
          durationMinutes: 45,
          completed: false,
        },
        {
          id: "tg-3",
          title: "Quantitative Aptitude – Simplification Sprint",
          subject: "Math",
          chapter: "Number System",
          durationMinutes: 30,
          completed: false,
        },
        {
          id: "tg-4",
          title: `Attempt Mock Test (${examCode} Sectional Simulation)`,
          subject: "Simulation",
          chapter: "Full Paper",
          durationMinutes: 60,
          completed: false,
        },
      ].filter((g) => !deletedSet.has(g.id));

      setTodayGoals(initialGoals);
      await AsyncStorage.setItem(`${TODAY_GOALS_KEY}${uid}_${today}`, JSON.stringify(initialGoals));
    } catch (err) {
      console.warn("Failed to load today's goals:", err);
    }
  }, [user?.id, activeExam?.conducting_body]);

  // Load Notifications
  const loadNotifications = useCallback(async () => {
    try {
      const uid = user?.id || "student_user";
      const list = await fetchStudentNotifications(uid, activeExam?.id);
      setNotifications(list);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    }
  }, [user?.id, activeExam?.id]);

  const fetchMetrics = useCallback(async (isInitial = false) => {
    if (!user?.id) return;
    const uid = user.id;
    const cacheKey = `${METRICS_CACHE_KEY}${uid}_${activeExam?.id || "all"}`;

    if (isInitial) {
      // 1. Instant 0ms render from disk cache
      try {
        const cachedRaw = await AsyncStorage.getItem(cacheKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed) {
            setMetrics(parsed);
            setIsLoading(false);
          }
        }
      } catch {}
    }

    // 2. Fetch fresh metrics from database
    try {
      const data = await getDashboardMetrics(uid, activeExam?.id);
      setMetrics(data);
      AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
    } catch (err) {
      console.warn("Failed to fetch dashboard metrics:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, activeExam?.id]);

  useEffect(() => {
    // Run all initial loads concurrently
    fetchMetrics(true);
    loadTodayGoals();
    loadNotifications();
  }, [fetchMetrics, loadTodayGoals, loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchMetrics(false),
      loadTodayGoals(),
      loadNotifications(),
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  // Toggle Today's Goal Item
  const toggleGoal = async (goalId: string) => {
    const uid = user?.id || "student_user";
    const today = getTodayDateStr();
    setTodayGoals((prev) => {
      const updated = prev.map((g) =>
        g.id === goalId ? { ...g, completed: !g.completed } : g
      );
      AsyncStorage.setItem(`${TODAY_GOALS_KEY}${uid}_${today}`, JSON.stringify(updated)).catch((err) =>
        console.warn("Failed to save goals after toggle:", err)
      );
      return updated;
    });
  };

  // Add Today's Goal Item
  const handleAddGoalItem = async (newItem: TodayGoalItem) => {
    const uid = user?.id || "student_user";
    const today = getTodayDateStr();
    setTodayGoals((prev) => {
      const updated = [newItem, ...prev];
      AsyncStorage.setItem(`${TODAY_GOALS_KEY}${uid}_${today}`, JSON.stringify(updated)).catch((err) =>
        console.warn("Failed to save goals after add:", err)
      );
      return updated;
    });
  };

  // Delete Today's Goal Item
  const handleDeleteGoalItem = async (goalId: string) => {
    const uid = user?.id || "student_user";
    const today = getTodayDateStr();

    // 1. Immediately update state and persist updated goals list
    setTodayGoals((prev) => {
      const updated = prev.filter((g) => g.id !== goalId);
      AsyncStorage.setItem(`${TODAY_GOALS_KEY}${uid}_${today}`, JSON.stringify(updated)).catch((err) =>
        console.warn("Failed to save goals after delete:", err)
      );
      return updated;
    });

    // 2. Add to permanent deleted goals tombstone so it NEVER resurfaces
    try {
      const deletedRaw = await AsyncStorage.getItem(`${DELETED_GOALS_KEY}${uid}`);
      const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deletedIds.includes(goalId)) {
        deletedIds.push(goalId);
        await AsyncStorage.setItem(`${DELETED_GOALS_KEY}${uid}`, JSON.stringify(deletedIds));
      }
    } catch (err) {
      console.warn("Failed to save deleted goal tombstone:", err);
    }
  };

  // Save Target Hours
  const handleSaveTargetHours = async (hours: number) => {
    const uid = user?.id || "student_user";
    setTargetHours(hours);
    await AsyncStorage.setItem(`${TARGET_HOURS_KEY}${uid}`, String(hours));
  };

  // Start Stopwatch for a specific topic
  const handleStartStopwatchForTopic = (topicTitle: string) => {
    setActiveStopwatchTopic(topicTitle);
    setShowStopwatchModal(true);
  };

  // Log study session (from Stopwatch or manual logger)
  const handleSaveStudySession = async (minutesParam?: number, notesParam?: string) => {
    if (!user) return;
    const duration = minutesParam || logMinutes;
    const noteText = notesParam || logNotes || "Focused Self-Study";
    setIsLogging(true);
    try {
      const success = await logStudySession({
        userId: user.id,
        durationMinutes: duration,
        notes: noteText,
      });

      if (success) {
        const addedHours = Math.round((duration / 60) * 10) / 10;
        setMetrics((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            study_hours: Math.round(((prev.study_hours || 0) + addedHours) * 10) / 10,
            study_hours_today: Math.round(((prev.study_hours_today || 0) + addedHours) * 10) / 10,
            study_streak_days: prev.study_streak_days === 0 ? 1 : prev.study_streak_days,
          };
        });

        // Mark goal completed if note matches topic
        const updated = todayGoals.map((g) => {
          if (
            noteText.toLowerCase().includes(g.subject.toLowerCase()) ||
            noteText.toLowerCase().includes(g.title.toLowerCase())
          ) {
            return { ...g, completed: true };
          }
          return g;
        });
        setTodayGoals(updated);
        if (user) {
          const today = getTodayDateStr();
          await AsyncStorage.setItem(`${TODAY_GOALS_KEY}${user.id}_${today}`, JSON.stringify(updated));
        }

        setShowLogModal(false);
        setLogNotes("");
        loadNotifications();
        if (!minutesParam) {
          Alert.alert("Session Logged!", `Recorded ${duration} minutes of focused study time.`);
        }
      }
    } catch {
      setShowLogModal(false);
    } finally {
      setIsLogging(false);
    }
  };

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Aspirant";

  const completedGoalsCount = todayGoals.filter((g) => g.completed).length;
  const totalGoalsCount = todayGoals.length;
  const completedGoalMinutes = todayGoals
    .filter((g) => g.completed)
    .reduce((sum, g) => sum + (g.durationMinutes || 0), 0);
  const hoursStudiedToday =
    metrics?.study_hours_today !== undefined && metrics?.study_hours_today !== null
      ? metrics.study_hours_today
      : Math.round((completedGoalMinutes / 60) * 10) / 10;
  const goalProgressPercentage = Math.min(
    100,
    Math.round((hoursStudiedToday / Math.max(1, targetHours)) * 100)
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="OdishaRank"
        subtitle={`Namaskar, ${displayName}!`}
        showCoursePill={true}
        showNotificationBell={true}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        onPressNotification={() => setShowNotificationsModal(true)}
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
            {/* 1. Key Metrics Grid (Authentic Real Data) */}
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

            {/* 2. Quick Actions */}
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
                style={[styles.actionCard, { backgroundColor: "#2563eb" }]}
                onPress={() => router.push("/speed-math" as any)}
                activeOpacity={0.8}
              >
                <Calculator size={18} color="#ffffff" />
                <Text style={styles.actionCardTitle}>Speed Math</Text>
                <Text style={styles.actionCardSub}>16 Calculation Drills</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: "#059669" }]}
                onPress={() => router.push("/bodmas" as any)}
                activeOpacity={0.8}
              >
                <Zap size={18} color="#ffffff" fill="#ffffff" />
                <Text style={styles.actionCardTitle}>BODMAS Lab</Text>
                <Text style={styles.actionCardSub}>Fast Simplification</Text>
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

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: "#0284c7" }]}
                onPress={() => router.push("/materials" as any)}
                activeOpacity={0.8}
              >
                <BookOpen size={18} color="#ffffff" />
                <Text style={styles.actionCardTitle}>Study Notes & PDFs</Text>
                <Text style={styles.actionCardSub}>Notes & Drive links</Text>
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
            </View>


            {/* 4. Today's Goal (Dynamic Target & Syllabus Lookup & Stopwatch) */}
            <View style={styles.goalCard}>
              <View style={styles.goalCardHeader}>
                <View style={styles.goalHeaderTitleGroup}>
                  <View style={styles.goalTargetIconBadge}>
                    <Target size={18} color={BRAND_COLORS.primary} />
                  </View>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.goalCardTitle}>Today&apos;s Goal</Text>
                      <View style={styles.todayDatePill}>
                        <Text style={styles.todayDateText}>Today</Text>
                      </View>
                    </View>
                    <Text style={styles.goalCardSub}>
                      {completedGoalsCount} of {totalGoalsCount} topics completed
                    </Text>
                  </View>
                </View>

                <View style={styles.goalHeaderActions}>
                  <TouchableOpacity
                    style={styles.headerAddGoalBtn}
                    onPress={() => setShowAddGoalModal(true)}
                    activeOpacity={0.8}
                  >
                    <Plus size={13} color={BRAND_COLORS.primary} />
                    <Text style={styles.headerAddGoalText}>Add Topic</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Study Time Target Tracker */}
              <View style={styles.goalTargetProgressBox}>
                <View style={styles.goalTargetProgressHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Clock size={13} color={BRAND_COLORS.primary} />
                    <Text style={styles.goalTargetProgressLabel}>Daily Target Hours</Text>
                  </View>
                  <Text style={styles.goalTargetProgressValue}>
                    {hoursStudiedToday} hrs{" "}
                    <Text style={{ color: BRAND_COLORS.textMuted, fontWeight: "500", fontSize: 11 }}>
                      / {targetHours} hrs target ({goalProgressPercentage}%)
                    </Text>
                  </Text>
                </View>

                {/* Progress bar track */}
                <View style={styles.goalProgressBarTrack}>
                  <View
                    style={[
                      styles.goalProgressBarFill,
                      { width: `${goalProgressPercentage}%` },
                      goalProgressPercentage >= 100 && { backgroundColor: "#10b981" },
                    ]}
                  />
                </View>

                {/* Quick Target Hour Chips: 1h, 2h, 3h, 4h, 5h, 6h */}
                <View style={styles.goalHourChipsRow}>
                  <Text style={styles.goalHourChipsPrompt}>Target:</Text>
                  {[1, 2, 3, 4, 5, 6].map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.goalHourChip,
                        targetHours === h && styles.goalHourChipActive,
                      ]}
                      onPress={() => handleSaveTargetHours(h)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.goalHourChipText,
                          targetHours === h && styles.goalHourChipTextActive,
                        ]}
                      >
                        {h}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dynamic Goal Topics Checklist */}
              {todayGoals.length === 0 ? (
                <View style={styles.goalEmptyContainer}>
                  <Target size={26} color="#94a3b8" />
                  <Text style={styles.goalEmptyTitle}>No study goals set for today</Text>
                  <Text style={styles.goalEmptySub}>
                    Choose topics from your active syllabus to build today&apos;s goal.
                  </Text>
                  <TouchableOpacity
                    style={styles.goalEmptyAddBtn}
                    onPress={() => setShowAddGoalModal(true)}
                    activeOpacity={0.8}
                  >
                    <Plus size={14} color="#ffffff" />
                    <Text style={styles.goalEmptyAddBtnText}>Add First Study Topic</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.goalList}>
                  {todayGoals.map((task) => (
                    <View
                      key={task.id}
                      style={[
                        styles.goalItemCard,
                        task.completed && styles.goalItemCardCompleted,
                      ]}
                    >
                      {/* Left: Checkbox toggle */}
                      <TouchableOpacity
                        style={styles.goalCheckBtn}
                        onPress={() => toggleGoal(task.id)}
                        activeOpacity={0.7}
                      >
                        {task.completed ? (
                          <CheckCircle2 size={19} color="#10b981" />
                        ) : (
                          <Circle size={19} color="#cbd5e1" />
                        )}
                      </TouchableOpacity>

                      {/* Middle: Title, Subject & Chapter info */}
                      <TouchableOpacity
                        style={styles.goalContentCol}
                        onPress={() => toggleGoal(task.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.goalItemTitle,
                            task.completed && styles.goalItemTitleCompleted,
                          ]}
                          numberOfLines={2}
                        >
                          {task.title}
                        </Text>
                        <View style={styles.goalItemMetaRow}>
                          <View style={styles.goalSubjectChip}>
                            <Text style={styles.goalSubjectChipText}>{task.subject}</Text>
                          </View>
                          {task.chapter ? (
                            <Text style={styles.goalChapterName} numberOfLines={1}>
                              {task.chapter}
                            </Text>
                          ) : null}
                          <View style={styles.goalDurationBadge}>
                            <Clock size={10} color="#64748b" />
                            <Text style={styles.goalDurationText}>
                              {task.durationMinutes}m
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Right actions: Stopwatch timer launch + delete */}
                      <View style={styles.goalItemRightActions}>
                        <TouchableOpacity
                          style={styles.goalItemTimerBtn}
                          onPress={() => handleStartStopwatchForTopic(`${task.subject}: ${task.title}`)}
                          activeOpacity={0.7}
                          accessibilityLabel="Time this topic"
                        >
                          <Play size={11} color="#2563eb" fill="#2563eb" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.goalItemDeleteBtn}
                          onPress={() => handleDeleteGoalItem(task.id)}
                          activeOpacity={0.7}
                          accessibilityLabel="Delete goal"
                        >
                          <Trash2 size={13} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Bottom Card Footer Actions */}
              <View style={styles.goalCardFooter}>
                <TouchableOpacity
                  style={styles.footerAddBtn}
                  onPress={() => setShowAddGoalModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={13} color={BRAND_COLORS.primary} />
                  <Text style={styles.footerAddBtnText}>Add Syllabus Topic</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.footerTimerBtn}
                  onPress={() => {
                    setActiveStopwatchTopic("Focused Preparation");
                    setShowStopwatchModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Timer size={13} color="#475569" />
                  <Text style={styles.footerTimerBtnText}>Stopwatch Timer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Dedicated BODMAS & Speed Calculation Zone */}
            <View style={styles.bodmasSection}>
              <View style={styles.bodmasHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <View style={styles.bodmasHeaderIconBadge}>
                    <Zap size={16} color="#f59e0b" fill="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bodmasSectionTitle}>BODMAS & Calculation Lab</Text>
                    <Text style={styles.bodmasSectionSub}>16 Speed Drills & Fast Simplification</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => router.push("/speed-math" as any)}
                    style={[styles.bodmasViewAllBtn, { borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.12)" }]}
                    activeOpacity={0.7}
                  >
                    <Zap size={11} color="#f59e0b" fill="#f59e0b" />
                    <Text style={[styles.bodmasViewAllText, { color: "#fbbf24" }]}>16 Drills ⚡</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push("/bodmas" as any)}
                    style={styles.bodmasViewAllBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.bodmasViewAllText}>BODMAS</Text>
                    <ArrowRight size={12} color="#38bdf8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 16 Speed Calculation Drills Feature Hub */}
              <View style={styles.speedMathBannerCard}>
                <View style={styles.speedMathBannerLeft}>
                  <View style={styles.speedMathIconCircle}>
                    <Calculator size={20} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <View style={styles.speedMathBadgeRow}>
                        <Text style={styles.speedMathBadgeText}>16 SPEED DRILLS</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: "#94a3b8", fontWeight: "700" }}>Aptitude Training</Text>
                    </View>
                    <Text style={styles.speedMathTitle}>Rapid Calculation Drills</Text>
                    <Text style={styles.speedMathSub}>
                      Addition, Multiplication, Squares, Cubes, Roots, Tables & % Fractions
                    </Text>
                  </View>
                </View>

                {/* Horizontal 16 Drills Carousel */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bodmasScrollCards}
                >
                  {[
                    { id: "addition", name: "Addition", symbol: "+", desc: "Column & Row Sums", color: "#2563eb", bg: "rgba(37, 99, 235, 0.2)" },
                    { id: "subtraction", name: "Subtraction", symbol: "−", desc: "Borrowing Drills", color: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" },
                    { id: "multiplication", name: "Multiplication", symbol: "×", desc: "Speed Tables & Products", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.2)" },
                    { id: "division", name: "Division", symbol: "÷", desc: "Clean Integer Division", color: "#f97316", bg: "rgba(249, 115, 22, 0.2)" },
                    { id: "squares", name: "Squares", symbol: "x²", desc: "Square Values 1-50", color: "#10b981", bg: "rgba(16, 185, 129, 0.2)" },
                    { id: "cubes", name: "Cubes", symbol: "x³", desc: "Cube Values 1-30", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.2)" },
                    { id: "square_root", name: "Square Root", symbol: "√", desc: "Perfect Square Roots", color: "#0284c7", bg: "rgba(2, 132, 199, 0.2)" },
                    { id: "cube_root", name: "Cube Root", symbol: "∛", desc: "Perfect Cube Roots", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.2)" },
                    { id: "tables", name: "Tables", symbol: "12×", desc: "Tables 11-25 Range", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.2)" },
                    { id: "exponents", name: "Exponents", symbol: "2ⁿ", desc: "Powers of 2, 3, 5", color: "#7c3aed", bg: "rgba(124, 58, 237, 0.2)" },
                    { id: "exponent_root", name: "Exponent Root", symbol: "x√", desc: "Reverse Exponents", color: "#f43f5e", bg: "rgba(244, 63, 94, 0.2)" },
                    { id: "fraction_of_percent", name: "Fraction of %", symbol: "%", desc: "x% of N using Fractions", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)" },
                    { id: "percent_to_fraction", name: "% to Fraction", symbol: "½", desc: "Percent to Fraction Match", color: "#6366f1", bg: "rgba(99, 102, 241, 0.2)" },
                    { id: "di_addition", name: "DI Addition", symbol: "📊", desc: "Column Sums for DI", color: "#ec4899", bg: "rgba(236, 72, 153, 0.2)" },
                    { id: "mix", name: "Mix Mode", symbol: "🔀", desc: "Random Mix Speed Drill", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.2)" },
                  ].map((drill) => (
                    <TouchableOpacity
                      key={drill.id}
                      style={[styles.bodmasSubCard, { width: 135 }]}
                      onPress={() =>
                        router.push({ pathname: "/speed-math", params: { category: drill.id } } as any)
                      }
                      activeOpacity={0.8}
                    >
                      <View style={[styles.bodmasSubIconBox, { backgroundColor: drill.bg }]}>
                        <Text style={{ fontSize: 16, fontWeight: "900", color: drill.color }}>
                          {drill.symbol}
                        </Text>
                      </View>
                      <Text style={styles.bodmasSubCardTitle}>{drill.name}</Text>
                      <Text style={styles.bodmasSubCardSub}>{drill.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.openAllDrillsCta}
                  onPress={() => router.push("/speed-math" as any)}
                  activeOpacity={0.8}
                >
                  <Zap size={14} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.openAllDrillsCtaText}>Explore All 16 Speed Calculation Drills</Text>
                  <ArrowRight size={14} color="#ffffff" />
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
                  Master bracket evaluation, divisions, and multiplications with live keypad, step-by-step breakdown & accuracy metrics.
                </Text>

                {/* Difficulty Quick Start Row */}
                <View style={styles.bodmasDiffRow}>
                  <TouchableOpacity
                    style={[styles.bodmasDiffBtn, { borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)" }]}
                    onPress={() =>
                      router.push({ pathname: "/bodmas", params: { difficulty: "easy" } } as any)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.bodmasDiffText, { color: "#34d399" }]}>Easy (2-Step)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bodmasDiffBtn, { borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.1)" }]}
                    onPress={() =>
                      router.push({ pathname: "/bodmas", params: { difficulty: "medium" } } as any)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.bodmasDiffText, { color: "#fbbf24" }]}>Medium (3-Step)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bodmasDiffBtn, { borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.1)" }]}
                    onPress={() =>
                      router.push({ pathname: "/bodmas", params: { difficulty: "hard" } } as any)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.bodmasDiffText, { color: "#f87171" }]}>Hard (Nested)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bodmasDiffBtn, { borderColor: "#ec4899", backgroundColor: "rgba(236, 72, 153, 0.1)" }]}
                    onPress={() =>
                      router.push({ pathname: "/bodmas", params: { difficulty: "sprint" } } as any)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.bodmasDiffText, { color: "#f472b6" }]}>⚡ 60s Sprint</Text>
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
                    router.push({ pathname: "/bodmas", params: { difficulty: "easy" } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.bodmasSubIconBox, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#3b82f6" }}>＋</Text>
                  </View>
                  <Text style={styles.bodmasSubCardTitle}>BODMAS Easy</Text>
                  <Text style={styles.bodmasSubCardSub}>Two-Step Foundations</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bodmasSubCard}
                  onPress={() =>
                    router.push({ pathname: "/bodmas", params: { difficulty: "medium" } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.bodmasSubIconBox, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#10b981" }}>×</Text>
                  </View>
                  <Text style={styles.bodmasSubCardTitle}>BODMAS Medium</Text>
                  <Text style={styles.bodmasSubCardSub}>Multi-Operator Rules</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bodmasSubCard}
                  onPress={() =>
                    router.push({ pathname: "/bodmas", params: { difficulty: "hard" } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.bodmasSubIconBox, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#8b5cf6" }}>x²</Text>
                  </View>
                  <Text style={styles.bodmasSubCardTitle}>BODMAS Hard</Text>
                  <Text style={styles.bodmasSubCardSub}>Nested Brackets</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bodmasSubCard}
                  onPress={() =>
                    router.push({ pathname: "/bodmas", params: { difficulty: "sprint" } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={[styles.bodmasSubIconBox, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#f59e0b" }}>⚡</Text>
                  </View>
                  <Text style={styles.bodmasSubCardTitle}>Speed Sprint</Text>
                  <Text style={styles.bodmasSubCardSub}>60s Timed Challenge</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* 4. Dedicated Brain Games & Mental Training Zone */}
            <View style={styles.gamesHeroSection}>
              <View style={styles.bodmasHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.bodmasHeaderIconBadge, { backgroundColor: "rgba(99, 102, 241, 0.15)" }]}>
                    <Gamepad2 size={16} color="#818cf8" />
                  </View>
                  <View>
                    <Text style={styles.bodmasSectionTitle}>Brain Games & Logic Lab</Text>
                    <Text style={styles.bodmasSectionSub}>32 Mental Puzzles for OSSC/OSSSC Aptitude</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/games" as any)}
                  style={[styles.bodmasViewAllBtn, { borderColor: "#4f46e5" }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bodmasViewAllText, { color: "#a5b4fc" }]}>All 32 Games</Text>
                  <ArrowRight size={12} color="#a5b4fc" />
                </TouchableOpacity>
              </View>

              {/* Featured Games Quick Launch Carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bodmasScrollCards}
              >
                {[
                  { id: "game-24", title: "24 Game", cat: "Math", color: "#3b82f6", emoji: "🎯" },
                  { id: "sudoku", title: "Sudoku", cat: "Logic", color: "#8b5cf6", emoji: "🔢" },
                  { id: "game-2048", title: "2048", cat: "Math", color: "#ea580c", emoji: "🧩" },
                  { id: "minesweeper", title: "Minesweeper", cat: "Logic", color: "#ef4444", emoji: "💣" },
                  { id: "memory-matrix", title: "Memory Matrix", cat: "Memory", color: "#10b981", emoji: "🧠" },
                  { id: "nerdle", title: "Nerdle", cat: "Math", color: "#9333ea", emoji: "🧮" },
                  { id: "number-bonds", title: "Number Bonds", cat: "Math", color: "#059669", emoji: "🔗" },
                  { id: "tower-of-hanoi", title: "Tower of Hanoi", cat: "Logic", color: "#d97706", emoji: "🗼" },
                ].map((gm) => (
                  <TouchableOpacity
                    key={gm.id}
                    style={styles.gameCarouselCard}
                    onPress={() => router.push(`/games/${gm.id}` as any)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.gameEmojiBox, { backgroundColor: `${gm.color}22` }]}>
                      <Text style={{ fontSize: 20 }}>{gm.emoji}</Text>
                    </View>
                    <Text style={styles.gameCarouselTitle} numberOfLines={1}>{gm.title}</Text>
                    <Text style={styles.gameCarouselCat}>{gm.cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.openAllGamesCta}
                onPress={() => router.push("/games" as any)}
                activeOpacity={0.8}
              >
                <Brain size={16} color="#ffffff" />
                <Text style={styles.openAllGamesCtaText}>Explore All 32 Brain Games</Text>
                <ArrowRight size={14} color="#ffffff" />
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
              onPress={() => handleSaveStudySession()}
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

      {/* Dynamic Add Goal Modal with Subject -> Chapter/Topic dynamic lookup */}
      <AddGoalModal
        visible={showAddGoalModal}
        onClose={() => setShowAddGoalModal(false)}
        examId={activeExam?.id}
        userId={user?.id}
        currentTargetHours={targetHours}
        onSaveTargetHours={handleSaveTargetHours}
        onAddGoalItem={handleAddGoalItem}
      />

      {/* Live Stopwatch Study Session Timer */}
      <StopwatchModal
        visible={showStopwatchModal}
        onClose={() => setShowStopwatchModal(false)}
        onSessionLogged={async (minutes, notes) => {
          await handleSaveStudySession(minutes, notes);
        }}
        activeTopicTitle={activeStopwatchTopic}
      />

      {/* Student Personalized Notifications Modal */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        userId={user?.id || ""}
        onRefreshNotifications={loadNotifications}
      />
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
  // Today's Goal Styles
  goalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  goalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  goalHeaderTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  goalTargetIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  goalCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  todayDatePill: {
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  todayDateText: {
    fontSize: 10,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  goalCardSub: {
    fontSize: 11,
    color: BRAND_COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 1,
  },
  goalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerStopwatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerStopwatchText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerAddGoalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerAddGoalText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  // Target Progress Box
  goalTargetProgressBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  goalTargetProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalTargetProgressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  goalTargetProgressValue: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
  },
  goalProgressBarTrack: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  goalProgressBarFill: {
    height: "100%",
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 4,
  },
  goalHourChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalHourChipsPrompt: {
    fontSize: 11,
    color: BRAND_COLORS.textSecondary,
    fontWeight: "600",
    marginRight: 2,
  },
  goalHourChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  goalHourChipActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  goalHourChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.textSecondary,
  },
  goalHourChipTextActive: {
    color: "#ffffff",
  },
  // Goal List
  goalList: {
    gap: 8,
    marginBottom: 12,
  },
  goalItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 8,
  },
  goalItemCardCompleted: {
    backgroundColor: "#f0fdf4",
    borderColor: "#dcfce7",
  },
  goalCheckBtn: {
    padding: 2,
  },
  goalContentCol: {
    flex: 1,
  },
  goalItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    lineHeight: 18,
  },
  goalItemTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#64748b",
  },
  goalItemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  goalSubjectChip: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  goalSubjectChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  goalChapterName: {
    fontSize: 11,
    color: BRAND_COLORS.textSecondary,
    fontWeight: "500",
    maxWidth: 130,
  },
  goalDurationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  goalDurationText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  goalItemRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalItemTimerBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  goalItemDeleteBtn: {
    padding: 4,
  },
  // Empty Goal State
  goalEmptyContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    marginBottom: 12,
  },
  goalEmptyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    marginTop: 8,
  },
  goalEmptySub: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 12,
  },
  goalEmptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goalEmptyAddBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  // Footer
  goalCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  footerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerAddBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  footerTimerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  footerTimerBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20,
  },
  actionCard: {
    width: "48.5%",
    padding: 12,
    borderRadius: 12,
    alignItems: "flex-start",
    marginBottom: 4,
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
  speedMathBannerCard: {
    backgroundColor: "#131b2e",
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  openAllDrillsCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  openAllDrillsCtaText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  // Brain Games Hero Section
  gamesHeroSection: {
    backgroundColor: "#0d1322",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#312e81",
  },
  gameCarouselCard: {
    backgroundColor: "#131b2e",
    borderRadius: 14,
    padding: 12,
    width: 115,
    borderWidth: 1,
    borderColor: "#1e293b",
    alignItems: "center",
  },
  gameEmojiBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gameCarouselTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  gameCarouselCat: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "600",
  },
  openAllGamesCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  openAllGamesCtaText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});
