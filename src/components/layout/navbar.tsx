"use client";

import { Link, usePathname } from "@/i18n/routing";
import Image from "next/image";
import { ThemeToggler } from "../theme-toggler";
import { LocaleSwitcher } from "./locale-switcher";
import { Typography } from "@/components/ui/layout/typography";
import { Button } from "@/components/ui/actions/button";
import { Stack } from "@/components/ui/layout/stack";
import { useTranslations } from "next-intl";

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("Navbar");
  const isAuthPage = pathname.includes("/auth/");
  const isProtectedPage =
    pathname.includes("/dashboard") ||
    pathname.includes("/teacher") ||
    pathname.includes("/student") ||
    pathname.includes("/admin");

  return (
    <Stack as="header" className="glass-overlay sticky top-0 z-50 w-full border-b">
      <Stack
        direction="row"
        align="center"
        justify="between"
        className="h-3xl px-md sm:px-lg lg:px-xl mx-auto w-full"
      >
        <Stack direction="row" align="center" gap="sm">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="EdRithm Logo"
              width={70}
              height={70}
              className="object-contain"
            />
            <Typography
              as="span"
              className="text-primary dark:text-accent text-xl font-bold tracking-tight"
            >
              <Typography as="span" className="text-black dark:text-white">
                Ed
              </Typography>
              Rithm
            </Typography>
          </Link>
        </Stack>

        <Stack direction="row" align="center" justify="end" gap="md" className="flex-1">
          <LocaleSwitcher />
          {!isAuthPage && !isProtectedPage && (
            <a href={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/login`}>
              <Button
                variant="outline"
                className="glass-overlay text-foreground flex cursor-pointer rounded-full"
              >
                {t("login")}
              </Button>
            </a>
          )}
          <ThemeToggler />
        </Stack>
      </Stack>
    </Stack>
  );
}
