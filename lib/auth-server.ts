import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "./supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

/**
 * High-performance cached user resolution for Server Components and Route Handlers.
 * 
 * 1. Checks for 'x-user-id' and 'x-user-email' forwarded by Next.js middleware (0ms network latency).
 * 2. Falls back to createClient().auth.getUser() if headers are absent.
 * 3. Wrapped with React cache() to deduplicate execution across Server Components in the same request.
 */
export const getAuthenticatedUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    const headerList = headers();
    const headerUserId = headerList.get("x-user-id");
    const headerUserEmail = headerList.get("x-user-email");

    if (headerUserId) {
      return {
        id: headerUserId,
        email: headerUserEmail || null,
      };
    }
  } catch {
    // headers() might not be available in all contexts
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || null,
    };
  } catch {
    return null;
  }
});
