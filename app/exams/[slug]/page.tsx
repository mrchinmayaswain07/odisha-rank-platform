import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getExamBySlug, getSubjects } from "@/lib/data-service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, BookOpen, Clock, HelpCircle, CheckCircle, ChevronRight } from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const exam = await getExamBySlug(params.slug);
  if (!exam) return { title: "Exam Not Found" };
  return {
    title: `${exam.title} — Syllabus & Preparation Pattern`,
    description: exam.description,
  };
}

export default async function ExamDetailPage({ params }: Props) {
  const exam = await getExamBySlug(params.slug);
  if (!exam) notFound();

  const subjects = await getSubjects(exam.id);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          href="/exams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations Catalog</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Badge variant="blue" size="md">{exam.conducting_body}</Badge>
          <div className="flex items-center gap-2">
            <Link href={`/mock-tests?exam=${exam.id}`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Mock Tests</span>
              </Button>
            </Link>
            <Link href={`/questions?exam=${exam.id}`}>
              <Button size="sm" variant="primary" className="gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Practice Questions</span>
              </Button>
            </Link>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
          {exam.title}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl mb-6">
          {exam.description}
        </p>

        {exam.eligibility && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-900">Minimum Eligibility: </span>
            {exam.eligibility}
          </div>
        )}
      </div>

      {/* Stages & Subjects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stages */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            Recruitment Stages
          </h2>
          <div className="space-y-3">
            {exam.stages.map((stg, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Stage {i + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {stg.marks} Marks
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{stg.name}</h3>
                <p className="text-xs text-slate-500">{stg.type}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Subjects & Syllabus */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            Official Syllabus Subjects
          </h2>

          <div className="space-y-4">
            {subjects.map((sub) => (
              <Card key={sub.id} hover className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                        {sub.code || "SUB"}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{sub.name}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {sub.description}
                    </p>
                  </div>
                  <Link href={`/syllabus?subject=${sub.id}`}>
                    <Button size="sm" variant="outline" className="gap-1 shrink-0">
                      <span>Explore Topics</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
