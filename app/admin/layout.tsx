import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/data-service";
import { AdminLayoutClient } from "./AdminLayoutClient";
import { InitialAdminSetupClient } from "./InitialAdminSetupClient";

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
  const { user, isAdmin, adminCount } = await requireAdmin();

  // If live database is configured and user is not signed in
  if (isConfigured && !user) {
    redirect("/login?redirectTo=/admin");
  }

  // If live database is configured and user is signed in but not an admin
  if (isConfigured && user && !isAdmin) {
    return (
      <InitialAdminSetupClient
        userEmail={user.email || "aspirant@odisharank.in"}
        adminCount={adminCount}
      />
    );
  }

  const userEmail = user?.email || "admin@odisharank.gov.in";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Administrator";

  return (
    <AdminLayoutClient userEmail={userEmail} userName={userName}>
      {children}
    </AdminLayoutClient>
  );
}
