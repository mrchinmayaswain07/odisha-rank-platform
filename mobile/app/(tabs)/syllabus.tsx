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
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileText,
} from "lucide-react-native";
import { BRAND_COLORS, Subject, Chapter, Topic } from "@odisha-rank/shared";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      setIsLoading(true);
      const subs = await getSubjects(activeExam?.id);
      setSubjects(subs);
      if (subs.length > 0) {
        setActiveSubject(subs[0]);
      } else {
        setActiveSubject(null);
        setChapters([]);
      }
      setIsLoading(false);
    };

    loadSubjects();
  }, [activeExam]);

  useEffect(() => {
    if (!activeSubject) return;

    const loadChapters = async () => {
      setIsLoadingChapters(true);
      const chaps = await getChapters(activeSubject.id, user?.id);
      setChapters(chaps);
      if (chaps.length > 0) {
        setExpandedChapterIds(new Set([chaps[0].id]));
      }
      setIsLoadingChapters(false);
    };

    loadChapters();
  }, [activeSubject, user]);

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
                  onPress={() => setActiveSubject(sub)}
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
                            <Text style={styles.topicTitle}>{t.title}</Text>
                            <Text style={styles.topicMeta}>
                              {t.estimated_minutes || 45} mins • Tap to study
                            </Text>
                          </View>
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
