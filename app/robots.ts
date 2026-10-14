import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://odisha-rank.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/contact", "/exams", "/exams/*", "/syllabus", "/questions", "/mock-tests"],
      disallow: [
        "/dashboard",
        "/profile",
        "/admin",
        "/api/*",
        "/auth/*",
        "/reset-password",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
