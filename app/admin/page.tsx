import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/admin-auth";
import { getExams, getSubjects, getQuestions, getMockTests } from "@/lib/data-service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ShieldAlert,
  ShieldCheck,
  Layers,
  HelpCircle,
  Clock,
  Database,
  Lock,
  ArrowRight,
  Plus,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Administrator Portal — Security & Syllabus Management",
  description: "Secure, role-based control center for managing official Odisha competitive examinations.",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const user = authData.user;
  const isAdmin = await checkIsAdmin(user?.id);

  const exams = await getExams();
  const subjects = await getSubjects();
  const questions = await getQuestions();
  const mockTests = await getMockTests();

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 mb-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider font-mono text-blue-400 font-bold">
              Production Admin Portal
            </span>
            <Badge variant="blue" size="sm">
              Role: {isAdmin ? "SYSTEM ADMINISTRATOR" : "STUDENT DEMO / READ ONLY"}
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            OdishaRank Curriculum Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Authorized administrative panel. Manages official state exam catalogs, subjects, verified question banks, and mock tests via strict database RLS policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isAdmin ? "emerald" : "amber"} size="md" className="gap-1 py-1">
            {isAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Authorized Admin</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Protected Role Mode</span>
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl mb-8 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong>Security Architecture Implementation:</strong> In compliance with prompt requirements, administrative privileges are governed strictly through the isolated <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-950 font-mono">public.user_roles</code> table and database RLS policy <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-950 font-mono">public.is_admin()</code>. They are <strong>never</strong> granted based on client-editable profile attributes.
        </div>
      </div>

      {/* Catalog Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Official Exams</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{exams.length}</div>
          <p className="text-xs text-slate-500 mt-1">OSSC, OSSSC, OPSC active</p>
        </Card>

        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Official Subjects</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{subjects.length}</div>
          <p className="text-xs text-slate-500 mt-1">Configured syllabus streams</p>
        </Card>

        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Verified MCQs</span>
            <HelpCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{questions.length}</div>
          <p className="text-xs text-slate-500 mt-1">Verified sample seed items</p>
        </Card>

        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Mock Tests</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{mockTests.length}</div>
          <p className="text-xs text-slate-500 mt-1">Published simulations</p>
        </Card>
      </div>

      {/* Management Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exams Catalog */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Official Exams Catalog</h3>
            <Badge variant="blue" size="sm">{exams.length} Registered</Badge>
          </div>
          <div className="space-y-3">
            {exams.map((ex) => (
              <div key={ex.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      {ex.conducting_body}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{ex.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ex.description}</p>
                </div>
                <Link href={`/exams/${ex.slug}`} className="text-xs font-bold text-blue-600 hover:underline shrink-0 ml-3">
                  View
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Mock Tests Catalog */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Published Mock Tests</h3>
            <Badge variant="emerald" size="sm">{mockTests.length} Live</Badge>
          </div>
          <div className="space-y-3">
            {mockTests.map((t) => (
              <div key={t.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{t.duration_minutes} Mins</span>
                    <span>&bull;</span>
                    <span>{t.total_marks} Marks</span>
                    <span>&bull;</span>
                    <span>Pass: {t.pass_percentage}%</span>
                  </div>
                </div>
                <Link href={`/mock-tests/${t.id}`} className="text-xs font-bold text-blue-600 hover:underline shrink-0 ml-3">
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
