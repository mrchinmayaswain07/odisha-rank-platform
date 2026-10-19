import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getQuestions, getSubjects, getExams, getStudentProfile } from "@/lib/data-service";
import { QuestionBankClient } from "./QuestionBankClient";
import { getAuthenticatedUser } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Question Bank & Interactive Practice | OdishaRank",
  description: "Practice verified MCQs for Odisha Government competitive exams with instant evaluation and detailed explanations.",
};

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
    getStudentProfile(user.id),
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
    <QuestionBankClient
      profile={profile}
      initialQuestions={questions}
      subjects={subjects}
      allExams={allExams}
      activeExam={activeExam}
    />
  );
}
