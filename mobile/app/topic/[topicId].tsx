import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react-native";
import { BRAND_COLORS, StudyMaterial, Topic } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";
import { supabase } from "../../src/lib/supabase";
import { getStudyMaterials } from "../../src/lib/data-service";
import { Header } from "../../src/components/Header";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";

export default function TopicDetailScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    if (!topicId) return;

    const loadTopic = async () => {
      setIsLoading(true);
      try {
        const { data: topicData } = await supabase
          .from("topics")
          .select("*")
          .eq("id", topicId)
          .single();

        setTopic(topicData as Topic);

        const mats = await getStudyMaterials({ topicId });
        setMaterials(mats);

        if (user) {
          const { data: prog } = await supabase
            .from("student_topic_progress")
            .select("status")
            .eq("user_id", user.id)
            .eq("topic_id", topicId)
            .maybeSingle();

          setIsCompleted(prog?.status === "completed");
        }
      } catch (err) {
        console.warn("Failed to load topic details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTopic();
  }, [topicId, user]);

  const toggleCompletion = async () => {
    if (!user || !topicId) return;
    setIsUpdatingProgress(true);

    const newStatus = isCompleted ? "not_started" : "completed";
    try {
      await supabase.from("student_topic_progress").upsert(
        {
          user_id: user.id,
          topic_id: topicId,
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
          last_studied_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic_id" }
      );

      if (newStatus === "completed") {
        await supabase.from("student_activity").insert({
          user_id: user.id,
          activity_type: "topic_completed",
          title: `Completed ${topic?.title || "Topic"}`,
          description: "Marked topic complete in official syllabus.",
          metadata: { topic_id: topicId },
        });
      }

      setIsCompleted(!isCompleted);
    } catch (err) {
      console.warn("Failed to update topic status:", err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Topic Study" showBack={true} showCoursePill={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loaderText}>Loading topic notes...</Text>
          </View>
        ) : topic ? (
          <>
            {/* Header Card */}
            <View style={styles.topicCard}>
              <View style={styles.badgeRow}>
                <Badge
                  label={topic.is_official ? "Official Syllabus" : "Personal Topic"}
                  variant={topic.is_official ? "blue" : "emerald"}
                  size="sm"
                />
                <View style={styles.timeTag}>
                  <Clock size={12} color={BRAND_COLORS.textMuted} />
                  <Text style={styles.timeText}>{topic.estimated_minutes || 45} mins</Text>
                </View>
              </View>

              <Text style={styles.title}>{topic.title}</Text>
              {topic.description ? (
                <Text style={styles.desc}>{topic.description}</Text>
              ) : null}

              <Button
                title={isCompleted ? "Completed ✓" : "Mark as Completed"}
                onPress={toggleCompletion}
                loading={isUpdatingProgress}
                variant={isCompleted ? "outline" : "primary"}
                size="sm"
                icon={<CheckCircle2 size={16} color={isCompleted ? BRAND_COLORS.success : "#ffffff"} />}
                style={isCompleted ? styles.completedBtn : undefined}
                textStyle={isCompleted ? { color: BRAND_COLORS.success } : undefined}
              />
            </View>

            {/* Study Materials & Notes Section */}
            <Text style={styles.sectionTitle}>Study Materials & Summary Notes</Text>
            {materials.length === 0 ? (
              <EmptyState
                title="Notes in Preparation"
                description="Summary sheets for this topic are being curated by our editorial team."
              />
            ) : (
              <View style={styles.materialList}>
                {materials.map((mat) => (
                  <TouchableOpacity
                    key={mat.id}
                    style={styles.materialCard}
                    onPress={() => router.push(`/material/${mat.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.matIcon}>
                      <FileText size={20} color={BRAND_COLORS.primary} />
                    </View>
                    <View style={styles.matInfo}>
                      <Text style={styles.matTitle}>{mat.title}</Text>
                      <Text style={styles.matType}>
                        {mat.material_type.toUpperCase()} • Read Summary
                      </Text>
                    </View>
                    <ChevronRight size={18} color={BRAND_COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState title="Topic Not Found" description="The requested topic could not be loaded." />
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
  topicCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: BRAND_COLORS.textMuted,
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  completedBtn: {
    borderColor: BRAND_COLORS.success,
    backgroundColor: "#ecfdf5",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 12,
  },
  materialList: {
    gap: 10,
  },
  materialCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    gap: 12,
  },
  matIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BRAND_COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  matInfo: {
    flex: 1,
  },
  matTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
  },
  matType: {
    fontSize: 11,
    color: BRAND_COLORS.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
});
