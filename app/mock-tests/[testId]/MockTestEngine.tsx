"use client";

import React, { useState, useEffect } from "react";
import { MockTest, Question } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Award,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface MockTestEngineProps {
  test: MockTest;
  questions: Question[];
}

export const MockTestEngine: React.FC<MockTestEngineProps> = ({ test, questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set([questions[0]?.id]));
  const [secondsRemaining, setSecondsRemaining] = useState(test.duration_minutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // Timer countdown
  useEffect(() => {
    if (result || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, result]);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.id];
      return copy;
    });
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    setFlagged((prev) => {
      const copy = new Set(prev);
      if (copy.has(currentQuestion.id)) {
        copy.delete(currentQuestion.id);
      } else {
        copy.add(currentQuestion.id);
      }
      return copy;
    });
  };

  const handleNavigate = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    const targetQ = questions[index];
    if (targetQ) {
      setVisited((prev) => new Set(prev).add(targetQ.id));
    }
    setCurrentIndex(index);
  };

  const handleSubmitTest = async () => {
    setShowSubmitModal(false);
    setIsSubmitting(true);

    const timeSpent = test.duration_minutes * 60 - secondsRemaining;

    try {
      const res = await fetch(`/api/mock-tests/${test.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          time_spent_seconds: timeSpent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      }
    } catch (err) {
      console.error("Submission error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // If result is ready, render the Verified Score Report
  if (result) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle text-center">
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
              result.passed ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            }`}
          >
            <Award className="w-8 h-8" />
          </div>

          <Badge variant={result.passed ? "emerald" : "amber"} size="md" className="mb-2">
            {result.passed ? "QUALIFIED" : "NEEDS REVISION"}
          </Badge>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Mock Test Results
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">{result.test_title}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-left">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Final Score</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {result.score}{" "}
                <span className="text-sm text-slate-400 font-normal">/ {result.total_marks}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Accuracy</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{result.accuracy}%</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Correct / Wrong</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                <span className="text-emerald-600">{result.correct_count}</span> :{" "}
                <span className="text-rose-600">{result.incorrect_count}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase">Time Spent</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {Math.round(result.time_spent_seconds / 60)}m
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Link href="/mock-tests">
              <Button variant="outline">Browse More Mock Tests</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Question-by-Question Review</h3>
          {result.questions_review.map((q: any, i: number) => (
            <Card key={q.question_id} className="p-6 border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                <span
                  className={`text-xs font-bold flex items-center gap-1 ${
                    q.selected_option_index === null
                      ? "text-slate-400"
                      : q.is_correct
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {q.selected_option_index === null ? (
                    "Unanswered (0.0)"
                  ) : q.is_correct ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Correct (+{q.marks_awarded})
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Incorrect ({q.marks_awarded})
                    </>
                  )}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-4">{q.question_text}</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {q.options.map((opt: string, optIdx: number) => {
                  const isCorrect = q.correct_option_index === optIdx;
                  const isSelected = q.selected_option_index === optIdx;

                  let style = "bg-white border-slate-200 text-slate-600";
                  if (isCorrect) {
                    style = "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold";
                  } else if (isSelected && !isCorrect) {
                    style = "bg-rose-50 border-rose-300 text-rose-900";
                  }

                  return (
                    <div key={optIdx} className={`p-3 rounded-lg border text-xs ${style}`}>
                      <span className="font-bold mr-2">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      {opt}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
                  <span className="font-bold text-slate-800">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state if test has no questions yet
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Card className="p-8 border-slate-200 shadow-subtle space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{test.title}</h2>
          <p className="text-sm text-slate-500">
            No questions have been attached to this mock test yet. The administrator is currently preparing the question set.
          </p>
          <div className="pt-4">
            <Link href="/mock-tests">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Return to Mock Tests Catalog
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Active Timed Exam Engine UI
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Main Question Display (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Top Header Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">{test.title}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>&bull;</span>
              <span>Marks: +1.0 / -{test.negative_marking}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
                secondsRemaining < 300
                  ? "bg-rose-50 text-rose-700 animate-pulse border border-rose-200"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Current Question Body */}
        {currentQuestion && (
          <Card className="p-6 sm:p-8 border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="blue" size="sm">
                Question #{currentIndex + 1}
              </Badge>
              <button
                onClick={handleToggleFlag}
                className={`text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                  flagged.has(currentQuestion.id)
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {flagged.has(currentQuestion.id) ? "Marked for Review" : "Mark for Review"}
                </span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-8">
              {currentQuestion.question_text}
            </h3>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((opt, optIndex) => {
                const isSelected = answers[currentQuestion.id] === optIndex;
                const labels = ["A", "B", "C", "D"];

                return (
                  <button
                    key={optIndex}
                    onClick={() => handleSelectOption(optIndex)}
                    className={`w-full flex items-center text-left p-4 rounded-xl border text-sm transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500 font-semibold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mr-3.5 shrink-0 transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {labels[optIndex]}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => handleNavigate(currentIndex - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => handleNavigate(currentIndex + 1)}
                  className="gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {answers[currentQuestion.id] !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearResponse}
                    className="text-slate-500 text-xs"
                  >
                    Clear Response
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Submit Test
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Right Column: Question Palette (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="p-5 border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
            Question Palette
          </h4>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-4 pb-4 border-b border-slate-100 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" />
              <span>Marked Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300" />
              <span>Visited (No Ans)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
              <span>Not Visited</span>
            </div>
          </div>

          {/* Grid buttons */}
          <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isFlagged = flagged.has(q.id);
              const isVisited = visited.has(q.id);
              const isCurrent = currentIndex === idx;

              let btnStyle = "bg-slate-100 text-slate-700 border-slate-200";

              if (isFlagged) {
                btnStyle = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
              } else if (isAnswered) {
                btnStyle = "bg-emerald-600 text-white border-transparent font-bold";
              } else if (isVisited) {
                btnStyle = "bg-slate-200 text-slate-800 border-slate-300";
              }

              if (isCurrent) {
                btnStyle += " ring-2 ring-blue-500 ring-offset-1";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => handleNavigate(idx)}
                  className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 justify-center"
              onClick={() => setShowSubmitModal(true)}
            >
              Submit & View Score
            </Button>
          </div>
        </Card>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Submit Examination?</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              You have answered{" "}
              <span className="font-bold text-emerald-600">{Object.keys(answers).length}</span> out of{" "}
              <span className="font-bold text-slate-900">{questions.length}</span> questions.
              Once submitted, your answers will be evaluated on the server and cannot be modified.
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowSubmitModal(false)}>
                Resume Test
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                isLoading={isSubmitting}
                onClick={handleSubmitTest}
              >
                Yes, Submit Test
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
