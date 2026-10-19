import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getStudentProfile, getDashboardMetrics, getExams, getPerformanceAnalytics } from "@/lib/data-service";
import { PerformanceClient } from "./PerformanceClient";

export const metadata: Metadata = {
  title: "Performance Analytics & State Rank Estimation | OdishaRank",
  description: "Comprehensive performance metrics, subject accuracy breakdowns, time-per-question analysis, and Odisha competitive rank predictions.",
};

export default async function PerformancePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/performance");
  }

  const userId = user.id;

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
