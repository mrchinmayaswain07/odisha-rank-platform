import React from "react";
import { Metadata } from "next";
import { ShieldCheck, Target, Award, Users, BookOpen, Compass } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "About OdishaRank",
  description: "Learn about the mission, architecture, and principles behind the OdishaRank competitive exam platform.",
};

export default function AboutPage() {
  return (
    <div className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          About Odisha<span className="text-blue-600">Rank</span>
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          OdishaRank was built to bring structure, transparency, and data-backed accountability
          to students preparing for Odisha Government competitive examinations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <Card className="p-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Our Core Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every year, lakhs of dedicated students across Odisha's 30 districts aspire to serve the state through OSSC, OSSSC, and OPSC examinations. Too often, aspirants struggle with fragmented syllabus copies, unreliable mock tests, and fabricated preparation trackers. OdishaRank provides a single, high-fidelity platform where every minute studied and every question answered is measured honestly.
          </p>
        </Card>

        <Card className="p-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Integrity & Authenticity</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We adhere strictly to factual syllabus definitions and verified question seeds. OdishaRank never claims unverified materials are official, and we clearly separate official syllabus requirements from user-created personal study items so your progress metrics always represent true examination readiness.
          </p>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-subtle mb-16">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Guiding Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Syllabus-First Learning
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every practice question, note, and mock test maps cleanly to an exam, subject, chapter, and topic.
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Real Metric Calculation
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              No decorative progress bars or inflated study hours. Your numbers come directly from verified database records.
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Student Ownership
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Students can create personalized chapters and custom study topics without affecting official syllabuses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
