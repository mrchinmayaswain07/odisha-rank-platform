import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Clock, Award, CheckCircle2, AlertCircle, ArrowRight, GraduationCap } from "lucide-react";
import { getMockTests, getExams, getStudentProfile } from "@/lib/data-service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mock Test Series & Exam Simulations",
  description: "Take timed, full-length mock examinations for Odisha competitive recruitment tests (OSSC, OSSSC, OPSC) with real-time scoring.",
};

import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth-server";

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams?: { exam?: string };
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?redirectTo=/mock-tests");
  }

  // Parallel fetch: all courses & student profile
  const [allExams, profile] = await Promise.all([
    getExams(),
    user ? getStudentProfile(user.id) : null,
  ]);

  const activeExamId = searchParams?.exam || profile?.target_exam_id || allExams[0]?.id || "";
  const activeExam = allExams.find((e) => e.id === activeExamId) || allExams[0] || null;

  const tests = await getMockTests(activeExamId);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mb-8">
        <Badge variant="blue" className="mb-2">Official Pattern Simulations</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Odisha State Competitive Mock Tests
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Experience real examination pressure with timed interfaces, official negative marking schemes (-0.25), and server-side score calculations.
        </p>
      </div>

      {/* Course Selector Bar */}
      {allExams && allExams.length > 0 && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Exam Course
              </span>
              <span className="text-xs font-bold text-slate-800">
                {activeExam?.title || "All Courses"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {allExams.map((ex) => (
              <Link
                key={ex.id}
                href={`/mock-tests?exam=${ex.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  ex.id === activeExam?.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {ex.conducting_body}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tests.map((test) => (
          <Card key={test.id} hover className="p-6 flex flex-col justify-between border-slate-200">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="blue" size="sm">Full Simulation</Badge>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{test.duration_minutes} Mins</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2">{test.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {test.description}
              </p>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Questions</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {test.questions_count || 6}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Marks</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{test.total_marks}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Pass</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{test.pass_percentage}%</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <span>Negative Marking:</span>
                <strong className="text-slate-800">-{test.negative_marking}</strong>
              </div>
              <Link href={`/mock-tests/${test.id}`}>
                <Button size="sm" className="gap-1.5">
                  <span>Start Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}

        {tests.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Mock Tests Available</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no published mock tests for this specific course yet. Check back soon or select another course.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
