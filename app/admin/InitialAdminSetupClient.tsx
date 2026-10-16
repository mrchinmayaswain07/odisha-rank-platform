"use client";

import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface InitialAdminSetupClientProps {
  userEmail: string;
  adminCount: number;
}

export const InitialAdminSetupClient: React.FC<InitialAdminSetupClientProps> = ({
  userEmail,
  adminCount,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClaim = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/setup-initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to claim administrator privileges.");
        setIsLoading(false);
      } else {
        setSuccess(data.message || "Administrator role provisioned successfully!");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1200);
      }
    } catch {
      setError("Network error connecting to setup endpoint.");
      setIsLoading(false);
    }
  };

  if (adminCount > 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Access Denied</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your authenticated account (<strong className="text-slate-200">{userEmail}</strong>) does not have system administrator privileges.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">How to get access:</div>
            <div>&bull; Ask an existing administrator to promote you from the <strong>Student Directory</strong>.</div>
            <div>&bull; Or run this SQL in Supabase SQL editor:</div>
            <code className="block bg-slate-900 p-2 rounded text-blue-400 font-mono text-[10px] break-all">
              INSERT INTO public.user_roles (user_id, role) SELECT id, &apos;admin&apos; FROM auth.users WHERE email = &apos;{userEmail}&apos; ON CONFLICT (user_id) DO UPDATE SET role = &apos;admin&apos;;
            </code>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {showSecretInput ? (
            <div className="space-y-2 text-left pt-2">
              <label className="text-[11px] font-medium text-slate-300">
                Setup Secret Key (from environment)
              </label>
              <input
                type="password"
                placeholder="Enter ADMIN_SETUP_SECRET"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
              />
              <Button
                onClick={handleClaim}
                disabled={isLoading || !secret.trim()}
                className="w-full justify-center text-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Claim Admin"}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowSecretInput(true)}
              className="text-[11px] text-slate-500 hover:text-slate-400 underline block mx-auto"
            >
              Have a setup secret?
            </button>
          )}

          <div className="pt-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-center gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Student Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Initial Administrator Claim
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-blue-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>

        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            Initial Platform Setup
          </span>
          <h1 className="text-xl font-extrabold text-white mt-3">
            Claim Administrator Access
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed mt-2">
            No system administrator has been registered yet for this OdishaRank instance. You are logged in as <strong className="text-white">{userEmail}</strong>.
          </p>
        </div>

        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
          <div className="font-bold text-white flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Administrator Privileges Include:</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
            <li>Curriculum & syllabus hierarchy management</li>
            <li>Verified question bank creation & bulk import</li>
            <li>Study materials & PDF publishing</li>
            <li>Full student registry & role assignments</li>
          </ul>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs text-rose-300 rounded-lg">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{success} Redirecting to Mission Control...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={handleClaim}
              disabled={isLoading}
              className="w-full justify-center gap-2 py-2.5 font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Claim Initial Administrator Role</span>
            </Button>

            <Link href="/dashboard" className="block">
              <Button
                variant="ghost"
                className="w-full justify-center text-xs text-slate-400 hover:text-slate-300"
              >
                Skip for now & go to student portal
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
