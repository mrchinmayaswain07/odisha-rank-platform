import React from "react";
import { Metadata } from "next";
import { getStudentsList, getExams } from "@/lib/data-service";
import { StudentManagerClient } from "./StudentManagerClient";

export const metadata: Metadata = {
  title: "Registered Aspirants Directory",
  description: "Manage registered student accounts, course enrollments, and platform administrative roles.",
};

export default async function AdminStudentsPage() {
  const [initialResult, exams] = await Promise.all([
    getStudentsList({ page: 1, pageSize: 15 }),
    getExams(true),
  ]);

  return <StudentManagerClient initialResult={initialResult} exams={exams} />;
}
