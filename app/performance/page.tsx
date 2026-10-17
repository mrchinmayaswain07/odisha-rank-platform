import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getDashboardMetrics, getExams, getPerformanceAnalytics } from "@/lib/data-service";
import { PerformanceClient } from "./PerformanceClient";

export const metadata: Metadata = {
  title: "Performance Analytics & State Rank Estimation | OdishaRank",
  description: "Comprehensive performance metrics, subject accuracy breakdowns, time-per-question analysis, and Odisha competitive rank predictions.",
};

import { redirect } from "next/navigation";

export default async function PerformancePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login?redirectTo=/performance");
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
  const analytics = await getPerformanceAnalytics(userId, targetExam?.id, metrics);

  return (
    <PerformanceClient
      profile={profile}
      metrics={metrics}
      analytics={analytics}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
