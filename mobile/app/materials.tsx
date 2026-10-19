import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Search,
  X,
  ExternalLink,
  Download,
  Filter,
  Sparkles,
  Layers,
  GraduationCap,
  RefreshCw,
  FolderOpen,
} from "lucide-react-native";
import { BRAND_COLORS, StudyMaterial } from "@odisha-rank/shared";
import { useAuth } from "../src/lib/auth-context";
import { getStudyMaterials, getExams } from "../src/lib/data-service";
import { Badge } from "../src/components/Badge";

type MaterialCategory = "all" | "note" | "pdf" | "pyq" | "formula" | "drive";

export default function MaterialsScreen() {
  const { user, activeExam } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>("all");
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [allExams, setAllExams] = useState<any[]>([]);

  // Load registered exams for course filter
  useEffect(() => {
    getExams().then((exams) => {
      if (exams && exams.length > 0) {
        setAllExams(exams);
      }
    });
  }, []);

  // Fetch published materials
  const fetchMaterials = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const data = await getStudyMaterials(
        {
          examId: selectedExamId !== "all" ? selectedExamId : undefined,
        },
        isRefresh
      );
      setMaterials(data);
    } catch (err) {
      console.warn("Failed to fetch study materials:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaterials(true);
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      // 1. Category Filter
      if (selectedCategory === "drive") {
        const url = m.file_url || m.url || "";
        const isDrive = url.includes("drive.google.com") || url.includes("docs.google.com");
        if (!isDrive) return false;
      } else if (selectedCategory === "pdf") {
        const isPdf =
          m.material_type === "pdf" ||
          m.category === "pdf" ||
          (m.file_url || m.url || "").endsWith(".pdf");
        if (!isPdf) return false;
      } else if (selectedCategory === "pyq") {
        const isPyq =
          m.category === "pyq" ||
          m.title.toLowerCase().includes("pyq") ||
          m.title.toLowerCase().includes("previous year");
        if (!isPyq) return false;
      } else if (selectedCategory === "formula") {
        const isFormula =
          m.category === "formula" ||
          m.title.toLowerCase().includes("formula") ||
          m.title.toLowerCase().includes("quick revision");
        if (!isFormula) return false;
      } else if (selectedCategory === "note") {
        const isNote = m.material_type === "note" || m.category === "note" || m.category === "notes";
        if (!isNote) return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = m.title?.toLowerCase().includes(q);
        const matchesContent = m.content?.toLowerCase().includes(q);
        const matchesCategory = m.category?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesCategory) return false;
      }

      return true;
    });
  }, [materials, selectedCategory, searchQuery]);

  const handleOpenUrl = async (url?: string | null) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.warn("Could not open external link:", e);
    }
  };

  const categories: { key: MaterialCategory; label: string }[] = [
    { key: "all", label: "All Materials" },
    { key: "note", label: "Concept Notes" },
    { key: "pdf", label: "PDF Documents" },
    { key: "drive", label: "Google Drive" },
    { key: "pyq", label: "PYQ Papers" },
    { key: "formula", label: "Formula Sheets" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={BRAND_COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Study Materials & Notes</Text>
          <Text style={styles.headerSubtitle}>
            Verified Handbooks, PDFs & Official Notes
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            color={refreshing ? BRAND_COLORS.textMuted : BRAND_COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={BRAND_COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, topics, PDFs, formulas..."
            placeholderTextColor={BRAND_COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={BRAND_COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Horizontal Scroll */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setSelectedCategory(cat.key)}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Course Selector Strip */}
      {allExams.length > 0 && (
        <View style={styles.courseStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseStripContent}>
            <TouchableOpacity
              onPress={() => setSelectedExamId("all")}
              style={[styles.coursePill, selectedExamId === "all" && styles.coursePillActive]}
            >
              <Text style={[styles.coursePillText, selectedExamId === "all" && styles.coursePillTextActive]}>
                All Odisha Exams
              </Text>
            </TouchableOpacity>
            {allExams.map((ex) => {
              const isSelected = selectedExamId === ex.id;
              return (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => setSelectedExamId(ex.id)}
                  style={[styles.coursePill, isSelected && styles.coursePillActive]}
                >
                  <Text style={[styles.coursePillText, isSelected && styles.coursePillTextActive]}>
                    {ex.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Content List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND_COLORS.primary]}
            tintColor={BRAND_COLORS.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loadingText}>Loading study materials...</Text>
          </View>
        ) : filteredMaterials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <FolderOpen size={36} color={BRAND_COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Study Materials Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No materials matched "${searchQuery}". Try a different keyword.`
                : "No study materials available for the selected filters."}
            </Text>
            {(searchQuery.length > 0 || selectedCategory !== "all" || selectedExamId !== "all") && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedExamId("all");
                }}
                style={styles.resetFiltersButton}
              >
                <Text style={styles.resetFiltersButtonText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            <View style={styles.resultsCountRow}>
              <Text style={styles.resultsCountText}>
                Showing <Text style={styles.resultsCountHighlight}>{filteredMaterials.length}</Text> verified study materials
              </Text>
            </View>

            {filteredMaterials.map((item) => {
              const targetUrl = item.file_url || item.url;
              const isGoogleDrive = Boolean(
                targetUrl &&
                  (targetUrl.includes("drive.google.com") ||
                    targetUrl.includes("docs.google.com"))
              );
              const isPdf =
                item.material_type === "pdf" ||
                item.category === "pdf" ||
                (targetUrl || "").endsWith(".pdf");

              return (
                <View key={item.id} style={styles.materialCard}>
                  {/* Top Badges */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.badgeCluster}>
                      <Badge
                        label={(item.material_type || "NOTE").toUpperCase()}
                        variant={isPdf ? "blue" : "emerald"}
                        size="sm"
                      />
                      {item.category && item.category !== item.material_type && (
                        <Badge
                          label={item.category.toUpperCase()}
                          variant="slate"
                          size="sm"
                        />
                      )}
                      {isGoogleDrive && (
                        <View style={styles.driveBadge}>
                          <Sparkles size={11} color="#b45309" />
                          <Text style={styles.driveBadgeText}>Google Drive</Text>
                        </View>
                      )}
                    </View>

                    {item.is_official && (
                      <View style={styles.officialPill}>
                        <Text style={styles.officialPillText}>Verified</Text>
                      </View>
                    )}
                  </View>

                  {/* Title */}
                  <Text style={styles.cardTitle}>{item.title}</Text>

                  {/* Description / Content Preview */}
                  {(item.content || item.description) && (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.content || item.description}
                    </Text>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      onPress={() => router.push(`/material/${item.id}` as any)}
                      style={styles.readButton}
                      activeOpacity={0.8}
                    >
                      <BookOpen size={15} color="#ffffff" />
                      <Text style={styles.readButtonText}>Read Notes</Text>
                    </TouchableOpacity>

                    {targetUrl && (
                      <TouchableOpacity
                        onPress={() => handleOpenUrl(targetUrl)}
                        style={styles.openLinkButton}
                        activeOpacity={0.7}
                      >
                        <ExternalLink
                          size={15}
                          color={isGoogleDrive ? "#b45309" : BRAND_COLORS.primary}
                        />
                        <Text
                          style={[
                            styles.openLinkButtonText,
                            isGoogleDrive && { color: "#b45309" },
                          ]}
                        >
                          {isGoogleDrive
                            ? "Open Drive"
                            : isPdf
                            ? "View PDF"
                            : "Open Link"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
    borderRadius: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
    marginTop: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.background,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: BRAND_COLORS.textPrimary,
    paddingVertical: 2,
  },
  categoriesWrapper: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
    paddingBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.background,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  categoryPillActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.textSecondary,
  },
  categoryPillTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  courseStrip: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border,
  },
  courseStripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  coursePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  coursePillActive: {
    backgroundColor: "#1e293b",
    borderColor: "#1e293b",
  },
  coursePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  coursePillTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFiltersButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFiltersButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  resultsCountRow: {
    marginBottom: 12,
  },
  resultsCountText: {
    fontSize: 12,
    color: BRAND_COLORS.textSecondary,
  },
  resultsCountHighlight: {
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
  },
  cardsContainer: {
    gap: 12,
  },
  materialCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badgeCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  driveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  driveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b45309",
  },
  officialPill: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  officialPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    lineHeight: 21,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  readButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  openLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRAND_COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  openLinkButtonText: {
    color: BRAND_COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
