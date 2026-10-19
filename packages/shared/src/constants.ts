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

export const SEED_DOUBTS: import("./types").StudentDoubt[] = [
  {
    id: "dbt-0001",
    user_id: "user-subrat-01",
    student_name: "Subrat Pattnaik",
    student_email: "subrat.pattnaik@gmail.com",
    subject: "General Studies & Odisha Special",
    exam_id: "11111111-1111-1111-1111-111111111111",
    question: "Which dynasty built the Konark Sun Temple and in which century?",
    answer: "The Sun Temple at Konark was built in the 13th century (around 1250 CE) by King Narasimhadeva I of the Eastern Ganga Dynasty. It is a UNESCO World Heritage Site dedicated to the Sun God Surya, designed in the shape of a colossal chariot with 24 carved stone wheels.",
    answered_by: "OdishaRank Academic Expert",
    answered_at: new Date(Date.now() - 7200000).toISOString(),
    status: "answered",
    is_private: false,
    upvotes: 14,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "dbt-0002",
    user_id: "user-priyanka-02",
    student_name: "Priyanka Mohanty",
    student_email: "priyanka.mohanty@gmail.com",
    subject: "Exam Pattern & Scheme",
    exam_id: "11111111-1111-1111-1111-111111111111",
    question: "What is the exact negative marking scheme for OSSC CGL Prelims?",
    answer: "In OSSC CGL Preliminary Examination, each question carries 1.0 mark. For every incorrect answer, 0.25 marks (one-fourth) are deducted. Unattempted questions incur no penalty.",
    answered_by: "Official Examination Cell",
    answered_at: new Date(Date.now() - 43200000).toISOString(),
    status: "answered",
    is_private: false,
    upvotes: 28,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: "dbt-0003",
    user_id: "user-rakesh-03",
    student_name: "Rakesh Nayak",
    student_email: "rakesh.nayak@gmail.com",
    subject: "Arithmetic & Quantitative Aptitude",
    exam_id: "11111111-1111-1111-1111-111111111111",
    question: "How to quickly calculate compound interest for 3 years without formula?",
    answer: "Use the ratio method! For 3 years, the compound interest ratio is 3 : 3 : 1. Calculate Simple Interest for 1 year (A), then Interest on A (B), and Interest on B (C). Total CI = 3A + 3B + 1C. This saves more than 60 seconds compared to standard formula substitution.",
    answered_by: "Quantitative Aptitude Faculty",
    answered_at: new Date(Date.now() - 86400000).toISOString(),
    status: "answered",
    is_private: false,
    upvotes: 35,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "dbt-0004",
    user_id: "demo-student-id",
    student_name: "Aspirant Scholar",
    student_email: "student@odisharank.in",
    subject: "General Studies & Odisha Special",
    exam_id: "11111111-1111-1111-1111-111111111111",
    question: "In the 1817 Paika Rebellion, what was the primary cause of unrest regarding salt manufacturing monopoly and land revenue in Khurda?",
    answer: null,
    answered_by: null,
    answered_at: null,
    status: "pending",
    is_private: false,
    upvotes: 3,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "dbt-0005",
    user_id: "demo-student-id",
    student_name: "Aspirant Scholar",
    student_email: "student@odisharank.in",
    subject: "Exam Pattern & Scheme",
    exam_id: "11111111-1111-1111-1111-111111111111",
    question: "Can I claim SEBC category certificate relaxation if my domicile is Jagatsinghpur district?",
    answer: "Yes, candidates belonging to SEBC category in Odisha holding a valid certificate issued within the prescribed validity period by the competent Tahsildar / Sub-Collector are eligible for age relaxation and reservation benefits as per GA & PG Department guidelines.",
    answered_by: "Chief Academic Officer",
    answered_at: new Date(Date.now() - 3600000).toISOString(),
    status: "answered",
    is_private: true,
    upvotes: 1,
    is_notified: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

