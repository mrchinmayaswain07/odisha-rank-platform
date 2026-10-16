"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Exam } from "@/lib/types";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react";

interface CourseSelectModalProps {
  isOpen: boolean;
  onClose?: () => void;
  exams: Exam[];
  currentExamId?: string | null;
  isRequired?: boolean;
}

export const CourseSelectModal: React.FC<CourseSelectModalProps> = ({
  isOpen,
  onClose,
  exams,
  currentExamId,
  isRequired = false,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(currentExamId || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSaveCourse = async () => {
    if (!selectedExamId) {
      setError("Please select a target examination to continue.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_exam_id: selectedExamId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update target course");
      }

      if (onClose) onClose();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred while saving your target course.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-blue-600">
                Personalized Preparation
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isRequired ? "Select Your Target Examination" : "Change Your Target Examination"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Your dashboard, syllabus, question bank, and mock tests will be instantly personalized to your selected course.
            </p>
          </div>

          {!isRequired && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Exams List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {exams.map((exam) => {
            const isSelected = selectedExamId === exam.id;
            return (
              <div
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {exam.conducting_body}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{exam.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {exam.description}
                    </p>
                    {exam.eligibility && (
                      <p className="text-[11px] text-slate-500 mt-2 font-medium">
                        <strong className="text-slate-700">Eligibility:</strong> {exam.eligibility}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 mt-1">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {exams.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              No examination courses are currently published.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            You can change this course anytime without losing your historical progress.
          </p>

          <div className="flex items-center gap-2">
            {!isRequired && onClose && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedExamId || isSaving}
              onClick={handleSaveCourse}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Personalizing...</span>
                </>
              ) : (
                <>
                  <span>Confirm Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
