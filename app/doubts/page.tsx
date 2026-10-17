import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getExams, getStudentDoubts } from "@/lib/data-service";
import { DoubtsClient } from "./DoubtsClient";

export const metadata: Metadata = {
  title: "Doubts & Instant Odisha Exam Guidance | OdishaRank",
  description: "Get instant, verified answers to your preparation doubts, syllabus queries, and competitive exam questions from Odisha subject experts.",
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

export default async function DoubtsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login?redirectTo=/doubts");
  }

  const userId = authData.user.id;

  const [profile, allExams, initialDoubts] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
    getStudentDoubts({ userId, includePublicAnswered: true }),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  return (
    <DoubtsClient
      profile={profile}
      metrics={EMPTY_METRICS}
      targetExam={targetExam}
      allExams={allExams}
      initialDoubts={initialDoubts}
      currentUserId={userId}
    />
  );
}
