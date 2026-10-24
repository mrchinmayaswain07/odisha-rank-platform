import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileText,
  Plus,
  Filter,
} from "lucide-react-native";
import { BRAND_COLORS, Subject, Chapter, Topic, getIndianDateStr } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { getSubjects, getChapters } from "../../src/lib/data-service";
import { Header } from "../../src/components/Header";
import { Badge } from "../../src/components/Badge";
import { EmptyState } from "../../src/components/EmptyState";

export default function SyllabusScreen() {
  const { user, activeExam } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(new Set());
  const [stageFilter, setStageFilter] = useState<"all" | "prelims" | "mains">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const loadSubjects = async () => {
      setIsLoading(true);
      try {
        const subs = await getSubjects(activeExam?.id);
        if (!isCurrent) return;
        setSubjects(subs);
        if (subs.length > 0) {
          setActiveSubject(subs[0]);
          const chaps = await getChapters(subs[0].id, user?.id);
          if (!isCurrent) return;
          setChapters(chaps);
          if (chaps.length > 0) {
            setExpandedChapterIds(new Set([chaps[0].id]));
          }
        } else {
          setActiveSubject(null);
          setChapters([]);
        }
      } catch (err) {
        console.warn("Failed to load syllabus subjects:", err);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadSubjects();
    return () => {
      isCurrent = false;
    };
  }, [activeExam?.id, user?.id]);

  const handleSelectSubject = async (sub: Subject) => {
    if (activeSubject?.id === sub.id) return;
    setActiveSubject(sub);
    setIsLoadingChapters(true);
    try {
      const chaps = await getChapters(sub.id, user?.id);
      setChapters(chaps);
      if (chaps.length > 0) {
        setExpandedChapterIds(new Set([chaps[0].id]));
      }
    } catch (err) {
      console.warn("Failed to load chapters for subject:", err);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const toggleChapter = (id: string) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Official Syllabus"
        subtitle={activeExam?.title || "Exam Hierarchy"}
        showCoursePill={true}
      />

      {/* Horizontal Subject Tabs */}
      {subjects.length > 0 ? (
        <View style={styles.subjectTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectTabsList}
          >
            {subjects.map((sub) => {
              const isActive = activeSubject?.id === sub.id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => handleSelectSubject(sub)}
                  style={[styles.subjectTab, isActive && styles.subjectTabActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.subjectTabText, isActive && styles.subjectTabTextActive]}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Stage Filter Chips */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 8, backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
        <Filter size={12} color="#64748b" />
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b" }}>Stage:</Text>
        {(["all", "prelims", "mains"] as const).map((stage) => {
          const isActive = stageFilter === stage;
          return (
            <TouchableOpacity
              key={stage}
              onPress={() => setStageFilter(stage)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 12,
                backgroundColor: isActive ? BRAND_COLORS.primary : "#ffffff",
                borderWidth: 1,
                borderColor: isActive ? BRAND_COLORS.primary : "#cbd5e1",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isActive ? "#ffffff" : "#475569",
                  textTransform: "capitalize",
                }}
              >
                {stage === "all" ? "All" : stage}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loaderText}>Loading exam syllabus...</Text>
          </View>
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No Subjects Found"
            description="No subjects registered for this examination yet. You can switch courses to explore other syllabuses."
            actionTitle="Choose Another Exam"
            onAction={() => router.push("/course-select")}
          />
        ) : isLoadingChapters ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
            <Text style={styles.loaderText}>Loading chapters and topics...</Text>
          </View>
        ) : chapters.length === 0 ? (
          <EmptyState
            title="Chapters Coming Soon"
            description="The syllabus for this subject is currently being structured."
          />
        ) : (
          <View style={styles.chaptersList}>
            {chapters.map((chap, idx) => {
              const isExpanded = expandedChapterIds.has(chap.id);
              const topics = chap.topics || [];

              return (
                <View key={chap.id} style={styles.chapterCard}>
                  {/* Chapter Header */}
                  <TouchableOpacity
                    onPress={() => toggleChapter(chap.id)}
                    style={styles.chapterHeader}
                    activeOpacity={0.7}
                  >
                    <View style={styles.chapterHeaderLeft}>
                      <View style={styles.chapterNumberBadge}>
                        <Text style={styles.chapterNumber}>{idx + 1}</Text>
                      </View>
                      <View style={styles.chapterTitleCol}>
                        <Text style={styles.chapterTitle}>{chap.title}</Text>
                        <Text style={styles.topicCountText}>
                          {topics.length} {topics.length === 1 ? "topic" : "topics"}
                          {!chap.is_official ? " • Personal" : ""}
                        </Text>
                      </View>
                    </View>

                    {isExpanded ? (
                      <ChevronDown size={20} color={BRAND_COLORS.textMuted} />
                    ) : (
                      <ChevronRight size={20} color={BRAND_COLORS.textMuted} />
                    )}
                  </TouchableOpacity>

                  {/* Expandable Topic Items */}
                  {isExpanded && (
                    <View style={styles.topicsContainer}>
                      {topics.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={styles.topicItem}
                          activeOpacity={0.7}
                          onPress={() => router.push(`/topic/${t.id}`)}
                        >
                          <Circle size={16} color={BRAND_COLORS.primary} style={styles.circleIcon} />
                          <View style={styles.topicInfo}>
                            <Text style={styles.topicTitle} numberOfLines={2}>
                              {t.title}
                            </Text>
                            <Text style={styles.topicMeta}>
                              {t.estimated_minutes || 45} mins • Tap to study
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 8,
                              backgroundColor: "rgba(37, 99, 235, 0.08)",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 3,
                              marginRight: 6,
                            }}
                            onPress={async (e) => {
                              e.stopPropagation();
                              try {
                                const uid = user?.id || "student_user";
                                const today = getIndianDateStr();
                                const storageKey = `odisharank_today_goals_${uid}_${today}`;
                                const raw = await AsyncStorage.getItem(storageKey);
                                const list = raw ? JSON.parse(raw) : [];
                                if (list.some((item: any) => item.topic_id === t.id)) {
                                  Alert.alert("Already in Goal", `"${t.title}" is already in today's study plan.`);
                                  return;
                                }
                                const newItem = {
                                  id: `tg-${t.id}-${Date.now()}`,
                                  title: `${activeSubject?.name || "Subject"}: ${t.title}`,
                                  subject: activeSubject?.name || "General",
                                  durationMinutes: t.estimated_minutes || 45,
                                  completed: false,
                                  topic_id: t.id,
                                  category: "study",
                                  priority: "high",
                                };
                                await AsyncStorage.setItem(storageKey, JSON.stringify([newItem, ...list]));
                                Alert.alert("Goal Added!", `Added "${t.title}" to today's study targets.`);
                              } catch {
                                Alert.alert("Goal Added", `Added to today's study plan.`);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Plus size={11} color={BRAND_COLORS.primary} />
                            <Text style={{ fontSize: 10, fontWeight: "700", color: BRAND_COLORS.primary }}>Goal</Text>
                          </TouchableOpacity>
                          <ChevronRight size={16} color={BRAND_COLORS.textMuted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
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
  subjectTabsContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  subjectTabsList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  subjectTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.background,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  subjectTabActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  subjectTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
  },
  subjectTabTextActive: {
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
  chaptersList: {
    gap: 12,
  },
  chapterCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    overflow: "hidden",
  },
  chapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  chapterHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  chapterNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: BRAND_COLORS.primary,
  },
  chapterTitleCol: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  topicCountText: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
  },
  topicsContainer: {
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border,
    backgroundColor: "#fafafa",
  },
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  circleIcon: {
    marginRight: 10,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.textPrimary,
  },
  topicMeta: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
  },
});
