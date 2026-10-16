import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Target,
  BookOpen,
  HelpCircle,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  Users,
  Compass,
  MapPin,
  Mail,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getExams } from "@/lib/data-service";
import { SITE_CONFIG } from "@/lib/constants";

export default async function HomePage() {
  const exams = await getExams();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/70 mb-6 text-blue-700 text-xs sm:text-sm font-semibold tracking-wide shadow-subtle">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Odisha Government Competitive Exams Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              Prepare Today. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                Rank Tomorrow.
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto font-normal">
              {SITE_CONFIG.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-md shadow-blue-600/20">
                  <span>Start Free Preparation</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/mock-tests" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Take a Mock Test</span>
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>OSSC, OSSSC & OPSC Aligned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Fabricated Metrics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Course-Specific Syllabus Tracking</span>
              </div>
            </div>
          </div>

          {/* 2. PRODUCT PREVIEW BANNER */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200/90 bg-slate-900/5 p-2 sm:p-3 shadow-xl backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
              {/* Browser Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono text-slate-500">odisharank.in/dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="blue" size="sm">OSSC CGL 2026</Badge>
                </div>
              </div>

              {/* Inside Dashboard Snapshot Preview */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50">
                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-subtle">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
                    <span>Study Hours</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">42.5 hrs</div>
                  <div className="text-xs text-emerald-600 font-medium mt-1">Logged sessions</div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-subtle">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
                    <span>Questions</span>
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">380 MCQs</div>
                  <div className="text-xs text-indigo-600 font-medium mt-1">78% Accuracy rate</div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-subtle">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
                    <span>Mock Tests</span>
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">6 Completed</div>
                  <div className="text-xs text-slate-600 font-medium mt-1">Score: 112.5 / 150</div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-subtle">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
                    <span>Study Streak</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">14 Days</div>
                  <div className="text-xs text-emerald-600 font-medium mt-1">Consistency on track</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TARGET EXAMINATIONS */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              Target Examinations
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Curated for Premier Odisha State Recruitments
            </h3>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              Configurable examination pathways with official multi-stage recruitment patterns, syllabus hierarchies, and verified questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <Card key={exam.id} hover className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="blue" size="md">
                      {exam.conducting_body}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">State Cadre</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    {exam.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6 line-clamp-3">
                    {exam.description}
                  </p>

                  <div className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                    <div className="text-xs font-semibold text-slate-700 uppercase">
                      Examination Stages:
                    </div>
                    {exam.stages.slice(0, 3).map((stg, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-medium text-slate-800">{stg.name}</span>
                        <span className="text-slate-500 font-mono">{stg.marks} marks</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/exams/${exam.slug}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    <span>View Syllabus</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href={`/mock-tests?exam=${exam.id}`}>
                    <Button variant="outline" size="sm">
                      Practice Tests
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PLATFORM FEATURES */}
      <section className="py-16 sm:py-20 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              Platform Features
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Everything You Need to Clear Your Exam
            </h3>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed">
              Purpose-built tools designed to replace chaotic study routines with measurable, authentic preparation progress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Hierarchical Syllabus
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Exam &rarr; Subject &rarr; Chapter &rarr; Topic navigation. Track official requirements while creating your own custom personal chapters.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Verified Question Bank
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Topic-filtered MCQs with instant answer evaluations, complete explanations, and historical accuracy tracking.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Timed Mock Engine
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Realistic exam interface with countdown timers, negative marking calculations, and server-side submission security.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">
                Course Isolation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Switch between OSSC, OSSSC, and OPSC at any time. Progress metrics are strictly isolated to prevent cross-course pollution.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. PREPARATION METHODOLOGY */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              The Preparation Method
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              4 Steps to Exam Success
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base mb-4 shadow-md shadow-blue-500/20">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Select Target Exam
              </h4>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Pick OSSC CGL, OSSSC Combined Recruitment, or OPSC Civil Services to configure your baseline syllabus.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base mb-4 shadow-md shadow-blue-500/20">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Master Topics Daily
              </h4>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Study structured notes and summary sheets. Check off completed topics to measure genuine syllabus coverage.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base mb-4 shadow-md shadow-blue-500/20">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Practice MCQs
              </h4>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Test concepts with topic-specific questions and read comprehensive answer explanations to eliminate weak spots.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base mb-4 shadow-md shadow-blue-500/20">
                4
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Simulate Mock Tests
              </h4>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Take timed tests under real negative marking pressure. Receive instant marks breakdowns and performance insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED PLATFORM CONTACT & HEADQUARTERS CARD */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Odisha Platform</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Direct Academic Support & Platform Inquiries
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Have questions regarding the exam syllabuses or questions? Connect directly with our team located at{" "}
                <strong className="text-slate-800">{SITE_CONFIG.contact.location}</strong>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
              <a
                href={`mailto:${SITE_CONFIG.contact.email}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Email: {SITE_CONFIG.contact.email}</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
              >
                <span>Contact Form</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Join Serious Odisha Government Exam Aspirants
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Create your personalized study profile today. Track your official syllabus completion with honest data and prepare to rank in your target examination.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-blue-500/20">
                <span>Create Free Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent text-white border-slate-700 hover:bg-slate-800">
                Log In to Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
