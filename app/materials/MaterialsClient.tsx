"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Download,
  FileText,
  Search,
  Filter,
  Eye,
  Star,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam } from "@/lib/types";

interface MaterialsClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
}

export const MaterialsClient: React.FC<MaterialsClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const studentName = profile?.full_name?.split(" ")[0] || "Aspirant";
  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "OD";
  const isUserAdmin =
    profile?.email?.toLowerCase() === "mrchinmayaswain07@gmail.com" ||
    (profile as any)?.role === "admin";

  const targetExamTitle = targetExam?.title || "OSSC Combined Graduate Level (CGL)";

  const materialsCatalog = [
    {
      id: "mat-1",
      title: "Odisha History: Comprehensive Chronology (Kalinga to Modern Era)",
      subject: "Odisha Special & History",
      category: "notes",
      pages: 42,
      fileSize: "3.2 MB",
      format: "PDF",
      downloads: 1420,
      description: "Detailed analysis of Ashoka's Edicts, Kharavela, Somavamshis, Eastern Gangas, Gajapati Empire, and Paika Rebellion.",
      readTime: "45 mins",
      isOfficial: true,
    },
    {
      id: "mat-2",
      title: "Indian Polity & Constitution High-Yield Revision Digest",
      subject: "General Studies",
      category: "notes",
      pages: 68,
      fileSize: "4.8 MB",
      format: "PDF",
      downloads: 2180,
      description: "Preamble, Fundamental Rights, Directive Principles, Parliamentary Procedures, and Governor/Presidential Ordinances with Odisha state governance tables.",
      readTime: "60 mins",
      isOfficial: true,
    },
    {
      id: "mat-3",
      title: "Arithmetic & Quantitative Aptitude Quick Formula Handbook",
      subject: "Quantitative Aptitude",
      category: "formulas",
      pages: 28,
      fileSize: "1.9 MB",
      format: "PDF",
      downloads: 3450,
      description: "Shortcut techniques, Vedic math tricks, Time & Work formulas, Compound Interest multipliers, and Mensuration 2D/3D tables.",
      readTime: "30 mins",
      isOfficial: true,
    },
    {
      id: "mat-4",
      title: "OSSC CGL Previous 5 Years Solved Question Papers (2019-2024)",
      subject: "Previous Year Papers",
      category: "pyq",
      pages: 110,
      fileSize: "8.5 MB",
      format: "PDF",
      downloads: 4890,
      description: "Authentic question papers with detailed step-by-step mathematical solutions and official answer key references.",
      readTime: "120 mins",
      isOfficial: true,
    },
    {
      id: "mat-5",
      title: "Odisha Current Affairs Monthly Digest (Jan - Oct 2026)",
      subject: "Current Affairs",
      category: "current_affairs",
      pages: 35,
      fileSize: "2.4 MB",
      format: "PDF",
      downloads: 1850,
      description: "Major state government policies, Mo Sarkar schemes, sports awards, appointments, and census data relevant for OSSC & OSSSC.",
      readTime: "40 mins",
      isOfficial: true,
    },
    {
      id: "mat-6",
      title: "Computer & Cyber Awareness 500 High-Probability MCQs & Notes",
      subject: "Computer Awareness",
      category: "notes",
      pages: 48,
      fileSize: "3.6 MB",
      format: "PDF",
      downloads: 2970,
      description: "MS Word, Excel, PowerPoint keyboard shortcuts, Networking protocols, and basic operating system commands for qualifying tests.",
      readTime: "50 mins",
      isOfficial: true,
    },
  ];

  const filteredMaterials = useMemo(() => {
    return materialsCatalog.filter((item) => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      <StudentSidebar />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <StudentSidebar isMobile onCloseMobile={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenTimer={() => setShowTimerModal(true)}
          onOpenCourseModal={() => setShowCourseModal(true)}
          studentName={studentName}
          initials={initials}
          isUserAdmin={isUserAdmin}
          email={profile?.email}
          allExams={allExams}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Banner */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold text-xs mb-3">
                <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                <span>Verified Study Material Repository</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Official Notes, Formulae & PYQ Papers
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Hand-curated study material aligned strictly with the official {targetExamTitle} syllabus. Read online or download high-yield PDF digests.
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto w-full sm:w-auto">
              {[
                { id: "all", label: "All Materials" },
                { id: "notes", label: "Subject Notes" },
                { id: "formulas", label: "Formula Sheets" },
                { id: "pyq", label: "PYQs (Solved)" },
                { id: "current_affairs", label: "Current Affairs" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === tab.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter study notes..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                      {mat.subject}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{mat.format}</span>
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2">
                    {mat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {mat.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{mat.pages} Pages • {mat.fileSize}</span>
                    <span>{mat.downloads} Downloads</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/syllabus?subject=${mat.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read Online</span>
                    </Link>

                    <button
                      onClick={() => alert(`Starting download for "${mat.title}" (${mat.fileSize})...`)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={targetExamTitle}
      />

      {showCourseModal && (
        <CourseSelectModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          currentExamId={targetExam?.id || null}
          exams={allExams}
        />
      )}
    </div>
  );
};
