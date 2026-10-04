"use client";

import { Card } from "@/components/ui/surfaces/card";
import { cn } from "@/lib/class-names";
import * as React from "react";

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradientClass?: string;
  shadowClass?: string;
}

export const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, gradientClass, shadowClass, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "border-border p-lg relative flex w-full flex-col overflow-hidden rounded-3xl border bg-transparent transition-all duration-300",
          gradientClass,
          shadowClass,
          className,
        )}
        {...props}
      >
        {children}
      </Card>
    );
  },
);

FeatureCard.displayName = "FeatureCard";
