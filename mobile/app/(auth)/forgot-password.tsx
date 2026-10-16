import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react-native";
import { BRAND_COLORS, forgotPasswordSchema } from "@odisha-rank/shared";
import { supabase } from "../../src/lib/supabase";
import { Button } from "../../src/components/Button";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const parsed = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setErrorMsg(parsed.error.errors[0]?.message || "Please enter a valid email.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "odisharank://reset-password",
    });
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message || "Could not send reset link. Please try again.");
    } else {
      setSuccessMsg("Password reset link sent! Check your inbox to set a new password.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={BRAND_COLORS.textPrimary} />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <KeyRound size={32} color="#ffffff" />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your registered email and we will send you a secure password reset link.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={BRAND_COLORS.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle2 size={16} color={BRAND_COLORS.success} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registered Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={BRAND_COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={BRAND_COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <Button
            title="Send Reset Instructions"
            onPress={handleReset}
            loading={isLoading}
            size="lg"
            style={styles.submitButton}
          />
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
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
    marginBottom: 20,
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
    marginTop: 4,
  },
});
