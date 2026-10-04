"use client";

import { Button } from "@/components/ui/actions/button";
import { Stack } from "@/components/ui/layout/stack";
import { Typography } from "@/components/ui/layout/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/class-names";
import { LOCALES } from "@/utils/constants";
import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onLocaleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
  }

  const currentLocale = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="group hover:bg-primary/10 flex h-9 cursor-pointer gap-2 rounded-full px-3"
        >
          <Stack
            align="center"
            justify="center"
            className="ring-border shrink-0 overflow-hidden rounded-xs ring-1"
          >
            <Image
              src={currentLocale.flag}
              alt={currentLocale.name}
              width={20}
              height={12}
              className="h-3 w-5 object-cover"
            />
          </Stack>
          <Typography variant="small" className="hidden font-medium md:inline-block">
            {currentLocale.name}
          </Typography>
          <Globe className="group-hover:text-primary h-4 w-4 opacity-50 transition-colors" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="shadow-deep w-40 rounded-xl">
        <Stack gap="xs" className="p-1">
          {LOCALES.map((l) => {
            const isActive = l.code === locale;
            return (
              <DropdownMenuItem
                key={l.code}
                onClick={() => onLocaleChange(l.code)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg py-2 transition-all",
                  "focus:bg-primary focus:text-primary-foreground",
                  isActive
                    ? "bg-primary/10 text-primary font-black"
                    : "text-muted-foreground font-medium",
                )}
              >
                <Stack
                  align="center"
                  justify="center"
                  className="ring-border/50 shrink-0 overflow-hidden rounded-xs ring-1"
                >
                  <Image
                    src={l.flag}
                    alt={l.name}
                    width={20}
                    height={12}
                    className="h-3 w-5 object-cover"
                  />
                </Stack>
                <Typography variant="small" className="font-inherit">
                  {l.name}
                </Typography>
              </DropdownMenuItem>
            );
          })}
        </Stack>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
