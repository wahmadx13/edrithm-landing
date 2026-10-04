import { cn } from "@/lib/class-names";
import { LucideIcon } from "lucide-react";
import * as React from "react";
import { Card } from "./card";

export interface InfoBarItem {
  icon: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;
  firstLine: string;
  secondLine: string;
  firstLineClass?: string;
  secondLineClass?: string;
}

export interface InfoBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: InfoBarItem[];
  dividerClass?: string;
}

export const InfoBar = React.forwardRef<HTMLDivElement, InfoBarProps>(
  ({ className, items, dividerClass = "bg-muted-foreground/20", ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "border-muted/50 dark:bg-card/50 flex w-full flex-col items-center justify-between rounded-[2rem] border bg-white p-4 shadow-sm md:flex-row md:rounded-full md:p-6 dark:border-white/10",
          className,
        )}
        {...props}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-1 items-center justify-center gap-4 py-4 md:py-0">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                  item.iconBgClass,
                )}
              >
                <item.icon className={cn("h-5 w-5", item.iconColorClass)} />
              </div>
              <div className="flex flex-col text-left">
                <span
                  className={cn(
                    "text-[0.625rem] font-semibold tracking-widest uppercase",
                    item.firstLineClass,
                  )}
                >
                  {item.firstLine}
                </span>
                <span
                  className={cn(
                    "text-foreground text-xs font-bold tracking-tight",
                    item.secondLineClass,
                  )}
                >
                  {item.secondLine}
                </span>
              </div>
            </div>
            {index < items.length - 1 && (
              <div className={cn("hidden h-10 w-px shrink-0 md:block", dividerClass)} />
            )}
            {index < items.length - 1 && (
              <div className={cn("h-px w-full shrink-0 md:hidden", dividerClass)} />
            )}
          </React.Fragment>
        ))}
      </Card>
    );
  },
);

InfoBar.displayName = "InfoBar";
