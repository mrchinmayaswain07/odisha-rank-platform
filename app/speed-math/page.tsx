import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getStudentProfile, getExams } from "@/lib/data-service";
import { SpeedMathClient } from "./SpeedMathClient";

export const metadata: Metadata = {
  title: "Speed Calculation & Mental Math Practice | OdishaRank",
  description:
    "Master fast mental calculations, BODMAS, square roots, cube roots, percentage fractions, and DI additions for OSSC CGL, OSSSC, and OPSC examinations.",
};

const EMPTY_METRICS: any = {
  study_hours: 0,
  questions_practiced: 0,
  accuracy_percentage: 0,
  mock_tests_completed: 0,
  study_streak_days: 0,
  official_progress_percentage: 0,
  personal_progress_percentage: 0,
  total_official_topics: 0,
  completed_official_topics: 0,
  total_personal_topics: 0,
  completed_personal_topics: 0,
  recent_activities: [],
  subject_progress: [],
};

export default async function SpeedMathPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/speed-math");
  }

  const userId = user.id;

  const [profile, allExams] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  return (
    <SpeedMathClient
      profile={profile}
      metrics={EMPTY_METRICS}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
