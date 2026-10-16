import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
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
} from "lucide-react-native";
import { BRAND_COLORS, SITE_CONFIG } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { Header } from "../../src/components/Header";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";

export default function ProfileScreen() {
  const { user, profile, isAdmin, activeExam, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of OdishaRank?",
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Student Profile" showCoursePill={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={36} color="#ffffff" />
          </View>
          <Text style={styles.name}>
            {profile?.full_name || user?.user_metadata?.full_name || "Aspirant Scholar"}
          </Text>
          <Text style={styles.email}>{user?.email || "No email"}</Text>

          {profile?.phone && (
            <View style={styles.phoneRow}>
              <Phone size={13} color={BRAND_COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.phoneText}>{profile.phone}</Text>
            </View>
          )}

          <View style={styles.profileBadgeRow}>
            <Badge
              label={profile?.district || "Odisha State"}
              variant="slate"
              size="sm"
            />
            <Badge
              label={`Batch ${profile?.target_year || 2026}`}
              variant="blue"
              size="sm"
            />
            {isAdmin && (
              <Badge
                label="Admin"
                variant="emerald"
                size="sm"
              />
            )}
          </View>

          {profile?.bio && (
            <Text style={styles.bioText}>"{profile.bio}"</Text>
          )}

          {/* Edit Profile Action */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push("/edit-profile")}
            activeOpacity={0.7}
          >
            <Edit3 size={14} color={BRAND_COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Control Center Banner (For Admins Only) */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Administration & Control</Text>
            <View style={styles.adminCard}>
              <View style={styles.adminCardHeader}>
                <View style={styles.adminDotRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.adminLabel}>ADMIN SESSION</Text>
                </View>
                <View style={styles.rlsBadge}>
                  <Text style={styles.rlsText}>RLS Enforced: Admin</Text>
                </View>
              </View>

              <Text style={styles.adminCardTitle}>Curriculum & Examination Administration</Text>
              <Text style={styles.adminCardDesc}>
                Full catalog statistics, registered student management, verified questions, and mock test administration.
              </Text>

              <View style={styles.adminActionRow}>
                <TouchableOpacity
                  style={styles.adminLaunchBtn}
                  onPress={() => router.push("/admin")}
                  activeOpacity={0.8}
                >
                  <ShieldCheck size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.adminLaunchText}>Open Admin Center</Text>
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
          </>
        )}

        {/* Target Course Card */}
        <Text style={styles.sectionTitle}>Target Examination</Text>
        <View style={styles.card}>
          <View style={styles.courseHeader}>
            <View style={styles.courseIconBox}>
              <GraduationCap size={22} color={BRAND_COLORS.primary} />
            </View>
            <View style={styles.courseTextCol}>
              <Text style={styles.courseTitle}>
                {activeExam?.title || "No course selected"}
              </Text>
              <Text style={styles.courseBody}>
                {activeExam?.conducting_body || "Odisha Cadre"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.push("/course-select")}
            activeOpacity={0.7}
          >
            <Text style={styles.switchText}>Change Target Course &rarr;</Text>
          </TouchableOpacity>
        </View>

        {/* Platform Info & Verified Contact */}
        <Text style={styles.sectionTitle}>Platform Information & Support</Text>
        <View style={styles.card}>
          <View style={styles.contactItem}>
            <MapPin size={18} color={BRAND_COLORS.primary} style={styles.contactIcon} />
            <View style={styles.contactCol}>
              <Text style={styles.contactLabel}>Platform Location</Text>
              <Text style={styles.contactValue}>{SITE_CONFIG.contact.location}</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Mail size={18} color={BRAND_COLORS.primary} style={styles.contactIcon} />
            <View style={styles.contactCol}>
              <Text style={styles.contactLabel}>Academic & Technical Support</Text>
              <Text style={styles.contactValue}>{SITE_CONFIG.contact.email}</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Clock size={18} color={BRAND_COLORS.primary} style={styles.contactIcon} />
            <View style={styles.contactCol}>
              <Text style={styles.contactLabel}>Support Hours</Text>
              <Text style={styles.contactValue}>{SITE_CONFIG.contact.supportHours}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Button
          title="Log Out of OdishaRank"
          onPress={handleSignOut}
          variant="outline"
          size="md"
          icon={<LogOut size={16} color={BRAND_COLORS.danger} />}
          style={styles.logoutButton}
          textStyle={{ color: BRAND_COLORS.danger }}
        />
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
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  email: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    marginTop: 2,
  },
  profileBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 24,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  courseIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  courseTextCol: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  courseBody: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    marginTop: 2,
  },
  switchButton: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border,
    alignItems: "flex-end",
  },
  switchText: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  contactIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  contactCol: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.textMuted,
    textTransform: "uppercase",
  },
  contactValue: {
    fontSize: 13,
    color: BRAND_COLORS.textPrimary,
    fontWeight: "500",
    marginTop: 2,
  },
  logoutButton: {
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
    marginTop: 8,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  phoneText: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    fontWeight: "500",
  },
  bioText: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  adminCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 24,
  },
  adminCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  adminDotRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  adminLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#10b981",
    letterSpacing: 0.5,
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
  adminCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  adminCardDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 14,
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
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
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
    paddingVertical: 10,
    borderRadius: 8,
  },
  adminWebText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
});
