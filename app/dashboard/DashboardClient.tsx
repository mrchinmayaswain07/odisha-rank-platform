"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Profile,
  DashboardMetrics,
  Exam,
} from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import {
  Clock,
  HelpCircle,
  Award,
  TrendingUp,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Sparkles,
  CheckCircle2,
  Activity,
  ArrowLeftRight,
  GraduationCap,
} from "lucide-react";

interface DashboardClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<DashboardMetrics>(metrics);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // If student has no target course chosen, force the course selector
  const hasNoCourse = !targetExam;

  const handleLogStudySession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      const res = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_minutes: sessionMinutes,
          notes: sessionNotes,
          session_date: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        // Update local state optimistically
        setCurrentMetrics((prev) => ({
          ...prev,
          study_hours: Math.round((prev.study_hours + sessionMinutes / 60) * 10) / 10,
          study_streak_days: prev.study_streak_days === 0 ? 1 : prev.study_streak_days,
          recent_activities: [
            {
              id: `act-${Date.now()}`,
              user_id: profile?.id || "me",
              activity_type: "study_session_logged",
              title: `Logged ${sessionMinutes} mins study session`,
              description: sessionNotes || "Self-study revision",
              metadata: {},
              created_at: new Date().toISOString(),
            },
            ...prev.recent_activities.slice(0, 5),
          ],
        }));
        setShowLogModal(false);
        setSessionNotes("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogging(false);
    }
  };

  const courseQueryParam = targetExam ? `?exam=${targetExam.id}` : "";

  return (
    <div className="space-y-8">
      {/* 1. WELCOME & COURSE STATUS HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Aspirant Workspace
            </span>
            {targetExam ? (
              <Badge variant="blue" size="md" className="gap-1.5 py-1">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>
                  Target: {targetExam.conducting_body} — {targetExam.title}
                </span>
              </Badge>
            ) : (
              <Badge
                variant="amber"
                size="md"
                onClick={() => setShowCourseModal(true)}
                className="cursor-pointer hover:bg-amber-100 gap-1.5 py-1 animate-pulse"
              >
                <span>No Course Selected — Click to Choose &rarr;</span>
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Namaskar, {profile?.full_name || "Scholar"}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            {targetExam
              ? `Personalized study plan for ${targetExam.title}. Only course-specific syllabus, materials, and test results are displayed.`
              : "Please select your target competitive examination to unlock your personalized curriculum and mock tests."}
          </p>
        </div>

        {/* Action Controls: Change Course & Log Study */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCourseModal(true)}
            className="gap-1.5 border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700"
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            <span>{targetExam ? "Change Course" : "Select Course"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLogModal(true)}
            className="gap-1.5"
          >
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Log Study Time</span>
          </Button>

          <Link href={`/mock-tests${courseQueryParam}`}>
            <Button size="sm" className="gap-1.5">
              <Award className="w-4 h-4" />
              <span>Take Mock Test</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. REAL METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Study Hours */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Study Hours</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {currentMetrics.study_hours}{" "}
            <span className="text-sm font-medium text-slate-400 font-sans">hrs</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Derived from logged study sessions</p>
        </Card>

        {/* Questions Practiced */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Questions Practiced</span>
            <HelpCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {currentMetrics.questions_practiced}
          </div>
          <p className="text-xs text-slate-500 mt-1">Recorded question attempts</p>
        </Card>

        {/* Mock Tests Completed */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Mock Tests</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {currentMetrics.mock_tests_completed}
          </div>
          <p className="text-xs text-slate-500 mt-1">Full simulations submitted</p>
        </Card>

        {/* Study Streak */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Study Streak</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {currentMetrics.study_streak_days}{" "}
            <span className="text-sm font-medium text-slate-400 font-sans">days</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {currentMetrics.study_streak_days > 0 ? "Active daily consistency" : "Start your streak today"}
          </p>
        </Card>
      </div>

      {/* 3. COURSE SYLLABUS DUAL-TRACK PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Official Course Syllabus */}
        <Card className="p-6 border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {targetExam?.title || "Official Course"} Syllabus
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Official Examination Coverage
              </h3>
            </div>
            <div className="text-2xl font-extrabold text-blue-600">
              {currentMetrics.official_progress_percentage}%
            </div>
          </div>

          <ProgressBar
            progress={currentMetrics.official_progress_percentage}
            color="blue"
            height="md"
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Completed:{" "}
              <strong className="text-slate-900">{currentMetrics.completed_official_topics}</strong> of{" "}
              {currentMetrics.total_official_topics} official topics
            </span>
            <Link
              href={`/syllabus${courseQueryParam}`}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Explore course syllabus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Personal Study Progress */}
        <Card className="p-6 border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Personal Study Progress
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Student-Created Topics
              </h3>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {currentMetrics.personal_progress_percentage}%
            </div>
          </div>

          <ProgressBar
            progress={currentMetrics.personal_progress_percentage}
            color="emerald"
            height="md"
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Custom Topics:{" "}
              <strong className="text-slate-900">{currentMetrics.completed_personal_topics}</strong> of{" "}
              {currentMetrics.total_personal_topics} created
            </span>
            <Link
              href={`/syllabus${courseQueryParam}`}
              className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Add custom topic</span>
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* 4. SUBJECT-WISE BREAKDOWN & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Subject Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>
                {targetExam?.title ? `${targetExam.conducting_body} Subject Breakdown` : "Subject Progress"}
              </span>
            </h3>
            <Link href={`/syllabus${courseQueryParam}`} className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {currentMetrics.subject_progress.map((sub) => (
              <Card key={sub.subject_id} className="p-4 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{sub.subject_name}</h4>
                  <span className="text-xs font-bold text-slate-700">
                    {sub.progress_percentage}%
                  </span>
                </div>
                <ProgressBar progress={sub.progress_percentage} color="blue" height="sm" />
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                  <span>
                    {sub.completed_topics} / {sub.total_topics} topics completed
                  </span>
                  <Link
                    href={`/syllabus${courseQueryParam}&subject=${sub.subject_id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Open subject &rarr;
                  </Link>
                </div>
              </Card>
            ))}

            {currentMetrics.subject_progress.length === 0 && (
              <EmptyState
                icon={BookOpen}
                title="No Subjects Configured for this Exam"
                description="Select or change your target examination to load the official subject syllabus."
                actionHref="#"
                actionText="Select Target Course"
              />
            )}
          </div>
        </div>

        {/* Recent Activity Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Recent Activity Feed</span>
            </h3>
          </div>

          {currentMetrics.recent_activities.length > 0 ? (
            <Card className="p-5 border-slate-200 space-y-4">
              {currentMetrics.recent_activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    {act.activity_type === "mock_test_completed" ? (
                      <Award className="w-4 h-4" />
                    ) : act.activity_type === "question_attempted" ? (
                      <HelpCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{act.title}</p>
                    {act.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{act.description}</p>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </Card>
          ) : (
            <Card className="p-8 border-slate-200">
              <EmptyState
                icon={Activity}
                title="No Activity Logged Yet"
                description="Complete topics in the syllabus, answer MCQs in the Question Bank, or submit a mock test to build your record."
                actionHref={`/questions${courseQueryParam}`}
                actionText="Practice First Question"
              />
            </Card>
          )}
        </div>
      </div>

      {/* Course Selection Modal */}
      <CourseSelectModal
        isOpen={showCourseModal || hasNoCourse}
        onClose={() => setShowCourseModal(false)}
        exams={allExams}
        currentExamId={targetExam?.id || null}
        isRequired={hasNoCourse}
      />

      {/* Log Study Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Log Study Session</h3>
            <p className="text-xs text-slate-500 mb-4">
              Record your offline reading or video preparation to accurately update your study hours and streak.
            </p>

            <form onSubmit={handleLogStudySession} className="space-y-4">
              <Input
                label="Study Duration (Minutes)"
                type="number"
                min={5}
                max={480}
                required
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Session Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Completed Chapter 1 of Odisha History"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isLogging}>
                  Save Session
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
