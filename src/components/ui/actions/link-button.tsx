"use client";

import { Button } from "@/components/ui/actions/button";
import { cn } from "@/lib/class-names";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface LinkButtonProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
  textGradientClass?: string;
  iconColorClass?: string;
}

export function LinkButton({
  href,
  label,
  icon: Icon,
  className,
  textGradientClass,
  iconColorClass,
}: LinkButtonProps) {
  return (
    <Link href={href} className={cn("inline-block", className)}>
      <Button
        variant="ghost"
        className="text-foreground hover:text-primary group h-12 gap-2 rounded-full px-0 hover:bg-transparent"
      >
        <span className={cn("text-sm font-bold tracking-tight", textGradientClass)}>{label}</span>
        {Icon && (
          <Icon
            className={cn("h-4 w-4 transition-transform group-hover:translate-x-1", iconColorClass)}
          />
        )}
      </Button>
    </Link>
  );
}
