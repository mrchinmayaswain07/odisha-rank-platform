/**
 * OdishaRank - Shared Platform Constants
 * Shared across Next.js Web and React Native Mobile applications.
 */

export const SITE_CONFIG = {
  name: "OdishaRank",
  tagline: "Prepare Today. Rank Tomorrow.",
  description:
    "Production-oriented competitive examination preparation platform for Odisha Government recruitments (OSSC, OSSSC, OPSC). Structured syllabus, verified questions, and measurable preparation tracking.",
  url: "https://odisharank.vercel.app",
  contact: {
    location: "Jagatsinghpur, Odisha – 754140, India",
    addressLine1: "Headquarters & Academic Center",
    addressLine2: "Jagatsinghpur, Odisha – 754140",
    country: "India",
    email: "cchinmaya8018@gmail.com",
    supportHours: "Mon - Sat: 9:00 AM - 7:00 PM IST",
    academicQueryNote: "Inquiries regarding syllabus, questions, or answer keys are reviewed within 24 business hours.",
  },
  admin: {
    rootEmail: "mrchinmayaswain07@gmail.com",
  },
  targetExams: [
    {
      code: "OSSC",
      name: "OSSC Combined Graduate Level (CGL)",
      slug: "ossc-cgl",
      cadre: "Group B & C State Cadre",
    },
    {
      code: "OSSSC",
      name: "OSSSC Combined Recruitment (RI, AMIN, ARI)",
      slug: "osssc-cre",
      cadre: "District Revenue & Field Cadre",
    },
    {
      code: "OPSC",
      name: "OPSC Odisha Civil Services (OAS, OPS)",
      slug: "opsc-oas",
      cadre: "Group A & B Gazetted Cadre",
    },
  ],
  navLinks: [
    { label: "Target Exams", href: "/exams" },
    { label: "Syllabus", href: "/syllabus" },
    { label: "Question Bank", href: "/questions" },
    { label: "Mock Tests", href: "/mock-tests" },
    { label: "Study Notes", href: "/materials" },
  ],
};

export const BRAND_COLORS = {
  primary: "#2563eb", // blue-600
  primaryHover: "#1d4ed8", // blue-700
  primaryLight: "#eff6ff", // blue-50
  secondary: "#0f172a", // slate-900
  background: "#f8fafc", // slate-50
  cardBg: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#475569", // slate-600
  textMuted: "#94a3b8", // slate-400
  border: "#e2e8f0", // slate-200
  success: "#10b981", // emerald-500
  warning: "#f59e0b", // amber-500
  danger: "#ef4444", // rose-500
};
