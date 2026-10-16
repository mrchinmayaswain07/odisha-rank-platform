import React from "react";
import { Metadata } from "next";
import { getExams, getSubjects, getChapters, getTopics, getStudyMaterials, getStudentProfile } from "@/lib/data-service";
import { SyllabusExplorer } from "./SyllabusExplorer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Syllabus Breakdown & Study Materials",
  description: "Browse verified Odisha Government exam subjects, chapters, topics, notes, and create personal custom study modules.",
};

export default async function SyllabusPage({
  searchParams,
}: {
  searchParams?: { exam?: string; subject?: string };
}) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  // Parallel fetch: all active courses & student profile
  const [allExams, profile] = await Promise.all([
    getExams(),
    user ? getStudentProfile(user.id) : null,
  ]);

  // Determine active course (URL param > student's selected course > first available)
  const activeExamId = searchParams?.exam || profile?.target_exam_id || allExams[0]?.id || "";
  const activeExam = allExams.find((e) => e.id === activeExamId) || allExams[0] || null;

  // Fetch subjects strictly for this course
  const subjects = await getSubjects(activeExamId);
  const firstSubjectId = searchParams?.subject || subjects[0]?.id || "";
  const chapters = firstSubjectId ? await getChapters(firstSubjectId, user?.id) : [];
  const firstChapterId = chapters[0]?.id || "";
  const topics = firstChapterId ? await getTopics(firstChapterId, user?.id) : [];
  const firstTopicId = topics[0]?.id || "";
  const materials = firstTopicId ? await getStudyMaterials({ topicId: firstTopicId }) : [];

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Syllabus & Study Materials
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Structured official hierarchy: Subject &rarr; Chapter &rarr; Topic &rarr; Study Material.
          Track your topic completion and add custom study topics for personalized preparation.
        </p>
      </div>

      <SyllabusExplorer
        initialSubjects={subjects}
        initialChapters={chapters}
        initialTopics={topics}
        initialMaterials={materials}
        allExams={allExams}
        activeExam={activeExam}
        userId={user?.id}
      />
    </div>
  );
}
