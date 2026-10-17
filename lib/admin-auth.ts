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

    // 1. Resolve user email if not directly provided
    if (!userEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle();
      if (profile?.email) {
        userEmail = profile.email;
      }
    }

    // 2. Strictly ROOT_ADMIN_EMAIL is authorized as platform administrator
    const isRootAdmin = Boolean(
      userEmail && userEmail.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()
    );

    if (isRootAdmin) {
      // Asynchronously ensure database record without blocking page rendering
      supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: "admin",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .then(() => {})
        .catch(() => {});
      return true;
    }

    // No other user has administrator privileges
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
