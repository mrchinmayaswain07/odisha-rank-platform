"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const ROOT_ADMIN_EMAIL = "mrchinmayaswain07@gmail.com";

  // Check if user is already signed in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setLoggedInUser(data.user);
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        const isUserAdmin =
          Boolean(roleData) ||
          data.user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
        setIsAdmin(Boolean(isUserAdmin));
      }
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      });

      if (error) {
        setAuthError(error.message);
      } else if (signUpData.user && signUpData.session) {
        // Logged in immediately
        window.location.href = "/profile";
      } else {
        // Confirmation email sent
        setIsSuccess(true);
      }
    } catch {
      setAuthError("Unable to communicate with the authentication service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-md mx-auto mb-3">
            <Image
              src="/logo.png"
              alt="OdishaRank Logo"
              width={56}
              height={56}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {loggedInUser ? "Active Session Detected" : "Create Student Account"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {loggedInUser
              ? "You are currently signed in to OdishaRank. Continue to your dashboard or switch accounts."
              : "Join OdishaRank and begin tracking your competitive examination progress."}
          </p>
        </div>

        {loggedInUser ? (
          <Card className="p-8 border-slate-200 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Already Signed In
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                You are currently logged in as <strong className="text-slate-800">{loggedInUser.email}</strong>
              </p>
              {isAdmin && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>System Administrator Account</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {isAdmin && (
                <Button
                  onClick={() => (window.location.href = "/admin")}
                  className="w-full justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enter Administrator Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}

              <Button
                onClick={() => (window.location.href = "/dashboard")}
                variant="primary"
                className="w-full justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                variant="outline"
                className="w-full justify-center text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Log Out & Switch Account
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8 border-slate-200">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Check Your Inbox</h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                We have sent an authentication verification link to your email address. Please click the link to confirm your account and access your student dashboard.
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {authError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Subrat Pattnaik"
                  {...register("full_name")}
                  error={errors.full_name?.message}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. aspirant@example.com"
                  {...register("email")}
                  error={errors.email?.message}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password (min. 6 characters)
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
                    Confirm Password
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

                <Button
                  type="submit"
                  className="w-full justify-center mt-2"
                  size="lg"
                  isLoading={isLoading}
                >
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-blue-600 hover:underline">
                  Log in here
                </Link>
              </div>
            </>
          )}
        </Card>
        )}
      </div>
    </div>
  );
}
