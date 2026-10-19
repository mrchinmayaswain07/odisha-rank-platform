import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Target,
  X,
  BookOpen,
  Clock,
  Layers,
  Plus,
  Check,
  ChevronRight,
} from "lucide-react-native";
import { BRAND_COLORS, Subject, Chapter } from "@odisha-rank/shared";
import { getSubjects, getChapters } from "../lib/data-service";

export interface TodayGoalItem {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  durationMinutes: number;
  completed: boolean;
  topic_id?: string;
}

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  examId?: string;
  userId?: string;
  currentTargetHours: number;
  onSaveTargetHours: (hours: number) => void;
  onAddGoalItem: (item: TodayGoalItem) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  onClose,
  examId,
  userId,
  currentTargetHours,
  onSaveTargetHours,
  onAddGoalItem,
}) => {
  const [targetHours, setTargetHours] = useState(currentTargetHours || 3);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterTitle, setSelectedChapterTitle] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>();
  const [customTitle, setCustomTitle] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(45);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Sync target hours
  useEffect(() => {
    setTargetHours(currentTargetHours || 3);
  }, [currentTargetHours]);

  // Fetch subjects on open
  useEffect(() => {
    if (visible) {
      let isMounted = true;
      setLoadingSubjects(true);
      getSubjects(examId)
        .then((subs) => {
          if (!isMounted) return;
          setSubjects(subs);
          if (subs.length > 0) {
            setSelectedSubjectId(subs[0].id);
          }
        })
        .finally(() => {
          if (isMounted) setLoadingSubjects(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [visible, examId]);

  // Fetch chapters whenever selectedSubjectId changes
  useEffect(() => {
    if (selectedSubjectId) {
      let isMounted = true;
      setLoadingChapters(true);
      getChapters(selectedSubjectId, userId)
        .then((chaps) => {
          if (!isMounted) return;
          setChapters(chaps);
          if (chaps.length > 0) {
            setSelectedChapterTitle(chaps[0].title);
            setSelectedTopicId(chaps[0].topics?.[0]?.id);
          } else {
            setSelectedChapterTitle("");
            setSelectedTopicId(undefined);
          }
        })
        .finally(() => {
          if (isMounted) setLoadingChapters(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setChapters([]);
    }
  }, [selectedSubjectId, userId]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const handleAdd = () => {
    const finalTitle =
      customTitle.trim() ||
      (selectedChapterTitle
        ? `${selectedSubject?.name || "Subject"} – ${selectedChapterTitle}`
        : `${selectedSubject?.name || "General"} Preparation Topic`);

    const newItem: TodayGoalItem = {
      id: `goal-${Date.now()}`,
      title: finalTitle,
      subject: selectedSubject?.name || "General",
      chapter: selectedChapterTitle || undefined,
      durationMinutes: durationMinutes || 45,
      completed: false,
      topic_id: selectedTopicId,
    };

    onSaveTargetHours(targetHours);
    onAddGoalItem(newItem);
    setCustomTitle("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.iconBox}>
                <Target size={18} color={BRAND_COLORS.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Set Today&apos;s Goal</Text>
                <Text style={styles.headerSub}>Plan study hours & lookup topics</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* 1. Target Study Time Picker */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={15} color={BRAND_COLORS.primary} />
                <Text style={styles.sectionTitle}>Daily Study Time Target</Text>
              </View>
              <Text style={styles.sectionDesc}>How many hours do you plan to study today?</Text>

              <View style={styles.chipsRow}>
                {[1, 2, 3, 4, 5, 6].map((hrs) => (
                  <TouchableOpacity
                    key={hrs}
                    style={[
                      styles.targetChip,
                      targetHours === hrs && styles.targetChipActive,
                    ]}
                    onPress={() => setTargetHours(hrs)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.targetChipText,
                        targetHours === hrs && styles.targetChipTextActive,
                      ]}
                    >
                      {hrs} hr{hrs > 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Dynamic Subject Picker */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BookOpen size={15} color="#6366f1" />
                <Text style={styles.sectionTitle}>1. Select Subject</Text>
              </View>
              <Text style={styles.sectionDesc}>Choose subject from your official exam syllabus</Text>

              {loadingSubjects ? (
                <ActivityIndicator size="small" color={BRAND_COLORS.primary} style={{ marginVertical: 10 }} />
              ) : subjects.length === 0 ? (
                <Text style={styles.emptyText}>No subjects available for this exam.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                  {subjects.map((sub) => {
                    const isSelected = selectedSubjectId === sub.id;
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={[
                          styles.subjectPill,
                          isSelected && styles.subjectPillActive,
                        ]}
                        onPress={() => setSelectedSubjectId(sub.id)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.subjectPillText,
                            isSelected && styles.subjectPillTextActive,
                          ]}
                        >
                          {sub.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* 3. Dynamic Chapter / Topic Lookup */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Layers size={15} color="#059669" />
                <Text style={styles.sectionTitle}>2. Choose Chapter / Topic</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Filtered dynamically for {selectedSubject?.name || "selected subject"}
              </Text>

              {loadingChapters ? (
                <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 10 }} />
              ) : chapters.length === 0 ? (
                <View style={styles.noChaptersBox}>
                  <Text style={styles.emptyText}>No chapters loaded for this subject.</Text>
                </View>
              ) : (
                <View style={styles.chaptersList}>
                  {chapters.map((chap) => {
                    const isSelected = selectedChapterTitle === chap.title;
                    return (
                      <TouchableOpacity
                        key={chap.id}
                        style={[
                          styles.chapterItem,
                          isSelected && styles.chapterItemActive,
                        ]}
                        onPress={() => {
                          setSelectedChapterTitle(chap.title);
                          setSelectedTopicId(chap.topics?.[0]?.id);
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.chapterRadio}>
                          {isSelected ? (
                            <View style={styles.radioInner} />
                          ) : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.chapterTitle,
                              isSelected && styles.chapterTitleActive,
                            ]}
                          >
                            {chap.title}
                          </Text>
                          {chap.topics && chap.topics.length > 0 && (
                            <Text style={styles.chapterSub}>
                              {chap.topics.length} topic{chap.topics.length > 1 ? "s" : ""} included
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Optional Custom Topic Title Override */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>Custom Topic Title (Optional)</Text>
              <TextInput
                value={customTitle}
                onChangeText={setCustomTitle}
                placeholder={selectedChapterTitle ? `e.g. Practice 25 MCQs on ${selectedChapterTitle}` : "Enter custom topic or revision task"}
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
              />
            </View>

            {/* 4. Planned Duration */}
            <View style={styles.section}>
              <Text style={styles.inputLabel}>Planned Duration</Text>
              <View style={styles.chipsRow}>
                {[15, 30, 45, 60, 90].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durationChip,
                      durationMinutes === mins && styles.durationChipActive,
                    ]}
                    onPress={() => setDurationMinutes(mins)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        durationMinutes === mins && styles.durationChipTextActive,
                      ]}
                    >
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Add Goal Button */}
          <TouchableOpacity
            style={styles.addGoalBtn}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#ffffff" />
            <Text style={styles.addGoalBtnText}>
              Add Topic to Today&apos;s Goal
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 11,
    color: "#64748b",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  scroll: {
    maxHeight: 460,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionDesc: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  targetChip: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  targetChipActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  targetChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  targetChipTextActive: {
    color: "#ffffff",
  },
  pillsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  subjectPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  subjectPillActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  subjectPillTextActive: {
    color: "#ffffff",
  },
  chaptersList: {
    gap: 6,
  },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chapterItemActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  chapterRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#10b981",
  },
  chapterTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
  },
  chapterTitleActive: {
    color: "#065f46",
    fontWeight: "800",
  },
  chapterSub: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 1,
  },
  noChaptersBox: {
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12,
    color: "#0f172a",
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  durationChipActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  durationChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  durationChipTextActive: {
    color: "#ffffff",
  },
  addGoalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRAND_COLORS.primary,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addGoalBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
