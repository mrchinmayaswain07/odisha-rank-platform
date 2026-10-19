import { NextResponse } from "next/server";
import { filterGames, GAMES_CATALOG } from "@odisha-rank/shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") || "all") as any;
    const access = (searchParams.get("access") || "all") as any;
    const search = searchParams.get("search") || "";

    const games = filterGames(category, access, search);

    return NextResponse.json({
      success: true,
      total: games.length,
      games,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load games catalog" },
      { status: 500 }
    );
  }
}
