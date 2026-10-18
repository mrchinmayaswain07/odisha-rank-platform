import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getStudentProfile, getDashboardMetrics, getExams } from "@/lib/data-service";
import { PlannerClient } from "./PlannerClient";

export const metadata: Metadata = {
  title: "Study Planner & Daily Target Goals | OdishaRank",
  description: "Set daily preparation goals, track study hours, organize weekly schedules, and maintain study streaks for Odisha competitive exams.",
};

export default async function PlannerPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/planner");
  }

  const [profile, allExams] = await Promise.all([
    getStudentProfile(user.id),
    getExams(),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  const metrics = await getDashboardMetrics(user.id, targetExam?.id);

  return (
    <PlannerClient
      profile={profile}
      metrics={metrics}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
