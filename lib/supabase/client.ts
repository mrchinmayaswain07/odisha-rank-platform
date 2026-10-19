import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://axauwfokutymvckamboi.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_VObtutpCMIG-cnoSzWENzg_HXwzK8J8";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
