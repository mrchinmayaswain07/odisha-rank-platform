import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    default: "OdishaRank | Prepare Today. Rank Tomorrow.",
    template: "%s | OdishaRank",
  },
  description:
    "Production-oriented competitive examination preparation platform for Odisha Government recruitments (OSSC, OSSSC, OPSC). Structured syllabus, verified questions, and measurable preparation tracking.",
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "OdishaRank — Prepare Today. Rank Tomorrow.",
    description:
      "Structured study materials, verified question bank, and real-time mock tests for Odisha Government competitive exams.",
    siteName: "OdishaRank",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OdishaRank — Prepare Today. Rank Tomorrow.",
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
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased text-slate-900 bg-slate-50">
        <Navbar user={user ? { id: user.id, email: user.email } : null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
