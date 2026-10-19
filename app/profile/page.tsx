import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getStudentProfile, getExams } from "@/lib/data-service";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "Student Profile & Target Configuration",
  description: "View and edit your OdishaRank student profile, target examination, and academic details.",
};

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  const userId = user.id;
  const profile = (await getStudentProfile(userId)) || {
    id: userId,
    email: user.email || "student@odisharank.in",
    full_name: "Aspirant Scholar",
    target_exam_id: null,
    target_year: 2026,
    district: "Khordha (Bhubaneswar)",
    phone: null,
    bio: null,
    is_profile_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const exams = await getExams();

  return <ProfileClient initialProfile={profile} exams={exams} />;
}

