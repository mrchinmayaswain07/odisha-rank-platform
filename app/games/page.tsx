import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getStudentProfile, getExams } from "@/lib/data-service";
import { getStudentGameProfile, getDailyBrainChallenge, getPersonalizedRecommendations } from "@/lib/games-service";
import { GamesClient } from "./GamesClient";

export const metadata: Metadata = {
  title: "Games & Brain Training | OdishaRank",
  description:
    "32 interactive math, memory, logic, and pattern games designed to boost mental calculation speed, reasoning agility, and problem-solving skills for OSSC CGL, OSSSC, and OPSC examinations.",
};

export default async function GamesPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/games");
  }

  const userId = user.id;

  const [profile, allExams, gameProfile, dailyChallenge] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
    getStudentGameProfile(userId),
    getDailyBrainChallenge(),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  const recommendations = getPersonalizedRecommendations(gameProfile);

  return (
    <GamesClient
      profile={profile}
      allExams={allExams}
      targetExam={targetExam}
      gameProfile={gameProfile}
      dailyChallenge={dailyChallenge}
      recommendations={recommendations}
    />
  );
}
