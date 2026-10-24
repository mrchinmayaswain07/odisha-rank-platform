import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Plus,
  Trash2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Target,
  BarChart2,
  BookOpen,
} from "lucide-react-native";
import {
  BRAND_COLORS,
  getIndianDateStr,
  getIndianPastDays,
  getIndianMonthPrefix,
  isTimestampInIndianDate,
  formatIndianDateLabel,
} from "@odisha-rank/shared";
import { useAuth } from "../src/lib/auth-context";
import {
  getStudySessionsList,
  logStudySession,
  deleteStudySession,
  getPlannedTasksForDate,
  StudySessionRecord,
} from "../src/lib/data-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FilterPeriod = "today" | "7days" | "month" | "all";

export default function StudyHistoryScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterPeriod>("today");

  // Planned hours cache for date ranges
  const [plannedHoursMap, setPlannedHoursMap] = useState<Record<string, number>>({});

  // Manual logging modal inside history screen
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMinutes, setLogMinutes] = useState(30);
  const [logNotes, setLogNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const todayStr = useMemo(() => getIndianDateStr(), []);

  // Compute 7 days date strings
  const past7Days = useMemo(() => getIndianPastDays(7), []);

  const currentMonthPrefix = useMemo(() => getIndianMonthPrefix(), []);

  // Load all sessions from local/remote
  const loadSessions = useCallback(async (isPullRefresh = false) => {
    if (!user) return;
    if (!isPullRefresh) setIsLoading(true);
    setErrorMessage(null);
    try {
      const list = await getStudySessionsList(user.id);
      setSessions(list);

      // Load planned hours for past 7 days
      const map: Record<string, number> = {};
      for (const d of past7Days) {
        const { plannedMinutes } = await getPlannedTasksForDate(user.id, d);
        map[d] = Math.round((plannedMinutes / 60) * 10) / 10;
      }
      setPlannedHoursMap(map);
    } catch (err: any) {
      setErrorMessage("Could not load study sessions. Showing cached records.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, past7Days]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSessions(true);
  }, [loadSessions]);

  // Aggregate metrics across all sessions
  const metrics = useMemo(() => {
    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;
    let totalMinutes = 0;

    for (const s of sessions) {
      const mins = Number(s.duration_minutes) || 0;
      totalMinutes += mins;

      if (s.session_date === todayStr) {
        todayMinutes += mins;
      }
      if (past7Days.includes(s.session_date)) {
        weekMinutes += mins;
      }
      if (s.session_date?.startsWith(currentMonthPrefix)) {
        monthMinutes += mins;
      }
    }

    return {
      todayHours: Math.round((todayMinutes / 60) * 10) / 10,
      weekHours: Math.round((weekMinutes / 60) * 10) / 10,
      monthHours: Math.round((monthMinutes / 60) * 10) / 10,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    };
  }, [sessions, todayStr, past7Days, currentMonthPrefix]);

  // Filter sessions according to selectedFilter
  const filteredSessions = useMemo(() => {
    switch (selectedFilter) {
      case "today":
        return sessions.filter((s) => s.session_date === todayStr);
      case "7days":
        return sessions.filter((s) => past7Days.includes(s.session_date));
      case "month":
        return sessions.filter((s) => s.session_date?.startsWith(currentMonthPrefix));
      case "all":
      default:
        return sessions;
    }
  }, [sessions, selectedFilter, todayStr, past7Days, currentMonthPrefix]);

  // Planned hours for the selected filter period
  const comparison = useMemo(() => {
    let planned = 0;
    let actual = 0;
    let label = "Today's Study Plan";

    if (selectedFilter === "today") {
      planned = plannedHoursMap[todayStr] || 0;
      actual = metrics.todayHours;
      label = "Today's Study Plan";
    } else if (selectedFilter === "7days") {
      planned = past7Days.reduce((sum, d) => sum + (plannedHoursMap[d] || 0), 0);
      planned = Math.round(planned * 10) / 10;
      actual = metrics.weekHours;
      label = "Last 7 Days Preparation Target";
    } else if (selectedFilter === "month") {
      // Approximate month planned from recorded 7-day average or daily target
      planned = Math.round(((plannedHoursMap[todayStr] || 4) * 30) * 10) / 10;
      actual = metrics.monthHours;
      label = "This Month Target";
    } else {
      // All time
      planned = Math.max(actual, 150);
      actual = metrics.totalHours;
      label = "Total Overall Goal";
    }

    const variance = Math.round((actual - planned) * 10) / 10;
    const percentage = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 100;

    return {
      plannedHours: planned,
      actualHours: actual,
      variance,
      percentage,
      label,
    };
  }, [selectedFilter, plannedHoursMap, todayStr, past7Days, metrics]);

  // Handle manual log submission
  const handleSaveSession = async () => {
    if (!user) return;
    setIsLogging(true);
    try {
      const noteText = logNotes.trim() || "Manual Study Session";
      const success = await logStudySession({
        userId: user.id,
        durationMinutes: logMinutes,
        notes: noteText,
        sessionDate: todayStr,
      });

      if (success) {
        setShowLogModal(false);
        setLogNotes("");
        Alert.alert("🎉 Great Job!", `Recorded ${logMinutes} minutes of focused study time.`);
        loadSessions(true);
      }
    } catch {
      Alert.alert("Error", "Could not record study session. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  // Handle delete session
  const handleDelete = (session: StudySessionRecord) => {
    Alert.alert(
      "Delete Study Session?",
      `Are you sure you want to remove this ${session.duration_minutes}-minute session?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            await deleteStudySession(user.id, session.id);
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
          },
        },
      ]
    );
  };

  // Format date helper
  const formatDateLabel = (dateStr: string) => {
    return formatIndianDateLabel(dateStr, todayStr);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={BRAND_COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Study Session History</Text>
          <Text style={styles.headerSubtitle}>Verified Recorded Hours & Performance</Text>
        </View>
        <TouchableOpacity
          style={styles.logSessionButton}
          onPress={() => setShowLogModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.logSessionText}>Log Time</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[BRAND_COLORS.primary]} />}
      >
        {/* Error notification banner if any */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#b91c1c" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* 1. Summary Metrics Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { borderLeftColor: BRAND_COLORS.primary }]}>
            <Text style={styles.summaryLabel}>Today's Actual</Text>
            <Text style={styles.summaryValue}>
              {metrics.todayHours} <Text style={styles.summaryUnit}>hrs</Text>
            </Text>
            <Text style={styles.summarySub}>
              {sessions.filter((s) => s.session_date === todayStr).length} recorded sessions
            </Text>
          </View>

          <View style={[styles.summaryCard, { borderLeftColor: "#8b5cf6" }]}>
            <Text style={styles.summaryLabel}>Last 7 Days</Text>
            <Text style={styles.summaryValue}>
              {metrics.weekHours} <Text style={styles.summaryUnit}>hrs</Text>
            </Text>
            <Text style={styles.summarySub}>
              {sessions.filter((s) => past7Days.includes(s.session_date)).length} recorded sessions
            </Text>
          </View>

          <View style={[styles.summaryCard, { borderLeftColor: "#10b981" }]}>
            <Text style={styles.summaryLabel}>All-Time Total</Text>
            <Text style={styles.summaryValue}>
              {metrics.totalHours} <Text style={styles.summaryUnit}>hrs</Text>
            </Text>
            <Text style={styles.summarySub}>{sessions.length} total sessions</Text>
          </View>
        </View>

        {/* 2. Planned vs. Actual Comparison Card */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <BarChart2 size={16} color={BRAND_COLORS.primary} />
              <Text style={styles.comparisonTitle}>Planned vs. Actual Comparison</Text>
            </View>
            <View style={styles.badgeWrap}>
              {comparison.variance >= 0 ? (
                <View style={styles.surplusBadge}>
                  <CheckCircle2 size={12} color="#15803d" />
                  <Text style={styles.surplusText}>
                    {comparison.variance === 0 ? "On Target" : `+${comparison.variance}h Surplus`}
                  </Text>
                </View>
              ) : (
                <View style={styles.deficitBadge}>
                  <Clock size={12} color="#b45309" />
                  <Text style={styles.deficitText}>{Math.abs(comparison.variance)}h to target</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.comparisonSubTitle}>{comparison.label}</Text>

          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>PLANNED DURATION</Text>
              <Text style={styles.statVal}>{comparison.plannedHours} hrs</Text>
              <Text style={styles.statSub}>Target study tasks</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>ACTUAL LOGGED</Text>
              <Text style={[styles.statVal, { color: BRAND_COLORS.primary }]}>
                {comparison.actualHours} hrs
              </Text>
              <Text style={styles.statSub}>Real session timing</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>COMPLETION</Text>
              <Text style={[styles.statVal, { color: comparison.percentage >= 100 ? "#15803d" : "#0284c7" }]}>
                {comparison.percentage}%
              </Text>
              <Text style={styles.statSub}>Plan adherence</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(5, comparison.percentage))}%` }]} />
          </View>

          <Text style={styles.comparisonFootnote}>
            {comparison.actualHours >= comparison.plannedHours && comparison.plannedHours > 0
              ? "🎯 Goal Achieved! Your recorded focused study time meets or exceeds your planned task duration."
              : `📖 ${Math.abs(comparison.variance)} more hours needed to fully complete your planned study agenda.`}
          </Text>
        </View>

        {/* 3. Filter Periods */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionHeader}>Session Records</Text>
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === "today" && styles.filterTabActive]}
              onPress={() => setSelectedFilter("today")}
            >
              <Text style={[styles.filterTabText, selectedFilter === "today" && styles.filterTabTextActive]}>
                Today ({sessions.filter((s) => s.session_date === todayStr).length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === "7days" && styles.filterTabActive]}
              onPress={() => setSelectedFilter("7days")}
            >
              <Text style={[styles.filterTabText, selectedFilter === "7days" && styles.filterTabTextActive]}>
                Last 7 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === "month" && styles.filterTabActive]}
              onPress={() => setSelectedFilter("month")}
            >
              <Text style={[styles.filterTabText, selectedFilter === "month" && styles.filterTabTextActive]}>
                This Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, selectedFilter === "all" && styles.filterTabActive]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text style={[styles.filterTabText, selectedFilter === "all" && styles.filterTabTextActive]}>
                All Time ({sessions.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Session List / Empty State */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loadingText}>Loading study session history...</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={42} color={BRAND_COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Study Sessions Recorded</Text>
            <Text style={styles.emptySub}>
              {selectedFilter === "today"
                ? "You haven't logged any study sessions today. Start the stopwatch timer on the Dashboard or tap below to record study time."
                : "No study sessions found for this timeframe."}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setShowLogModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.emptyActionText}>Log Study Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionCardHeader}>
                <View style={styles.sessionDateBadge}>
                  <Calendar size={13} color={BRAND_COLORS.primary} />
                  <Text style={styles.sessionDateText}>{formatDateLabel(session.session_date)}</Text>
                </View>

                <View style={styles.durationBadge}>
                  <Clock size={13} color="#0369a1" />
                  <Text style={styles.durationBadgeText}>
                    {session.duration_minutes >= 60
                      ? `${Math.floor(session.duration_minutes / 60)}h ${session.duration_minutes % 60}m`
                      : `${session.duration_minutes} mins`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(session)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={15} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sessionTopicText}>{session.notes || "Focused Self-Study"}</Text>

              <View style={styles.sessionFooter}>
                <Text style={styles.sessionSourceTag}>
                  {session.notes?.toLowerCase().includes("stopwatch") || session.notes?.toLowerCase().includes("timing")
                    ? "⏱️ Timer Session"
                    : "📝 Manual Log"}
                </Text>
                <Text style={styles.sessionTimestamp}>
                  {new Date(session.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Manual Study Session Logging Modal */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Study Session</Text>
                <Text style={styles.modalSub}>Record actual completed study time</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Study Duration (Minutes)</Text>
            <View style={styles.presetRow}>
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[styles.presetBtn, logMinutes === mins && styles.presetBtnActive]}
                  onPress={() => setLogMinutes(mins)}
                >
                  <Text style={[styles.presetBtnText, logMinutes === mins && styles.presetBtnTextActive]}>
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Subject / Topic & Notes</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. History & Heritage of Odisha revision"
              placeholderTextColor="#94a3b8"
              value={logNotes}
              onChangeText={setLogNotes}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogModal(false)}
                disabled={isLogging}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveSession}
                disabled={isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Session</Text>
                )}
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 1,
  },
  logSessionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  logSessionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginVertical: 4,
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: BRAND_COLORS.textMuted,
  },
  summarySub: {
    fontSize: 10,
    color: BRAND_COLORS.textMuted,
  },
  comparisonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  comparisonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  badgeWrap: {},
  surplusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  surplusText: {
    color: "#15803d",
    fontSize: 11,
    fontWeight: "700",
  },
  deficitBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  deficitText: {
    color: "#b45309",
    fontSize: 11,
    fontWeight: "700",
  },
  comparisonSubTitle: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: BRAND_COLORS.textMuted,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  statSub: {
    fontSize: 10,
    color: BRAND_COLORS.textMuted,
    marginTop: 1,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 4,
  },
  comparisonFootnote: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    lineHeight: 16,
  },
  filterSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 8,
  },
  filterTabs: {
    flexDirection: "row",
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  filterTabActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
  },
  filterTabTextActive: {
    color: "#ffffff",
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: BRAND_COLORS.textMuted,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  emptyActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  sessionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369a1",
  },
  deleteButton: {
    padding: 4,
  },
  sessionTopicText: {
    fontSize: 14,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  sessionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
  sessionSourceTag: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    fontWeight: "500",
  },
  sessionTimestamp: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
  },
  modalCloseText: {
    fontSize: 18,
    color: BRAND_COLORS.textMuted,
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 6,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    alignItems: "center",
  },
  presetBtnActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
  },
  presetBtnTextActive: {
    color: "#ffffff",
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: BRAND_COLORS.textPrimary,
    marginBottom: 18,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});
