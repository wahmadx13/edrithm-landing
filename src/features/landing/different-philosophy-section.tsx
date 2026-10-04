"use client";

import { TaglineBadge } from "@/components/shared/tagline-badge/tagline-badge";
import { Button } from "@/components/ui/actions/button";
import { FeatureCard } from "@/components/ui/surfaces/feature-card";
import { transition, viewport } from "@/utils/animation";
import { PHILOSOPHY_LEGACY_CARDS, PHILOSOPHY_NEW_STANDARD_CARDS } from "@/utils/constants";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { useDifferentPhilosophySection } from "./hooks/use-different-philosophy-section";

export function DifferentPhilosophySection() {
  const t = useTranslations("Landing.Philosophy");
  const { mounted, containerRef, parallax } = useDifferentPhilosophySection();

  return (
    <section
      ref={containerRef}
      className="relative isolate flex w-full flex-col items-center justify-center overflow-hidden py-24 md:py-32"
    >
      <div className="absolute inset-0 -z-10 h-full w-full">
        <motion.div
          style={mounted ? parallax.background : undefined}
          className="absolute inset-0 h-[120%] w-full"
        >
          <div className="dark:gradient-glass-flare absolute inset-0 opacity-0 transition-opacity dark:opacity-20" />
          <div className="gradient-digital-gold absolute inset-0 opacity-50 transition-opacity dark:opacity-0" />
        </motion.div>
      </div>

      <div className="mx-auto flex w-full flex-col items-center gap-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          style={mounted ? parallax.content : undefined}
          className="mx-auto flex flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={transition}
          viewport={viewport}
        >
          <TaglineBadge text={t("tagline")} />

          <h2 className="text-foreground flex flex-col gap-1 overflow-visible py-1 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-5xl">
            <span className="overflow-visible pb-1">{t("titlePart1")}</span>
            <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember overflow-visible py-1 font-bold">
              {t("titlePart2")}
            </span>
          </h2>

          <p className="text-muted-foreground max-w-4xl text-base leading-relaxed md:text-lg">
            {t("description")}
          </p>
        </motion.div>

        <div className="flex w-full max-w-7xl flex-col gap-16">
          <div className="flex w-full items-center justify-between border-b border-white/5 pb-8">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-bold tracking-[.3em] uppercase">
                {t("legacyLabel")}
              </span>
              <p className="text-muted-foreground/60 text-[0.625rem] font-medium tracking-wider uppercase">
                {t("legacySubLabel")}
              </p>
            </div>

            <div className="from-muted/50 via-muted-foreground/20 hidden h-px grow bg-linear-to-r to-orange-500/30 lg:mx-12 lg:block" />

            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-xs font-bold tracking-[.3em] text-orange-600 uppercase drop-shadow-[0_0_0.625rem_rgba(255,122,0,0.4)] dark:text-yellow-400 dark:drop-shadow-[0_0_0.625rem_rgba(250,204,21,0.4)]">
                {t("newStandardLabel")}
              </span>
              <p className="text-[0.625rem] font-medium tracking-wider text-orange-500 uppercase dark:text-yellow-300">
                {t("newStandardSubLabel")}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-20">
            {[0, 1, 2, 3, 4].map((idx) => (
              <React.Fragment key={idx}>
                <motion.div
                  initial={{ opacity: 0, x: -40, y: 40 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ ...transition, delay: idx * 0.1 }}
                  viewport={viewport}
                >
                  <FeatureCard className="gradient-legacy-card shadow-deep dark:gradient-legacy-card-dark border-slate-300/50 p-6 sm:p-8 dark:border-white/10">
                    <div className="flex items-center gap-6">
                      <div className="text-muted-foreground/40 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 sm:h-14 sm:w-14">
                        {(() => {
                          const Icon = PHILOSOPHY_LEGACY_CARDS[idx].icon;
                          return <Icon className="h-6 w-6 sm:h-7 sm:w-7" />;
                        })()}
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="text-muted-foreground text-[0.625rem] font-bold tracking-[.25em] uppercase sm:text-xs">
                          {t(`cards.legacy.${idx}.title`)}
                        </h4>
                        <p className="text-muted-foreground/60 text-xs leading-relaxed sm:text-sm">
                          {t(`cards.legacy.${idx}.description`)}
                        </p>
                      </div>
                    </div>
                  </FeatureCard>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 40, y: 40 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ ...transition, delay: idx * 0.1 }}
                  viewport={viewport}
                >
                  <FeatureCard className="glass-overlay border-orange-500 bg-white/5 shadow-[0_0_1.25rem_rgba(255,122,0,0.15)] transition-all duration-500 hover:scale-[1.02] sm:p-8 dark:border-yellow-400/40 dark:shadow-[0_0_1.875rem_rgba(252,211,77,0.2)]">
                    <div className="flex items-center gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-orange-500/80 bg-orange-500/5 text-orange-600 shadow-[0_0_0.9375rem_rgba(255,122,0,0.4)] sm:h-14 sm:w-14 dark:border-yellow-100/60 dark:bg-yellow-400/5 dark:text-yellow-100 dark:shadow-[0_0_1.25rem_rgba(250,204,21,0.6)]">
                        {(() => {
                          const Icon = PHILOSOPHY_NEW_STANDARD_CARDS[idx].icon;
                          return <Icon className="h-6 w-6 sm:h-7 sm:w-7" />;
                        })()}
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember text-[0.625rem] font-bold tracking-[.25em] uppercase sm:text-xs">
                          {t(`cards.new.${idx}.title`)}
                        </h4>
                        <p className="text-foreground text-xs leading-relaxed sm:text-sm dark:text-white/90">
                          {t(`cards.new.${idx}.description`)}
                        </p>
                      </div>
                    </div>
                  </FeatureCard>
                </motion.div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.3 }}
          viewport={viewport}
          className="mt-24 w-full"
        >
          <div className="flex flex-col items-center gap-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <h3 className="text-foreground overflow-visible py-2 text-2xl font-normal tracking-tight text-slate-600 sm:text-3xl lg:text-4xl dark:text-white/80">
                {t("ctaTitle")}{" "}
                <span className="relative inline-block overflow-visible py-1 font-bold text-slate-900 dark:text-white">
                  {t("ctaComplement")}
                  <motion.span
                    className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-orange-500 dark:bg-yellow-100"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ ...transition, delay: 0.8 }}
                    viewport={viewport}
                    style={{ originX: 0 }}
                  />
                </span>
              </h3>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 bg-orange-500 opacity-25 blur-xl transition duration-1000 group-hover:opacity-40 group-hover:duration-200 dark:bg-yellow-300" />
              <Button className="relative flex h-auto items-center gap-3 rounded-[2rem] bg-orange-500 px-10 py-5 text-sm text-white transition-all hover:scale-[1.02] hover:bg-orange-600 active:scale-95 sm:px-12 sm:text-base dark:bg-yellow-100 dark:text-black dark:hover:bg-yellow-200">
                {t("ctaButton")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-4">
              <p className="dark:text-muted-foreground/30 text-[0.625rem tracking-[0.4em] text-black/40 uppercase sm:text-xs">
                {t("securityAssurance")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
