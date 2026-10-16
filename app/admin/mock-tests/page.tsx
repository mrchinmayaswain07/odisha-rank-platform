import React from "react";
import { Metadata } from "next";
import { getMockTests, getExams } from "@/lib/data-service";
import { MockTestManagerClient } from "./MockTestManagerClient";

export const metadata: Metadata = {
  title: "Mock Test Simulations Manager",
  description: "Create and configure timed mock test simulations, scoring algorithms, and publishing statuses.",
};

export default async function AdminMockTestsPage() {
  const [tests, exams] = await Promise.all([
    getMockTests(undefined, true),
    getExams(true),
  ]);

  return <MockTestManagerClient initialTests={tests} exams={exams} />;
}
