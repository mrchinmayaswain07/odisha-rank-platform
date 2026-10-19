import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import {
  getStudentGameProfile,
  saveGameSessionResult,
  getDailyBrainChallenge,
  getPersonalizedRecommendations,
} from "@/lib/games-service";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const userId = user?.id || "guest-aspirant";

    const profile = await getStudentGameProfile(userId);
    const dailyChallenge = getDailyBrainChallenge();
    const recommendations = getPersonalizedRecommendations(profile);

    return NextResponse.json({
      success: true,
      profile,
      dailyChallenge,
      recommendations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch game profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const userId = user?.id || "guest-aspirant";

    const body = await request.json();
    const { gameId, category, difficulty, score, timeSeconds, moves, accuracy, won, explanation } = body;

    if (!gameId || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required gameId or category" },
        { status: 400 }
      );
    }

    const { profile, newAchievements } = await saveGameSessionResult(userId, {
      gameId,
      category,
      difficulty: difficulty || "easy",
      score: Number(score) || 0,
      timeSeconds: Number(timeSeconds) || 0,
      moves: Number(moves) || 0,
      accuracy: Number(accuracy) || 100,
      won: Boolean(won),
      explanation,
    });

    return NextResponse.json({
      success: true,
      profile,
      newAchievements,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record game session" },
      { status: 500 }
    );
  }
}
