"use client";

import React, { useState } from "react";
import { Question, Subject } from "@/lib/types";
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
} from "lucide-react";

interface QuestionBankClientProps {
  initialQuestions: Question[];
  subjects: Subject[];
}

export const QuestionBankClient: React.FC<QuestionBankClientProps> = ({
  initialQuestions,
  subjects,
}) => {
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
    // If already answered, let them change or lock it
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleResetSession = () => {
    setUserAnswers({});
  };

  return (
    <div className="space-y-8">
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
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Questions Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No practice questions match the selected subject or difficulty criteria. Try clearing filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
