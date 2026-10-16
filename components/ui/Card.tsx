import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200/80 shadow-subtle p-6 transition-all duration-200",
        hover && "hover:shadow-cardHover hover:border-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
