import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getStudentProfile, getExams } from "@/lib/data-service";
import { BookmarksClient } from "./BookmarksClient";

export const metadata: Metadata = {
  title: "Bookmarked Questions & Revision Hub | OdishaRank",
  description: "Access your saved questions, revision formulas, and tricky topics for quick review before Odisha state examinations.",
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

export default async function BookmarksPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/bookmarks");
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
    <BookmarksClient
      profile={profile}
      metrics={EMPTY_METRICS}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
