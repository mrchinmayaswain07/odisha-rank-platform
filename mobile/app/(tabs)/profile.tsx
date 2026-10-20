import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  User,
  GraduationCap,
  MapPin,
  Mail,
  Calendar,
  LogOut,
  ShieldCheck,
  Clock,
  ArrowRight,
  Edit3,
  Phone,
  ExternalLink,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Shield,
  Layers,
  Award,
} from "lucide-react-native";
import { BRAND_COLORS, SITE_CONFIG } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { Header } from "../../src/components/Header";
import { Badge } from "../../src/components/Badge";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user, profile, isAdmin, activeExam, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your OdishaRank student account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  // Student Initials
  const studentName = profile?.full_name || user?.user_metadata?.full_name || "Aspirant Scholar";
  const initials = studentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join("") || "OS";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Student Profile"
        subtitle="Account & Exam Preferences"
        showCoursePill={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* 1. PREMIUM PROFILE HERO CARD                                 */}
        {/* ============================================================ */}
        <View style={styles.profileHeroCard}>
          {/* Subtle Top Decorative Banner Bar */}
          <View style={styles.heroTopBanner}>
            <View style={styles.heroBannerPattern} />
          </View>

          <View style={styles.profileBody}>
            {/* Avatar with Dual-Ring & Verified Check */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarOuterRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              </View>
              {isAdmin ? (
                <View style={styles.verifiedBadgeEmerald}>
                  <ShieldCheck size={14} color="#ffffff" />
                </View>
              ) : (
                <View style={styles.verifiedBadgeBlue}>
                  <CheckCircle2 size={14} color="#ffffff" />
                </View>
              )}
            </View>

            {/* Student Name */}
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={2}>
                {studentName}
              </Text>
            </View>

            {/* Email Address */}
            <View style={styles.metaRow}>
              <Mail size={13} color="#64748b" style={{ marginRight: 5 }} />
              <Text
                style={styles.email}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {user?.email || "No email linked"}
              </Text>
            </View>

            {/* Phone Number (if available) */}
            {profile?.phone && (
              <View style={[styles.metaRow, { marginTop: 4 }]}>
                <Phone size={13} color="#64748b" style={{ marginRight: 5 }} />
                <Text style={styles.phoneText}>{profile.phone}</Text>
              </View>
            )}

            {/* Badges Quad */}
            <View style={styles.profileBadgeRow}>
              <View style={styles.badgePillSlate}>
                <MapPin size={11} color="#475569" style={{ marginRight: 4 }} />
                <Text style={styles.badgeTextSlate}>
                  {profile?.district || "Odisha State"}
                </Text>
              </View>

              <View style={styles.badgePillBlue}>
                <Calendar size={11} color="#2563eb" style={{ marginRight: 4 }} />
                <Text style={styles.badgeTextBlue}>
                  Batch {profile?.target_year || 2026}
                </Text>
              </View>

              {isAdmin && (
                <View style={styles.badgePillEmerald}>
                  <ShieldCheck size={11} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.badgeTextEmerald}>Administrator</Text>
                </View>
              )}
            </View>

            {/* Student Bio (if available) */}
            {profile?.bio ? (
              <View style={styles.bioContainer}>
                <Text style={styles.bioText} numberOfLines={3}>
                  "{profile.bio}"
                </Text>
              </View>
            ) : null}

            {/* Edit Profile Action Button */}
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => router.push("/edit-profile")}
              activeOpacity={0.7}
            >
              <Edit3 size={14} color="#2563eb" style={{ marginRight: 6 }} />
              <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 2. ADMINISTRATION & CONTROL CARD (ADMIN ONLY)                */}
        {/* ============================================================ */}
        {isAdmin && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTitleRow}>
              <Shield size={16} color="#0f172a" />
              <Text style={styles.sectionTitle}>Administration & Control</Text>
            </View>

            <View style={styles.adminCard}>
              <View style={styles.adminCardHeader}>
                <View style={styles.adminDotRow}>
                  <View style={styles.liveDotPulse} />
                  <Text style={styles.adminLabel}>ADMIN SESSION ACTIVE</Text>
                </View>
                <View style={styles.rlsBadge}>
                  <ShieldCheck size={11} color="#34d399" style={{ marginRight: 4 }} />
                  <Text style={styles.rlsText}>RLS Enforced: Admin</Text>
                </View>
              </View>

              <Text style={styles.adminCardTitle}>
                Curriculum & Examination Administration
              </Text>
              <Text style={styles.adminCardDesc}>
                Full catalog statistics, registered student management, verified questions, and mock test administration.
              </Text>

              <View style={styles.adminActionRow}>
                <TouchableOpacity
                  style={styles.adminLaunchBtn}
                  onPress={() => router.push("/admin")}
                  activeOpacity={0.85}
                >
                  <ShieldCheck size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.adminLaunchText}>Open Admin Center</Text>
                  <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.adminWebBtn}
                  onPress={() => Linking.openURL("https://odisharank.vercel.app/admin")}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={14} color="#94a3b8" style={{ marginRight: 4 }} />
                  <Text style={styles.adminWebText}>Web Portal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* 3. TARGET EXAMINATION CARD                                   */}
        {/* ============================================================ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <GraduationCap size={16} color="#0f172a" />
            <Text style={styles.sectionTitle}>Target Examination</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.courseHeader}>
              <View style={styles.courseIconBox}>
                <GraduationCap size={24} color="#2563eb" />
              </View>
              <View style={styles.courseTextCol}>
                <View style={styles.courseBadgeRow}>
                  <View style={styles.activeCoursePill}>
                    <Text style={styles.activeCoursePillText}>PRIMARY TARGET</Text>
                  </View>
                </View>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {activeExam?.title || "No course selected"}
                </Text>
                <Text style={styles.courseBody} numberOfLines={1}>
                  {activeExam?.conducting_body || "Odisha State Examination Cadre"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => router.push("/course-select")}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>Change Target Course</Text>
              <ChevronRight size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 4. PLATFORM INFORMATION & SUPPORT                            */}
        {/* ============================================================ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <HelpCircle size={16} color="#0f172a" />
            <Text style={styles.sectionTitle}>Platform Information & Support</Text>
          </View>

          <View style={styles.card}>
            {/* Location Tile */}
            <View style={styles.contactItem}>
              <View style={[styles.contactIconWrap, { backgroundColor: "#eff6ff" }]}>
                <MapPin size={18} color="#2563eb" />
              </View>
              <View style={styles.contactCol}>
                <Text style={styles.contactLabel}>Platform Location</Text>
                <Text style={styles.contactValue}>
                  {SITE_CONFIG.contact.location}
                </Text>
              </View>
            </View>

            {/* Email Tile */}
            <View style={styles.contactItem}>
              <View style={[styles.contactIconWrap, { backgroundColor: "#f0fdf4" }]}>
                <Mail size={18} color="#16a34a" />
              </View>
              <View style={styles.contactCol}>
                <Text style={styles.contactLabel}>Academic & Technical Support</Text>
                <Text style={styles.contactValue}>
                  {SITE_CONFIG.contact.email}
                </Text>
              </View>
            </View>

            {/* Support Hours Tile */}
            <View style={styles.contactItem}>
              <View style={[styles.contactIconWrap, { backgroundColor: "#fffbeb" }]}>
                <Clock size={18} color="#d97706" />
              </View>
              <View style={styles.contactCol}>
                <Text style={styles.contactLabel}>Support Operating Hours</Text>
                <Text style={styles.contactValue}>
                  {SITE_CONFIG.contact.supportHours}
                </Text>
              </View>
            </View>

            {/* Doubts & Faculty Q&A Action */}
            <TouchableOpacity
              style={styles.askDoubtsBtn}
              onPress={() => router.push("/doubts" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.askDoubtsLeft}>
                <MessageSquare size={16} color="#2563eb" style={{ marginRight: 8 }} />
                <Text style={styles.askDoubtsText}>
                  Ask Faculty Doubts & Q&A
                </Text>
              </View>
              <ChevronRight size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 5. LOGOUT BUTTON                                             */}
        {/* ============================================================ */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#dc2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out of OdishaRank</Text>
        </TouchableOpacity>

        {/* App Version Info Footer */}
        <View style={styles.appFooter}>
          <Text style={styles.appFooterText}>
            OdishaRank Mobile v2.4 • Premier Odisha State Exam Prep
          </Text>
          <Text style={styles.appFooterSub}>
            Protected by Supabase Row-Level Security (RLS)
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
  },

  // 1. Profile Hero Card
  profileHeroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  heroTopBanner: {
    height: 72,
    backgroundColor: "#0f172a",
    overflow: "hidden",
  },
  heroBannerPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1e3a8a",
    opacity: 0.4,
  },
  profileBody: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "center",
    marginTop: -38,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarOuterRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#ffffff",
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 38,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  verifiedBadgeBlue: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  verifiedBadgeEmerald: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  nameRow: {
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "90%",
  },
  email: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  phoneText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  profileBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  badgePillSlate: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeTextSlate: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  badgePillBlue: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeTextBlue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
  },
  badgePillEmerald: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeTextEmerald: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  bioContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxWidth: "95%",
  },
  bioText: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginTop: 16,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
  },

  // Section Header
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.2,
  },

  // 2. Admin Card
  adminCard: {
    backgroundColor: "#0b1329",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  adminCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  adminDotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  adminLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10b981",
    letterSpacing: 0.8,
  },
  rlsBadge: {
    flexDirection: "row",
    alignItems: "center",
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
  adminCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  adminCardDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 16,
  },
  adminActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  adminLaunchBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 11,
    borderRadius: 10,
  },
  adminLaunchText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  adminWebBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 11,
    borderRadius: 10,
  },
  adminWebText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },

  // 3. Target Exam & Generic Cards
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  courseIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
  },
  courseTextCol: {
    flex: 1,
  },
  courseBadgeRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  activeCoursePill: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeCoursePillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  courseBody: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  switchText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },

  // 4. Contact & Support
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactCol: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "600",
    marginTop: 2,
  },
  askDoubtsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  askDoubtsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  askDoubtsText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },

  // 5. Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 16,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#dc2626",
  },

  // Footer
  appFooter: {
    alignItems: "center",
    paddingVertical: 8,
  },
  appFooterText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
    textAlign: "center",
  },
  appFooterSub: {
    fontSize: 10,
    color: "#cbd5e1",
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
});
