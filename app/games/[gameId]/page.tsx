import React from "react";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { getGameById, GameId } from "@odisha-rank/shared";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getStudentProfile, getExams } from "@/lib/data-service";
import { getStudentGameProfile } from "@/lib/games-service";
import { GameArenaClient } from "./GameArenaClient";

interface Props {
  params: { gameId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = getGameById(params.gameId as GameId);
  if (!game) return { title: "Game Not Found | OdishaRank" };

  return {
    title: `${game.title} — Games & Brain Training | OdishaRank`,
    description: game.shortDescription,
  };
}

export default async function GameArenaPage({ params }: Props) {
  const game = getGameById(params.gameId as GameId);
  if (!game) notFound();

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?redirectTo=/games/${params.gameId}`);
  }

  const userId = user.id;
  const [profile, allExams, gameProfile] = await Promise.all([
    getStudentProfile(userId),
    getExams(),
    getStudentGameProfile(userId),
  ]);

  const targetExam = profile?.target_exam_id
    ? allExams.find((e) => e.id === profile.target_exam_id) || null
    : allExams[0] || null;

  return (
    <GameArenaClient
      game={game}
      profile={profile}
      allExams={allExams}
      targetExam={targetExam}
      gameProfile={gameProfile}
    />
  );
}
