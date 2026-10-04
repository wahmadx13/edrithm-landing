"use client";

import { cn } from "@/lib/class-names";
import { Loader2 } from "lucide-react";

interface CircularLoaderProps {
  className?: string;
}

export function CircularLoader({ className }: CircularLoaderProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <Loader2 className="h-full w-full animate-spin" />
    </div>
  );
}
