import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/data-service";
import { AdminLayoutClient } from "./AdminLayoutClient";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

  // If live database is configured and user is not signed in
  if (isConfigured && !user) {
    redirect("/login?redirectTo=/admin");
  }

  // If live database is configured and user is signed in but not an admin
  if (isConfigured && user && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white mb-2">Access Denied</h1>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            Your authenticated account (<strong className="text-slate-200">{user.email}</strong>) does not have system administrator privileges. Administrative routes require an explicit entry in the <code className="text-rose-400 font-mono text-[11px] bg-slate-800 px-1 py-0.5 rounded">public.user_roles</code> table.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard">
              <Button className="w-full justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Student Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
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
