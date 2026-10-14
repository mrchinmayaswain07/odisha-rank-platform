import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { GraduationCap, ArrowRight, BookOpen, Clock, ShieldCheck } from "lucide-react";
import { getExams } from "@/lib/data-service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Target Examinations Catalog",
  description: "Browse official Odisha Government competitive examinations including OSSC, OSSSC, and OPSC recruitments.",
};

export default async function ExamsPage() {
  const exams = await getExams();

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mb-10">
        <Badge variant="blue" className="mb-2">Official State Catalog</Badge>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Odisha Government Competitive Examinations
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Structured exam roadmaps based on official notifications. Select an examination to view stages, subjects, topic hierarchy, and authentic mock tests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <Card key={exam.id} hover className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="blue" size="md">{exam.conducting_body}</Badge>
                <span className="text-xs text-slate-400 font-medium">Cadre Examination</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {exam.title}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {exam.description}
              </p>

              <div className="space-y-2 mb-6 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Selection Stages:
                </div>
                {exam.stages.map((stg, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium">{stg.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{stg.marks}m</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Link href={`/exams/${exam.slug}`}>
                <Button size="sm" variant="primary" className="gap-1.5">
                  <span>View Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link href={`/mock-tests?exam=${exam.id}`}>
                <Button size="sm" variant="outline">
                  Practice Tests
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
