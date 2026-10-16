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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let navUser = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (user) {
      const [{ data: prof }, isAdmin] = await Promise.all([
        supabase.from("profiles").select("full_name, target_exam_id").eq("id", user.id).maybeSingle(),
        checkIsAdmin(user.id, user.email),
      ]);

      navUser = {
        id: user.id,
        email: user.email || null,
        fullName: prof?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Aspirant",
        targetExamId: prof?.target_exam_id || null,
        isAdmin,
      };
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
