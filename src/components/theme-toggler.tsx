"use client";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/layout/typography";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-full"
    >
      <Sun className="block h-5 w-5 dark:hidden" />
      <Moon className="hidden h-5 w-5 dark:block" />
      <Typography as="span" className="sr-only">
        Toggle theme
      </Typography>
    </Button>
  );
}
