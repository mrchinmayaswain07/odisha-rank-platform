import React from "react";
import { Metadata } from "next";
import { getQuestions, getSubjects, getExams, getStudentProfile } from "@/lib/data-service";
import { QuestionBankClient } from "./QuestionBankClient";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Question Bank & Interactive Practice",
  description: "Practice verified MCQs for Odisha Government competitive exams with instant evaluation and detailed explanations.",
};

import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth-server";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams?: { exam?: string; subject?: string; difficulty?: string };
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/questions");
  }

  // Parallel fetch: all exams & student profile
  const [allExams, profile] = await Promise.all([
    getExams(),
    user ? getStudentProfile(user.id) : null,
  ]);

  // Determine active course
  const isAllExams = searchParams?.exam === "all";
  const activeExamId = isAllExams ? "" : (searchParams?.exam || profile?.target_exam_id || allExams[0]?.id || "");
  const activeExam = isAllExams ? null : (allExams.find((e) => e.id === activeExamId) || (activeExamId ? allExams[0] : null));

  // Parallel fetch: subjects and questions for active exam
  const [subjects, questions] = await Promise.all([
    activeExamId ? getSubjects(activeExamId) : getSubjects(),
    getQuestions({
      examId: activeExamId || undefined,
      subjectId: searchParams?.subject,
      difficulty: searchParams?.difficulty,
    }),
  ]);

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Odisha Competitive Question Bank
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Practice multiple-choice questions curated for OSSC, OSSSC, and OPSC examinations.
          Select an option to immediately evaluate your answer and study the detailed explanation.
        </p>
      </div>

      <QuestionBankClient
        initialQuestions={questions}
        subjects={subjects}
        allExams={allExams}
        activeExam={activeExam}
      />
    </div>
  );
}
