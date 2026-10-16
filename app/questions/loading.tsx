import React from "react";

export default function QuestionsLoading() {
  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 rounded w-80" />
        <div className="h-4 bg-slate-200 rounded w-full max-w-xl" />
      </div>

      {/* Filter Card Skeleton */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
        <div className="flex gap-3">
          <div className="h-8 w-28 bg-slate-200 rounded" />
          <div className="h-8 w-28 bg-slate-200 rounded" />
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded" />
      </div>

      {/* Question Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
            <div className="h-5 bg-slate-200 rounded w-3/4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-10 bg-slate-100 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
