import React from "react";

export default function MockTestsLoading() {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      <div className="space-y-3 max-w-2xl">
        <div className="h-4 bg-slate-200 rounded w-40" />
        <div className="h-8 bg-slate-200 rounded w-96" />
        <div className="h-4 bg-slate-200 rounded w-full" />
      </div>

      {/* Course Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-slate-200 rounded" />
          <div className="h-8 w-20 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
            <div className="flex justify-between">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-4 bg-slate-200 rounded w-16" />
            </div>
            <div className="h-6 bg-slate-200 rounded w-3/4" />
            <div className="h-12 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-200 rounded w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
