import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminCount } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to claim administrator access." },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const secretProvided = body?.secret?.trim();
    const adminSetupSecret = process.env.ADMIN_SETUP_SECRET?.trim();

    // Check how many admins currently exist
    const adminCount = await getAdminCount();

    // If an admin already exists AND no valid setup secret is supplied, forbid setup
    if (adminCount > 0) {
      if (!adminSetupSecret || secretProvided !== adminSetupSecret) {
        return NextResponse.json(
          {
            error:
              "An administrator account already exists. Please ask an existing administrator to promote your account from the Student Directory.",
          },
          { status: 403 }
        );
      }
    }

    // Provision admin role
    let client: any;
    try {
      client = createAdminClient();
    } catch {
      client = supabase;
    }

    const { error: upsertError } = await client.from("user_roles").upsert(
      {
        user_id: user.id,
        role: "admin",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      return NextResponse.json(
        { error: `Database error updating role: ${upsertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Administrator access successfully granted to ${user.email}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to provision administrator access." },
      { status: 500 }
    );
  }
}
