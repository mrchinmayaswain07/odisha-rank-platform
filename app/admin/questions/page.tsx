import React from "react";
import { Metadata } from "next";
import { getPaginatedQuestions, getExams, getSubjects, getStudentDoubts } from "@/lib/data-service";
import { QuestionManagerClient } from "./QuestionManagerClient";

export const metadata: Metadata = {
  title: "Question Bank & Student Doubts Management",
  description: "Curate verified multiple-choice questions, difficulty tiers, and answer student questions & doubts.",
};

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams?: { page?: string; exam?: string; subject?: string; tab?: string };
}) {
  const page = searchParams?.page ? Number(searchParams.page) : 1;

  const [initialResult, exams, subjects, initialDoubts] = await Promise.all([
    getPaginatedQuestions({
      page,
      pageSize: 10,
      examId: searchParams?.exam,
      subjectId: searchParams?.subject,
    }),
    getExams(true),
    getSubjects(undefined, true),
    getStudentDoubts({ isAdmin: true }),
  ]);

  return (
    <QuestionManagerClient
      initialResult={initialResult}
      exams={exams}
      subjects={subjects}
      initialDoubts={initialDoubts}
      initialTab={searchParams?.tab === "doubts" ? "doubts" : "mcqs"}
    />
  );
}
