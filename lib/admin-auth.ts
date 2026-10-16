import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export const PRIMARY_ADMIN_EMAILS = [
  "mrchinmayaswain07@gmail.com",
];

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

    if (error) return PRIMARY_ADMIN_EMAILS.length;
    return count ?? PRIMARY_ADMIN_EMAILS.length;
  } catch {
    return PRIMARY_ADMIN_EMAILS.length;
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

    // Check pre-configured primary admin emails or ADMIN_EMAILS environment variable
    const envEmails = process.env.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
      : [];
    const allAdminEmails = Array.from(
      new Set([...PRIMARY_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...envEmails])
    );

    if (userEmail && allAdminEmails.includes(userEmail.toLowerCase())) {
      try {
        await supabase.from("user_roles").upsert(
          {
            user_id: userId,
            role: "admin",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (err) {
        console.warn("Could not upsert admin role for primary admin:", err);
      }
      return true;
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
