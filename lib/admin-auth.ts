import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export async function getAdminCount(): Promise<number> {
  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const { count, error } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function checkIsAdmin(userId?: string, userEmail?: string | null): Promise<boolean> {
  if (!userId) return false;

  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!error && data?.role === "admin") return true;

    // Check optional ADMIN_EMAILS environment variable
    if (userEmail && process.env.ADMIN_EMAILS) {
      const allowed = process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase());
      if (allowed.includes(userEmail.toLowerCase())) {
        try {
          await supabase.from("user_roles").upsert(
            {
              user_id: userId,
              role: "admin",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch {}
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<{ user: any; isAdmin: boolean; adminCount: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false, adminCount: 0 };
  }

  const isAdmin = await checkIsAdmin(user.id, user.email);
  const adminCount = isAdmin ? 1 : await getAdminCount();
  return { user, isAdmin, adminCount };
}
