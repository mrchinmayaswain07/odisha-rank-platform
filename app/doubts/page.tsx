import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getDashboardMetrics, getExams, getStudentDoubts } from "@/lib/data-service";
import { DoubtsClient } from "./DoubtsClient";

export const metadata: Metadata = {
  title: "Doubts & Instant Odisha Exam Guidance | OdishaRank",
  description: "Get instant, verified answers to your preparation doubts, syllabus queries, and competitive exam questions from Odisha subject experts.",
};

export default async function DoubtsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const userId = authData.user?.id || "demo-student-id";

  const [profile, allExams, initialDoubts] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
    getStudentDoubts({ userId, includePublicAnswered: true }),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  const metrics = await getDashboardMetrics(userId, targetExam?.id);

  return (
    <DoubtsClient
      profile={profile}
      metrics={metrics}
      targetExam={targetExam}
      allExams={allExams}
      initialDoubts={initialDoubts}
      currentUserId={userId}
    />
  );
}
