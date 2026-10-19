import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, Check, MapPin, User, Phone, Calendar, BookOpen, ChevronDown } from "lucide-react-native";
import { BRAND_COLORS, ODISHA_DISTRICTS, profileSchema } from "@odisha-rank/shared";
import { useAuth } from "../src/lib/auth-context";
import { Button } from "../src/components/Button";

const TARGET_YEARS = [2026, 2027, 2028, 2029, 2030];

export default function EditProfileModal() {
  const { profile, editProfile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [district, setDistrict] = useState(profile?.district || "Khordha");
  const [targetYear, setTargetYear] = useState(
    profile?.target_year && profile.target_year >= 2026 ? profile.target_year : 2026
  );
  const [bio, setBio] = useState(profile?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  const handleSave = async () => {
    setErrorMsg(null);

    // Validation using shared Zod schema
    const validation = profileSchema.safeParse({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      district: district.trim() || null,
      target_year: Number(targetYear),
      bio: bio.trim() || null,
    });

    if (!validation.success) {
      const firstErr = validation.error.errors[0]?.message || "Please check your inputs";
      setErrorMsg(firstErr);
      return;
    }

    try {
      setIsSaving(true);
      await editProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        district: district.trim() || null,
        target_year: Number(targetYear),
        bio: bio.trim() || null,
      });

      await refreshProfile();
      Alert.alert("Success", "Your profile has been updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Keep your student details accurate</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel="Close"
        >
          <X size={22} color={BRAND_COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Full Name <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <User size={18} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={BRAND_COLORS.textMuted}
            />
          </View>
        </View>

        {/* Mobile Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mobile Phone (10 digits)</Text>
          <View style={styles.inputBox}>
            <Phone size={18} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 9876543210"
              placeholderTextColor={BRAND_COLORS.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <Text style={styles.fieldHint}>Used for SMS exam alerts and verification</Text>
        </View>

        {/* District Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Odisha District</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setShowDistrictModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerTriggerLeft}>
              <MapPin size={18} color={BRAND_COLORS.primary} style={styles.inputIcon} />
              <Text style={styles.pickerValueText}>{district || "Select District"}</Text>
            </View>
            <ChevronDown size={18} color={BRAND_COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Target Examination Year */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Target Exam Year</Text>
          <View style={styles.yearRow}>
            {TARGET_YEARS.map((yr) => {
              const selected = targetYear === yr;
              return (
                <TouchableOpacity
                  key={yr}
                  style={[styles.yearChip, selected && styles.yearChipActive]}
                  onPress={() => setTargetYear(yr)}
                >
                  <Text style={[styles.yearChipText, selected && styles.yearChipTextActive]}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bio / Preparation Goals */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>About You / Aspirant Goals</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about your target exams or study goals (e.g. Aiming for OSSC CGL 2026)"
            placeholderTextColor={BRAND_COLORS.textMuted}
            multiline
            numberOfLines={4}
            maxLength={300}
          />
          <Text style={styles.fieldHint}>{bio.length}/300 characters</Text>
        </View>

        {/* Save Button */}
        <View style={styles.actionRow}>
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => router.back()}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title={isSaving ? "Saving..." : "Save Changes"}
            variant="primary"
            size="md"
            onPress={handleSave}
            disabled={isSaving || !fullName.trim()}
            style={{ flex: 2 }}
          />
        </View>
      </ScrollView>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.districtModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Select Odisha District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)} style={styles.closeBtn}>
                <X size={20} color={BRAND_COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={ODISHA_DISTRICTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === district;
                return (
                  <TouchableOpacity
                    style={[styles.districtItem, isSelected && styles.districtItemActive]}
                    onPress={() => {
                      setDistrict(item);
                      setShowDistrictModal(false);
                    }}
                  >
                    <Text style={[styles.districtText, isSelected && styles.districtTextActive]}>
                      {item}
                    </Text>
                    {isSelected && <Check size={18} color={BRAND_COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: BRAND_COLORS.danger,
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: BRAND_COLORS.danger,
  },
  fieldHint: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    marginTop: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: BRAND_COLORS.textPrimary,
  },
  textArea: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    borderRadius: 10,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pickerTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerValueText: {
    fontSize: 15,
    color: BRAND_COLORS.textPrimary,
    fontWeight: "500",
  },
  yearRow: {
    flexDirection: "row",
    gap: 6,
  },
  yearChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    backgroundColor: "#ffffff",
  },
  yearChipActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  yearChipTextActive: {
    color: "#ffffff",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  districtModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  districtItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BRAND_COLORS.border,
  },
  districtItemActive: {
    backgroundColor: "#eff6ff",
  },
  districtText: {
    fontSize: 15,
    color: BRAND_COLORS.textPrimary,
  },
  districtTextActive: {
    color: BRAND_COLORS.primary,
    fontWeight: "600",
  },
});
