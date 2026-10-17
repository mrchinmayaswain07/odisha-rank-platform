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
  X,
  Check,
  GraduationCap,
  FileCode,
  Layers,
  ArrowRight,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";
import { Profile, DashboardMetrics, Exam, Subject, StudyMaterial } from "@/lib/types";

interface MaterialsClientProps {
  profile: Profile | null;
  metrics: DashboardMetrics;
  targetExam: Exam | null;
  allExams: Exam[];
  subjects: Subject[];
  initialMaterials: StudyMaterial[];
}

export const MaterialsClient: React.FC<MaterialsClientProps> = ({
  profile,
  metrics,
  targetExam,
  allExams,
  subjects,
  initialMaterials,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExamId, setSelectedExamId] = useState<string>(targetExam?.id || "all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Read Online Modal State
  const [readingMaterial, setReadingMaterial] = useState<StudyMaterial | null>(null);

  // Download toast state
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

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

  // Filter materials in real time (Only published materials visible to students)
  const filteredMaterials = useMemo(() => {
    return initialMaterials.filter((mat) => {
      // Must be published (strict isolation against draft/archived)
      if ((mat.status || "published") !== "published") return false;

      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "notes" && mat.category !== "notes" && mat.category !== "note") return false;
        if (selectedCategory === "formulas" && mat.category !== "formulas" && mat.category !== "formula") return false;
        if (selectedCategory === "pyq" && mat.category !== "pyq") return false;
        if (selectedCategory === "current_affairs" && mat.category !== "current_affairs") return false;
      }

      // Exam filter
      if (selectedExamId !== "all" && mat.exam_id && mat.exam_id !== selectedExamId) {
        return false;
      }

      // Subject filter
      if (selectedSubjectId !== "all" && mat.subject_id && mat.subject_id !== selectedSubjectId) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = mat.title.toLowerCase().includes(q);
        const inDesc = mat.description?.toLowerCase().includes(q) || false;
        const inContent = mat.content.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inContent) return false;
      }

      return true;
    });
  }, [initialMaterials, selectedCategory, selectedExamId, selectedSubjectId, searchQuery]);

  // Handle Download Action
  const handleDownload = (mat: StudyMaterial) => {
    if (mat.file_url && mat.file_url.startsWith("http")) {
      window.open(mat.file_url, "_blank");
    } else {
      // Generate clean downloadable file from content
      const contentToDownload = `# ${mat.title}\n\n` +
        `Category: ${mat.category || "Study Material"}\n` +
        `Published by: OdishaRank Academic Preparation Cell\n` +
        `Date: ${new Date(mat.created_at).toLocaleDateString()}\n\n` +
        `---\n\n` +
        `${mat.content}\n`;

      const blob = new Blob([contentToDownload], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeFilename = mat.title.replace(/[^a-zA-Z0-9_-]/g, "_") + ".md";
      link.href = url;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setDownloadToast(`Downloaded "${mat.title}" successfully!`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  // Helper to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "2.4 MB";
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  // Helper to get category label
  const getCategoryBadgeLabel = (cat?: string) => {
    switch (cat) {
      case "formulas":
        return "Formula Sheet";
      case "pyq":
        return "PYQ Paper (Solved)";
      case "current_affairs":
        return "Current Affairs";
      case "pdf":
        return "Official PDF";
      default:
        return "Subject Notes";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop & Mobile Sidebar */}
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

      {/* Main Content Area */}
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
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-bold text-xs mb-3">
                <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                <span>Verified Study Material Repository</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Materials, Notes & PYQ Papers
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Official syllabus notes, quick formula handbooks, and previous year question papers (PYQs) for {targetExamTitle}. Read online or download anytime.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 relative z-10">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-bold text-white focus:outline-none"
              >
                <option value="all" className="text-slate-900">All Odisha Exams</option>
                {allExams.map((ex) => (
                  <option key={ex.id} value={ex.id} className="text-slate-900">
                    {ex.conducting_body} - {ex.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toast Notification */}
          {downloadToast && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{downloadToast}</span>
            </div>
          )}

          {/* Real-time Category Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto w-full sm:w-auto">
              {[
                { id: "all", label: "All Materials" },
                { id: "notes", label: "Subject Notes" },
                { id: "formulas", label: "Formula Sheets" },
                { id: "pyq", label: "PYQ Papers (Solved)" },
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
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, formulas, or PYQ papers..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Published Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMaterials.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-800">
                  No published study materials found for this selection.
                </p>
                <p className="text-xs text-slate-400">
                  Try switching category or examination filter to view available revision notes.
                </p>
              </div>
            ) : (
              filteredMaterials.map((mat) => {
                const categoryLabel = getCategoryBadgeLabel(mat.category);

                return (
                  <div
                    key={mat.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                          {categoryLabel}
                        </span>
                        <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{mat.material_type === "pdf" ? "PDF" : "Notes"}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                        {mat.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                        {mat.description || mat.content.slice(0, 160)}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span>{formatFileSize(mat.file_size)}</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified Official</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Read Online Button */}
                        <button
                          onClick={() => setReadingMaterial(mat)}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Read Online</span>
                        </button>

                        {/* Download Button */}
                        <button
                          onClick={() => handleDownload(mat)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* READ ONLINE MODAL (Rich Reader Experience)                 */}
      {/* ========================================================= */}
      {readingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Reader Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                      {getCategoryBadgeLabel(readingMaterial.category)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Official Preparation Material
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                    {readingMaterial.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(readingMaterial)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={() => setReadingMaterial(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reader Content Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs sm:text-sm leading-relaxed">
              {readingMaterial.description && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-950 font-medium">
                  {readingMaterial.description}
                </div>
              )}

              {/* Formatted Markdown Content */}
              <div className="prose prose-slate max-w-none space-y-4">
                <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                  {readingMaterial.content}
                </div>
              </div>

              {readingMaterial.file_url && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Downloadable File Reference
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(readingMaterial)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File ({formatFileSize(readingMaterial.file_size)})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reader Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                OdishaRank Academic Syllabus & Document Repository
              </span>
              <button
                onClick={() => setReadingMaterial(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
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
