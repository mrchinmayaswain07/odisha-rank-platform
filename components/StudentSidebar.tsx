"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  GraduationCap,
  HelpCircle,
  Clock,
  BookOpen,
  BarChart3,
  Calendar,
  Bookmark,
  MessageSquare,
  User,
  ShieldCheck,
  Zap,
  Gamepad2,
  X,
} from "lucide-react";

interface StudentSidebarProps {
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  onCloseMobile,
  isMobile = false,
}) => {
  const pathname = usePathname();

  const navLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutGrid,
    },
    {
      name: "My Courses",
      href: "/courses",
      icon: GraduationCap,
    },
    {
      name: "Brain Gym & Speed Math",
      href: "/speed-math",
      icon: Zap,
      badge: "WARM-UP",
    },
    {
      name: "Brain Gym: 32 Games",
      href: "/games",
      icon: Gamepad2,
      badge: "32 GAMES",
    },
    {
      name: "Practice Questions",
      href: "/questions",
      icon: HelpCircle,
    },
    {
      name: "Mock Tests",
      href: "/mock-tests",
      icon: Clock,
    },
    {
      name: "Study Materials",
      href: "/materials",
      icon: BookOpen,
    },
    {
      name: "Performance",
      href: "/performance",
      icon: BarChart3,
    },
    {
      name: "Study Planner",
      href: "/planner",
      icon: Calendar,
    },
    {
      name: "Bookmarks",
      href: "/bookmarks",
      icon: Bookmark,
    },
    {
      name: "Doubts",
      href: "/doubts",
      icon: MessageSquare,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between p-5 z-40 transition-all ${
        isMobile
          ? "fixed inset-y-0 left-0 w-72 shadow-2xl"
          : "hidden lg:flex w-64 shrink-0 h-screen sticky top-0"
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="OdishaRank Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                Odisha<span className="text-blue-600">Rank</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Odisha Govt Exam Prep
              </p>
            </div>
          </Link>

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onClick={onCloseMobile}
                className={`flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 transition-colors shrink-0 ${
                      isActive
                        ? "text-blue-600"
                        : (item as any).badge
                        ? "text-amber-500 fill-amber-400"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {(item as any).badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-amber-400 text-slate-950 shadow-2xs shrink-0">
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card: Prepare Practice Achieve */}
      <div className="relative rounded-2xl overflow-hidden p-4 bg-gradient-to-br from-blue-100 via-sky-50 to-amber-100/70 border border-blue-200/60 shadow-xs mt-6">
        <div className="absolute right-0 bottom-0 w-24 h-24 opacity-25 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-blue-900">
            <path
              d="M50 5 L55 25 L65 28 L57 38 L62 55 L50 48 L38 55 L43 38 L35 28 L45 25 Z"
              fill="currentColor"
            />
            <path
              d="M30 60 L70 60 L65 95 L35 95 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="relative z-10">
          <h3 className="text-sm font-black text-slate-900 leading-snug">
            Prepare<br />Practice<br />Achieve
          </h3>
          <p className="text-[11px] font-medium text-slate-600 mt-2">
            Your Success in Odisha Government Exams
          </p>
        </div>
      </div>
    </aside>
  );
};
