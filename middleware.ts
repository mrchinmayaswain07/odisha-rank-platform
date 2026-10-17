import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );

  const pathname = request.nextUrl.pathname;
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

  // Prevent back-button cache restoration for protected routes
  if (isProtectedRoute) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

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
  // If user has no auth cookie and is visiting a public path, return immediately without querying Supabase!
  if (!hasAuthCookie && !pathname.startsWith("/api/admin")) {
    return response;
  }

  // If Supabase credentials are not live in this environment, allow previewing routes
  if (!isConfigured) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
