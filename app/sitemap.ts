import { MetadataRoute } from "next";
import { SEED_EXAMS } from "@/lib/mock-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://odisha-rank.vercel.app";

  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/exams",
    "/syllabus",
    "/questions",
    "/mock-tests",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const examRoutes = SEED_EXAMS.map((exam) => ({
    url: `${baseUrl}/exams/${exam.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...examRoutes];
}
