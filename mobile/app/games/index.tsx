import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Search,
  Gamepad2,
  Sparkles,
  Trophy,
  Brain,
  Flame,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Grid,
  Clock,
  Target,
  Equal,
  Layers,
  Sun,
  ShieldAlert,
  ChevronRight,
  Hash,
  TrendingUp,
  AlertCircle,
  Divide,
  Timer,
  Edit3,
  Percent,
  Scale,
  Zap,
  ArrowLeftRight,
  Activity,
  Box,
  Bomb,
  Table,
  Binary,
} from "lucide-react-native";
import {
  GAMES_CATALOG,
  GameMetadata,
  BRAND_COLORS,
} from "@odisha-rank/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 40) / 2;

export default function GamesCatalogueScreen() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [brainScore, setBrainScore] = useState<number>(550);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);

  useEffect(() => {
    // Load local mobile game stats
    AsyncStorage.getItem("@odisha_rank_game_stats").then((res) => {
      if (res) {
        try {
          const parsed = JSON.parse(res);
          if (parsed.brainScore) setBrainScore(parsed.brainScore);
          if (parsed.totalPlayed) setGamesPlayed(parsed.totalPlayed);
        } catch {}
      }
    });
  }, []);

  const filteredGames = useMemo(() => {
    return GAMES_CATALOG.filter((game) => {
      if (activeTab === "free" && game.access !== "free") return false;
      if (activeTab === "premium" && game.access !== "premium") return false;
      if (
        ["math", "memory", "logic", "pattern"].includes(activeTab) &&
        game.category !== activeTab
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          game.title.toLowerCase().includes(q) ||
          game.shortDescription.toLowerCase().includes(q) ||
          game.category.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [activeTab, searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={BRAND_COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Games & Brain Training</Text>
          <Text style={styles.headerSub}>32 Cognitive Exam Aptitude Drills</Text>
        </View>
        <View style={styles.brainScoreBadge}>
          <Brain size={14} color="#2563eb" />
          <Text style={styles.brainScoreText}>{brainScore}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Daily Brain Challenge Card */}
        <View style={styles.dailyCard}>
          <View style={styles.dailyHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Trophy size={16} color="#d97706" />
              <Text style={styles.dailyTitle}>Daily Brain Challenge</Text>
            </View>
            <View style={styles.xpPill}>
              <Text style={styles.xpText}>+50 XP</Text>
            </View>
          </View>
          <Text style={styles.dailySub}>
            Complete today&apos;s 3 featured brain challenges to boost your daily streak.
          </Text>
          <View style={styles.dailyGamesRow}>
            {["game-24", "sudoku", "memory-matrix"].map((gid, idx) => {
              const gm = GAMES_CATALOG.find((g) => g.id === gid);
              return (
                <TouchableOpacity
                  key={gid}
                  style={styles.dailyGameChip}
                  onPress={() => router.push(`/games/${gid}` as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dailyGameNum}>{idx + 1}</Text>
                  <Text style={styles.dailyGameName} numberOfLines={1}>
                    {gm?.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder="Search all 32 games..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Category Pill Filters (Matching Screenshot) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {[
            { id: "all", label: "All Games" },
            { id: "free", label: "Free" },
            { id: "premium", label: "Premium" },
            { id: "math", label: "Math" },
            { id: "memory", label: "Memory" },
            { id: "logic", label: "Logic" },
            { id: "pattern", label: "Pattern" },
          ].map((pill) => {
            const isActive = activeTab === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                onPress={() => setActiveTab(pill.id)}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Game Cards Grid (2-Column touch friendly cards) */}
        <View style={styles.gridContainer}>
          {filteredGames.map((game) => {
            const isFree = game.access === "free";
            return (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => router.push(`/games/${game.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.iconSquircle,
                      { backgroundColor: game.bgColor },
                    ]}
                  >
                    <Gamepad2 size={20} color={game.color} />
                  </View>
                  <View
                    style={[
                      styles.accessBadge,
                      isFree ? styles.freeBadge : styles.premiumBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.accessBadgeText,
                        isFree ? styles.freeBadgeText : styles.premiumBadgeText,
                      ]}
                    >
                      {isFree ? "FREE" : "PREMIUM"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>
                  {game.title}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={3}>
                  {game.shortDescription}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryChipText}>{game.category}</Text>
                  </View>
                  <View style={styles.playAction}>
                    <Text style={styles.playText}>Play</Text>
                    <ArrowRight size={12} color="#2563eb" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  brainScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  brainScoreText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563eb",
  },
  dailyCard: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#fef3c7",
    borderWidth: 1.5,
    borderColor: "#fde68a",
  },
  dailyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dailyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#78350f",
  },
  xpPill: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  xpText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  dailySub: {
    fontSize: 11,
    color: "#92400e",
    marginBottom: 10,
  },
  dailyGamesRow: {
    flexDirection: "row",
    gap: 6,
  },
  dailyGameChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  dailyGameNum: {
    fontSize: 10,
    fontWeight: "800",
    color: "#d97706",
  },
  dailyGameName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "500",
  },
  pillsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPillActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 10,
  },
  gameCard: {
    width: CARD_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "space-between",
    minHeight: 160,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  iconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  accessBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadge: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  premiumBadge: {
    backgroundColor: "#7c3aed",
  },
  accessBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },
  freeBadgeText: {
    color: "#059669",
  },
  premiumBadgeText: {
    color: "#ffffff",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 15,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  categoryChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    textTransform: "capitalize",
  },
  playAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  playText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563eb",
  },
});
