import React from "react";
import clsx from "clsx";

interface ProgressBarProps {
  progress: number; // 0 - 100
  color?: "blue" | "emerald" | "amber" | "indigo";
  height?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = "blue",
  height = "md",
  showLabel = false,
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colors = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    indigo: "bg-indigo-600",
  };

  return (
    <div className={clsx("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-1">
          <span>Completion</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className={clsx("w-full bg-slate-100 rounded-full overflow-hidden", heights[height])}>
        <div
          className={clsx("h-full transition-all duration-500 ease-out rounded-full", colors[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
