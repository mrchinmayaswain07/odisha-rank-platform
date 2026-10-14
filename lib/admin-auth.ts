import { createClient } from "./supabase/server";

export async function checkIsAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}
