import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStudentProfile, getDashboardMetrics, getExams } from "@/lib/data-service";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Student Dashboard & Personalized Analytics",
  description: "Track your authentic study hours, questions practiced, mock test scores, and course-specific syllabus completion.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const userId = authData.user.id;

  // Parallel fetch: profile and exams
  const [profile, allExams] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
  ]);

  // Determine active course
  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : null;

  // Calculate metrics strictly scoped to active course
  const metrics = await getDashboardMetrics(userId, targetExam?.id);

  return (
    <DashboardClient
      profile={profile}
      metrics={metrics}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
