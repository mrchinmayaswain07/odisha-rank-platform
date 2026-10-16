import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { GraduationCap } from "lucide-react-native";
import { BRAND_COLORS, SITE_CONFIG } from "@odisha-rank/shared";
import { useAuth } from "../src/lib/auth-context";

export default function Index() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [session, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <GraduationCap size={44} color="#ffffff" />
      </View>
      <Text style={styles.brandTitle}>
        Odisha<Text style={styles.brandAccent}>Rank</Text>
      </Text>
      <Text style={styles.tagline}>{SITE_CONFIG.tagline}</Text>
      <ActivityIndicator size="small" color={BRAND_COLORS.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: BRAND_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: BRAND_COLORS.primary,
  },
  tagline: {
    fontSize: 14,
    color: BRAND_COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  spinner: {
    marginTop: 36,
  },
});
