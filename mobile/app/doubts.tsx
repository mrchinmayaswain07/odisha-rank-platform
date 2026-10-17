import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  HelpCircle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  X,
  Lock,
  MessageSquare,
  Sparkles,
} from "lucide-react-native";
import { BRAND_COLORS, StudentDoubt } from "@odisha-rank/shared";
import { useAuth } from "../src/lib/auth-context";
import { getStudentDoubts, createStudentDoubt } from "../src/lib/data-service";
import { Badge } from "../src/components/Badge";

export default function DoubtsScreen() {
  const { user, profile, activeExam } = useAuth();
  const [doubts, setDoubts] = useState<StudentDoubt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "my" | "answered">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Ask Modal State
  const [showAskModal, setShowAskModal] = useState(false);
  const [subject, setSubject] = useState("General Studies");
  const [questionText, setQuestionText] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDoubts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getStudentDoubts(user.id);
      setDoubts(data);
    } catch (err) {
      console.warn("Failed to fetch doubts:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoubts();
  };

  const handleAskSubmit = async () => {
    if (!questionText.trim()) {
      Alert.alert("Question Required", "Please enter your question or doubt description.");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      const newDoubt = await createStudentDoubt({
        user_id: user.id,
        student_name: profile?.full_name || user.email?.split("@")[0] || "Aspirant",
        student_email: user.email || undefined,
        subject: subject.trim(),
        exam_id: activeExam?.id || null,
        question: questionText.trim(),
        is_private: isPrivate,
      });

      if (newDoubt) {
        setDoubts((prev) => [newDoubt, ...prev]);
        setShowAskModal(false);
        setQuestionText("");
        Alert.alert("Doubt Submitted!", "Your question has been sent to our faculty. You'll receive a detailed answer soon.");
      }
    } catch {
      Alert.alert("Submission Failed", "Could not submit question. Please check network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered doubts
  const filteredDoubts = doubts.filter((d) => {
    if (activeTab === "my" && d.user_id !== user?.id) return false;
    if (activeTab === "answered" && d.status !== "answered") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQ = d.question?.toLowerCase().includes(q);
      const matchS = d.subject?.toLowerCase().includes(q);
      const matchA = d.answer?.toLowerCase().includes(q);
      if (!matchQ && !matchS && !matchA) return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={BRAND_COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Ask Doubts & Q&A</Text>
            <Text style={styles.headerSub}>Expert faculty concept clarification</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowAskModal(true)}
          style={styles.askBtn}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.askBtnText}>Ask Doubt</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={16} color={BRAND_COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doubts, subjects, or concepts..."
          placeholderTextColor={BRAND_COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={16} color={BRAND_COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
            All Questions ({doubts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "my" && styles.tabActive]}
          onPress={() => setActiveTab("my")}
        >
          <Text style={[styles.tabText, activeTab === "my" && styles.tabTextActive]}>
            My Questions ({doubts.filter((d) => d.user_id === user?.id).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "answered" && styles.tabActive]}
          onPress={() => setActiveTab("answered")}
        >
          <Text style={[styles.tabText, activeTab === "answered" && styles.tabTextActive]}>
            Answered ({doubts.filter((d) => d.status === "answered").length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Doubts List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_COLORS.primary]}
          />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loaderText}>Loading discussion forum...</Text>
          </View>
        ) : filteredDoubts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <HelpCircle size={44} color={BRAND_COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Doubts Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "No questions match your search terms."
                : activeTab === "my"
                ? "You haven't submitted any doubts yet. Tap 'Ask Doubt' to ask expert teachers!"
                : "Be the first to submit a question!"}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => setShowAskModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.emptyBtnText}>Ask a Question</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredDoubts.map((doubt) => {
            const isAnswered = doubt.status === "answered";
            const isMyDoubt = doubt.user_id === user?.id;

            return (
              <View key={doubt.id} style={styles.doubtCard}>
                {/* Header Tag Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardBadgeGroup}>
                    <Badge
                      label={doubt.subject || "General"}
                      variant="blue"
                      size="sm"
                    />
                    {doubt.is_private && (
                      <View style={styles.privatePill}>
                        <Lock size={10} color="#64748b" />
                        <Text style={styles.privateText}>Private</Text>
                      </View>
                    )}
                    {isMyDoubt && (
                      <View style={styles.myPill}>
                        <Text style={styles.myPillText}>You</Text>
                      </View>
                    )}
                  </View>

                  {isAnswered ? (
                    <View style={styles.statusAnswered}>
                      <CheckCircle2 size={12} color="#059669" />
                      <Text style={styles.statusAnsweredText}>Answered</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPending}>
                      <Clock size={12} color="#d97706" />
                      <Text style={styles.statusPendingText}>Under Review</Text>
                    </View>
                  )}
                </View>

                {/* Question */}
                <Text style={styles.questionText}>{doubt.question}</Text>

                {/* Question meta */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    By {isMyDoubt ? "You" : doubt.student_name || "Aspirant"} •{" "}
                    {new Date(doubt.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>

                {/* Faculty Answer Box */}
                {isAnswered && doubt.answer ? (
                  <View style={styles.answerBox}>
                    <View style={styles.answerHeader}>
                      <View style={styles.facultyBadge}>
                        <Sparkles size={12} color="#2563eb" />
                        <Text style={styles.facultyTitle}>
                          Faculty Response {doubt.answered_by ? `(${doubt.answered_by})` : ""}
                        </Text>
                      </View>
                      {doubt.answered_at && (
                        <Text style={styles.answerDate}>
                          {new Date(doubt.answered_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.answerText}>{doubt.answer}</Text>
                  </View>
                ) : (
                  <View style={styles.pendingNotice}>
                    <Text style={styles.pendingNoticeText}>
                      Faculty is reviewing this question. Answers typically post within 4-12 hours.
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Ask Doubt Modal */}
      <Modal
        visible={showAskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ask a Doubt</Text>
                <Text style={styles.modalSub}>
                  Get comprehensive clarifications from expert faculty
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAskModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={BRAND_COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Subject Selector */}
            <Text style={styles.inputLabel}>Subject / Paper</Text>
            <View style={styles.subjectRow}>
              {["General Studies", "Odisha GK", "Reasoning", "Mathematics", "English"].map(
                (sub) => (
                  <TouchableOpacity
                    key={sub}
                    style={[
                      styles.subjectChip,
                      subject === sub && styles.subjectChipActive,
                    ]}
                    onPress={() => setSubject(sub)}
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        subject === sub && styles.subjectChipTextActive,
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Question Text */}
            <Text style={styles.inputLabel}>Your Doubt / Concept Description</Text>
            <TextInput
              style={styles.questionInput}
              multiline
              numberOfLines={4}
              placeholder="Explain the question, concept, or specific doubt you have in detail..."
              placeholderTextColor={BRAND_COLORS.textMuted}
              value={questionText}
              onChangeText={setQuestionText}
              textAlignVertical="top"
            />

            {/* Private Toggle */}
            <TouchableOpacity
              style={styles.privateToggleRow}
              onPress={() => setIsPrivate(!isPrivate)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, isPrivate && styles.checkboxActive]}>
                {isPrivate && <CheckCircle2 size={14} color="#ffffff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.privateLabel}>Keep doubt private</Text>
                <Text style={styles.privateSub}>
                  Only you and authorized faculty can see this question
                </Text>
              </View>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleAskSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Send size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Submit Doubt to Faculty</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: BRAND_COLORS.textSecondary,
  },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  askBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: BRAND_COLORS.textPrimary,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  tabActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
  },
  tabTextActive: {
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  doubtCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  privatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  privateText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  myPill: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  myPillText: {
    fontSize: 10,
    color: "#2563eb",
    fontWeight: "600",
  },
  statusAnswered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusAnsweredText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  statusPending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPendingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#d97706",
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
    lineHeight: 20,
  },
  metaRow: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
  },
  answerBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: BRAND_COLORS.primary,
  },
  answerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  facultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  facultyTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  answerDate: {
    fontSize: 10,
    color: BRAND_COLORS.textMuted,
  },
  answerText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 19,
  },
  pendingNotice: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  pendingNoticeText: {
    fontSize: 11,
    color: BRAND_COLORS.textSecondary,
    fontStyle: "italic",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 10,
  },
  subjectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  subjectChipActive: {
    backgroundColor: "#eff6ff",
    borderColor: BRAND_COLORS.primary,
  },
  subjectChipText: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    fontWeight: "500",
  },
  subjectChipTextActive: {
    color: BRAND_COLORS.primary,
    fontWeight: "700",
  },
  questionInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: BRAND_COLORS.textPrimary,
    minHeight: 100,
  },
  privateToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    marginBottom: 18,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  privateLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
  },
  privateSub: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
