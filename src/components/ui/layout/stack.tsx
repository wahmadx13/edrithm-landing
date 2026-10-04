import { cn } from "@/lib/class-names";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { ElementType, forwardRef, HTMLAttributes } from "react";

const stackVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    gap: {
      0: "gap-0",
      xs: "gap-xs",
      sm: "gap-sm",
      md: "gap-md",
      lg: "gap-lg",
      xl: "gap-xl",
      "2xl": "gap-2xl",
      "3xl": "gap-3xl",
    },
  },
  defaultVariants: {
    direction: "column",
    align: "stretch",
    justify: "start",
    gap: 0,
  },
});

export interface StackProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof stackVariants> {
  as?: ElementType;
  asChild?: boolean;
}

const Stack = forwardRef<HTMLElement, StackProps>(
  (
    { className, direction, align, justify, gap, as: Component = "div", asChild = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot.Root : Component;
    return (
      <Comp
        ref={ref}
        className={cn(stackVariants({ direction, align, justify, gap, className }))}
        {...props}
      />
    );
  },
);
Stack.displayName = "Stack";

export { Stack, stackVariants };
