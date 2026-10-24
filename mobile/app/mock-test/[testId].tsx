import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react-native";
import { BRAND_COLORS, MockTest, Question } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { getMockTestById, submitMockTest } from "../../src/lib/data-service";
import { Button } from "../../src/components/Button";
import { Badge } from "../../src/components/Badge";

export default function MockTestSimulationScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const { user } = useAuth();
  const [test, setTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDurationSeconds = useRef(0);

  useEffect(() => {
    if (!testId) return;

    const loadTest = async () => {
      setIsLoading(true);
      const data = await getMockTestById(testId, true);
      if (data) {
        setTest(data.test);
        setQuestions(data.questions);
        const durationSec = (data.test.duration_minutes || 60) * 60;
        setRemainingSeconds(durationSec);
        initialDurationSeconds.current = durationSec;
      }
      setIsLoading(false);
    };

    loadTest();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId]);

  // Countdown Timer
  useEffect(() => {
    if (isLoading || !test) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, test]);

  const handleTimeExpired = () => {
    Alert.alert("Time's Up!", "Your test time has expired. Submitting your answers now...", [
      { text: "OK", onPress: () => performSubmit() },
    ]);
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optIdx: number) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIdx,
    }));
  };

  const handleClearAnswer = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const confirmSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;

    Alert.alert(
      "Submit Mock Test",
      `You have answered ${answeredCount} of ${questions.length} questions (${unansweredCount} skipped). Are you sure you want to finish?`,
      [
        { text: "Continue Test", style: "cancel" },
        { text: "Submit Now", style: "default", onPress: () => performSubmit() },
      ]
    );
  };

  const performSubmit = async () => {
    if (!test || !user) return;
    setIsSubmitting(true);
    const timeSpent = initialDurationSeconds.current - remainingSeconds;

    try {
      const evaluation = await submitMockTest(test.id, answers, timeSpent, user.id);
      router.replace({
        pathname: "/mock-test/[testId]/result",
        params: { testId: test.id, resultData: JSON.stringify(evaluation) },
      } as any);
    } catch (err) {
      console.warn("Failed to submit test:", err);
      Alert.alert("Submission Error", "Failed to submit test. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeCritical = remainingSeconds < 300; // less than 5 mins

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Test Simulation Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {test?.title || "Exam Simulation"}
          </Text>
          <Text style={styles.headerSub}>Negative: -{test?.negative_marking || 0.25}m</Text>
        </View>

        <View
          style={[
            styles.timerBox,
            isTimeCritical && styles.timerBoxCritical,
          ]}
        >
          <Clock size={16} color={isTimeCritical ? BRAND_COLORS.danger : BRAND_COLORS.primary} />
          <Text style={[styles.timerText, isTimeCritical && styles.timerTextCritical]}>
            {formatTimer(remainingSeconds)}
          </Text>
        </View>
      </View>

      {/* Question Number Palette Bar */}
      <View style={styles.paletteBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteList}>
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[q.id] !== undefined;

            return (
              <TouchableOpacity
                key={q.id}
                onPress={() => setCurrentIndex(idx)}
                style={[
                  styles.paletteItem,
                  isAnswered && styles.paletteItemAnswered,
                  isCurrent && styles.paletteItemCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.paletteText,
                    isAnswered && styles.paletteTextAnswered,
                    isCurrent && styles.paletteTextCurrent,
                  ]}
                >
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loaderText}>Loading examination questions...</Text>
          </View>
        ) : currentQ ? (
          <View style={styles.questionCard}>
            <View style={styles.questionMeta}>
              <Badge
                label={`Question ${currentIndex + 1} of ${questions.length}`}
                variant="slate"
                size="sm"
              />
              <Text style={styles.marksBadge}>+{1.0}m / -{test?.negative_marking || 0.25}m</Text>
            </View>

            <Text style={styles.questionText}>{currentQ.question_text}</Text>

            {/* Options List */}
            <View style={styles.optionsList}>
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentQ.id] === idx;

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectOption(idx)}
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {answers[currentQ.id] !== undefined ? (
              <TouchableOpacity
                onPress={handleClearAnswer}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.clearText}>Clear Option</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : !test ? (
          <View style={styles.loaderContainer}>
            <AlertCircle size={44} color="#ef4444" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 6 }}>
              Mock Test Not Found
            </Text>
            <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", paddingHorizontal: 24, marginBottom: 20 }}>
              The requested examination simulation could not be found or has been removed.
            </Text>
            <Button
              title="Return to Mock Tests"
              onPress={() => router.back()}
              variant="outline"
              size="sm"
            />
          </View>
        ) : (
          <View style={styles.loaderContainer}>
            <AlertCircle size={44} color="#f59e0b" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 6 }}>
              No Questions Attached Yet
            </Text>
            <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", paddingHorizontal: 24, marginBottom: 20 }}>
              The administrator is currently configuring examination questions for this mock test simulation.
            </Text>
            <Button
              title="Return to Mock Tests"
              onPress={() => router.back()}
              variant="outline"
              size="sm"
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation & Submit Bar */}
      <View style={styles.bottomBar}>
        <Button
          title="Previous"
          onPress={() => currentIndex > 0 && setCurrentIndex((prev) => prev - 1)}
          disabled={currentIndex === 0}
          variant="outline"
          size="sm"
          icon={<ArrowLeft size={16} color={BRAND_COLORS.textPrimary} />}
        />

        <Button
          title="Submit Test"
          onPress={confirmSubmit}
          loading={isSubmitting}
          size="sm"
          variant="primary"
          style={styles.submitBtn}
        />

        <Button
          title="Next"
          onPress={() =>
            currentIndex < questions.length - 1 && setCurrentIndex((prev) => prev + 1)
          }
          disabled={currentIndex === questions.length - 1}
          variant="outline"
          size="sm"
          icon={<ArrowRight size={16} color={BRAND_COLORS.textPrimary} />}
        />
      </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
  },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  timerBoxCritical: {
    backgroundColor: "#fee2e2",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
    fontVariant: ["tabular-nums"],
  },
  timerTextCritical: {
    color: BRAND_COLORS.danger,
  },
  paletteBar: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  paletteList: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  paletteItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.background,
  },
  paletteItemAnswered: {
    backgroundColor: BRAND_COLORS.primaryLight,
    borderColor: BRAND_COLORS.primary,
  },
  paletteItemCurrent: {
    borderColor: BRAND_COLORS.secondary,
    borderWidth: 2,
  },
  paletteText: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.textMuted,
  },
  paletteTextAnswered: {
    color: BRAND_COLORS.primary,
  },
  paletteTextCurrent: {
    color: BRAND_COLORS.secondary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
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
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  questionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  marksBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.textMuted,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 20,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border,
    backgroundColor: BRAND_COLORS.background,
    gap: 12,
  },
  optionItemSelected: {
    borderColor: BRAND_COLORS.primary,
    backgroundColor: "#eff6ff",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BRAND_COLORS.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: BRAND_COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_COLORS.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: BRAND_COLORS.textPrimary,
    lineHeight: 19,
  },
  optionTextSelected: {
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  clearBtn: {
    alignSelf: "flex-end",
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    fontWeight: "600",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border,
  },
  submitBtn: {
    paddingHorizontal: 20,
  },
});
