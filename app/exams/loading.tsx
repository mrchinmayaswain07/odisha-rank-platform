import React from "react";

export default function ExamsLoading() {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="max-w-3xl space-y-3">
        <div className="h-5 w-36 bg-slate-200 rounded-full" />
        <div className="h-9 w-3/4 bg-slate-200 rounded-lg" />
        <div className="h-4 w-full bg-slate-200 rounded" />
      </div>

      {/* Exam Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-subtle"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
            </div>
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-5/6" />
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-200 rounded" />
              <div className="h-3 w-4/5 bg-slate-200 rounded" />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <div className="h-8 w-28 bg-slate-200 rounded-lg" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
