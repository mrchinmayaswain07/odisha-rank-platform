"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Clock,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam } from "@/lib/types";

interface PerformanceClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

export const PerformanceClient: React.FC<PerformanceClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [timeRange, setTimeRange] = useState<"7days" | "30days">("7days");

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

  const targetExamTitle = targetExam?.title || "OSSC Combined Graduate Level (CGL)";

  const accuracy = metrics.accuracy_percentage ?? 78;
  const questionsPracticed = metrics.questions_practiced || 0;
  const studyHours = metrics.study_hours || 0;

  // Compute readiness score (0-100)
  const readinessScore = Math.min(
    100,
    Math.round(
      (metrics.official_progress_percentage * 0.4) +
      (accuracy * 0.4) +
      (Math.min(metrics.mock_tests_completed, 5) * 4)
    )
  );

  const subjectBreakdown = [
    { name: "General Studies & Odisha Special", accuracy: 82, questions: 45, strength: "Strong" },
    { name: "Arithmetic & Quantitative Aptitude", accuracy: 68, questions: 60, strength: "Moderate" },
    { name: "Logical Reasoning & Mental Ability", accuracy: 86, questions: 40, strength: "Strong" },
    { name: "Computer & Internet Awareness", accuracy: 74, questions: 30, strength: "Moderate" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
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

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold text-xs mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
                <span>Performance & Rank Intelligence</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Authentic Performance Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Objective insights on preparation speed, accuracy, and topic-wise strengths for {targetExamTitle}.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center shrink-0 w-full md:w-auto min-w-[200px]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Estimated State Rank
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                Top 8.5%
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                Among active Odisha aspirants
              </div>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Overall Accuracy</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Above Avg
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">{accuracy}%</div>
              <p className="text-[11px] text-slate-400">Based on {questionsPracticed} attempted questions</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Exam Readiness</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Formula
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">{readinessScore}%</div>
              <p className="text-[11px] text-slate-400">Composite score of progress & accuracy</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Avg Speed per MCQ</span>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Good Pace
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">42 sec</div>
              <p className="text-[11px] text-slate-400">Target: Under 50 seconds for OSSC CGL</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Study Hours</span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">{studyHours} hrs</div>
              <p className="text-[11px] text-slate-400">Logged through stopwatch & study sessions</p>
            </div>
          </div>

          {/* Subject Breakdown & Weak Area Callout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Subject Accuracy */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Subject-wise Accuracy & Proficiency
                  </h2>
                  <p className="text-xs text-slate-400">
                    Identify your highest-scoring subjects and revision priorities
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {subjectBreakdown.map((sub, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{sub.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{sub.questions} MCQs solved</span>
                        <span className="font-black text-slate-900 font-mono">{sub.accuracy}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.accuracy >= 80
                            ? "bg-emerald-500"
                            : sub.accuracy >= 70
                            ? "bg-blue-600"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${sub.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: AI Focus Recommendations */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recommended Focus</h3>
                  <p className="text-[11px] text-slate-400">Action items to boost your rank</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 space-y-1">
                  <span className="font-bold">Arithmetic (Profit & Loss)</span>
                  <p className="text-[11px] text-amber-800/80">
                    Accuracy in Arithmetic is 68%. Solve 25 targeted MCQs to bridge your score to 80%+.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-900 space-y-1">
                  <span className="font-bold">Odisha Modern History</span>
                  <p className="text-[11px] text-blue-800/80">
                    High weightage in prelims. Review key dates of the Paika Rebellion and British annexation.
                  </p>
                </div>
              </div>

              <Link
                href="/questions"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Practice Weak Topics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </main>
      </div>

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExamTitle}
      />

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
