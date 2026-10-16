/**
 * OdishaRank - Platform Constants & Central Configuration
 * Authoritative single source of truth for branding, metadata, contact info, and navigation.
 */

export const SITE_CONFIG = {
  name: "OdishaRank",
  tagline: "Prepare Today. Rank Tomorrow.",
  description:
    "Production-oriented competitive examination preparation platform for Odisha Government recruitments (OSSC, OSSSC, OPSC). Structured syllabus, verified questions, and measurable preparation tracking.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://odisharank.vercel.app",
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
