import React from "react";
import clsx from "clsx";

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
      className={clsx(
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
