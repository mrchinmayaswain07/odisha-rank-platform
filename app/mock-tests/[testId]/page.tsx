import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getMockTestById } from "@/lib/data-service";
import { MockTestEngine } from "./MockTestEngine";

interface Props {
  params: { testId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getMockTestById(params.testId);
  if (!data) return { title: "Test Not Found" };
  return {
    title: `${data.test.title} — Active Simulation`,
    description: data.test.description,
  };
}

export default async function MockTestActivePage({ params }: Props) {
  const data = await getMockTestById(params.testId);
  if (!data) notFound();

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <MockTestEngine test={data.test} questions={data.questions} />
    </div>
  );
}
