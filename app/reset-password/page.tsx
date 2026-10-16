"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GraduationCap, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

type ResetFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");

    if (code) {
      // PKCE code exchange in browser
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        setIsVerifyingSession(false);
        if (error) {
          setAuthError("Password recovery link has expired or is invalid. Please request a new link.");
        } else {
          setHasSession(true);
        }
      });
    } else {
      // Check existing session or auth state change
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsVerifyingSession(false);
        if (session) {
          setHasSession(true);
        } else {
          // Listen for recovery event from hash fragment
          const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" || session) {
              setHasSession(true);
              setAuthError(null);
            }
          });

          // If no event fired within 1.5s, notify user
          setTimeout(() => {
            if (!hasSession) {
              supabase.auth.getSession().then(({ data: { session: s } }) => {
                if (!s) {
                  setAuthError(
                    "No active password reset session found. Please click the reset link sent to your email, or request a new one."
                  );
                } else {
                  setHasSession(true);
                }
              });
            }
          }, 1500);

          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      });
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch {
      setAuthError("Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="text-center py-8 text-xs text-slate-500">
        Verifying secure reset authorization...
      </div>
    );
  }

  return (
    <Card className="p-8 border-slate-200">
      {isSuccess ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Password Updated Successfully</h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Your password has been changed. You can now log into your OdishaRank student account with your new credentials.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button size="sm">Go to Login</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
              <div className="pl-6">
                <Link
                  href="/forgot-password"
                  className="font-bold text-rose-900 underline hover:text-rose-950 text-xs"
                >
                  Click here to send a new reset email &rarr;
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                New Password (min. 6 characters)
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                {...register("password")}
              />
              {errors.password?.message && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                {...register("confirm_password")}
              />
              {errors.confirm_password?.message && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full justify-center mt-2" size="lg" isLoading={isLoading}>
              Update Password
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Enter your new secure password below.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
