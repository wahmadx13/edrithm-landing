"use client";
import { ComplexityDiagram } from "./components/complexity/complexity-diagram";

import { PingIndicator } from "@/components/shared/ping-indicator/ping-indicator";
import { TaglineBadge } from "@/components/shared/tagline-badge/tagline-badge";
import { Button } from "@/components/ui/actions/button";
import { FeatureCard } from "@/components/ui/surfaces/feature-card";
import { transition, viewport } from "@/utils/animation";
import { motion } from "framer-motion";
import NextImage from "next/image";
import { useOperationalComplexitySection } from "./hooks/use-operational-complexity-section";

import { useTranslations } from "next-intl";

export function OperationalComplexitySection() {
  const t = useTranslations("Landing.OperationalComplexity");
  const { mounted, containerRef, parallax } = useOperationalComplexitySection();

  return (
    <section
      ref={containerRef}
      className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden py-28 md:py-30"
    >
      <div className="absolute inset-0 -z-10 h-full w-full">
        <motion.div
          style={mounted ? parallax.background : undefined}
          className="absolute inset-0 h-[150%] w-full"
        >
          <div className="gradient-morning-glow dark:gradient-solar-flare absolute top-0 left-[-10%] h-[120%] w-[120%] opacity-40 blur-[6.25rem] dark:opacity-10" />
          <div className="gradient-citrus-breeze dark:gradient-midnight-ember absolute right-[-20%] bottom-[-20%] h-full w-[80%] rounded-full opacity-30 blur-[7.5rem] dark:opacity-20" />
        </motion.div>

        <div className="glass-overlay absolute inset-0 border-none" />

        <div className="from-background absolute inset-x-0 top-0 h-32 bg-linear-to-b to-transparent" />
        <div className="from-background absolute inset-x-0 bottom-0 h-32 bg-linear-to-t to-transparent" />
      </div>

      <div className="mx-auto flex w-full flex-col items-center gap-16 px-4 sm:px-6 lg:px-8">
        <motion.div style={mounted ? parallax.content : undefined} className="w-full">
          <motion.div
            className="mx-auto flex flex-col items-center gap-6 text-center"
            initial={{ opacity: 0, y: -60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={transition}
            viewport={viewport}
          >
            <TaglineBadge text={t("tagline")} />

            <h2 className="text-foreground flex flex-col gap-1 overflow-visible py-2 pb-6 text-4xl leading-tight font-semibold tracking-tight lg:text-5xl">
              <span className="overflow-visible pb-1 dark:text-white">{t("titlePart1")}</span>
              <span className="flex flex-wrap items-center justify-center gap-x-[0.3em] overflow-visible pb-1">
                <span className="dark:text-gradient-glass-frost-dark text-gradient-glass-frost overflow-visible py-1">
                  {t("titlePart2")}
                </span>
                <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember overflow-visible py-1 font-bold">
                  {t("titlePart3")}
                </span>
                <span className="dark:text-gradient-glass-frost-dark text-gradient-glass-frost overflow-visible py-1">
                  {t("titlePart4")}
                </span>
              </span>
            </h2>

            <p className="text-muted-foreground max-w-4xl text-base leading-relaxed md:text-lg">
              {t("description")}
            </p>
          </motion.div>
        </motion.div>

        <ComplexityDiagram />

        <motion.div
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.2 }}
          viewport={viewport}
          className="flex w-full justify-center"
        >
          <FeatureCard
            gradientClass="gradient-frosted-neon dark:gradient-ellipse-glow"
            shadowClass="shadow-soft dark:shadow-deep"
            className="w-full max-w-4xl p-2 lg:p-4"
          >
            <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left lg:gap-16">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28">
                <NextImage
                  src="/assets/icons/landing-page/operational-complexity/curves.png"
                  alt="Friction Indicator"
                  fill
                  className="object-contain"
                />
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-gradient-glass-frost dark:text-gradient-glass-frost-dark text-xl font-bold tracking-tight sm:text-2xl">
                  {t("card3Title")}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                  {t("card3Description")}{" "}
                  <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember font-bold">
                    {t("card3Multiplier")}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:justify-start">
                  <div className="flex items-center gap-2.5">
                    <PingIndicator
                      fillColorClass="bg-orange-500 dark:bg-yellow-400"
                      propagatingColorClass="bg-orange-500 dark:bg-yellow-400"
                    />
                    <span className="text-foreground text-[0.625rem] font-bold tracking-widest uppercase">
                      {t("maintenance")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <PingIndicator
                      fillColorClass="bg-blue-400 dark:bg-cyan-300"
                      propagatingColorClass="bg-blue-400 dark:bg-cyan-300"
                    />
                    <span className="text-foreground text-[0.625rem] font-bold tracking-widest uppercase">
                      {t("subscription")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.3 }}
          viewport={viewport}
          className="mt-10 flex w-full flex-col items-center gap-12"
        >
          <div className="h-0.25 w-full max-w-5xl bg-linear-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />

          <div className="flex flex-col items-center gap-6 text-center">
            <span className="text-[.625rem] font-bold tracking-[.3em] text-orange-600 uppercase drop-shadow-[0_0_0.9375rem_rgba(255,122,0,0.6)] sm:text-xs dark:text-yellow-100 dark:drop-shadow-[0_0_0.9375rem_rgba(250,204,21,0.6)]">
              {t("evolutionTagline")}
            </span>
            <h2 className="text-foreground max-w-4xl text-lg font-bold tracking-tight uppercase sm:text-xl lg:text-2xl dark:text-white">
              {t("evolutionTitle")}
            </h2>
          </div>

          <div className="relative flex w-full items-center justify-center gap-6">
            <div className="hidden h-0.25 grow bg-linear-to-r from-transparent to-white/10 sm:block dark:to-white/5" />

            <Button className="bg-foreground text-background hover:bg-foreground/90 h-14 rounded-full px-10 text-sm font-bold whitespace-nowrap transition-all active:scale-95 sm:px-12 sm:text-base dark:bg-white dark:text-black">
              {t("seeSolution")}
            </Button>

            <div className="hidden h-0.25 grow bg-linear-to-l from-transparent to-white/10 sm:block dark:to-white/5" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
