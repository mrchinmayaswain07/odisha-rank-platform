import React from "react";

export default function ProfileLoading() {
  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="h-4 bg-slate-200 rounded w-96" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-10 bg-slate-100 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-10 bg-slate-100 rounded-lg" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
