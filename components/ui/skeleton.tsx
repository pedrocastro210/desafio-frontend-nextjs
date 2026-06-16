import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-slate-800/60 shimmer ${className}`}
      {...props}
    />
  );
}
