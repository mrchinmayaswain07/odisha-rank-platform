import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getDashboardMetrics, getExams } from "@/lib/data-service";
import { BookmarksClient } from "./BookmarksClient";

export const metadata: Metadata = {
  title: "Bookmarked Questions & Revision Hub | OdishaRank",
  description: "Access your saved questions, revision formulas, and tricky topics for quick review before Odisha state examinations.",
};

export default async function BookmarksPage() {
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

  const metrics = await getDashboardMetrics(userId, targetExam?.id);

  return (
    <BookmarksClient
      profile={profile}
      metrics={metrics}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
