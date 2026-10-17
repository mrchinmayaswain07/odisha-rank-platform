"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, Mail, MapPin, ExternalLink } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Suppress public student footer on administrative routes and dedicated dashboard portal
  if (pathname?.startsWith("/admin") || pathname === "/dashboard") {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info & Accurate Verified Contact Details */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-blue-500/20">
                <Image
                  src="/logo.png"
                  alt="OdishaRank Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Odisha<span className="text-blue-400">Rank</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              {SITE_CONFIG.description}
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 font-medium">
                  {SITE_CONFIG.contact.location}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium"
                >
                  {SITE_CONFIG.contact.email}
                </a>
              </div>
            </div>
          </div>

          {/* Exam Portals */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Target Examinations
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/exams/ossc-cgl" className="hover:text-white transition-colors">
                  OSSC CGL Exam
                </Link>
              </li>
              <li>
                <Link href="/exams/osssc-cre" className="hover:text-white transition-colors">
                  OSSSC RI, AMIN, ARI
                </Link>
              </li>
              <li>
                <Link href="/exams/opsc-oas" className="hover:text-white transition-colors">
                  OPSC Odisha Civil Services
                </Link>
              </li>
              <li>
                <Link href="/exams" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Browse All Exams &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Study Modules */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Preparation Modules
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/syllabus" className="hover:text-white transition-colors">
                  Syllabus Breakdown
                </Link>
              </li>
              <li>
                <Link href="/questions" className="hover:text-white transition-colors">
                  Question Bank & MCQs
                </Link>
              </li>
              <li>
                <Link href="/mock-tests" className="hover:text-white transition-colors">
                  Timed Mock Tests
                </Link>
              </li>
              <li>
                <Link href="/materials" className="hover:text-white transition-colors">
                  Study Materials
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Student Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional / External Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Official Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="https://www.ossc.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-200 flex items-center gap-1.5"
                >
                  <span>OSSC Official Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.osssc.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-200 flex items-center gap-1.5"
                >
                  <span>OSSSC Official Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.opsc.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-200 flex items-center gap-1.5"
                >
                  <span>OPSC Official Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p className="max-w-2xl leading-relaxed text-slate-400">
            <strong className="text-slate-300">Disclaimer:</strong> OdishaRank is an independent educational technology platform providing study materials and practice tests for students. It is neither affiliated with, authorized by, nor endorsed by the Government of Odisha, OSSC, OSSSC, or OPSC.
          </p>
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/about" className="hover:text-white transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <span>&copy; {new Date().getFullYear()} OdishaRank. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
