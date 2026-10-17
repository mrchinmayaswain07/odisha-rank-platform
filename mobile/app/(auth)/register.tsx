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
  Image,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GraduationCap, User, Mail, Lock, AlertCircle, CheckCircle2, MailCheck, ArrowRight } from "lucide-react-native";
import { BRAND_COLORS, registerSchema } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { Button } from "../../src/components/Button";

export default function RegisterScreen() {
  const { user, isAdmin, signUp } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.replace(isAdmin ? "/admin" : "/(tabs)/dashboard");
    }
  }, [user, isAdmin]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

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
    const { data, error } = await signUp(fullName.trim(), email.trim(), password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || "Failed to create account. Please try again.");
    } else if (data?.session) {
      // Auto-confirmed or immediate session
      setSuccessMsg("Account created! Redirecting to dashboard...");
      setTimeout(() => {
        router.replace("/(tabs)/dashboard");
      }, 1000);
    } else {
      // Verification email has been sent! Do NOT auto-redirect to an empty profile!
      setRegisteredEmail(email.trim());
      setIsVerificationPending(true);
    }
  };

  if (isVerificationPending) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.verifyCard}>
            <View style={styles.verifyIconBox}>
              <MailCheck size={44} color={BRAND_COLORS.success} />
            </View>
            <Text style={styles.verifyTitle}>Check Your Inbox</Text>
            <Text style={styles.verifySubtitle}>
              We have dispatched an account verification link to:
            </Text>
            <View style={styles.emailBadgeBox}>
              <Mail size={16} color={BRAND_COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.emailBadgeText}>{registeredEmail}</Text>
            </View>
            <Text style={styles.verifyInstructions}>
              Please check your email inbox (or spam folder) and tap the confirmation link to activate your student account.
            </Text>
            <Text style={styles.verifyNote}>
              Once confirmed, sign in with your password to access your courses, mock tests, and personalized syllabus.
            </Text>
            <Button
              title="Proceed to Sign In"
              variant="primary"
              size="lg"
              onPress={() => router.replace("/(auth)/login")}
              style={{ width: "100%", marginTop: 24 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
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
  verifyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  verifyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  verifySubtitle: {
    fontSize: 14,
    color: BRAND_COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
  emailBadgeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  emailBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  verifyInstructions: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  verifyNote: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    lineHeight: 18,
    textAlign: "center",
  },
});
