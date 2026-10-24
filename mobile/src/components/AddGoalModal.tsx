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
  Calendar,
  Zap,
  RotateCcw,
  Pause,
  Play,
  AlertCircle,
  ShieldCheck,
} from "lucide-react-native";
import {
  BRAND_COLORS,
  Subject,
  Chapter,
  StudentStudyGoal,
  calculateStudyPace,
  getIndianDateStr,
  addDaysToIndianDate,
  getDaysDifference,
} from "@odisha-rank/shared";
import { getSubjects, getChapters } from "../lib/data-service";

export interface TodayGoalItem {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  durationMinutes: number;
  completed: boolean;
  topic_id?: string;
  category?: "study" | "practice" | "braingym" | "mock" | "revision" | "custom";
  priority?: "high" | "medium" | "low";
  rescheduled_from?: string;
}

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  examId?: string;
  userId?: string;
  currentTargetHours: number;
  onSaveTargetHours: (hours: number) => void;
  onAddGoalItem: (item: TodayGoalItem) => void;
  studyGoal?: StudentStudyGoal;
  onSaveStudyGoal?: (goal: StudentStudyGoal) => void;
  totalCompletedHours?: number;
  plannedHours?: number;
  initialTab?: "daily" | "overall";
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  onClose,
  examId,
  userId,
  currentTargetHours,
  onSaveTargetHours,
  onAddGoalItem,
  studyGoal,
  onSaveStudyGoal,
  totalCompletedHours = 0,
  plannedHours = 0,
  initialTab = "daily",
}) => {
  const [activeTab, setActiveTab] = useState<"daily" | "overall">(initialTab || "daily");
  const [targetHours, setTargetHours] = useState(currentTargetHours || 3);
  const [customTotalHoursInput, setCustomTotalHoursInput] = useState<string>(
    String(studyGoal?.target_total_hours || 300)
  );
  const [customWeeklyHoursInput, setCustomWeeklyHoursInput] = useState<string>(
    String(studyGoal?.weekly_target_hours || 20)
  );
  const [examDateInput, setExamDateInput] = useState<string>(studyGoal?.exam_date || "");

  const [taskCategory, setTaskCategory] = useState<
    "study" | "practice" | "braingym" | "mock" | "revision" | "custom"
  >("study");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("high");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterTitle, setSelectedChapterTitle] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>();
  const [customTitle, setCustomTitle] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(45);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const prevVisibleRef = React.useRef(false);

  // Sync state when opened
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setTargetHours(currentTargetHours || 3);
      if (initialTab) setActiveTab(initialTab);
      setCustomTotalHoursInput(String(studyGoal?.target_total_hours || 300));
      setCustomWeeklyHoursInput(String(studyGoal?.weekly_target_hours || 20));
      setExamDateInput(studyGoal?.exam_date || "");
    }
    prevVisibleRef.current = visible;
  }, [visible, currentTargetHours, initialTab, studyGoal]);

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

  // Overall Goal Save Handler
  const handleSaveOverall = (updates: Partial<StudentStudyGoal>) => {
    if (!onSaveStudyGoal) return;
    const baseGoal: StudentStudyGoal = studyGoal || {
      id: `goal-${userId || "student"}`,
      user_id: userId || "student_user",
      target_total_hours: 300,
      daily_target_hours: currentTargetHours || 3,
      daily_topics_target: 3,
      weekly_target_hours: 20,
      exam_date: null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated: StudentStudyGoal = {
      ...baseGoal,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    onSaveStudyGoal(updated);
  };

  const handleApplyCustomTotalHours = (valStr: string) => {
    setCustomTotalHoursInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      const valid = Math.round(parsed);
      handleSaveOverall({ target_total_hours: valid });
    }
  };

  const handleSelectTotalPreset = (preset: number) => {
    setCustomTotalHoursInput(String(preset));
    handleSaveOverall({ target_total_hours: preset });
  };

  const handleApplyCustomWeeklyHours = (valStr: string) => {
    setCustomWeeklyHoursInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      const valid = Math.round(parsed);
      handleSaveOverall({ weekly_target_hours: valid });
    }
  };

  const handleSelectWeeklyPreset = (preset: number) => {
    setCustomWeeklyHoursInput(String(preset));
    handleSaveOverall({ weekly_target_hours: preset });
  };

  // Exam Date validation and save handler
  const handleApplyExamDate = (val?: string) => {
    const rawVal = val !== undefined ? val : examDateInput;
    const dateStr = rawVal ? rawVal.trim() : "";
    if (!dateStr) {
      setExamDateInput("");
      handleSaveOverall({ exam_date: null });
      Alert.alert("Date Cleared", "Target examination date has been removed.");
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      Alert.alert(
        "Invalid Date Format",
        "Please enter date in YYYY-MM-DD format (for example: 2026-12-31)."
      );
      return;
    }

    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime()) || dateObj.getMonth() !== m - 1) {
      Alert.alert("Invalid Calendar Date", "Please check the month and day entered.");
      return;
    }

    setExamDateInput(dateStr);
    handleSaveOverall({ exam_date: dateStr });
    Alert.alert("Exam Date Saved!", `Target examination date set to ${dateStr}.`);
  };

  const handleSelectExamDatePreset = (daysFromNow: number) => {
    const dateStr = addDaysToIndianDate(getIndianDateStr(), daysFromNow);
    handleApplyExamDate(dateStr);
  };

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
      category: taskCategory,
      priority: taskPriority,
    };

    onSaveTargetHours(targetHours);
    onAddGoalItem(newItem);
    setCustomTitle("");
    onClose();
  };

  // Metrics Calculations: Total Target minus (Completed Study Hours + Today's Planned study tasks)
  const totalTargetHours = Math.max(1, studyGoal?.target_total_hours || 300);
  const actualCompleted = totalCompletedHours || 0;
  const todayPlanned = plannedHours || 0;
  const effectiveAllocated = Math.round((actualCompleted + todayPlanned) * 10) / 10;
  const remainingHours = Math.max(0, Math.round((totalTargetHours - effectiveAllocated) * 10) / 10);
  const totalProgressPct = Math.min(100, Math.round((effectiveAllocated / totalTargetHours) * 100));

  const isPlannedExceedingTarget = plannedHours > targetHours;

  const paceEstimate = studyGoal
    ? calculateStudyPace({
        goal: studyGoal,
        completedHours: effectiveAllocated,
        sessionDaysCount: effectiveAllocated > 0 ? Math.max(3, Math.ceil(effectiveAllocated / Math.max(1, studyGoal.daily_target_hours || 3))) : 0,
        recentDailyHours: [studyGoal.daily_target_hours || 3, studyGoal.daily_target_hours || 3, 2.5],
      })
    : null;

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
                <Text style={styles.headerTitle}>Study Goal & Planner</Text>
                <Text style={styles.headerSub}>Custom preparation targets & daily tasks</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "daily" && styles.tabBtnActive]}
              onPress={() => setActiveTab("daily")}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === "daily" && styles.tabBtnTextActive]}>
                Today&apos;s Tasks & Goal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "overall" && styles.tabBtnActive]}
              onPress={() => setActiveTab("overall")}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === "overall" && styles.tabBtnTextActive]}>
                Total Goal & Deadline
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {activeTab === "daily" ? (
              <>
                {/* Planned vs Target Status Banner */}
                <View style={styles.plannedSummaryCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.plannedSummaryLabel}>
                      Today&apos;s Planned: <Text style={styles.plannedSummaryVal}>{plannedHours} hrs</Text>
                    </Text>
                    <Text style={styles.plannedSummaryLabel}>
                      Daily Target: <Text style={styles.plannedSummaryTarget}>{targetHours} hrs</Text>
                    </Text>
                  </View>

                  {isPlannedExceedingTarget && (
                    <View style={styles.exceedBanner}>
                      <AlertCircle size={14} color="#b45309" style={{ marginTop: 1 }} />
                      <Text style={styles.exceedText}>
                        Planned tasks ({plannedHours}h) exceed daily target ({targetHours}h). You can still proceed or adjust task durations.
                      </Text>
                    </View>
                  )}
                </View>

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

                {/* Task Category Selection */}
                <View style={styles.section}>
                  <Text style={styles.inputLabel}>Task Category</Text>
                  <View style={styles.chipsRow}>
                    {[
                      { id: "study", label: "Study" },
                      { id: "practice", label: "Practice" },
                      { id: "braingym", label: "Brain Gym" },
                      { id: "mock", label: "Mock" },
                      { id: "revision", label: "Revision" },
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.durationChip,
                          taskCategory === cat.id && styles.durationChipActive,
                        ]}
                        onPress={() => setTaskCategory(cat.id as any)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.durationChipText,
                            taskCategory === cat.id && styles.durationChipTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Task Priority Selection */}
                <View style={styles.section}>
                  <Text style={styles.inputLabel}>Priority Level</Text>
                  <View style={styles.chipsRow}>
                    {[
                      { id: "high", label: "🔴 High" },
                      { id: "medium", label: "🟡 Medium" },
                      { id: "low", label: "🔵 Low" },
                    ].map((pri) => (
                      <TouchableOpacity
                        key={pri.id}
                        style={[
                          styles.durationChip,
                          taskPriority === pri.id && styles.durationChipActive,
                        ]}
                        onPress={() => setTaskPriority(pri.id as any)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.durationChipText,
                            taskPriority === pri.id && styles.durationChipTextActive,
                          ]}
                        >
                          {pri.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
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
              </>
            ) : (
              /* TAB 2: TOTAL GOAL & EXAM DEADLINE */
              <View style={{ gap: 14 }}>
                {/* Total Target Hours Card */}
                <View style={styles.overallCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Target size={16} color={BRAND_COLORS.primary} />
                      <Text style={styles.overallTitle}>Total Preparation Target</Text>
                    </View>
                    <Text style={styles.overallHighlight}>{totalTargetHours} hrs total</Text>
                  </View>

                  {/* Presets */}
                  <View style={styles.chipsRow}>
                    {[150, 300, 500, 750, 1000].map((tot) => (
                      <TouchableOpacity
                        key={tot}
                        style={[
                          styles.targetChip,
                          studyGoal?.target_total_hours === tot && styles.targetChipActive,
                        ]}
                        onPress={() => handleSelectTotalPreset(tot)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.targetChipText,
                            studyGoal?.target_total_hours === tot && styles.targetChipTextActive,
                          ]}
                        >
                          {tot}h
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Custom Input */}
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.inputLabel}>Custom Total Hours (Any positive number)</Text>
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <TextInput
                        value={customTotalHoursInput}
                        onChangeText={handleApplyCustomTotalHours}
                        placeholder="e.g. 450, 800, 1200, 1500"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        style={[styles.textInput, { flex: 1 }]}
                      />
                      <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => handleApplyCustomTotalHours(customTotalHoursInput)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.applyBtnText}>Set Goal</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 3 Metrics Box */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricBoxLabel}>TARGET</Text>
                      <Text style={styles.metricBoxVal}>{totalTargetHours}h</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricBoxLabel}>COMPLETED</Text>
                      <Text style={[styles.metricBoxVal, { color: "#059669" }]}>{actualCompleted}h</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricBoxLabel}>REMAINING</Text>
                      <Text style={[styles.metricBoxVal, { color: "#d97706" }]}>{remainingHours}h</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={{ marginTop: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                      <Text style={{ fontSize: 10, color: "#64748b", fontWeight: "600" }}>Total Progress</Text>
                      <Text style={{ fontSize: 10, color: BRAND_COLORS.primary, fontWeight: "700" }}>{totalProgressPct}%</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${totalProgressPct}%`, backgroundColor: BRAND_COLORS.primary, borderRadius: 3 }} />
                    </View>
                  </View>
                </View>

                {/* Weekly Target Hours */}
                <View style={styles.overallCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Clock size={16} color="#6366f1" />
                      <Text style={styles.overallTitle}>Weekly Study Target</Text>
                    </View>
                    <Text style={[styles.overallHighlight, { color: "#6366f1" }]}>
                      {studyGoal?.weekly_target_hours || 20} hrs/week
                    </Text>
                  </View>

                  <View style={styles.chipsRow}>
                    {[15, 20, 25, 30, 40].map((wk) => (
                      <TouchableOpacity
                        key={wk}
                        style={[
                          styles.targetChip,
                          (studyGoal?.weekly_target_hours || 20) === wk && { backgroundColor: "#6366f1", borderColor: "#6366f1" },
                        ]}
                        onPress={() => handleSelectWeeklyPreset(wk)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.targetChipText,
                            (studyGoal?.weekly_target_hours || 20) === wk && { color: "#ffffff" },
                          ]}
                        >
                          {wk}h
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ marginTop: 6, flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TextInput
                      value={customWeeklyHoursInput}
                      onChangeText={handleApplyCustomWeeklyHours}
                      placeholder="Custom weekly hours"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={[styles.textInput, { flex: 1 }]}
                    />
                    <TouchableOpacity
                      style={[styles.applyBtn, { backgroundColor: "#6366f1" }]}
                      onPress={() => handleApplyCustomWeeklyHours(customWeeklyHoursInput)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.applyBtnText}>Set Weekly</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Target Exam Date */}
                <View style={styles.overallCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Calendar size={16} color="#9333ea" />
                      <Text style={styles.overallTitle}>Target Exam Date</Text>
                    </View>
                    {paceEstimate?.days_to_exam !== null && paceEstimate?.days_to_exam !== undefined && (
                      <View style={styles.daysBadge}>
                        <Text style={styles.daysBadgeText}>{paceEstimate.days_to_exam} Days Left</Text>
                      </View>
                    )}
                  </View>

                  {/* Date Quick Presets */}
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[styles.targetChip, { flex: 1, paddingVertical: 6, paddingHorizontal: 4 }]}
                      onPress={() => handleSelectExamDatePreset(30)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.targetChipText, { fontSize: 11 }]}>+30d</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.targetChip, { flex: 1, paddingVertical: 6, paddingHorizontal: 4 }]}
                      onPress={() => handleSelectExamDatePreset(90)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.targetChipText, { fontSize: 11 }]}>+90d (3M)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.targetChip, { flex: 1, paddingVertical: 6, paddingHorizontal: 4 }]}
                      onPress={() => handleSelectExamDatePreset(180)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.targetChipText, { fontSize: 11 }]}>+180d (6M)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.targetChip, { flex: 1, paddingVertical: 6, paddingHorizontal: 4 }]}
                      onPress={() => handleApplyExamDate("2026-12-31")}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.targetChipText, { fontSize: 11 }]}>Dec 2026</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ marginTop: 6, flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TextInput
                      value={examDateInput}
                      onChangeText={setExamDateInput}
                      placeholder="YYYY-MM-DD (e.g. 2026-12-31)"
                      placeholderTextColor="#94a3b8"
                      style={[styles.textInput, { flex: 1 }]}
                      keyboardType="numbers-and-punctuation"
                      returnKeyType="done"
                      onSubmitEditing={() => handleApplyExamDate()}
                    />
                    <TouchableOpacity
                      style={[styles.applyBtn, { backgroundColor: "#9333ea" }]}
                      onPress={() => handleApplyExamDate()}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.applyBtnText}>Set Date</Text>
                    </TouchableOpacity>
                  </View>

                  {studyGoal?.exam_date ? (
                    <TouchableOpacity
                      onPress={() => handleApplyExamDate("")}
                      style={{ alignSelf: "flex-start", marginTop: 4 }}
                    >
                      <Text style={{ fontSize: 11, color: "#9333ea", fontWeight: "600" }}>
                        ✕ Clear Exam Date ({studyGoal.exam_date})
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Completion Projection Card */}
                {paceEstimate && (
                  <View style={styles.overallCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Zap size={16} color="#d97706" />
                        <Text style={styles.overallTitle}>Completion Projection</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          paceEstimate.pace_status === "on_track"
                            ? { backgroundColor: "#ecfdf5" }
                            : paceEstimate.pace_status === "ahead"
                            ? { backgroundColor: "#f0fdf4" }
                            : { backgroundColor: "#fffbeb" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            paceEstimate.pace_status === "on_track" || paceEstimate.pace_status === "ahead"
                              ? { color: "#059669" }
                              : { color: "#b45309" },
                          ]}
                        >
                          {paceEstimate.pace_status.replace("_", " ").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: "#475569", lineHeight: 16 }}>
                      {paceEstimate.message}
                    </Text>
                    {paceEstimate.required_daily_hours !== null && (
                      <Text style={{ fontSize: 11, color: "#1e293b", fontWeight: "700", marginTop: 4 }}>
                        Required Pace: {paceEstimate.required_daily_hours} hrs/day
                      </Text>
                    )}
                  </View>
                )}

                {/* Pause & Reset Controls */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 12 }}>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => {
                      const next = studyGoal?.status === "paused" ? "active" : "paused";
                      handleSaveOverall({ status: next });
                    }}
                    activeOpacity={0.7}
                  >
                    {studyGoal?.status === "paused" ? (
                      <>
                        <Play size={15} color="#059669" />
                        <Text style={[styles.controlBtnText, { color: "#059669" }]}>Resume Goal</Text>
                      </>
                    ) : (
                      <>
                        <Pause size={15} color="#d97706" />
                        <Text style={[styles.controlBtnText, { color: "#d97706" }]}>Pause Goal</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.controlBtn, { borderColor: "#fecdd3", backgroundColor: "#fff1f2" }]}
                    onPress={() => {
                      Alert.alert(
                        "Reset Goal?",
                        "Reset target total hours to 300h and daily target to 3h? Your recorded study sessions will not be deleted.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Reset",
                            style: "destructive",
                            onPress: () => {
                              handleSaveOverall({
                                target_total_hours: 300,
                                daily_target_hours: 3,
                                weekly_target_hours: 20,
                                status: "reset",
                              });
                              setCustomTotalHoursInput("300");
                              setCustomWeeklyHoursInput("20");
                            },
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={15} color="#e11d48" />
                    <Text style={[styles.controlBtnText, { color: "#e11d48" }]}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
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
    maxHeight: "90%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
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
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingHorizontal: 20,
    gap: 12,
  },
  tabBtn: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: BRAND_COLORS.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  tabBtnTextActive: {
    color: BRAND_COLORS.primary,
  },
  plannedSummaryCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 10,
    marginBottom: 4,
  },
  plannedSummaryLabel: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  plannedSummaryVal: {
    color: "#0f172a",
    fontWeight: "800",
  },
  plannedSummaryTarget: {
    color: BRAND_COLORS.primary,
    fontWeight: "800",
  },
  exceedBanner: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  exceedText: {
    fontSize: 10.5,
    color: "#92400e",
    flex: 1,
    lineHeight: 14,
    fontWeight: "600",
  },
  scroll: {
    maxHeight: 480,
    paddingHorizontal: 20,
    paddingTop: 10,
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
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    color: "#0f172a",
  },
  applyBtn: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
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
    marginTop: 14,
    marginBottom: 8,
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
  overallCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  overallTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  overallHighlight: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  metricBoxLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94a3b8",
  },
  metricBoxVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2,
  },
  daysBadge: {
    backgroundColor: "#faf5ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  daysBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9333ea",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  controlBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
