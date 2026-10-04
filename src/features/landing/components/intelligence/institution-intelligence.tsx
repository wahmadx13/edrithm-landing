"use client";
import { AreaLineChart } from "@/components/charts/area-line-chart";
import { LinkButton } from "@/components/ui/actions/link-button";
import { CircularLoader } from "@/components/ui/feedback/circular-loader";
import { FeatureCard } from "@/components/ui/surfaces/feature-card";
import { transition, viewport } from "@/utils/animation";
import { AREA_CHART_MOCK_DATA } from "@/utils/constants";
import { motion } from "framer-motion";
import { ArrowRight, Eye, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useIntelligenceSection } from "../../hooks/use-intelligence-section";
export function InstitutionIntelligence({
  scene,
}: {
  scene: ReturnType<typeof useIntelligenceSection>;
}) {
  const { mounted, isDark, parallax } = scene;
  const t = useTranslations("Landing.Intelligence");
  return (
    <div className="mt-24 grid w-full grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-8 lg:gap-16">
      <motion.div style={mounted ? parallax.slow : undefined} className="w-full">
        <motion.div
          className="flex flex-col items-start gap-8"
          initial={{ opacity: 0, x: -60, y: 60 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          transition={transition}
          viewport={viewport}
        >
          <div className="bg-primary/20 border-primary flex h-12 w-12 items-center justify-center rounded-xl border dark:border-yellow-400 dark:bg-yellow-400/20">
            <Eye className="text-primary h-6 w-6 dark:text-yellow-400" />
          </div>
          <h3 className="flex flex-col gap-1 overflow-visible py-1 text-3xl leading-tight font-bold tracking-tight lg:text-4xl">
            <span className="text-foreground overflow-visible pb-1">{t("attendanceTitle")}</span>
            <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember overflow-visible py-1">
              {t("attendanceGradient")}
            </span>
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
            {t("attendanceDescription")}
          </p>
          <LinkButton
            href="#analyze"
            label={t("analyzeMetrics")}
            icon={ArrowRight}
            textGradientClass="text-gradient-midnight-citrus dark:text-gradient-midnight-ember"
            iconColorClass="text-primary"
          />
        </motion.div>
      </motion.div>

      <motion.div style={mounted ? parallax.fast : undefined} className="w-full">
        <motion.div
          className="flex w-full items-center justify-center"
          initial={{ opacity: 0, x: 60, y: 60 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          transition={transition}
          viewport={viewport}
        >
          <FeatureCard
            gradientClass="gradient-frosted-neon dark:gradient-ellipse-glow"
            shadowClass="shadow-soft dark:shadow-deep"
            className="gap-6 p-8 lg:p-10"
          >
            <div className="dark:bg-card/50 flex w-full items-center justify-between rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                  {t("dailyRate")}
                </span>
                <span className="text-foreground text-4xl font-bold tracking-tight">
                  96.8
                  <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember">
                    %
                  </span>
                </span>
              </div>
              <CircularLoader className="text-primary h-10 w-10 dark:text-yellow-400" />
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className="flex h-32 w-full">
                {mounted ? (
                  <AreaLineChart
                    data={AREA_CHART_MOCK_DATA}
                    dataKey="value"
                    strokeColor={isDark ? "#facc15" : "#FF7A00"}
                  />
                ) : (
                  <div className="bg-muted h-full w-full animate-pulse rounded-xl opacity-30" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-bold">98.2%</span>
                  <span className="text-muted-foreground text-[0.625rem] font-medium tracking-wide uppercase">
                    {t("baseline")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2 py-1 text-[0.625rem] font-bold text-orange-600 dark:text-orange-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>{t("stable")}</span>
                </div>
              </div>
            </div>
          </FeatureCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
