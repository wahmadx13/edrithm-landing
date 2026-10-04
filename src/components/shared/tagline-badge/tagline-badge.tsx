"use client";

import { Stack } from "@/components/ui/layout/stack";
import { Typography } from "@/components/ui/layout/typography";
import { cn } from "@/lib/class-names";
import { PingIndicator } from "../ping-indicator/ping-indicator";

interface TaglineBadgeProps {
  text: string;
  className?: string;
}

export const TaglineBadge = ({ text, className }: TaglineBadgeProps) => {
  return (
    <Stack
      direction="row"
      align="center"
      gap="sm"
      className={cn(
        "bg-primary/5 dark:bg-accent/10 border-primary/10 dark:border-accent/20 hover:bg-primary/10 dark:hover:bg-accent/20 w-fit rounded-full border px-4 py-1.5 shadow-sm transition-all",
        className,
      )}
    >
      <PingIndicator className="h-1.5 w-1.5 shrink-0" />
      <Typography
        variant="small"
        className="text-primary dark:text-accent leading-none font-black tracking-[0.15em] uppercase"
      >
        {text}
      </Typography>
    </Stack>
  );
};
