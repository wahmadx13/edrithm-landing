"use client";
import { EnrollmentIntelligence } from "./components/intelligence/enrollment-intelligence";
import { InstitutionIntelligence } from "./components/intelligence/institution-intelligence";
import { PerformanceIntelligence } from "./components/intelligence/performance-intelligence";

import { TaglineBadge } from "@/components/shared/tagline-badge/tagline-badge";
import { InfoBar } from "@/components/ui/surfaces/info-bar";
import { transition, viewport } from "@/utils/animation";
import { INTELLIGENCE_INFO_BAR_DATA } from "@/utils/constants";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useIntelligenceSection } from "./hooks/use-intelligence-section";

export function IntelligenceSection() {
  const t = useTranslations("Landing.Intelligence");
  const scene = useIntelligenceSection();
  const { mounted, containerRef, parallax } = scene;

  return (
    <section ref={containerRef} className="relative isolate w-full overflow-hidden py-24 md:py-32">
      <motion.div
        style={mounted ? parallax.background : undefined}
        className="gradient-sky-amber dark:gradient-deep-amber absolute inset-0 -z-10 opacity-20 dark:opacity-30"
      />

      <div className="mx-auto flex w-full flex-col items-center gap-16 px-4 sm:px-6 lg:px-8">
        <motion.div style={mounted ? parallax.slow : undefined} className="w-full">
          <motion.div
            className="mx-auto flex flex-col items-center gap-6 text-center"
            initial={{ opacity: 0, y: -60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={transition}
            viewport={viewport}
          >
            <TaglineBadge text={t("tagline")} />
            <h2 className="text-foreground flex flex-col gap-1 overflow-visible py-1 pb-4 text-4xl leading-tight font-semibold tracking-tight lg:text-5xl">
              <span className="overflow-visible pb-1">{t("titlePart1")}</span>
              <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember overflow-visible py-1 font-bold">
                {t("titlePart2")}
              </span>
            </h2>
            <p className="text-muted-foreground max-w-4xl text-base leading-relaxed md:text-lg">
              {t("description")}
            </p>
          </motion.div>
        </motion.div>

        <EnrollmentIntelligence scene={scene} />

        <PerformanceIntelligence scene={scene} />

        <InstitutionIntelligence scene={scene} />

        <motion.div style={mounted ? parallax.fast : undefined} className="mt-24 w-full">
          <motion.div
            className="flex w-full justify-center"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={transition}
            viewport={viewport}
          >
            <InfoBar items={INTELLIGENCE_INFO_BAR_DATA} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
