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

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams?: { exam?: string; category?: string; q?: string };
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const userId = authData.user?.id || "demo-student-id";

  const [profile, allExams, subjects] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
    getSubjects(),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  const metrics = await getDashboardMetrics(userId, targetExam?.id);

  // Fetch only published study materials (draft and archived excluded) for eligible students
  const publishedMaterials = await getStudyMaterials({
    status: "published",
    examId: searchParams?.exam || targetExam?.id,
  });

  return (
    <MaterialsClient
      profile={profile}
      metrics={metrics}
      targetExam={targetExam}
      allExams={allExams}
      subjects={subjects}
      initialMaterials={publishedMaterials}
    />
  );
}
