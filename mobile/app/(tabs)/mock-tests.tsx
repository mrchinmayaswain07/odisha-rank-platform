import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Award, Clock, HelpCircle, AlertCircle, ArrowRight } from "lucide-react-native";
import { BRAND_COLORS, MockTest } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { getMockTests } from "../../src/lib/data-service";
import { Header } from "../../src/components/Header";
import { Badge } from "../../src/components/Badge";
import { EmptyState } from "../../src/components/EmptyState";
import { Button } from "../../src/components/Button";

export default function MockTestsScreen() {
  const { activeExam } = useAuth();
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTests = async () => {
      setIsLoading(true);
      const list = await getMockTests(activeExam?.id);
      setMockTests(list);
      setIsLoading(false);
    };

    loadTests();
  }, [activeExam?.id]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Timed Mock Tests"
        subtitle={activeExam?.title || "Exam Simulations"}
        showCoursePill={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loaderText}>Loading mock test simulations...</Text>
          </View>
        ) : mockTests.length === 0 ? (
          <EmptyState
            title="No Mock Tests Available"
            description="There are currently no published mock tests for this examination. Try switching to OSSC CGL or check back soon."
            actionTitle="Choose Another Exam"
            onAction={() => router.push("/course-select")}
          />
        ) : (
          <View style={styles.testList}>
            {mockTests.map((test) => (
              <View key={test.id} style={styles.testCard}>
                <View style={styles.cardHeader}>
                  <Badge label="Official Format" variant="blue" size="sm" />
                  <Text style={styles.questionCountText}>
                    {test.questions_count || 10} Questions
                  </Text>
                </View>

                <Text style={styles.testTitle}>{test.title}</Text>
                <Text style={styles.testDesc} numberOfLines={2}>
                  {test.description}
                </Text>

                {/* Test Specs Grid */}
                <View style={styles.specGrid}>
                  <View style={styles.specItem}>
                    <Clock size={14} color={BRAND_COLORS.textMuted} />
                    <Text style={styles.specText}>{test.duration_minutes} Mins</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Award size={14} color={BRAND_COLORS.textMuted} />
                    <Text style={styles.specText}>{test.total_marks} Marks</Text>
                  </View>
                  <View style={styles.specItem}>
                    <AlertCircle size={14} color={BRAND_COLORS.textMuted} />
                    <Text style={styles.specText}>-{test.negative_marking || 0.25} Neg</Text>
                  </View>
                </View>

                <Button
                  title="Start Exam Simulation"
                  onPress={() => router.push(`/mock-test/${test.id}`)}
                  size="md"
                  icon={<ArrowRight size={16} color="#ffffff" />}
                />
              </View>
            ))}
          </View>
        )}
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
  testList: {
    gap: 16,
  },
  testCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  questionCountText: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    fontWeight: "600",
  },
  testTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 6,
  },
  testDesc: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  specGrid: {
    flexDirection: "row",
    backgroundColor: BRAND_COLORS.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    justifyContent: "space-around",
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  specText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
  },
});
