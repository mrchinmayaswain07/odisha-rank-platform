import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

// Sole super-administrator who can promote/revoke any student in the Student Directory
export const ROOT_ADMIN_EMAIL = "mrchinmayaswain07@gmail.com";

export async function checkIsAdmin(userId?: string, userEmail?: string | null): Promise<boolean> {
  if (!userId) return false;

  try {
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    // 1. If this is the root platform administrator, automatically ensure role and grant access
    if (userEmail && userEmail.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
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
        console.warn("Could not sync root admin role:", err);
      }
      return true;
    }

    // 2. For all other users, access is ONLY granted if explicitly promoted by root admin in user_roles table
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!error && data?.role === "admin") return true;

    return false;
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<{ user: any; isAdmin: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const isAdmin = await checkIsAdmin(user.id, user.email);
  return { user, isAdmin };
}
