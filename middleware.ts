import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

interface FastSession {
  userId: string;
  email: string;
  exp: number;
}

/**
 * Parses Supabase auth session directly from cookies with 0ms network latency.
 * Avoids expensive round-trip HTTP requests to Supabase auth servers on every navigation.
 */
function parseSupabaseSession(request: NextRequest): FastSession | null {
  try {
    const allCookies = request.cookies.getAll();
    const authCookies = allCookies
      .filter((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (authCookies.length === 0) return null;

    let rawVal = authCookies.map((c) => c.value).join("");
    if (!rawVal) return null;

    // Handle base64- prefix used by modern @supabase/ssr
    if (rawVal.startsWith("base64-")) {
      const b64 = rawVal.slice(7);
      const decoded = Buffer.from(b64, "base64").toString("utf-8");
      rawVal = decoded;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawVal);
    } catch {
      try {
        parsed = JSON.parse(decodeURIComponent(rawVal));
      } catch {
        return null;
      }
    }

    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
    if (!accessToken || typeof accessToken !== "string") return null;

    // Split JWT and decode payload
    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;

    const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    if (!payload?.sub) return null;

    return {
      userId: payload.sub,
      email: payload.email || "",
      exp: payload.exp || 0,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  requestHeaders.set("x-pathname", pathname);
  const ROOT_ADMIN_EMAIL = "mrchinmayaswain07@gmail.com";

  // Comprehensive list of strictly protected student & administrator paths
  const PROTECTED_PREFIXES = [
    "/dashboard",
    "/doubts",
    "/syllabus",
    "/materials",
    "/performance",
    "/questions",
    "/mock-tests",
    "/bookmarks",
    "/courses",
    "/planner",
    "/profile",
    "/admin",
  ];

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Check if any Supabase auth cookies are present in request
  const hasAuthCookie = request.cookies.getAll().some(
    (c) =>
      (c.name.startsWith("sb-") || c.name.includes("auth-token")) &&
      c.value &&
      c.value.trim() !== ""
  );

  // Zero-latency fast-path for unauthenticated users accessing protected routes:
  // If there are no auth cookies at all, redirect to login immediately without making any network calls!
  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fast-path for guest browsing public paths:
  // If user has no auth cookie and is visiting a public path, return immediately!
  if (!hasAuthCookie && !pathname.startsWith("/api/admin")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );

  // If Supabase credentials are not live in this environment, allow previewing routes
  if (!isConfigured) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Step 1: Fast in-memory session inspection (0ms latency)
  const fastSession = parseSupabaseSession(request);
  const nowSec = Math.floor(Date.now() / 1000);
  const isFastSessionValid = Boolean(fastSession && fastSession.exp > nowSec + 30);

  let user: { id: string; email?: string | null } | null = null;
  let responseCookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = [];

  if (isFastSessionValid && fastSession) {
    user = {
      id: fastSession.userId,
      email: fastSession.email,
    };
    requestHeaders.set("x-user-id", fastSession.userId);
    requestHeaders.set("x-user-email", fastSession.email);
  } else {
    // Step 2: Fallback to full Supabase SSR client only if token is expired or parsing failed
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          responseCookiesToSet.push({ name, value, options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          responseCookiesToSet.push({ name, value: "", options });
        },
      },
    });

    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user || null;

    if (user) {
      requestHeaders.set("x-user-id", user.id);
      requestHeaders.set("x-user-email", user.email || "");
    }
  }

  // If visiting login or register while already authenticated, redirect appropriately
  if ((pathname === "/login" || pathname === "/register") && user) {
    const isRootAdmin = user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
    const targetUrl = new URL(isRootAdmin ? "/admin" : "/dashboard", request.url);
    return NextResponse.redirect(targetUrl);
  }

  // If accessing a protected route without valid user session, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Strict role check for /admin routes: only root administrator or promoted admin users can access /admin
  if (pathname.startsWith("/admin") && user) {
    const isRootAdmin = user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
    if (!isRootAdmin) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      });

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleRow || roleRow.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Apply any session cookies refreshed during SSR fallback
  for (const c of responseCookiesToSet) {
    response.cookies.set(c.name, c.value, c.options);
  }

  // Cache optimization:
  // For full document navigations, enforce private revalidation without breaking Next.js router cache
  const isRscRequest = request.headers.get("RSC") === "1" || request.nextUrl.searchParams.has("_rsc");
  if (isProtectedRoute && !isRscRequest) {
    response.headers.set("Cache-Control", "private, no-cache, no-transform");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png
     * - static public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
