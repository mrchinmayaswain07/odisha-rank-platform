import React from "react";
import { Metadata } from "next";
import { getPaginatedQuestions, getExams, getSubjects } from "@/lib/data-service";
import { QuestionManagerClient } from "./QuestionManagerClient";

export const metadata: Metadata = {
  title: "Question Bank & Evaluation Management",
  description: "Curate verified multiple-choice questions, difficulty tiers, and manage CSV bulk imports.",
};

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams?: { page?: string; exam?: string; subject?: string };
}) {
  const page = searchParams?.page ? Number(searchParams.page) : 1;

  const [initialResult, exams, subjects] = await Promise.all([
    getPaginatedQuestions({
      page,
      pageSize: 10,
      examId: searchParams?.exam,
      subjectId: searchParams?.subject,
    }),
    getExams(true),
    getSubjects(undefined, true),
  ]);

  return (
    <QuestionManagerClient
      initialResult={initialResult}
      exams={exams}
      subjects={subjects}
    />
  );
}
