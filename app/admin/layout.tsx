import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/data-service";
import { AdminLayoutClient } from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: {
    default: "Admin Portal | OdishaRank",
    template: "%s | OdishaRank Admin",
  },
  description: "Secure, role-based administration portal for Odisha competitive examination catalogs.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isConfigured = isSupabaseConfigured();
  const { user, isAdmin } = await requireAdmin();

  // If unauthenticated, redirect to login
  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  // Normal students are directly redirected to their student dashboard (no access-denied or admin setup screen exposed)
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const userEmail = user?.email || "admin@odisharank.gov.in";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Administrator";

  return (
    <AdminLayoutClient userEmail={userEmail} userName={userName}>
      {children}
    </AdminLayoutClient>
  );
}
