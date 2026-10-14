"use client";

import React, { useState, Suspense } from "react";
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
import { GraduationCap, AlertCircle, ArrowRight } from "lucide-react";

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get("redirectTo"), "/dashboard");

  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setAuthError("Unable to connect to authentication service.");
    } finally {
      setIsLoading(false);
    }
  };

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
        Don't have an account yet?{" "}
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
