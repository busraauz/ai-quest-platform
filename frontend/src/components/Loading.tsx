"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({
  message = "Loading...",
  fullScreen = false,
  className,
  size = "md",
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-8 w-full";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="relative">
        <Loader2 className={cn("animate-spin text-indigo-600", sizeClasses[size])} />
        <div className={cn(
          "absolute inset-0 blur-xl bg-indigo-500/20 -z-10 rounded-full animate-pulse",
          size === "lg" ? "scale-150" : "scale-125"
        )} />
      </div>
      {message && (
        <p className={cn(
          "mt-4 font-medium text-gray-500 animate-pulse tracking-tight",
          size === "lg" ? "text-lg" : "text-sm"
        )}>
          {message}
        </p>
      )}
    </div>
  );
}
