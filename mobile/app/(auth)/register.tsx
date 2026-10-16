import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GraduationCap, User, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react-native";
import { BRAND_COLORS, registerSchema } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { Button } from "../../src/components/Button";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const parsed = registerSchema.safeParse({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      confirm_password: confirmPassword,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.errors[0]?.message || "Please check your inputs.");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(fullName.trim(), email.trim(), password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to create account. Please try again.");
    } else {
      setSuccessMsg("Account created! Please check your email for confirmation or sign in directly.");
      setTimeout(() => {
        router.replace("/(tabs)/dashboard");
      }, 1500);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <GraduationCap size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join serious Odisha exam aspirants</Text>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={BRAND_COLORS.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Success Banner */}
          {successMsg ? (
            <View style={styles.successBanner}>
              <CheckCircle2 size={16} color={BRAND_COLORS.success} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Subrat Pattnaik"
                  placeholderTextColor={BRAND_COLORS.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="student@example.com"
                  placeholderTextColor={BRAND_COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password (Min 6 chars)</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Choose a password"
                  placeholderTextColor={BRAND_COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={BRAND_COLORS.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <Button
              title="Create Student Account"
              onPress={handleRegister}
              loading={isLoading}
              size="lg"
              style={styles.submitButton}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: BRAND_COLORS.danger,
    fontSize: 13,
    flex: 1,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  successText: {
    color: BRAND_COLORS.success,
    fontSize: 13,
    flex: 1,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border,
    borderRadius: 10,
    backgroundColor: BRAND_COLORS.background,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: BRAND_COLORS.textPrimary,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: BRAND_COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
});
