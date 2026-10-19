import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getMockTests, getExams, getStudentProfile } from "@/lib/data-service";
import { MockTestsClient } from "./MockTestsClient";

export const metadata: Metadata = {
  title: "Mock Test Series & Exam Simulations | OdishaRank",
  description: "Take timed, full-length mock examinations for Odisha competitive recruitment tests (OSSC, OSSSC, OPSC) with real-time scoring.",
};

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams?: { exam?: string };
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/mock-tests");
  }

  const explicitExam = searchParams?.exam;

  // Parallel fetch: all courses, student profile, and mock tests if exam is provided
  const [allExams, profile, prefetchTests] = await Promise.all([
    getExams(),
    getStudentProfile(user.id),
    explicitExam ? getMockTests(explicitExam) : null,
  ]);

  const activeExamId = explicitExam || profile?.target_exam_id || allExams[0]?.id || "";
  const activeExam = allExams.find((e) => e.id === activeExamId) || allExams[0] || null;

  const tests = prefetchTests || (await getMockTests(activeExamId));

  return (
    <MockTestsClient
      profile={profile}
      allExams={allExams}
      activeExam={activeExam}
      tests={tests}
    />
  );
}
