import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getDashboardMetrics, getExams } from "@/lib/data-service";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Student Dashboard & Preparation Analytics",
  description: "Track your authentic study hours, questions practiced, mock test scores, and syllabus completion.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  // If Supabase is configured and user is not logged in, redirect to login
  const userId = authData.user?.id || "demo-student-id";

  const profile = await getStudentProfile(userId);
  const metrics = await getDashboardMetrics(userId);
  const exams = await getExams();

  const targetExam = exams.find((e) => e.id === profile?.target_exam_id) || exams[0] || null;

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <DashboardClient
        profile={profile}
        metrics={metrics}
        targetExam={targetExam}
      />
    </div>
  );
}
