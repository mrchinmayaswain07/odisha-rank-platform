import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Check if client requested JSON
    const accept = request.headers.get("accept");
    if (accept && accept.includes("application/json")) {
      return NextResponse.json({ success: true, message: "Logged out successfully" });
    }

    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/login`, { status: 302 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to log out" },
      { status: 500 }
    );
  }
}
