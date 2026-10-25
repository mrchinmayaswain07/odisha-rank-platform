import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getStudentProfile, getExams } from "@/lib/data-service";
import { CalculationTrainerClient } from "./CalculationTrainerClient";

export const metadata: Metadata = {
  title: "Calculation Speed Trainer | OdishaRank Brain Gym",
  description:
    "Master high-speed mental calculations, Vedic shortcuts, and arithmetic agility for OSSC CGL, OSSSC, and OPSC competitive examinations. 10-minute timed sprints with real-time accuracy and weak area diagnostics.",
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

export default async function CalculationTrainerPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/calculation-trainer");
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
    <CalculationTrainerClient
      profile={profile}
      metrics={EMPTY_METRICS}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
