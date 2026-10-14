import React from "react";
import { Metadata } from "next";
import { getQuestions, getSubjects } from "@/lib/data-service";
import { QuestionBankClient } from "./QuestionBankClient";

export const metadata: Metadata = {
  title: "Question Bank & Interactive Practice",
  description: "Practice verified MCQs for Odisha Government competitive exams with instant evaluation and detailed explanations.",
};

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams?: { exam?: string; subject?: string; difficulty?: string };
}) {
  const subjects = await getSubjects(searchParams?.exam);
  const questions = await getQuestions({
    examId: searchParams?.exam,
    subjectId: searchParams?.subject,
    difficulty: searchParams?.difficulty,
  });

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

      <QuestionBankClient initialQuestions={questions} subjects={subjects} />
    </div>
  );
}
