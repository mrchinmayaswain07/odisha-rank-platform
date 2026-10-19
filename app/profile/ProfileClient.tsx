"use client";

import React, { useState } from "react";
import { Profile, Exam } from "@/lib/types";
import { ODISHA_DISTRICTS } from "@/lib/validation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  User,
  GraduationCap,
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
} from "lucide-react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { StudyTimerModal } from "@/components/StudyTimerModal";
import { CourseSelectModal } from "@/components/CourseSelectModal";

interface ProfileClientProps {
  initialProfile: Profile;
  exams: Exam[];
}

export const ProfileClient: React.FC<ProfileClientProps> = ({
  initialProfile,
  exams,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const studentName = initialProfile?.full_name?.split(" ")[0] || "Aspirant";
  const initials =
    initialProfile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "OD";
  const isUserAdmin =
    initialProfile?.email?.toLowerCase() === "mrchinmayaswain07@gmail.com" ||
    (initialProfile as any)?.role === "admin";

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialProfile.full_name || "",
    target_exam_id: initialProfile.target_exam_id || exams[0]?.id || "",
    target_year: initialProfile.target_year && initialProfile.target_year >= 2026 ? initialProfile.target_year : 2026,
    district: initialProfile.district || ODISHA_DISTRICTS[18], // Default to Khordha
    phone: initialProfile.phone || "",
    bio: initialProfile.bio || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedExam = exams.find((e) => e.id === profile.target_exam_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update profile");
      } else {
        setProfile((prev) => ({
          ...prev,
          ...formData,
          is_profile_completed: true,
        }));
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch {
      setErrorMessage("Network error updating profile");
    } finally {
      setIsSaving(false);
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
          allExams={exams}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
          {/* Top Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {profile.full_name}
              </h1>
              <Badge variant={profile.is_profile_completed ? "emerald" : "amber"} size="sm">
                {profile.is_profile_completed ? "Profile Complete" : "Incomplete Profile"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono">{profile.email}</p>
          </div>
        </div>

        <div>
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isEditing ? (
        /* Edit Mode Form */
        <Card className="p-6 sm:p-8 border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-6">Edit Student Details</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Examination
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  value={formData.target_exam_id}
                  onChange={(e) => setFormData({ ...formData, target_exam_id: e.target.value })}
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.conducting_body} — {ex.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Exam Year
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  value={formData.target_year}
                  onChange={(e) => setFormData({ ...formData, target_year: Number(e.target.value) })}
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                  <option value={2029}>2029</option>
                  <option value={2030}>2030</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Odisha District
                </label>
                <select
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                >
                  {ODISHA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Mobile Phone (10 digits)"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Preparation Goal / Bio
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Aiming for Group B State Cadre in OSSC CGL."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSaving} className="gap-1.5">
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* View Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Examination Target
            </h3>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-500">Selected Goal:</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {selectedExam?.title || "No Target Selected"}
              </h4>
              <p className="text-xs text-slate-500">Target Year: {profile.target_year || 2026}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 pt-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>District: {profile.district || "Not specified"}</span>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Student Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Contact Phone:</span>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {profile.phone || "No phone number added"}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Preparation Objective:</span>
                <p className="text-slate-700 leading-relaxed mt-0.5">
                  {profile.bio || "No preparation objective specified yet."}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Member Since:</span>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {new Date(profile.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
        </main>
      </div>

      <StudyTimerModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        activeCourseName={selectedExam?.title}
      />

      {showCourseModal && (
        <CourseSelectModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          currentExamId={profile.target_exam_id || null}
          exams={exams}
        />
      )}
    </div>
  );
};

