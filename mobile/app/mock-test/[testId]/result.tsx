import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw,
} from "lucide-react-native";
import { BRAND_COLORS, MockTestEvaluationResult } from "@odisha-rank/shared";
import { Header } from "../../../src/components/Header";
import { Badge } from "../../../src/components/Badge";
import { Button } from "../../../src/components/Button";

export default function MockTestResultScreen() {
  const { testId, resultData } = useLocalSearchParams<{
    testId: string;
    resultData: string;
  }>();

  let result: MockTestEvaluationResult | null = null;
  try {
    if (resultData) {
      result = JSON.parse(resultData);
    }
  } catch {
    result = null;
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Examination Results" showCoursePill={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {result ? (
          <>
            {/* Scorecard Hero */}
            <View style={styles.scoreCard}>
              <View style={styles.statusBadge}>
                <Badge
                  label={result.passed ? "PASSED EXAMINATION" : "NEEDS PRACTICE"}
                  variant={result.passed ? "emerald" : "amber"}
                  size="md"
                />
              </View>

              <Text style={styles.scoreNumber}>
                {result.score}{" "}
                <Text style={styles.totalMarks}>/ {result.total_marks}</Text>
              </Text>
              <Text style={styles.scoreSub}>Final Server-Calculated Marks</Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: BRAND_COLORS.success }]}>
                    {result.correct_count}
                  </Text>
                  <Text style={styles.statLabel}>Correct</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: BRAND_COLORS.danger }]}>
                    {result.incorrect_count}
                  </Text>
                  <Text style={styles.statLabel}>Incorrect</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{result.unanswered_count}</Text>
                  <Text style={styles.statLabel}>Skipped</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: BRAND_COLORS.primary }]}>
                    {result.accuracy}%
                  </Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
              </View>

              {result.time_spent_seconds ? (
                <Text style={styles.timeSpentText}>
                  Time taken: {formatTime(result.time_spent_seconds)}
                </Text>
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Button
                title="Return to Dashboard"
                onPress={() => router.replace("/(tabs)/dashboard")}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Retake"
                onPress={() => router.replace(`/mock-test/${testId}`)}
                variant="outline"
                size="md"
                icon={<RotateCcw size={16} color={BRAND_COLORS.textPrimary} />}
              />
            </View>

            {/* Detailed Question Review */}
            <Text style={styles.reviewHeading}>Question-by-Question Review</Text>

            <View style={styles.reviewList}>
              {result.answers.map((ans, idx) => (
                <View key={ans.question_id} style={styles.reviewCard}>
                  <View style={styles.cardTop}>
                    <Badge
                      label={`Q ${idx + 1}`}
                      variant={ans.is_correct ? "emerald" : ans.selected_option_index === null ? "slate" : "amber"}
                      size="sm"
                    />
                    <Text
                      style={[
                        styles.marksAwarded,
                        {
                          color:
                            ans.marks_awarded > 0
                              ? BRAND_COLORS.success
                              : ans.marks_awarded < 0
                              ? BRAND_COLORS.danger
                              : BRAND_COLORS.textMuted,
                        },
                      ]}
                    >
                      {ans.marks_awarded > 0
                        ? `+${ans.marks_awarded}m`
                        : `${ans.marks_awarded}m`}
                    </Text>
                  </View>

                  <Text style={styles.qText}>{ans.question_text}</Text>

                  {/* Options with markers */}
                  <View style={styles.reviewOptions}>
                    {ans.options.map((opt, optIdx) => {
                      const isUserChoice = ans.selected_option_index === optIdx;
                      const isAnswer = ans.correct_option_index === optIdx;

                      let itemStyle = styles.reviewOptItem;
                      let tStyle = styles.reviewOptText;

                      if (isAnswer) {
                        itemStyle = styles.reviewOptCorrect;
                        tStyle = styles.reviewOptTextCorrect;
                      } else if (isUserChoice && !ans.is_correct) {
                        itemStyle = styles.reviewOptWrong;
                        tStyle = styles.reviewOptTextWrong;
                      }

                      return (
                        <View key={optIdx} style={itemStyle}>
                          <Text style={styles.optLetter}>
                            {String.fromCharCode(65 + optIdx)}.
                          </Text>
                          <Text style={tStyle}>{opt}</Text>
                          {isAnswer ? (
                            <CheckCircle2 size={16} color={BRAND_COLORS.success} />
                          ) : isUserChoice && !ans.is_correct ? (
                            <XCircle size={16} color={BRAND_COLORS.danger} />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>

                  {/* Explanation */}
                  {ans.explanation ? (
                    <View style={styles.explanationBox}>
                      <Text style={styles.expTitle}>Explanation:</Text>
                      <Text style={styles.expText}>{ans.explanation}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No test result data to display.</Text>
            <Button
              title="Back to Dashboard"
              onPress={() => router.replace("/(tabs)/dashboard")}
              size="md"
            />
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
    paddingBottom: 40,
  },
  scoreCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusBadge: {
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 44,
    fontWeight: "900",
    color: BRAND_COLORS.textPrimary,
    letterSpacing: -1,
  },
  totalMarks: {
    fontSize: 20,
    fontWeight: "600",
    color: BRAND_COLORS.textMuted,
  },
  scoreSub: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    backgroundColor: BRAND_COLORS.background,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  statBox: {
    alignItems: "center",
  },
  statVal: {
    fontSize: 18,
    fontWeight: "900",
    color: BRAND_COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  timeSpentText: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    marginTop: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  reviewHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 12,
  },
  reviewList: {
    gap: 14,
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  marksAwarded: {
    fontSize: 13,
    fontWeight: "800",
  },
  qText: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: 14,
  },
  reviewOptions: {
    gap: 8,
    marginBottom: 12,
  },
  reviewOptItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    backgroundColor: BRAND_COLORS.background,
    gap: 8,
  },
  reviewOptCorrect: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.success,
    backgroundColor: "#ecfdf5",
    gap: 8,
  },
  reviewOptWrong: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.danger,
    backgroundColor: "#fef2f2",
    gap: 8,
  },
  optLetter: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.textMuted,
  },
  reviewOptText: {
    flex: 1,
    fontSize: 13,
    color: BRAND_COLORS.textPrimary,
  },
  reviewOptTextCorrect: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#065f46",
  },
  reviewOptTextWrong: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#991b1b",
  },
  explanationBox: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  expTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  expText: {
    fontSize: 12,
    color: BRAND_COLORS.textPrimary,
    lineHeight: 17,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: BRAND_COLORS.textSecondary,
    marginBottom: 16,
  },
});
