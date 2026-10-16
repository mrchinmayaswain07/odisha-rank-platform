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
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
} from "lucide-react-native";
import { BRAND_COLORS, Question, Subject } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { getQuestions, getSubjects, recordQuestionAttempt } from "../../src/lib/data-service";
import { Header } from "../../src/components/Header";
import { Badge } from "../../src/components/Badge";
import { EmptyState } from "../../src/components/EmptyState";
import { Button } from "../../src/components/Button";

export default function QuestionsScreen() {
  const { user, activeExam } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      const subs = await getSubjects(activeExam?.id);
      setSubjects(subs);
    };
    loadSubjects();
  }, [activeExam]);

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      const list = await getQuestions({
        examId: activeExam?.id,
        subjectId: selectedSubjectId,
      });
      setQuestions(list);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsLoading(false);
    };

    loadQuestions();
  }, [activeExam, selectedSubjectId]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correct_option_index;
    if (user) {
      recordQuestionAttempt(currentQ.id, idx, isCorrect, user.id);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsAnswered(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Question Bank"
        subtitle={activeExam?.title || "MCQ Practice"}
        showCoursePill={true}
      />

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <TouchableOpacity
            onPress={() => setSelectedSubjectId(undefined)}
            style={[styles.filterChip, !selectedSubjectId && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, !selectedSubjectId && styles.filterChipTextActive]}>
              All Subjects
            </Text>
          </TouchableOpacity>

          {subjects.map((sub) => {
            const isActive = selectedSubjectId === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => setSelectedSubjectId(sub.id)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {sub.name}
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
            <Text style={styles.loaderText}>Loading verified questions...</Text>
          </View>
        ) : questions.length === 0 ? (
          <EmptyState
            title="No Questions Found"
            description="No practice questions match this filter. Try selecting 'All Subjects' or switch courses."
          />
        ) : currentQ ? (
          <View style={styles.questionCard}>
            {/* Meta Row */}
            <View style={styles.metaRow}>
              <Badge
                label={`Q ${currentIndex + 1} of ${questions.length}`}
                variant="slate"
                size="sm"
              />
              <Badge
                label={currentQ.difficulty.toUpperCase()}
                variant={
                  currentQ.difficulty === "easy"
                    ? "emerald"
                    : currentQ.difficulty === "hard"
                    ? "amber"
                    : "blue"
                }
                size="sm"
              />
            </View>

            {/* Question Text */}
            <Text style={styles.questionText}>{currentQ.question_text}</Text>

            {/* Options List */}
            <View style={styles.optionsList}>
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correct_option_index;

                let optionStyle = styles.optionItem;
                let textStyle = styles.optionText;

                if (isAnswered) {
                  if (isCorrect) {
                    optionStyle = styles.optionCorrect;
                    textStyle = styles.optionTextCorrect;
                  } else if (isSelected) {
                    optionStyle = styles.optionIncorrect;
                    textStyle = styles.optionTextIncorrect;
                  }
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    style={optionStyle}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIndexBadge}>
                      <Text style={styles.optionIndexLetter}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text style={textStyle}>{opt}</Text>
                    {isAnswered && isCorrect ? (
                      <CheckCircle2 size={18} color={BRAND_COLORS.success} />
                    ) : isAnswered && isSelected && !isCorrect ? (
                      <XCircle size={18} color={BRAND_COLORS.danger} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Explanation Card */}
            {isAnswered && currentQ.explanation ? (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationTitle}>Explanation</Text>
                <Text style={styles.explanationText}>{currentQ.explanation}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                title="Prev"
                onPress={handlePrev}
                disabled={currentIndex === 0}
                variant="outline"
                size="sm"
                icon={<ArrowLeft size={16} color={BRAND_COLORS.textPrimary} />}
              />

              {isAnswered ? (
                <Button
                  title="Retry"
                  onPress={handleReset}
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw size={14} color={BRAND_COLORS.primary} />}
                />
              ) : null}

              <Button
                title={currentIndex === questions.length - 1 ? "Finished" : "Next"}
                onPress={handleNext}
                disabled={currentIndex === questions.length - 1}
                size="sm"
                icon={<ArrowRight size={16} color="#ffffff" />}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  filterBar: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.background,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  filterChipActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
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
  questionCard: {
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
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
    marginBottom: 18,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border,
    backgroundColor: BRAND_COLORS.background,
    gap: 10,
  },
  optionCorrect: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.success,
    backgroundColor: "#ecfdf5",
    gap: 10,
  },
  optionIncorrect: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.danger,
    backgroundColor: "#fef2f2",
    gap: 10,
  },
  optionIndexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  optionIndexLetter: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: BRAND_COLORS.textPrimary,
    lineHeight: 19,
  },
  optionTextCorrect: {
    flex: 1,
    fontSize: 14,
    color: "#065f46",
    fontWeight: "700",
    lineHeight: 19,
  },
  optionTextIncorrect: {
    flex: 1,
    fontSize: 14,
    color: "#991b1b",
    fontWeight: "600",
    lineHeight: 19,
  },
  explanationBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 18,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    color: BRAND_COLORS.textPrimary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border,
  },
});
