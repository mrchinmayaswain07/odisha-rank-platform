import React from "react";

export default function SyllabusLoading() {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      <div className="space-y-3 max-w-2xl">
        <div className="h-8 bg-slate-200 rounded w-72" />
        <div className="h-4 bg-slate-200 rounded w-full" />
      </div>

      {/* Course Bar Skeleton */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-slate-200 rounded" />
          <div className="h-8 w-20 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 pb-3 border-b border-slate-200">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-32 bg-slate-200 rounded-lg" />
        ))}
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-8 p-6 bg-white border border-slate-200 rounded-xl space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}
