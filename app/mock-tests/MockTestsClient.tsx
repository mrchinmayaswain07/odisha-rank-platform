"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Profile, Exam, MockTest } from "@/lib/types";

interface MockTestsClientProps {
  profile: Profile | null;
  allExams: Exam[];
  activeExam: Exam | null;
  tests: MockTest[];
}

export const MockTestsClient: React.FC<MockTestsClientProps> = ({
  profile,
  allExams,
  activeExam,
  tests,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

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

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold text-xs mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Official Pattern Exam Simulations</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Odisha State Competitive Mock Tests
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Experience real examination conditions with timed countdowns, official negative marking schemes (-0.25), and instant score analytics.
              </p>
            </div>
          </div>

          {/* Target Exam Course Bar */}
          {allExams && allExams.length > 0 && (
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Target Exam Course
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {activeExam?.title || "All Courses"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {allExams.map((ex) => (
                  <Link
                    key={ex.id}
                    href={`/mock-tests?exam=${ex.id}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      ex.id === activeExam?.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ex.conducting_body}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <Card key={test.id} hover className="p-6 flex flex-col justify-between border-slate-200 rounded-2xl">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="blue" size="sm">Full Simulation</Badge>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{test.duration_minutes} Mins</span>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 mb-2">{test.title}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {test.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center mb-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Questions</span>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {test.questions_count || 6}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Marks</span>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{test.total_marks}</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">Pass</span>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{test.pass_percentage}%</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span>Negative Marking:</span>
                    <strong className="text-slate-800">-{test.negative_marking}</strong>
                  </div>
                  <Link href={`/mock-tests/${test.id}`}>
                    <Button size="sm" className="gap-1.5 rounded-xl">
                      <span>Start Test</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}

            {tests.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-800">No Mock Tests Available</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no published mock tests for this specific course yet. Check back soon or select another course.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Course Selection Modal */}
      {showCourseModal && (
        <CourseSelectModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          exams={allExams}
          currentExamId={activeExam?.id || null}
        />
      )}

      {/* Study Session Timer Modal */}
      {showTimerModal && (
        <StudyTimerModal
          isOpen={showTimerModal}
          onClose={() => setShowTimerModal(false)}
          activeCourseName={activeExam?.title || "OSSC CGL"}
        />
      )}
    </div>
  );
};
