import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStudentProfile, getExams } from "@/lib/data-service";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "Student Profile & Target Configuration",
  description: "View and edit your OdishaRank student profile, target examination, and academic details.",
};

import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect("/login?redirectTo=/profile");
  }

  const userId = authData.user.id;
  const profile = (await getStudentProfile(userId)) || {
    id: userId,
    email: authData.user.email || "student@odisharank.in",
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

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ProfileClient initialProfile={profile} exams={exams} />
    </div>
  );
}
