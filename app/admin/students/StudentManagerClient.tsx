"use client";

import React, { useState } from "react";
import { StudentListItem, Exam, PaginatedResult, UserRole } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Shield,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";

interface StudentManagerClientProps {
  initialResult?: PaginatedResult<StudentListItem>;
  exams?: Exam[];
}

export const StudentManagerClient: React.FC<StudentManagerClientProps> = ({
  initialResult,
  exams = [],
}) => {
  const safeInitialResult: PaginatedResult<StudentListItem> = {
    data: initialResult?.data || [],
    total: initialResult?.total || 0,
    page: initialResult?.page || 1,
    pageSize: initialResult?.pageSize || 15,
    totalPages: initialResult?.totalPages || 1,
  };
  const [result, setResult] = useState<PaginatedResult<StudentListItem>>(safeInitialResult);
  const [search, setSearch] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchStudents = async (page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "15");
      if (search.trim()) params.set("search", search.trim());
      if (selectedExamId !== "all") params.set("targetExamId", selectedExamId);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(1);
  };

  const ROOT_ADMIN_EMAIL = "mrchinmayaswain07@gmail.com";

  const handleRoleChange = async (student: StudentListItem, newRole: UserRole) => {
    if (student.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase() && newRole !== "admin") {
      alert("The root platform administrator profile is permanent and cannot be demoted or removed.");
      return;
    }

    if (!confirm(`Are you sure you want to change ${student.full_name}'s role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    try {
      setUpdatingUserId(student.id);
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: student.id, newRole }),
      });

      if (res.ok) {
        setResult((prev) => ({
          ...prev,
          data: prev.data.map((item) =>
            item.id === student.id ? { ...item, role: newRole } : item
          ),
        }));
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || "Failed to update student role.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Network error while updating role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            <span>Registered Aspirants Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search registered students, review active course enrollments, and manage role-based platform access.
          </p>
        </div>

        <Badge variant="blue" size="md">
          Total: {result?.total ?? 0} Aspirants
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-950 border-slate-800">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, email, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Target Course:</span>
            </span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
            >
              <option value="all">All Courses</option>
              {(exams || []).map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.conducting_body} — {ex.title}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="primary" className="text-xs">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Students Table */}
      <Card className="bg-slate-950 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Scholar</th>
                <th className="py-3 px-4">Target Course</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Target Year</th>
                <th className="py-3 px-4">Role Access</th>
                <th className="py-3 px-4 text-right">Role Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(result?.data || []).map((student) => {
                const isUpdating = updatingUserId === student.id;
                return (
                  <tr key={student.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{student.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {student.email || "No email verified"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate max-w-xs">{student.target_exam_title || "Unset"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{student.district || "Odisha State"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      {student.target_year || 2026}
                    </td>
                    <td className="py-3.5 px-4">
                      {student.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase() ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Root Admin (Permanent)</span>
                        </span>
                      ) : (
                        <Badge
                          variant={student.role === "admin" ? "emerald" : "blue"}
                          size="sm"
                          className="capitalize"
                        >
                          {student.role === "admin" ? "System Admin" : "Student"}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400 inline" />
                      ) : student.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase() ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400/90 font-medium select-none bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/40">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          <span>Protected</span>
                        </div>
                      ) : student.role === "admin" ? (
                        <button
                          onClick={() => handleRoleChange(student, "student")}
                          className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-semibold"
                        >
                          Revoke Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(student, "admin")}
                          className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
                        >
                          Promote to Admin
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {(result?.data || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong>{(result?.total ?? 0) === 0 ? 0 : ((result?.page ?? 1) - 1) * (result?.pageSize ?? 15) + 1}</strong> to{" "}
            <strong>{Math.min((result?.page ?? 1) * (result?.pageSize ?? 15), result?.total ?? 0)}</strong> of{" "}
            <strong>{result?.total ?? 0}</strong> students
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={(result?.page ?? 1) <= 1 || isLoading}
              onClick={() => fetchStudents((result?.page ?? 1) - 1)}
              className="text-xs h-7 px-2 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-slate-300">
              Page {result?.page ?? 1} of {result?.totalPages || 1}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={(result?.page ?? 1) >= (result?.totalPages ?? 1) || isLoading}
              onClick={() => fetchStudents((result?.page ?? 1) + 1)}
              className="text-xs h-7 px-2 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
