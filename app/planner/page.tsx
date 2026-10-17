import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getDashboardMetrics, getExams } from "@/lib/data-service";
import { PlannerClient } from "./PlannerClient";

export const metadata: Metadata = {
  title: "Study Planner & Daily Target Goals | OdishaRank",
  description: "Set daily preparation goals, track study hours, organize weekly schedules, and maintain study streaks for Odisha competitive exams.",
};

import { redirect } from "next/navigation";

export default async function PlannerPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login?redirectTo=/planner");
  }

  const userId = authData.user.id;

  const [profile, allExams] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  const metrics = await getDashboardMetrics(userId, targetExam?.id);

  return (
    <PlannerClient
      profile={profile}
      metrics={metrics}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
