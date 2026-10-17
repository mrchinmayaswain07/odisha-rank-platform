"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  FileText,
  Clock,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam } from "@/lib/types";

interface CoursesClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

export const CoursesClient: React.FC<CoursesClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [switchingExamId, setSwitchingExamId] = useState<string | null>(null);

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

  const activeExamId = targetExam?.id || allExams[0]?.id;

  const handleEnrollCourse = async (examId: string) => {
    setSwitchingExamId(examId);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_exam_id: examId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Course switch error:", err);
    } finally {
      setSwitchingExamId(null);
    }
  };

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
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold text-xs mb-3">
                <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
                <span>Odisha Examination Portal</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                My Enrolled Courses & Exam Catalog
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Seamlessly prepare for high-competition Odisha state recruitment exams. Switch your target course anytime to reconfigure syllabus tracking, question banks, and mock tests.
              </p>
            </div>
          </div>

          {/* Active Course Spotlight */}
          {targetExam && (
            <div className="bg-white rounded-3xl border-2 border-blue-500/30 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-lg shadow-xs">
                    {targetExam.conducting_body}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        Active Enrolled Course
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                      {targetExam.title}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/syllabus?exam=${targetExam.id}`}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>View Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Course Stages */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Exam Stages & Mark Distribution
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(targetExam.stages && targetExam.stages.length > 0
                    ? targetExam.stages
                    : [
                        { name: "Preliminary Exam", marks: 150, type: "Objective MCQ" },
                        { name: "Main Written Exam", marks: 300, type: "Subjective & Objective" },
                        { name: "Computer Skill Test", marks: 50, type: "Qualifying" },
                      ]
                  ).map((stage, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Stage {idx + 1}
                      </span>
                      <div className="text-xs font-bold text-slate-900">{stage.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {stage.marks} Marks • {stage.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                <span>
                  Eligibility: <strong className="text-slate-800">{targetExam.eligibility || "Graduate in any discipline from recognized university"}</strong>
                </span>
                <Link
                  href="/mock-tests"
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Practice Stage 1 Mock Tests</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* All Exams Catalog */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Explore All Odisha Competitive Examinations ({allExams.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {allExams.map((exam) => {
                const isActive = exam.id === activeExamId;
                const isSwitching = switchingExamId === exam.id;

                return (
                  <div
                    key={exam.id}
                    className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                      isActive ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200/80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                          {exam.conducting_body}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Target
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {exam.description || "Official state recruitment examination conducted by Government of Odisha."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Stages: {exam.stages?.length || 3}</span>
                        <span>Negative Marking: 0.25</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <Link
                            href={`/syllabus?exam=${exam.id}`}
                            className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs text-center transition-colors"
                          >
                            Go to Syllabus
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleEnrollCourse(exam.id)}
                            disabled={isSwitching}
                            className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs text-center transition-colors disabled:opacity-50"
                          >
                            {isSwitching ? "Switching..." : "Switch to this Course"}
                          </button>
                        )}

                        <Link
                          href={`/exams/${exam.slug}`}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                          title="View Exam Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExam?.title}
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
