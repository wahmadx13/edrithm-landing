"use client";

import { TaglineBadge } from "@/components/shared/tagline-badge/tagline-badge";
import { Button } from "@/components/ui/actions/button";
import { transition, viewport } from "@/utils/animation";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, CloudCheck, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useHeroSection } from "./hooks/use-hero-section";

import { Stack } from "@/components/ui/layout/stack";
import { Typography } from "@/components/ui/layout/typography";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("Landing.Hero");
  const { mounted, resolvedTheme, parallax } = useHeroSection();

  return (
    <section className="relative isolate w-full overflow-hidden pt-16 pb-24 md:pt-32 md:pb-40">
      <Stack className="gradient-clean-energy dark:gradient-midnight-pulse absolute inset-0 -z-10 opacity-60" />

      <motion.div
        style={mounted ? parallax : undefined}
        className="mx-auto w-full px-4 sm:px-6 lg:px-8"
      >
        <section className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-8 lg:gap-12">
          <motion.div
            className="flex flex-col items-start gap-8"
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={transition}
            viewport={viewport}
          >
            <TaglineBadge text={t("tagline")} />

            <Typography
              as="h1"
              variant="h1"
              className="text-h1 flex flex-col gap-2 overflow-visible py-4 pb-12 leading-tight tracking-tight md:text-4xl lg:text-[4rem]"
            >
              <Typography
                as="span"
                variant="h1"
                className="text-foreground overflow-visible pb-2 font-bold"
              >
                {t("titlePart1")}
              </Typography>
              <Typography
                as="span"
                variant="h1"
                className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember overflow-visible py-1 font-semibold"
              >
                {t("titlePart2")}
              </Typography>
              <Typography
                as="span"
                variant="h1"
                className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember overflow-visible py-1 font-bold"
              >
                {t("titlePart3")}
              </Typography>
            </Typography>

            <Typography variant="p" className="text-body text-muted-foreground md:text-lg">
              {t("description")}
            </Typography>

            <Stack
              direction="column"
              align="start"
              gap="md"
              className="w-full sm:flex-row sm:items-center"
            >
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground dark:bg-primary dark:hover:bg-primary/90 h-12 w-full gap-2 rounded-full px-8 sm:w-auto dark:text-white"
              >
                {t("ctaDemo")}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-foreground hover:text-primary group h-12 w-full gap-2 rounded-full px-4 hover:bg-transparent sm:w-auto"
              >
                {t("ctaCompare")}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Stack>

            <Stack className="from-border h-px w-full bg-linear-to-r to-transparent" />

            <Stack
              direction="row"
              align="center"
              gap="lg"
              className="text-muted-foreground text-sm"
            >
              <Stack direction="row" align="center" gap="sm">
                <ShieldCheck className="h-4 w-4" />
                <Typography as="span">{t("noSetupFees")}</Typography>
              </Stack>
              <Stack direction="row" align="center" gap="sm">
                <CloudCheck className="h-4 w-4" />
                <Typography as="span">{t("noItOverhead")}</Typography>
              </Stack>
            </Stack>
          </motion.div>

          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: -100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={transition}
            viewport={viewport}
          >
            <Stack
              direction="row"
              align="center"
              justify="center"
              className="glass-card shadow-deep relative flex h-100 w-full overflow-hidden rounded-2xl p-8 lg:h-150"
            >
              {mounted ? (
                <Image
                  src={
                    resolvedTheme === "dark"
                      ? "/assets/icons/landing-page/landing-dark-1.svg"
                      : "/assets/icons/landing-page/landing-light-1.svg"
                  }
                  alt="EdRithm Dashboard Preview"
                  fill
                  className="object-contain p-4 transition-opacity duration-500"
                  priority
                />
              ) : (
                <Stack className="bg-muted h-full w-full animate-pulse rounded-xl" />
              )}
            </Stack>
          </motion.div>
        </section>
      </motion.div>
    </section>
  );
}
