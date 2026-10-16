import React from "react";
import { Metadata } from "next";
import { getStudyMaterials, getTopics, getExams } from "@/lib/data-service";
import { MaterialManagerClient } from "./MaterialManagerClient";

export const metadata: Metadata = {
  title: "PDF & Study Material Management",
  description: "Curate official documents, revision notes, and downloadable exam guides.",
};

export default async function AdminMaterialsPage() {
  const [materials, exams] = await Promise.all([
    getStudyMaterials({ status: undefined }),
    getExams(true),
  ]);

  // Fallback sample topics for association
  const fallbackTopics: any[] = [
    { id: "t1111111-1111-1111-1111-111111111111", title: "Ancient & Medieval History of Odisha" },
    { id: "t2222222-2222-2222-2222-222222222222", title: "Odisha Modern Freedom Movement" },
    { id: "t3333333-3333-3333-3333-333333333333", title: "Physiography & River Basins of Odisha" },
    { id: "t4444444-4444-4444-4444-444444444444", title: "Percentages & Applications" },
  ];

  return (
    <MaterialManagerClient
      initialMaterials={materials}
      topics={fallbackTopics}
      exams={exams}
    />
  );
}
