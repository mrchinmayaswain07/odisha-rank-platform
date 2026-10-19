"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Brain,
  Sparkles,
  Trophy,
  Flame,
  Search,
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
  Image as ImageIcon,
  FileCode2,
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
  RotateCcw,
  GraduationCap,
} from "lucide-react";
import {
  GameMetadata,
  GameCategory,
  GameAccess,
  GAMES_CATALOG,
  StudentGameProfile,
  DailyBrainChallenge,
} from "@odisha-rank/shared";
import { Profile, Exam } from "@/lib/types";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface GamesClientProps {
  profile: Profile | null;
  allExams: Exam[];
  targetExam: Exam | null;
  gameProfile: StudentGameProfile;
  dailyChallenge: DailyBrainChallenge;
  recommendations: {
    focusArea: string;
    reason: string;
    recommendedGames: string[];
  };
}

// Icon resolver for game cards
function renderGameIcon(name: string, className: string = "w-6 h-6") {
  switch (name) {
    case "Calculator":
      return <Calculator className={className} />;
    case "Gamepad2":
      return <Gamepad2 className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Grid":
      return <Grid className={className} />;
    case "Target":
      return <Target className={className} />;
    case "Equal":
      return <Equal className={className} />;
    case "Clock":
      return <Clock className={className} />;
    case "Brain":
      return <Brain className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "Table":
      return <Table className={className} />;
    case "Bomb":
      return <Bomb className={className} />;
    case "Box":
      return <Box className={className} />;
    case "Binary":
      return <Binary className={className} />;
    case "Layers":
      return <Layers className={className} />;
    case "Sun":
      return <Sun className={className} />;
    case "ShieldAlert":
      return <ShieldAlert className={className} />;
    case "ChevronRight":
      return <ChevronRight className={className} />;
    case "Hash":
      return <Hash className={className} />;
    case "Image":
      return <ImageIcon className={className} />;
    case "FileCode2":
      return <FileCode2 className={className} />;
    case "TrendingUp":
      return <TrendingUp className={className} />;
    case "AlertCircle":
      return <AlertCircle className={className} />;
    case "Divide":
      return <Divide className={className} />;
    case "Timer":
      return <Timer className={className} />;
    case "Edit3":
      return <Edit3 className={className} />;
    case "Percent":
      return <Percent className={className} />;
    case "Scale":
      return <Scale className={className} />;
    case "ArrowLeftRight":
      return <ArrowLeftRight className={className} />;
    case "Activity":
      return <Activity className={className} />;
    default:
      return <Gamepad2 className={className} />;
  }
}

export const GamesClient: React.FC<GamesClientProps> = ({
  profile,
  allExams,
  targetExam,
  gameProfile,
  dailyChallenge,
  recommendations,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Filter States: activeTab can be "all", "free", "premium", "math", "memory", "logic", "pattern"
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const studentName = profile?.full_name?.split(" ")[0] || "Aspirant";
  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "OD";
  const isUserAdmin =
    profile?.email?.toLowerCase() === "mrchinmayaswain07@gmail.com" ||
    (profile as any)?.role === "admin";

  // Filter games based on tab and search
  const filteredGames = useMemo(() => {
    return GAMES_CATALOG.filter((game) => {
      // Tab filter
      if (activeTab === "free" && game.access !== "free") return false;
      if (activeTab === "premium" && game.access !== "premium") return false;
      if (
        ["math", "memory", "logic", "pattern"].includes(activeTab) &&
        game.category !== activeTab
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          game.title.toLowerCase().includes(q) ||
          game.shortDescription.toLowerCase().includes(q) ||
          game.category.toLowerCase().includes(q) ||
          game.examRelevance.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop & Mobile Sidebar */}
      <StudentSidebar />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <StudentSidebar isMobile onCloseMobile={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenTimer={() => setShowTimerModal(true)}
          onOpenCourseModal={() => setShowCourseModal(true)}
          studentName={studentName}
          initials={initials}
          isUserAdmin={isUserAdmin}
          email={profile?.email}
          allExams={allExams}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Hero Banner */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold text-xs mb-3">
                <Brain className="w-3.5 h-3.5 text-blue-300" />
                <span>Cognitive Exam Aptitude Training</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Games & Brain Training
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                32 authentic mathematical, memory, deductive logic, and pattern games designed to develop rapid mental agility, elimination accuracy, and focus under exam pressure.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-2xl shrink-0">
              <div className="text-center px-3 border-r border-white/15">
                <span className="text-[10px] font-bold text-slate-300 uppercase block">Brain Score</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  {gameProfile.brainScore}
                </span>
              </div>
              <div className="text-center px-3 border-r border-white/15">
                <span className="text-[10px] font-bold text-slate-300 uppercase block">Games Played</span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {gameProfile.totalGamesPlayed}
                </span>
              </div>
              <div className="text-center px-3">
                <span className="text-[10px] font-bold text-slate-300 uppercase block">Streak</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                  {gameProfile.currentStreakDays}d
                </span>
              </div>
            </div>
          </div>

          {/* Daily Brain Challenge Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-500/10 border-2 border-amber-300/50 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">
                  <Trophy className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-amber-950">Daily Brain Challenge</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 text-[10px] font-extrabold">
                  +50 XP
                </span>
              </div>
              <p className="text-xs text-amber-900/80">
                Sharpen 3 curated mental skills every day. Complete today&apos;s trio to keep your streak glowing!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {dailyChallenge.games.map((dg, idx) => {
                const gMeta = GAMES_CATALOG.find((g) => g.id === dg.gameId);
                return (
                  <Link
                    key={dg.gameId}
                    href={`/games/${dg.gameId}`}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all text-xs font-bold text-slate-800"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <span>{gMeta?.title}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      ({dg.difficulty})
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Personalized Weakness Recommendation Banner */}
          {recommendations && (
            <div className="bg-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Target Focus: {recommendations.focusArea}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                    {recommendations.reason}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                {recommendations.recommendedGames.map((gid) => {
                  const gm = GAMES_CATALOG.find((g) => g.id === gid);
                  if (!gm) return null;
                  return (
                    <Link
                      key={gid}
                      href={`/games/${gid}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold border border-blue-200/60"
                    >
                      {gm.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters & Search Toolbar (Matches Reference Screenshot Top Bar) */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              {/* Pill Buttons: [All Games] [Free] [Premium] [Math] [Memory] [Logic] [Pattern] */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {[
                  { id: "all", label: "All Games", icon: Gamepad2 },
                  { id: "free", label: "Free", icon: CheckCircle2 },
                  { id: "premium", label: "Premium", icon: Sparkles },
                  { id: "math", label: "Math", icon: Calculator },
                  { id: "memory", label: "Memory", icon: Brain },
                  { id: "logic", label: "Logic", icon: ShieldAlert },
                  { id: "pattern", label: "Pattern", icon: TrendingUp },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search 32 games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>Showing {filteredGames.length} of 32 games</span>
              {activeTab !== "all" && (
                <button
                  onClick={() => setActiveTab("all")}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* 32 Game Cards Grid (Matches Reference Screenshot 2-Column Clean Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredGames.map((game) => {
              const stat = gameProfile.gameStats[game.id];
              const isFree = game.access === "free";

              return (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    {/* Header: Icon, Title, and Free/Premium Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: game.bgColor,
                            color: game.color,
                            border: `1px solid ${game.borderColor}`,
                          }}
                        >
                          {renderGameIcon(game.iconName, "w-6 h-6")}
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {game.title}
                          </h3>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            {game.examRelevance ? "Official Pattern" : "Cognitive Drill"}
                          </span>
                        </div>
                      </div>

                      {/* FREE / PREMIUM Badge (Matching Reference Screenshot Style) */}
                      {isFree ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold tracking-wider uppercase">
                          FREE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-xs flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          PREMIUM
                        </span>
                      )}
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                      {game.shortDescription}
                    </p>
                  </div>

                  {/* Footer: Category Tag & Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold capitalize text-[11px]">
                      {game.category}
                    </span>

                    <div className="flex items-center gap-3 text-slate-400">
                      {stat && stat.playedCount > 0 ? (
                        <span className="font-semibold text-slate-600">
                          Best: <strong className="text-blue-600">{stat.bestScore}</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">Not played yet</span>
                      )}
                      <span className="inline-flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Play</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Empty Search Fallback */}
          {filteredGames.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No games found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No games match your search criteria. Try selecting &quot;All Games&quot; or clearing your search.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}

          {/* Cognitive Skill Proficiencies Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Student Cognitive Proficiencies
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time skill index updated across your gameplay performance
                </p>
              </div>
              <Badge variant="blue" size="sm">
                Aggregated Brain Rating: {gameProfile.brainScore} / 1000
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  name: "Math & Arithmetic",
                  val: gameProfile.categoryProficiency.math,
                  color: "bg-blue-600",
                  text: "text-blue-600",
                },
                {
                  name: "Working Memory",
                  val: gameProfile.categoryProficiency.memory,
                  color: "bg-purple-600",
                  text: "text-purple-600",
                },
                {
                  name: "Deductive Logic",
                  val: gameProfile.categoryProficiency.logic,
                  color: "bg-emerald-600",
                  text: "text-emerald-600",
                },
                {
                  name: "Pattern & Sequences",
                  val: gameProfile.categoryProficiency.pattern,
                  color: "bg-amber-500",
                  text: "text-amber-500",
                },
              ].map((cat) => (
                <div key={cat.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">{cat.name}</span>
                    <span className={cat.text}>{cat.val}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                      style={{ width: `${cat.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Study Session Timer Modal */}
      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExam?.title || "Odisha Government Exams"}
      />

      {/* Target Course Selector Modal */}
      {showCourseModal && (
        <CourseSelectModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          currentExamId={targetExam?.id || null}
          exams={allExams}
        />
      )}
    </div>
  );
};
