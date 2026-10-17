"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  HelpCircle,
  FileText,
  Clock,
  Users,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  LogOut,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
}

export const AdminLayoutClient: React.FC<AdminLayoutClientProps> = ({
  children,
  userEmail,
  userName,
}) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Courses & Exams", href: "/admin/courses", icon: Layers },
    { name: "Syllabus Hierarchy", href: "/admin/syllabus", icon: BookOpen },
    { name: "Question Bank", href: "/admin/questions", icon: HelpCircle },
    { name: "Student Questions & Doubts", href: "/admin/questions?tab=doubts", icon: MessageSquare },
    { name: "Study Materials / PDFs", href: "/admin/materials", icon: FileText },
    { name: "Mock Test Builder", href: "/admin/mock-tests", icon: Clock },
    { name: "Student Directory", href: "/admin/students", icon: Users },
  ];

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-0 lg:translate-x-0 hidden lg:flex"
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-md">
                <Image
                  src="/logo.png"
                  alt="OdishaRank Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">
                  Odisha<span className="text-blue-500">Admin</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1 font-mono uppercase">
                  Curriculum Control
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin User Info Pill */}
          <div className="p-4 mx-3 my-3 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Admin Session
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate">{userName}</div>
            <div className="text-[11px] text-slate-400 truncate">{userEmail}</div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Back to Student Portal</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-blue-400 font-bold">ODISHARANK</span>
              <span>/</span>
              <span className="text-slate-200 capitalize font-medium">
                {pathname.replace("/admin", "").replace("/", "") || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="emerald" size="sm" className="gap-1.5 py-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RLS Enforced: Admin</span>
            </Badge>

            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student View</span>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-900/50">
          {children}
        </main>
      </div>
    </div>
  );
};
