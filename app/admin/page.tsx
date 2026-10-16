import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getAdminDashboardStats } from "@/lib/data-service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Layers,
  BookOpen,
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  ShieldCheck,
  Activity,
  FolderTree,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard Overview",
  description: "Real-time administrative metrics and content catalog summaries.",
};

export default async function AdminOverviewPage() {
  const stats = await getAdminDashboardStats();

  const metricCards = [
    {
      title: "Registered Students",
      value: stats.total_students,
      subtitle: "Verified aspirants",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/students",
    },
    {
      title: "Active Courses",
      value: stats.total_courses,
      subtitle: "OSSC, OSSSC, OPSC",
      icon: Layers,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      href: "/admin/courses",
    },
    {
      title: "Syllabus Streams",
      value: stats.total_subjects,
      subtitle: `${stats.total_chapters} Chapters &bull; ${stats.total_topics} Topics`,
      icon: FolderTree,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/admin/syllabus",
    },
    {
      title: "Question Bank",
      value: stats.total_questions,
      subtitle: "Verified MCQs",
      icon: HelpCircle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/admin/questions",
    },
    {
      title: "Study Materials / PDFs",
      value: stats.total_materials,
      subtitle: "Official notes & PDFs",
      icon: FileText,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      href: "/admin/materials",
    },
    {
      title: "Mock Tests",
      value: stats.total_mock_tests,
      subtitle: "Timed simulations",
      icon: Clock,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      href: "/admin/mock-tests",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
              Mission Control
            </span>
            <Badge variant="blue" size="sm">
              Odisha Recruitment Catalog
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Curriculum & Examination Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live catalog statistics powered by Supabase. Manage courses, official syllabi, question banks, study PDFs, and mock tests with strict Row Level Security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/questions">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </Button>
          </Link>
          <Link href="/admin/courses">
            <Button size="sm" variant="outline" className="gap-1.5 border-slate-700 text-slate-300 hover:bg-slate-800">
              <Layers className="w-4 h-4" />
              <span>Manage Courses</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="group">
              <Card className="p-5 bg-slate-950 border-slate-800 hover:border-slate-700 transition-all duration-150">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-xs font-bold text-slate-300 mt-0.5">{card.title}</div>
                  <div
                    className="text-[11px] text-slate-500 mt-1"
                    dangerouslySetInnerHTML={{ __html: card.subtitle }}
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Launch & Content Hierarchy Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Overview (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 bg-slate-950 border-slate-800">
            <h3 className="text-base font-bold text-white mb-2">Curriculum Content Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Content strictly follows the hierarchical state model to guarantee personalization and course isolation:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-xs font-mono font-bold text-blue-400 mb-1">Level 1</div>
                <div className="text-sm font-bold text-white">Course / Exam</div>
                <p className="text-[11px] text-slate-400 mt-1">OSSC CGL, OSSSC CRE, OPSC OAS</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-xs font-mono font-bold text-indigo-400 mb-1">Level 2</div>
                <div className="text-sm font-bold text-white">Subject</div>
                <p className="text-[11px] text-slate-400 mt-1">General Studies, Arithmetic, Reasoning</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-xs font-mono font-bold text-emerald-400 mb-1">Level 3</div>
                <div className="text-sm font-bold text-white">Chapter</div>
                <p className="text-[11px] text-slate-400 mt-1">Odisha Geography, Percentages</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-xs font-mono font-bold text-amber-400 mb-1">Level 4</div>
                <div className="text-sm font-bold text-white">Topic & Notes</div>
                <p className="text-[11px] text-slate-400 mt-1">Rivers, Climate, MCQs, PDFs</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Publication Flow: Draft &rarr; Review &rarr; Published &rarr; Archived</span>
              </div>
              <Link href="/admin/syllabus" className="text-blue-400 hover:underline font-semibold">
                Open Syllabus Hierarchy &rarr;
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Management Links (1 col) */}
        <Card className="p-6 bg-slate-950 border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white mb-2">Administrative Actions</h3>

          <Link
            href="/admin/courses"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-white">Manage Examination Courses</div>
              <p className="text-[11px] text-slate-400">Create, edit, or publish exams</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/admin/questions"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-white">Import / Add MCQs</div>
              <p className="text-[11px] text-slate-400">Bulk CSV import or manual editor</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/admin/materials"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-white">Study Materials & PDFs</div>
              <p className="text-[11px] text-slate-400">Manage notes and downloadable PDFs</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/admin/mock-tests"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-white">Create Mock Test</div>
              <p className="text-[11px] text-slate-400">Timed simulations with negative marking</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
