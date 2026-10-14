import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Clock, Award, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { getMockTests } from "@/lib/data-service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Mock Test Series & Exam Simulations",
  description: "Take timed, full-length mock examinations for Odisha competitive recruitment tests (OSSC, OSSSC, OPSC) with real-time scoring.",
};

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams?: { exam?: string };
}) {
  const tests = await getMockTests(searchParams?.exam);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mb-10">
        <Badge variant="blue" className="mb-2">Official Pattern Simulations</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Odisha State Competitive Mock Tests
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Experience real examination pressure with timed interfaces, official negative marking schemes (-0.25), and server-side score calculations.
        </p>
      </div>

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
                  <span className="text-[10px] uppercase font-bold text-slate-500">Pass Mark</span>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">
                    {test.pass_percentage}%
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Negative Mark: -{test.negative_marking}</span>
              <Link href={`/mock-tests/${test.id}`}>
                <Button size="sm" className="gap-1.5">
                  <span>Start Mock Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
