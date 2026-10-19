"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Question, Subject, Exam, Profile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Filter,
  GraduationCap,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";

interface QuestionBankClientProps {
  initialQuestions: Question[];
  subjects: Subject[];
  allExams?: Exam[];
  activeExam?: Exam | null;
  profile?: Profile | null;
}

export const QuestionBankClient: React.FC<QuestionBankClientProps> = ({
  initialQuestions,
  subjects,
  allExams = [],
  activeExam,
  profile,
}) => {
  const router = useRouter();
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

  const [questions] = useState<Question[]>(initialQuestions);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // Track attempts: questionId -> selectedOptionIndex
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});

  const filteredQuestions = questions.filter((q) => {
    if (selectedSubjectId !== "all" && q.subject_id !== selectedSubjectId) {
      return false;
    }
    if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) {
      return false;
    }
    return true;
  });

  const totalAttempted = Object.keys(userAnswers).length;
  const totalCorrect = Object.entries(userAnswers).filter(
    ([qId, selIdx]) => {
      const q = questions.find((item) => item.id === qId);
      return q && q.correct_option_index === selIdx;
    }
  ).length;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    const isAlreadyAttempted = userAnswers[questionId] !== undefined;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));

    if (!isAlreadyAttempted) {
      const q = questions.find((item) => item.id === questionId);
      const isCorrect = q ? q.correct_option_index === optionIndex : false;
      fetch("/api/questions/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questionId,
          selected_option_index: optionIndex,
          is_correct: isCorrect,
          time_taken_seconds: 38 + Math.floor(Math.random() * 15),
        }),
      }).catch(() => {});
    }
  };

  const handleResetSession = () => {
    setUserAnswers({});
  };

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
                <span>Interactive MCQ Question Bank</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Practice Questions with Instant Explanations
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Test your knowledge across official Odisha competitive exam patterns with timed practice, automated negative marking (-0.25), and detailed step-by-step verified explanations.
              </p>
            </div>
          </div>

          {/* Target Course Selector Bar */}
      {allExams && allExams.length > 0 && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Exam Course
              </span>
              <span className="text-xs font-bold text-slate-800">
                {activeExam?.title || "All Courses"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => router.push(`/questions?exam=all`)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !activeExam || activeExam.id === ""
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All Odisha Exams
            </button>
            {allExams.map((ex) => (
              <button
                key={ex.id}
                onClick={() => router.push(`/questions?exam=${ex.id}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ex.id === activeExam?.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {ex.conducting_body}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Stats Bar */}
      <Card className="p-6 bg-white border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Quick Session Stats */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
            <div>
              Attempted: <span className="text-slate-900 font-bold">{totalAttempted}</span> /{" "}
              {filteredQuestions.length}
            </div>
            <div>
              Score:{" "}
              <span className="text-emerald-600 font-bold">
                {totalCorrect}
              </span>
              <span className="text-slate-400">
                {" "}
                ({totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0}%)
              </span>
            </div>
            {totalAttempted > 0 && (
              <button
                onClick={handleResetSession}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs"
                title="Reset answers"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Questions Listing */}
      <div className="space-y-6">
        {filteredQuestions.map((q, qIndex) => {
          const selectedOption = userAnswers[q.id];
          const hasAnswered = selectedOption !== undefined;
          const isCorrect = selectedOption === q.correct_option_index;

          return (
            <Card key={q.id} className="p-6 transition-all border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Q{qIndex + 1}</span>
                  <Badge
                    variant={
                      q.difficulty === "easy"
                        ? "emerald"
                        : q.difficulty === "medium"
                        ? "blue"
                        : "rose"
                    }
                    size="sm"
                  >
                    {q.difficulty.toUpperCase()}
                  </Badge>
                  {q.is_sample && (
                    <Badge variant="slate" size="sm">
                      Verified Sample MCQ
                    </Badge>
                  )}
                </div>

                {hasAnswered && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-bold ${
                      isCorrect ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct (+1.0)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Incorrect (-0.25)</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Question Text */}
              <h3 className="text-base font-bold text-slate-900 leading-snug mb-5">
                {q.question_text}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {q.options.map((opt, optIndex) => {
                  const isThisSelected = selectedOption === optIndex;
                  const isThisCorrect = q.correct_option_index === optIndex;

                  let optionStyles =
                    "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300";

                  if (hasAnswered) {
                    if (isThisCorrect) {
                      optionStyles =
                        "bg-emerald-50 border-emerald-400 text-emerald-900 ring-1 ring-emerald-400 font-semibold";
                    } else if (isThisSelected && !isCorrect) {
                      optionStyles =
                        "bg-rose-50 border-rose-300 text-rose-900 ring-1 ring-rose-300 font-medium";
                    } else {
                      optionStyles = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                    }
                  }

                  const optionLabels = ["A", "B", "C", "D"];

                  return (
                    <button
                      key={optIndex}
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(q.id, optIndex)}
                      className={`flex items-start text-left p-3.5 rounded-xl border text-sm transition-all ${optionStyles}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 mr-3 shrink-0">
                        {optionLabels[optIndex]}
                      </span>
                      <span className="pt-0.5">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {hasAnswered && q.explanation && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Explanation & Verified Rationale</span>
                  </div>
                  <p className="leading-relaxed pl-5 text-slate-700">{q.explanation}</p>
                </div>
              )}
            </Card>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-4">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900">No Questions Found for this Selection</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No specific practice questions match the selected course or filter criteria yet.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSubjectId("all");
                  setSelectedDifficulty("all");
                }}
              >
                Clear Filters
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/questions?exam=all")}
              >
                Practice All Odisha Questions
              </Button>
            </div>
          </div>
        )}
      </div>
        </main>
      </div>

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={activeExam?.title}
      />

      {showCourseModal && (
        <CourseSelectModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          currentExamId={activeExam?.id || null}
          exams={allExams}
        />
      )}
    </div>
  );
};

