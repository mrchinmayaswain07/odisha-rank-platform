import React from "react";
import { Metadata } from "next";
import { getExams } from "@/lib/data-service";
import { CoursesManagerClient } from "./CoursesManagerClient";

export const metadata: Metadata = {
  title: "Course and Exam Catalog Management",
  description: "Configure competitive state exams, metadata, publication status, and student enrollment counts.",
};

export default async function AdminCoursesPage() {
  const exams = await getExams(true);

  return <CoursesManagerClient initialExams={exams} />;
}
