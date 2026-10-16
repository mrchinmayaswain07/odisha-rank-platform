"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Clock,
  LayoutDashboard,
  User,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  LogOut,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/Button";
import { createClient } from "@/lib/supabase/client";

interface NavbarUser {
  id: string;
  email?: string | null;
  fullName?: string;
  targetExamId?: string | null;
  isAdmin?: boolean;
}

interface NavbarProps {
  user?: NavbarUser | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Target Exams", href: "/exams", icon: GraduationCap },
    { name: "Syllabus & Materials", href: "/syllabus", icon: BookOpen },
    { name: "Question Bank", href: "/questions", icon: HelpCircle },
    { name: "Mock Tests", href: "/mock-tests", icon: Clock },
    { name: "About", href: "/about", icon: null },
    { name: "Contact", href: "/contact", icon: null },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLogoutError(null);

      // 1. Client-side Supabase sign out
      const supabase = createClient();
      await supabase.auth.signOut();

      // 2. Server-side session invalidation
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Accept: "application/json" },
        });
      } catch {
        // Fallback to client sign-out if server route is unreachable
      }

      // 3. Clear local storage / session storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignore storage errors
      }

      setUserDropdownOpen(false);
      setMobileMenuOpen(false);

      // 4. Force hard redirect to login page to purge all React / Next.js memory cache
      window.location.href = "/login";
    } catch (err: any) {
      console.error("Logout error:", err);
      setLogoutError("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const userDisplayName = user?.fullName || user?.email?.split("@")[0] || "Student";
  const userInitials = userDisplayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Odisha<span className="text-blue-600">Rank</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Govt Exams
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Prepare Today. Rank Tomorrow.
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-blue-600 bg-blue-50/80 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2" ref={dropdownRef}>
                <Link href="/dashboard">
                  <Button variant="primary" size="sm" className="gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>

                {/* User Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    aria-label="User menu"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-mono">
                      {userInitials}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                      {userDisplayName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Header */}
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {userDisplayName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {user.email || "Student Account"}
                        </p>
                        {user.isAdmin && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>System Administrator</span>
                          </div>
                        )}
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Student Dashboard</span>
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Profile & Target Course</span>
                        </Link>

                        {user.isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors border-t border-slate-100 my-1 pt-2"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span>Administrator Panel</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout Action */}
                      <div className="pt-1 border-t border-slate-100 px-1">
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isLoggingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <LogOut className="w-4 h-4 text-rose-600" />
                          )}
                          <span>{isLoggingOut ? "Signing out..." : "Log Out"}</span>
                        </button>
                      </div>

                      {logoutError && (
                        <div className="mx-2 mt-1 p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-700 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{logoutError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          {/* Mobile User Banner */}
          {user && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {userInitials}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{userDisplayName}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[180px]">{user.email}</div>
                </div>
              </div>
              {user.isAdmin && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
          )}

          {/* Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive(link.href)
                      ? "text-blue-600 bg-blue-50 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-4 h-4 text-slate-500" />}
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              );
            })}
          </div>

          {/* User actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </Button>
                </Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <User className="w-4 h-4" />
                    <span>My Profile & Target Course</span>
                  </Button>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center gap-2 text-blue-700 border-blue-200 bg-blue-50/50">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Admin Control Panel</span>
                    </Button>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  ) : (
                    <LogOut className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{isLoggingOut ? "Logging out..." : "Log Out of OdishaRank"}</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-center">Register Now</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
