import React from "react";
import { Metadata } from "next";
import { getExams, getSubjects, getChapters, getTopics } from "@/lib/data-service";
import { SyllabusManagerClient } from "./SyllabusManagerClient";

export const metadata: Metadata = {
  title: "Syllabus Hierarchy Architecture",
  description: "Manage Course -> Subject -> Chapter -> Topic syllabus structure and publication states.",
};

export default async function AdminSyllabusPage() {
  const exams = await getExams(true);
  const subjects = await getSubjects(undefined, true);

  // Fetch initial chapters for subjects
  let allChapters: any[] = [];
  let allTopics: any[] = [];

  for (const sub of subjects) {
    const chaps = await getChapters(sub.id, undefined, true);
    allChapters = [...allChapters, ...chaps];
    for (const chap of chaps) {
      const tops = await getTopics(chap.id, undefined, true);
      allTopics = [...allTopics, ...tops];
    }
  }

  return (
    <SyllabusManagerClient
      exams={exams}
      initialSubjects={subjects}
      initialChapters={allChapters}
      initialTopics={allTopics}
    />
  );
}
