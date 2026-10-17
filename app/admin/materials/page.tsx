import React from "react";
import { Metadata } from "next";
import { getStudyMaterials, getTopics, getExams, getSubjects } from "@/lib/data-service";
import { MaterialManagerClient } from "./MaterialManagerClient";

export const metadata: Metadata = {
  title: "PDF & Study Material Management | OdishaRank Admin",
  description: "Curate official documents, revision notes, PYQs, and downloadable exam guides.",
};

export default async function AdminMaterialsPage() {
  const [materials, exams, subjects, topics] = await Promise.all([
    getStudyMaterials({ status: "all" }),
    getExams(true),
    getSubjects(),
    getTopics(),
  ]);

  return (
    <MaterialManagerClient
      initialMaterials={materials}
      topics={topics}
      subjects={subjects}
      exams={exams}
    />
  );
}
