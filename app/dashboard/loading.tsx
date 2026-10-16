import React from "react";

export default function DashboardLoading() {
  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 w-full md:w-1/2">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-4 bg-slate-200 rounded w-80" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-slate-200 rounded-lg" />
          <div className="h-9 w-32 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* 4 Metrics Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="h-3 bg-slate-200 rounded w-24" />
            <div className="h-8 bg-slate-200 rounded w-16" />
            <div className="h-3 bg-slate-200 rounded w-32" />
          </div>
        ))}
      </div>

      {/* 2 Syllabus Progress Trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-200 rounded w-40" />
              <div className="h-6 bg-slate-200 rounded w-12" />
            </div>
            <div className="h-3 bg-slate-200 rounded-full w-full" />
            <div className="h-3 bg-slate-200 rounded w-48" />
          </div>
        ))}
      </div>

      {/* Subject list skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-48 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-36" />
                <div className="h-4 bg-slate-200 rounded w-8" />
              </div>
              <div className="h-2 bg-slate-200 rounded-full w-full" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-5 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-36 mb-4" />
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
