import React from "react";
import { Metadata } from "next";
import { getExams, getSubjects, getStudentDoubts } from "@/lib/data-service";
import { StudentQuestionsManager } from "../questions/StudentQuestionsManager";

export const metadata: Metadata = {
  title: "Student Questions & Doubts Management | OdishaRank Admin",
  description: "View, answer, and manage student questions and competitive exam queries.",
};

export default async function AdminDoubtsPage() {
  const [exams, subjects, initialDoubts] = await Promise.all([
    getExams(true),
    getSubjects(undefined, true),
    getStudentDoubts({ isAdmin: true }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Student Doubts & Questions Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review, answer, and clarify student preparation queries with verified faculty explanations.
        </p>
      </div>

      <StudentQuestionsManager
        initialDoubts={initialDoubts}
        exams={exams}
        subjects={subjects}
      />
    </div>
  );
}
