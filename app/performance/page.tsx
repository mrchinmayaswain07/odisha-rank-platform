import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getDashboardMetrics, getExams, getPerformanceAnalytics } from "@/lib/data-service";
import { PerformanceClient } from "./PerformanceClient";

export const metadata: Metadata = {
  title: "Performance Analytics & State Rank Estimation | OdishaRank",
  description: "Comprehensive performance metrics, subject accuracy breakdowns, time-per-question analysis, and Odisha competitive rank predictions.",
};

export default async function PerformancePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const userId = authData.user?.id || "demo-student-id";

  const [profile, allExams] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  const [metrics, analytics] = await Promise.all([
    getDashboardMetrics(userId, targetExam?.id),
    getPerformanceAnalytics(userId, targetExam?.id),
  ]);

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
