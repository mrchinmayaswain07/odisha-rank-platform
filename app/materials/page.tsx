import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getStudentProfile,
  getDashboardMetrics,
  getExams,
  getSubjects,
  getStudyMaterials,
} from "@/lib/data-service";
import { MaterialsClient } from "./MaterialsClient";

export const metadata: Metadata = {
  title: "Study Materials, Notes & PYQ Papers | OdishaRank",
  description: "Access verified study notes, formula sheets, previous year question papers (PYQs), and Odisha GK handbooks for OPSC, OSSC, and OSSSC exams.",
};

import { redirect } from "next/navigation";

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

import { getAuthenticatedUser } from "@/lib/auth-server";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams?: { exam?: string; category?: string; q?: string };
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/materials");
  }

  const userId = user.id;

  const [profile, allExams, subjects, publishedMaterials] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
    getSubjects(),
    getStudyMaterials({ status: "published" }),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  return (
    <MaterialsClient
      profile={profile}
      metrics={EMPTY_METRICS}
      targetExam={targetExam}
      allExams={allExams}
      subjects={subjects}
      initialMaterials={publishedMaterials}
      initialExamId={searchParams?.exam}
    />
  );
}
