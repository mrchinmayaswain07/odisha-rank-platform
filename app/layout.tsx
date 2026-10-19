import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/admin-auth";
import { SITE_CONFIG } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "Odisha Government Exams",
    "OSSC CGL",
    "OSSSC RI AMIN",
    "OPSC OAS",
    "Odisha GK",
    "Mock Tests Odisha",
    "Competitive Exam Preparation",
  ],
  authors: [{ name: "OdishaRank Editorial & Engineering Team" }],
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description:
      "Structured study materials, verified question bank, and real-time mock tests for Odisha Government competitive exams.",
    siteName: SITE_CONFIG.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description:
      "Target OSSC, OSSSC, and OPSC recruitments with structured syllabus tracking and authentic mock tests.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

import { headers } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth-server";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let navUser = null;

  try {
    const headerList = headers();
    const pathname = headerList.get("x-pathname") || "";
    const isPortalRoute =
      pathname.startsWith("/admin") ||
      [
        "/dashboard",
        "/planner",
        "/courses",
        "/materials",
        "/performance",
        "/bookmarks",
        "/doubts",
        "/speed-math",
        "/games",
        "/mock-tests",
        "/questions",
        "/profile",
        "/syllabus",
      ].some((p) => pathname === p || pathname.startsWith(`${p}/`));

    // Zero-latency optimization: Navbar and Footer return null on portal/admin routes.
    // Completely bypass DB queries on portal routes!
    if (!isPortalRoute) {
      const user = await getAuthenticatedUser();

      if (user) {
        const ROOT_ADMIN_EMAIL = "mrchinmayaswain07@gmail.com";
        const isRootAdmin = user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

        const supabase = await createClient();
        const [{ data: prof }, isAdmin] = await Promise.all([
          supabase.from("profiles").select("full_name, target_exam_id").eq("id", user.id).maybeSingle(),
          isRootAdmin ? true : checkIsAdmin(user.id, user.email || undefined),
        ]);

        navUser = {
          id: user.id,
          email: user.email || null,
          fullName: prof?.full_name || user.email?.split("@")[0] || "Aspirant",
          targetExamId: prof?.target_exam_id || null,
          isAdmin,
        };
      }
    }
  } catch {
    navUser = null;
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased text-slate-900 bg-slate-50 selection:bg-blue-600 selection:text-white">
        <Navbar user={navUser} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
