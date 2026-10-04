"use client";
import { VelocityChart } from "@/components/charts/velocity-chart";
import { FeatureCard } from "@/components/ui/surfaces/feature-card";
import { cn } from "@/lib/class-names";
import { transition, viewport } from "@/utils/animation";
import { VELOCITY_CHART_DATA } from "@/utils/constants";
import { motion } from "framer-motion";
import {
  AppWindow,
  Archive,
  ArrowRightLeft,
  ChartColumn,
  DollarSign,
  GraduationCap,
  Landmark,
  Mail,
  Rocket,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import NextImage from "next/image";
export function ComplexityDiagram() {
  const t = useTranslations("Landing.OperationalComplexity");
  return (
    <div className="mt-24 grid w-full grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-12 lg:gap-24">
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={transition}
        viewport={viewport}
        className="relative flex w-full justify-start lg:-mt-14"
      >
        <div className="aspect-704/709 w-full">
          <NextImage
            src="/assets/icons/landing-page/operational-complexity/window.svg"
            alt="Complexity Window Illustration"
            fill
            className="object-contain"
            priority
          />
        </div>
      </motion.div>

      <div className="flex flex-col gap-10 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={transition}
          viewport={viewport}
        >
          <FeatureCard
            gradientClass="gradient-frosted-neon dark:gradient-ellipse-glow"
            shadowClass="shadow-soft dark:shadow-deep"
            className="p-8 lg:p-10"
          >
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-muted-foreground text-[.521rem] font-bold tracking-widest uppercase sm:text-xs">
                {t("card1Title")}
              </h3>
              <span className="text-right text-[.521rem] font-bold tracking-widest text-orange-600 uppercase drop-shadow-[0_0_0.9375rem_rgba(255,122,0,0.8)] sm:text-xs dark:text-yellow-500">
                {t("card1Badge")}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:gap-4">
              {[
                { icon: ArrowRightLeft, glow: false },
                { icon: DollarSign, glow: false },
                { icon: AppWindow, glow: false },
                { icon: GraduationCap, glow: true },
                { icon: Users, glow: false },
                { icon: ChartColumn, glow: false },
                { icon: Rocket, glow: true },
                { icon: Mail, glow: false },
                { icon: Archive, glow: false },
                { icon: Landmark, glow: true },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex aspect-square w-xl items-center justify-center rounded-lg border transition-all duration-300 lg:w-3xl",
                      item.glow
                        ? "border-orange-600/60 bg-orange-600/15 shadow-[0_0_1.25rem_rgba(255,59,59,0.3)] dark:border-yellow-400/60 dark:bg-yellow-400/15 dark:shadow-[0_0_1.5625rem_rgba(255,214,0,0.4)]"
                        : "text-muted-foreground/40 border-white/5 bg-white/5",
                    )}
                  >
                    <Icon
                      className={cn(
                        "transition-all",
                        item.glow ? "h-8 w-8 text-orange-600 dark:text-yellow-400" : "h-5 w-5",
                      )}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-8 border-t border-white/5 pt-4 text-center">
              <p className="text-muted-foreground text-xs italic">{t("card1Quote")}</p>
            </div>
          </FeatureCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60, y: 60 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          transition={{ ...transition, delay: 0.1 }}
          viewport={viewport}
        >
          <FeatureCard
            gradientClass="gradient-frosted-neon dark:gradient-ellipse-glow"
            shadowClass="shadow-soft dark:shadow-deep"
            className="p-2 lg:p-4"
          >
            <div className="mb-8">
              <h3 className="text-muted-foreground text-[.521rem] font-bold tracking-widest uppercase sm:text-xs">
                {t("card2Title")}
              </h3>
            </div>

            <div className="relative h-auto w-full">
              <VelocityChart data={VELOCITY_CHART_DATA} />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <span className="text-muted-foreground text-[.521rem] font-bold uppercase sm:text-xs">
                {t("card2Phase")}
              </span>
              <span className="text-[.521rem] font-bold text-orange-600 uppercase sm:text-xs dark:text-orange-500">
                {t("card2Warning")}
              </span>
            </div>
          </FeatureCard>
        </motion.div>
      </div>
    </div>
  );
}
