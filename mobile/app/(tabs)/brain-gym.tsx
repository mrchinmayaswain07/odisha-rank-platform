import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  Brain,
  Zap,
  Calculator,
  Gamepad2,
  Flame,
  Trophy,
  Target,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BookOpen,
  Info,
  X,
  ChevronDown,
  Hash,
  Divide,
  Percent,
  BarChart3,
  Layers,
  Table,
  Grid,
  Bomb,
  Box,
  Sun,
  Scale,
  Timer,
  Check,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GAMES_CATALOG,
  GameMetadata,
  BRAND_COLORS,
} from "@odisha-rank/shared";
import { Header } from "../../src/components/Header";
import { Badge } from "../../src/components/Badge";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

// Quick Mental Math Generator Types
type QuickMode = "add" | "multiply" | "percentage" | "square" | "bodmas";

interface QuickQuestion {
  prompt: string;
  options: number[];
  answer: number;
  explanation: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuickMath(mode: QuickMode): QuickQuestion {
  if (mode === "add") {
    const a = randInt(18, 99);
    const b = randInt(14, 89);
    const answer = a + b;
    const offsets = [-10, -2, 2, 10, -1, 1].sort(() => Math.random() - 0.5);
    const distractors = offsets.slice(0, 3).map((o) => answer + o);
    const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
    return {
      prompt: `${a} + ${b} = ?`,
      options,
      answer,
      explanation: `${a} + ${b} = ${answer} (Mental tip: ${a} + ${Math.floor(b / 10) * 10} = ${a + Math.floor(b / 10) * 10}, then + ${b % 10})`,
    };
  }

  if (mode === "multiply") {
    const a = randInt(6, 19);
    const b = randInt(4, 16);
    const answer = a * b;
    const offsets = [-a, a, -b, b, -2, 2].sort(() => Math.random() - 0.5);
    const distractors = offsets.slice(0, 3).map((o) => answer + o);
    const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
    return {
      prompt: `${a} × ${b} = ?`,
      options,
      answer,
      explanation: `${a} × ${b} = ${answer}`,
    };
  }

  if (mode === "percentage") {
    const presets = [
      { p: 10, base: randInt(5, 40) * 20 },
      { p: 20, base: randInt(4, 30) * 25 },
      { p: 25, base: randInt(4, 25) * 40 },
      { p: 50, base: randInt(12, 90) * 10 },
      { p: 75, base: randInt(2, 15) * 40 },
    ];
    const item = presets[Math.floor(Math.random() * presets.length)];
    const answer = Math.round((item.p / 100) * item.base);
    const offsets = [-10, 10, -5, 5, -2, 2].sort(() => Math.random() - 0.5);
    const distractors = offsets.slice(0, 3).map((o) => answer + o);
    const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
    return {
      prompt: `${item.p}% of ${item.base} = ?`,
      options,
      answer,
      explanation: `${item.p}% of ${item.base} = ${answer}`,
    };
  }

  if (mode === "square") {
    const n = randInt(11, 30);
    const answer = n * n;
    const offsets = [-20, 20, -10, 10, -(2 * n - 1), 2 * n + 1].sort(() => Math.random() - 0.5);
    const distractors = offsets.slice(0, 3).map((o) => answer + o);
    const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
    return {
      prompt: `${n}² = ?`,
      options,
      answer,
      explanation: `${n}² = ${answer}`,
    };
  }

  // BODMAS
  const a = randInt(6, 20);
  const b = randInt(3, 8);
  const c = randInt(2, 6);
  const answer = a + b * c;
  const wrongLeftToRight = (a + b) * c;
  const options = [answer, wrongLeftToRight, answer + 4, answer - 6].sort(() => Math.random() - 0.5);
  return {
    prompt: `${a} + ${b} × ${c} = ?`,
    options,
    answer,
    explanation: `BODMAS: Multiply first (${b} × ${c} = ${b * c}), then add ${a} = ${answer}`,
  };
}

export default function BrainGymScreen() {
  const [activeTab, setActiveTab] = useState<"all" | "calc" | "games" | "daily">("all");
  const [gameCategoryFilter, setGameCategoryFilter] = useState<"all" | "math" | "memory" | "logic" | "pattern">("all");
  
  // Cognitive Stats
  const [brainScore, setBrainScore] = useState<number>(550);
  const [streakDays, setStreakDays] = useState<number>(3);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(94);
  const [showCheatsheet, setShowCheatsheet] = useState<boolean>(false);

  // Quick Live Warmup State
  const [quickMode, setQuickMode] = useState<QuickMode>("add");
  const [quickQuestion, setQuickQuestion] = useState<QuickQuestion>(() => generateQuickMath("add"));
  const [selectedQuickOpt, setSelectedQuickOpt] = useState<number | null>(null);
  const [quickAnswerState, setQuickAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [quickScore, setQuickScore] = useState<number>(0);
  const [quickCombo, setQuickCombo] = useState<number>(0);
  const [quickRound, setQuickRound] = useState<number>(1);

  // Daily Challenge Checklist
  const [dailyTasks, setDailyTasks] = useState([
    { id: 1, title: "Speed Calculation Sprint", desc: "Solve 5 mental math drills", done: true, xp: 20 },
    { id: 2, title: "BODMAS Precedence", desc: "Complete 1 simplification run", done: false, xp: 20 },
    { id: 3, title: "Brain Logic Game", desc: "Play 2048, Sudoku, or 24 Game", done: false, xp: 20 },
  ]);

  // Load stats from AsyncStorage
  const loadStats = useCallback(() => {
    AsyncStorage.getItem("@odisha_rank_game_stats").then((res) => {
      if (res) {
        try {
          const parsed = JSON.parse(res);
          if (parsed.brainScore !== undefined) setBrainScore(parsed.brainScore);
          if (parsed.totalPlayed !== undefined) setGamesPlayed(parsed.totalPlayed);
          if (parsed.streakDays !== undefined) setStreakDays(parsed.streakDays);
        } catch {}
      }
    });
  }, []);

  useFocusEffect(loadStats);

  // Handle Quick Question Answer
  const handleSelectQuickAnswer = (option: number) => {
    if (selectedQuickOpt !== null) return;
    setSelectedQuickOpt(option);

    if (option === quickQuestion.answer) {
      setQuickAnswerState("correct");
      setQuickScore((s) => s + 10 * Math.max(1, quickCombo));
      setQuickCombo((c) => c + 1);
      setBrainScore((bs) => bs + 5);
    } else {
      setQuickAnswerState("wrong");
      setQuickCombo(0);
    }

    setTimeout(() => {
      setSelectedQuickOpt(null);
      setQuickAnswerState("idle");
      setQuickRound((r) => r + 1);
      setQuickQuestion(generateQuickMath(quickMode));
    }, 1200);
  };

  const handleSwitchQuickMode = (m: QuickMode) => {
    setQuickMode(m);
    setSelectedQuickOpt(null);
    setQuickAnswerState("idle");
    setQuickQuestion(generateQuickMath(m));
  };

  // Rank Tier Calculation
  const rankTier = useMemo(() => {
    if (brainScore >= 850) return { title: "Grandmaster", tier: "Tier IV", color: "#f59e0b", bg: "#78350f" };
    if (brainScore >= 700) return { title: "Cognitive Elite", tier: "Tier III", color: "#a855f7", bg: "#581c87" };
    if (brainScore >= 550) return { title: "Tactical Strategist", tier: "Tier II", color: "#38bdf8", bg: "#0c4a6e" };
    return { title: "Aspirant Scholar", tier: "Tier I", color: "#34d399", bg: "#064e3b" };
  }, [brainScore]);

  // Fast Calculation Tools List
  const calculationTools = [
    {
      id: "speed-math",
      title: "Speed Math Arena",
      badge: "16 DRILLS",
      desc: "Fast addition, multiplication, tables & roots",
      route: "/speed-math",
      icon: Calculator,
      color: "#2563eb",
      bgColor: "#eff6ff",
    },
    {
      id: "bodmas",
      title: "BODMAS Lab",
      badge: "ORDER OF OPS",
      desc: "Brackets, Division, Multiply & Subtract sprints",
      route: "/bodmas",
      icon: Zap,
      color: "#059669",
      bgColor: "#ecfdf5",
    },
    {
      id: "approximation",
      title: "Approximation Challenge",
      badge: "CGL & BANKING",
      desc: "Decimal rounding & nearest-value estimation",
      route: "/games/approximation",
      icon: Percent,
      color: "#0891b2",
      bgColor: "#ecfeff",
    },
    {
      id: "percentage-blitz",
      title: "Percentage Blitz",
      badge: "FRACTION TRICKS",
      desc: "Instant 1/6, 3/8, 12.5% mental conversion",
      route: "/games/percentage-blitz",
      icon: Target,
      color: "#ea580c",
      bgColor: "#fff7ed",
    },
    {
      id: "quick-calc",
      title: "Quick Calc 60s",
      badge: "BEAT THE CLOCK",
      desc: "Rapid-fire arithmetic sprint with multipliers",
      route: "/games/quick-calc",
      icon: Timer,
      color: "#dc2626",
      bgColor: "#fef2f2",
    },
    {
      id: "average-race",
      title: "Average Deviation Race",
      badge: "DI ESSENTIAL",
      desc: "Assumed mean shortcut for rapid averages",
      route: "/games/average-race",
      icon: Scale,
      color: "#7c3aed",
      bgColor: "#f5f3ff",
    },
    {
      id: "simplification",
      title: "Simplification Sprint",
      badge: "HIGH SCORING",
      desc: "Multi-operator expressions under time limits",
      route: "/games/simplification-sprint",
      icon: Hash,
      color: "#4f46e5",
      bgColor: "#eef2ff",
    },
    {
      id: "missing-operator",
      title: "Missing Operator",
      badge: "REASONING",
      desc: "Deduce +, -, ×, ÷ to balance equations",
      route: "/games/missing-operator",
      icon: Divide,
      color: "#0d9488",
      bgColor: "#f0fdfa",
    },
  ];

  // Filtered games from catalog
  const filteredGames = useMemo(() => {
    if (gameCategoryFilter === "all") return GAMES_CATALOG.slice(0, 12);
    return GAMES_CATALOG.filter((g) => g.category === gameCategoryFilter);
  }, [gameCategoryFilter]);

  // Cheatsheet Items
  const fractionEquivalents = [
    { f: "1/2", p: "50%" },
    { f: "1/3", p: "33.33%" },
    { f: "1/4", p: "25%" },
    { f: "1/5", p: "20%" },
    { f: "1/6", p: "16.67%" },
    { f: "1/7", p: "14.28%" },
    { f: "1/8", p: "12.5%" },
    { f: "1/9", p: "11.11%" },
    { f: "1/11", p: "9.09%" },
    { f: "1/12", p: "8.33%" },
    { f: "1/16", p: "6.25%" },
    { f: "3/8", p: "37.5%" },
    { f: "5/8", p: "62.5%" },
    { f: "7/8", p: "87.5%" },
  ];

  const squaresList = [
    { n: 11, sq: 121 }, { n: 12, sq: 144 }, { n: 13, sq: 169 },
    { n: 14, sq: 196 }, { n: 15, sq: 225 }, { n: 16, sq: 256 },
    { n: 17, sq: 289 }, { n: 18, sq: 324 }, { n: 19, sq: 361 },
    { n: 21, sq: 441 }, { n: 22, sq: 484 }, { n: 23, sq: 529 },
    { n: 24, sq: 576 }, { n: 25, sq: 625 }, { n: 29, sq: 841 },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Brain Gym"
        subtitle="Speed Math & Cognitive Arena"
        showBack={false}
        showCoursePill={true}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* 1. COGNITIVE STATS HERO BANNER                                */}
        {/* ============================================================ */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTitleGroup}>
              <View style={styles.brainIconBadge}>
                <Brain size={24} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.heroTitle}>Aspirant Brain Gym</Text>
                <View style={styles.tierPill}>
                  <Sparkles size={11} color={rankTier.color} />
                  <Text style={[styles.tierText, { color: rankTier.color }]}>
                    {rankTier.title} • {rankTier.tier}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cheatsheetTrigger}
              onPress={() => setShowCheatsheet(true)}
              activeOpacity={0.8}
            >
              <BookOpen size={14} color="#ffffff" />
              <Text style={styles.cheatsheetTriggerText}>Cheatsheet</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Quad */}
          <View style={styles.statsQuad}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{brainScore}</Text>
              <Text style={styles.statLabel}>Brain Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.streakRow}>
                <Flame size={15} color="#f59e0b" />
                <Text style={styles.statNumber}>{streakDays}d</Text>
              </View>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>32</Text>
              <Text style={styles.statLabel}>Games Ready</Text>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 2. LIVE INTERACTIVE WARM-UP (QUICK CALCULATION ARENA)        */}
        {/* ============================================================ */}
        <View style={styles.quickPlayCard}>
          <View style={styles.quickPlayHeader}>
            <View style={styles.quickPlayTitleRow}>
              <Zap size={18} color="#eab308" fill="#eab308" />
              <Text style={styles.quickPlayTitle}>Quick-Fire Warm Up</Text>
            </View>
            <View style={styles.quickPlayMeta}>
              {quickCombo > 1 && (
                <View style={styles.comboBadge}>
                  <Flame size={12} color="#ffffff" />
                  <Text style={styles.comboText}>{quickCombo}x COMBO</Text>
                </View>
              )}
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Pts: {quickScore}</Text>
              </View>
            </View>
          </View>

          {/* Mode Switcher Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickModeList}
          >
            {[
              { id: "add", label: "Addition" },
              { id: "multiply", label: "Tables ×" },
              { id: "square", label: "Squares ²" },
              { id: "percentage", label: "Percent %" },
              { id: "bodmas", label: "BODMAS" },
            ].map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.quickModeChip,
                  quickMode === m.id && styles.quickModeChipActive,
                ]}
                onPress={() => handleSwitchQuickMode(m.id as QuickMode)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.quickModeText,
                    quickMode === m.id && styles.quickModeTextActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Question Box */}
          <View
            style={[
              styles.questionBox,
              quickAnswerState === "correct" && styles.questionBoxCorrect,
              quickAnswerState === "wrong" && styles.questionBoxWrong,
            ]}
          >
            <Text style={styles.questionPrompt}>{quickQuestion.prompt}</Text>
            {quickAnswerState === "correct" && (
              <Text style={styles.feedbackCorrect}>✓ Correct! +10 XP</Text>
            )}
            {quickAnswerState === "wrong" && (
              <Text style={styles.feedbackWrong}>
                ✗ Ans: {quickQuestion.answer}
              </Text>
            )}
          </View>

          {/* 4 Quick Options */}
          <View style={styles.optionsGrid}>
            {quickQuestion.options.map((opt, idx) => {
              const isSelected = selectedQuickOpt === opt;
              const isCorrectAnswer = opt === quickQuestion.answer;
              let btnStyle = styles.optionBtn;
              let txtStyle = styles.optionText;

              if (selectedQuickOpt !== null) {
                if (isCorrectAnswer) {
                  btnStyle = styles.optionBtnCorrect;
                  txtStyle = styles.optionTextWhite;
                } else if (isSelected) {
                  btnStyle = styles.optionBtnWrong;
                  txtStyle = styles.optionTextWhite;
                }
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={btnStyle}
                  onPress={() => handleSelectQuickAnswer(opt)}
                  disabled={selectedQuickOpt !== null}
                  activeOpacity={0.7}
                >
                  <Text style={txtStyle}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ============================================================ */}
        {/* 3. SECTION SELECTOR (ALL / CALCULATIONS / GAMES / DAILY)      */}
        {/* ============================================================ */}
        <View style={styles.sectionTabs}>
          {[
            { id: "all", label: "Gym Arena" },
            { id: "calc", label: "⚡ Calculations" },
            { id: "games", label: "🎮 Brain Games" },
            { id: "daily", label: "📋 Daily Workout" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.sectionTabBtn,
                activeTab === tab.id && styles.sectionTabBtnActive,
              ]}
              onPress={() => setActiveTab(tab.id as any)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sectionTabText,
                  activeTab === tab.id && styles.sectionTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ============================================================ */}
        {/* 4. SPEED CALCULATION SECTION ("caclatution part")             */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "calc") && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Speed Calculation Drills</Text>
                <Text style={styles.sectionSubtitle}>
                  Rapid mental arithmetic, Vedic tricks & simplification
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/speed-math" as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>All Drills →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.toolsGrid}>
              {calculationTools.map((tool) => {
                const IconComp = tool.icon;
                return (
                  <TouchableOpacity
                    key={tool.id}
                    style={[styles.toolCard, { backgroundColor: tool.bgColor }]}
                    onPress={() => router.push(tool.route as any)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.toolCardTop}>
                      <View
                        style={[
                          styles.toolIconWrap,
                          { backgroundColor: tool.color },
                        ]}
                      >
                        <IconComp size={18} color="#ffffff" />
                      </View>
                      <View
                        style={[
                          styles.toolBadge,
                          { borderColor: tool.color },
                        ]}
                      >
                        <Text style={[styles.toolBadgeText, { color: tool.color }]}>
                          {tool.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDesc} numberOfLines={2}>
                      {tool.desc}
                    </Text>
                    <View style={styles.toolFooter}>
                      <Text style={[styles.toolActionText, { color: tool.color }]}>
                        Start Session
                      </Text>
                      <ArrowRight size={13} color={tool.color} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* 5. BRAIN TRAINING GAMES ARENA ("game part")                  */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "games") && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Cognitive Brain Games</Text>
                <Text style={styles.sectionSubtitle}>
                  Deductive logic, working memory & spatial puzzles
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/games" as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>32 Games →</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gameFiltersScroll}
            >
              {[
                { id: "all", label: "Top Pick (12)" },
                { id: "math", label: "Math (15)" },
                { id: "logic", label: "Logic (8)" },
                { id: "memory", label: "Memory (3)" },
                { id: "pattern", label: "Pattern (6)" },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.gameFilterPill,
                    gameCategoryFilter === cat.id && styles.gameFilterPillActive,
                  ]}
                  onPress={() => setGameCategoryFilter(cat.id as any)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.gameFilterText,
                      gameCategoryFilter === cat.id && styles.gameFilterTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Games Grid */}
            <View style={styles.gamesGrid}>
              {filteredGames.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={styles.gameCard}
                  onPress={() => router.push(`/games/${game.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.gameCardHeader,
                      { backgroundColor: game.bgColor || "#eff6ff" },
                    ]}
                  >
                    <View
                      style={[
                        styles.gameIconBox,
                        { backgroundColor: game.color || BRAND_COLORS.primary },
                      ]}
                    >
                      <Gamepad2 size={16} color="#ffffff" />
                    </View>
                    <View style={styles.gameDifficultyBadge}>
                      <Text style={styles.gameDifficultyText}>
                        {game.defaultDifficulty.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.gameCardBody}>
                    <Text style={styles.gameTitle} numberOfLines={1}>
                      {game.title}
                    </Text>
                    <Text style={styles.gameShortDesc} numberOfLines={2}>
                      {game.shortDescription}
                    </Text>
                    <View style={styles.gameCardFooter}>
                      <Text style={styles.playNowText}>Play Now</Text>
                      <Play size={12} color={BRAND_COLORS.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Button to Full Catalog */}
            <TouchableOpacity
              style={styles.fullCatalogBtn}
              onPress={() => router.push("/games" as any)}
              activeOpacity={0.85}
            >
              <Gamepad2 size={18} color="#ffffff" />
              <Text style={styles.fullCatalogBtnText}>
                Explore Complete 32-Game Catalog
              </Text>
              <ArrowRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================ */}
        {/* 6. DAILY BRAIN WORKOUT CHALLENGE                             */}
        {/* ============================================================ */}
        {(activeTab === "all" || activeTab === "daily") && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Daily 3-Minute Workout</Text>
                <Text style={styles.sectionSubtitle}>
                  Keep your mental agility sharp for exam day
                </Text>
              </View>
              <View style={styles.streakBadgeGreen}>
                <Flame size={13} color="#059669" />
                <Text style={styles.streakBadgeGreenText}>+50 XP Bonus</Text>
              </View>
            </View>

            <View style={styles.workoutList}>
              {dailyTasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskLeft}>
                    <View
                      style={[
                        styles.taskCheckbox,
                        task.done && styles.taskCheckboxDone,
                      ]}
                    >
                      {task.done ? (
                        <Check size={14} color="#ffffff" />
                      ) : (
                        <Clock size={13} color="#94a3b8" />
                      )}
                    </View>
                    <View style={styles.taskInfo}>
                      <Text
                        style={[
                          styles.taskTitle,
                          task.done && styles.taskTitleDone,
                        ]}
                      >
                        {task.title}
                      </Text>
                      <Text style={styles.taskDesc}>{task.desc}</Text>
                    </View>
                  </View>
                  <View style={styles.taskXp}>
                    <Text style={styles.taskXpText}>+{task.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* 7. QUICK ACCESS TO SYLLABUS PRACTICE QUESTIONS               */}
        {/* ============================================================ */}
        <View style={styles.practiceBanner}>
          <View style={styles.practiceBannerLeft}>
            <View style={styles.practiceIconWrap}>
              <HelpCircle size={20} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.practiceBannerTitle}>
                Official Syllabus Question Bank
              </Text>
              <Text style={styles.practiceBannerSubtitle}>
                Practice topic-wise verified questions with solutions
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.practiceBannerBtn}
            onPress={() => router.push("/(tabs)/questions" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.practiceBannerBtnText}>Practice MCQs</Text>
            <ArrowRight size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============================================================ */}
      {/* 8. QUICK FORMULAS & SHORTCUTS CHEATSHEET MODAL               */}
      {/* ============================================================ */}
      <Modal
        visible={showCheatsheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCheatsheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <BookOpen size={20} color={BRAND_COLORS.primary} />
                <Text style={styles.modalTitle}>Speed Math Cheatsheet</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCheatsheet(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Percentage to Fraction Table */}
              <Text style={styles.cheatsheetSectionTitle}>
                1. Percentage ↔ Fraction Equivalents
              </Text>
              <View style={styles.cheatsheetGrid}>
                {fractionEquivalents.map((item, idx) => (
                  <View key={idx} style={styles.cheatsheetPill}>
                    <Text style={styles.cheatsheetFraction}>{item.f}</Text>
                    <Text style={styles.cheatsheetEqual}>=</Text>
                    <Text style={styles.cheatsheetPercent}>{item.p}</Text>
                  </View>
                ))}
              </View>

              {/* Squares Table */}
              <Text style={[styles.cheatsheetSectionTitle, { marginTop: 18 }]}>
                2. Key Squares (11² to 30²)
              </Text>
              <View style={styles.cheatsheetGrid}>
                {squaresList.map((item, idx) => (
                  <View key={idx} style={styles.cheatsheetPillSquare}>
                    <Text style={styles.cheatsheetNum}>{item.n}²</Text>
                    <Text style={styles.cheatsheetEqual}>=</Text>
                    <Text style={styles.cheatsheetVal}>{item.sq}</Text>
                  </View>
                ))}
              </View>

              {/* Fast Multiplication Tricks */}
              <Text style={[styles.cheatsheetSectionTitle, { marginTop: 18 }]}>
                3. High-Speed Vedic Tricks
              </Text>
              <View style={styles.trickCard}>
                <Text style={styles.trickTitle}>Squaring numbers ending in 5:</Text>
                <Text style={styles.trickDesc}>
                  Multiply first digit(s) by next integer, append 25.{"\n"}
                  Example: 35² → 3 × 4 = 12 → 1225. 75² → 7 × 8 = 56 → 5625.
                </Text>
              </View>

              <View style={styles.trickCard}>
                <Text style={styles.trickTitle}>Multiplying by 11:</Text>
                <Text style={styles.trickDesc}>
                  Add adjacent digits. Example: 45 × 11 → [4] [4+5=9] [5] = 495.
                </Text>
              </View>

              <View style={styles.trickCard}>
                <Text style={styles.trickTitle}>BODMAS Precedence:</Text>
                <Text style={styles.trickDesc}>
                  Brackets () → Orders (x²) → Division (÷) & Multiplication (×) from left to right → Addition (+) & Subtraction (-) from left to right.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brainIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  tierText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cheatsheetTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cheatsheetTriggerText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  statsQuad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  // Quick Play Card
  quickPlayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: { elevation: 2 },
    }),
  },
  quickPlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quickPlayTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickPlayTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  quickPlayMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  comboBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ea580c",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  comboText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  scoreBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  scoreText: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "700",
  },
  quickModeList: {
    gap: 6,
    marginBottom: 14,
  },
  quickModeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  quickModeChipActive: {
    backgroundColor: "#2563eb",
  },
  quickModeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  quickModeTextActive: {
    color: "#ffffff",
  },
  questionBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  questionBoxCorrect: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  questionBoxWrong: {
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
  },
  questionPrompt: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  feedbackCorrect: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    marginTop: 4,
  },
  feedbackWrong: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dc2626",
    marginTop: 4,
  },
  optionsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionBtnCorrect: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#059669",
  },
  optionBtnWrong: {
    flex: 1,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  optionTextWhite: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  // Section Selector Tabs
  sectionTabs: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    padding: 3,
    marginBottom: 18,
  },
  sectionTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  sectionTabBtnActive: {
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  sectionTabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  sectionTabTextActive: {
    color: "#0f172a",
    fontWeight: "700",
  },

  // Generic Section Blocks
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
  },

  // Calculation Tools Grid
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  toolCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  toolCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  toolIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toolBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  toolBadgeText: {
    fontSize: 8,
    fontWeight: "800",
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 3,
  },
  toolDesc: {
    fontSize: 10,
    color: "#64748b",
    lineHeight: 14,
    minHeight: 28,
  },
  toolFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  toolActionText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Games Section
  gameFiltersScroll: {
    gap: 8,
    marginBottom: 12,
  },
  gameFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  gameFilterPillActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  gameFilterText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  gameFilterTextActive: {
    color: "#ffffff",
  },
  gamesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  gameCard: {
    width: CARD_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  gameCardHeader: {
    height: 52,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gameIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gameDifficultyBadge: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gameDifficultyText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#0f172a",
  },
  gameCardBody: {
    padding: 10,
  },
  gameTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 3,
  },
  gameShortDesc: {
    fontSize: 10,
    color: "#64748b",
    lineHeight: 14,
    minHeight: 28,
  },
  gameCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  playNowText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  fullCatalogBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  fullCatalogBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Daily Workout
  streakBadgeGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  streakBadgeGreenText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  workoutList: {
    gap: 8,
  },
  taskCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckboxDone: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: "#94a3b8",
  },
  taskDesc: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 1,
  },
  taskXp: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  taskXpText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563eb",
  },

  // Practice Banner
  practiceBanner: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  practiceBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  practiceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  practiceBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  practiceBannerSubtitle: {
    fontSize: 10,
    color: "#3b82f6",
    marginTop: 1,
  },
  practiceBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  practiceBannerBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },

  // Modal Cheatsheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  cheatsheetSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  cheatsheetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  cheatsheetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cheatsheetFraction: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
  },
  cheatsheetEqual: {
    fontSize: 10,
    color: "#94a3b8",
  },
  cheatsheetPercent: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a",
  },
  cheatsheetPillSquare: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cheatsheetNum: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7c3aed",
  },
  cheatsheetVal: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a",
  },
  trickCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  trickTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  trickDesc: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 16,
  },
});
