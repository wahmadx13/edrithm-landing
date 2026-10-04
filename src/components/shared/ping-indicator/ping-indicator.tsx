"use client";

import { Stack } from "@/components/ui/layout/stack";
import { cn } from "@/lib/class-names";

interface PingIndicatorProps {
  fillColorClass?: string;
  propagatingColorClass?: string;
  className?: string;
}

export function PingIndicator({
  fillColorClass = "bg-primary dark:bg-accent",
  propagatingColorClass = "bg-primary dark:bg-accent",
  className,
}: PingIndicatorProps) {
  return (
    <Stack
      className={cn("relative h-2 w-2", className)}
      direction="row"
      align="center"
      justify="center"
    >
      <Stack
        as="span"
        className={cn(
          "absolute h-full w-full animate-ping rounded-full opacity-60",
          propagatingColorClass,
        )}
      />
      <Stack
        as="span"
        className={cn(
          "relative h-full w-full rounded-full shadow-sm ring-1 ring-white/10",
          fillColorClass,
        )}
      />
    </Stack>
  );
}
