import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  target_exam_id: z.string().uuid("Please select a target examination").nullable().optional(),
  target_year: z.coerce.number().min(2024).max(2030),
  district: z.string().min(2, "Please select your district").max(50).nullable().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number").nullable().optional().or(z.literal("")),
  bio: z.string().max(300, "Bio cannot exceed 300 characters").nullable().optional(),
});

export const customChapterSchema = z.object({
  subject_id: z.string().uuid("Subject ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().max(500).optional().nullable(),
});

export const customTopicSchema = z.object({
  chapter_id: z.string().uuid("Chapter ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().max(500).optional().nullable(),
  estimated_minutes: z.coerce.number().min(5).max(360).default(45),
});

export const studySessionSchema = z.object({
  duration_minutes: z.coerce.number().min(1, "Duration must be at least 1 minute").max(720),
  topic_id: z.string().uuid().optional().nullable(),
  subject_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const mockTestSubmissionSchema = z.object({
  answers: z.record(z.string(), z.number().nullable().optional()),
  time_spent_seconds: z.number().min(0).default(0),
});

export const ODISHA_DISTRICTS = [
  "Angul", "Balangir", "Balasore (Baleswar)", "Bargarh", "Bhadrak", "Boudh",
  "Cuttack", "Deogarh (Debagarh)", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur",
  "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)",
  "Khordha (Bhubaneswar)", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur",
  "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur (Sonepur)", "Sundargarh"
] as const;

export type OdishaDistrict = typeof ODISHA_DISTRICTS[number];
