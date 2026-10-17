import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getDashboardMetrics, getExams } from "@/lib/data-service";
import { CoursesClient } from "./CoursesClient";

export const metadata: Metadata = {
  title: "My Courses & Target Odisha Examinations | OdishaRank",
  description: "Browse official examination courses, switch active exam preparations, and view stage-wise syllabus patterns for OPSC, OSSC, and OSSSC.",
};

export default async function CoursesPage() {
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
    <CoursesClient
      profile={profile}
      metrics={metrics}
      targetExam={targetExam}
      allExams={allExams}
    />
  );
}
