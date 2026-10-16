"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema, sanitizeRedirect } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  GraduationCap,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get("redirectTo"), "/dashboard");

  const [authError, setAuthError] = useState<string | null>(null);
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
        // Check if admin
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

        // If explicitly requested a redirect, redirect to target
        if (searchParams.get("redirectTo")) {
          window.location.href = redirectTo;
        }
      }
    });
  }, [redirectTo, searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
      } else if (signInData.user) {
        // Check if admin to smartly route to admin if they came without target
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", signInData.user.id)
          .eq("role", "admin")
          .maybeSingle();

        const isUserAdmin =
          Boolean(roleData) ||
          signInData.user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
        const target = searchParams.get("redirectTo") || (isUserAdmin ? "/admin" : "/dashboard");
        // Hard redirect guarantees Next.js layout re-mounts and reads updated cookies
        window.location.href = target;
      }
    } catch {
      setAuthError("Unable to connect to authentication service.");
      setIsLoading(false);
    }
  };

  // If already logged in, show convenient direct entry buttons
  if (loggedInUser) {
    return (
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
    );
  }

  return (
    <Card className="p-8 border-slate-200">
      {authError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. aspirant@example.com"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            {...register("password")}
          />
          {errors.password?.message && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full justify-center" size="lg" isLoading={isLoading}>
          <span>Log In</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="font-bold text-blue-600 hover:underline">
          Create student account
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Log in to OdishaRank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Access your syllabus progress, questions, and mock test scores.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading login...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
