import React from "react";
import { Metadata } from "next";
import { getSubjects, getChapters, getTopics, getStudyMaterials } from "@/lib/data-service";
import { SyllabusExplorer } from "./SyllabusExplorer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Syllabus Breakdown & Study Materials",
  description: "Browse verified Odisha Government exam subjects, chapters, topics, notes, and create personal custom study modules.",
};

export default async function SyllabusPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const subjects = await getSubjects();
  const firstSubjectId = subjects[0]?.id || "";
  const chapters = await getChapters(firstSubjectId, user?.id);
  const firstChapterId = chapters[0]?.id || "";
  const topics = await getTopics(firstChapterId, user?.id);
  const firstTopicId = topics[0]?.id || "";
  const materials = await getStudyMaterials(firstTopicId);

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
        userId={user?.id}
      />
    </div>
  );
}
