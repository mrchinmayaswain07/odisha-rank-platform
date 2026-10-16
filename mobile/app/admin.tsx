import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ShieldCheck,
  Users,
  Layers,
  BookOpen,
  HelpCircle,
  FileText,
  Clock,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  GraduationCap,
} from "lucide-react-native";
import { BRAND_COLORS, SITE_CONFIG } from "@odisha-rank/shared";
import { useAuth } from "../src/lib/auth-context";
import { getAdminOverviewStats } from "../src/lib/data-service";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";

export default function AdminScreen() {
  const { user, profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setRefreshing(true);
      const data = await getAdminOverviewStats();
      setStats(data);
    } catch (err) {
      console.warn("Could not load admin stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleOpenWebAdmin = async () => {
    const url = "https://odisharank.vercel.app/admin";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Link", `Please open this URL in your browser: ${url}`);
      }
    } catch {
      Alert.alert("Link", `Please open this URL in your browser: ${url}`);
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.unauthBox}>
          <ShieldCheck size={48} color={BRAND_COLORS.danger} />
          <Text style={styles.unauthTitle}>Access Restricted</Text>
          <Text style={styles.unauthDesc}>
            This control center is reserved for root platform administrators (mrchinmayaswain07@gmail.com).
          </Text>
          <Button
            title="Return to Student Portal"
            variant="primary"
            size="md"
            onPress={() => router.back()}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Odisha<Text style={{ color: "#38bdf8" }}>Admin</Text></Text>
            <View style={styles.rlsBadge}>
              <Text style={styles.rlsText}>RLS Enforced: Admin</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>Curriculum & Examination Administration</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Admin Identity Card */}
        <View style={styles.adminCard}>
          <View style={styles.adminDotRow}>
            <View style={styles.liveDot} />
            <Text style={styles.adminSessionLabel}>ADMIN SESSION</Text>
          </View>
          <Text style={styles.adminName}>
            {profile?.full_name || "Chinmaya Swain"} (Admin)
          </Text>
          <Text style={styles.adminEmail}>{user?.email || SITE_CONFIG.admin.rootEmail}</Text>
        </View>

        {/* Mission Control Subheading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Curriculum Statistics</Text>
          <TouchableOpacity onPress={loadStats} disabled={refreshing} style={styles.refreshBtn}>
            <RefreshCw size={14} color={BRAND_COLORS.primary} />
            <Text style={styles.refreshText}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.statsGrid}>
            {/* Registered Students */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#eff6ff" }]}>
                <Users size={20} color="#2563eb" />
              </View>
              <Text style={styles.statCount}>{stats?.studentsCount ?? 0}</Text>
              <Text style={styles.statTitle}>Registered Students</Text>
              <Text style={styles.statSub}>Verified aspirants</Text>
            </View>

            {/* Active Courses */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#f5f3ff" }]}>
                <Layers size={20} color="#7c3aed" />
              </View>
              <Text style={styles.statCount}>{stats?.activeCoursesCount ?? 0}</Text>
              <Text style={styles.statTitle}>Active Courses</Text>
              <Text style={styles.statSub}>OSSC, OSSSC, OPSC</Text>
            </View>

            {/* Syllabus Streams */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#ecfdf5" }]}>
                <BookOpen size={20} color="#059669" />
              </View>
              <Text style={styles.statCount}>
                {(stats?.chaptersCount ?? 0) + (stats?.topicsCount ?? 0)}
              </Text>
              <Text style={styles.statTitle}>Syllabus Streams</Text>
              <Text style={styles.statSub}>
                {stats?.chaptersCount ?? 0} Chapters • {stats?.topicsCount ?? 0} Topics
              </Text>
            </View>

            {/* Question Bank */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#fffbeb" }]}>
                <HelpCircle size={20} color="#d97706" />
              </View>
              <Text style={styles.statCount}>{stats?.questionsCount ?? 0}</Text>
              <Text style={styles.statTitle}>Question Bank</Text>
              <Text style={styles.statSub}>Verified MCQs</Text>
            </View>

            {/* Study Materials */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#f0fdfa" }]}>
                <FileText size={20} color="#0d9488" />
              </View>
              <Text style={styles.statCount}>{stats?.materialsCount ?? 0}</Text>
              <Text style={styles.statTitle}>Study Materials</Text>
              <Text style={styles.statSub}>Official notes & PDFs</Text>
            </View>

            {/* Mock Tests */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#fff1f2" }]}>
                <Clock size={20} color="#e11d48" />
              </View>
              <Text style={styles.statCount}>{stats?.mockTestsCount ?? 0}</Text>
              <Text style={styles.statTitle}>Mock Tests</Text>
              <Text style={styles.statSub}>Timed simulations</Text>
            </View>
          </View>
        )}

        {/* Web Administration Launcher */}
        <View style={styles.webAdminCard}>
          <View style={styles.webAdminLeft}>
            <Text style={styles.webAdminTitle}>Desktop Administration Portal</Text>
            <Text style={styles.webAdminDesc}>
              Full catalog control: Add questions, upload PDF study materials, and manage student roles.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.openWebBtn}
            onPress={handleOpenWebAdmin}
            activeOpacity={0.8}
          >
            <ExternalLink size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.openWebBtnText}>Open Web Admin</Text>
          </TouchableOpacity>
        </View>

        {/* Return Button */}
        <Button
          title="Back to Student Portal"
          variant="outline"
          size="md"
          icon={<GraduationCap size={16} color={BRAND_COLORS.primary} />}
          onPress={() => router.back()}
          style={styles.backPortalBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  rlsBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rlsText: {
    color: "#34d399",
    fontSize: 10,
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  adminCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 20,
  },
  adminDotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  adminSessionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10b981",
    letterSpacing: 0.5,
  },
  adminName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 13,
    color: "#94a3b8",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    color: BRAND_COLORS.primary,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statCount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  statSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  webAdminCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 20,
  },
  webAdminLeft: {
    marginBottom: 14,
  },
  webAdminTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  webAdminDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
  },
  openWebBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  openWebBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  backPortalBtn: {
    borderColor: "#334155",
  },
  unauthBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  unauthDesc: {
    fontSize: 14,
    color: BRAND_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
