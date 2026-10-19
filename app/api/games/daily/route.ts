import { NextResponse } from "next/server";
import { getDailyBrainChallenge } from "@/lib/games-service";

export async function GET() {
  try {
    const daily = getDailyBrainChallenge();
    return NextResponse.json({
      success: true,
      daily,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load daily brain challenge" },
      { status: 500 }
    );
  }
}
