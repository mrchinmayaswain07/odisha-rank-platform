import React from "react";

export default function AdminLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 space-y-3">
        <div className="h-4 bg-slate-800 rounded w-36" />
        <div className="h-8 bg-slate-800 rounded w-96" />
        <div className="h-4 bg-slate-800 rounded w-2/3" />
      </div>

      {/* 6 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="h-10 w-10 bg-slate-800 rounded-xl" />
            <div className="h-8 bg-slate-800 rounded w-20" />
            <div className="h-3 bg-slate-800 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
