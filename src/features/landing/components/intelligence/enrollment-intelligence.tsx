"use client";
import { LinkButton } from "@/components/ui/actions/link-button";
import { FeatureCard } from "@/components/ui/surfaces/feature-card";
import { transition, viewport } from "@/utils/animation";
import { motion } from "framer-motion";
import { ArrowRight, CircleCheckBig, Library, ShieldCheck, ShieldUser } from "lucide-react";
import { useTranslations } from "next-intl";
import { useIntelligenceSection } from "../../hooks/use-intelligence-section";
export function EnrollmentIntelligence({
  scene,
}: {
  scene: ReturnType<typeof useIntelligenceSection>;
}) {
  const { mounted, parallax } = scene;
  const t = useTranslations("Landing.Intelligence");
  return (
    <div className="grid w-full grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-8 lg:gap-16">
      <motion.div style={mounted ? parallax.slow : undefined} className="w-full">
        <motion.div
          className="flex flex-col items-start gap-8"
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={transition}
          viewport={viewport}
        >
          <div className="border-primary bg-primary/20 flex h-12 w-12 items-center justify-center rounded-xl border">
            <ShieldUser className="text-primary h-6 w-6" />
          </div>
          <h3 className="flex flex-col gap-1 overflow-visible py-1 text-3xl leading-tight font-bold tracking-tight lg:text-4xl">
            <span className="text-foreground overflow-visible pb-1">{t("enrollmentTitle")}</span>
            <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember overflow-visible py-1">
              {t("enrollmentGradient")}
            </span>
          </h3>
          <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
            {t("enrollmentDescription")}
          </p>
          <LinkButton
            href="#workflows"
            label={t("exploreWorkflows")}
            icon={ArrowRight}
            textGradientClass="text-gradient-midnight-citrus dark:text-gradient-midnight-ember"
            iconColorClass="text-primary"
          />
        </motion.div>
      </motion.div>

      <motion.div style={mounted ? parallax.fast : undefined} className="w-full">
        <motion.div
          className="flex w-full items-center justify-center"
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={transition}
          viewport={viewport}
        >
          <FeatureCard
            gradientClass="gradient-frosted-neon dark:gradient-ellipse-glow"
            shadowClass="shadow-soft dark:shadow-deep"
            className="items-center justify-center gap-4 p-8 md:flex-row md:justify-around lg:gap-6 lg:p-12"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="bg-primary flex h-14 w-14 items-center justify-center rounded-xl shadow-md">
                <Library className="h-6 w-6 stroke-[1.5] text-white" />
              </div>
              <span className="text-primary text-xs font-bold tracking-wider uppercase">
                {t("collect")}
              </span>
            </div>
            <div className="from-primary to-accent/50 h-8 w-0.5 rounded-full bg-linear-to-b md:h-0.5 md:w-8 md:bg-linear-to-r lg:w-16" />
            <div className="flex flex-col items-center gap-3">
              <div className="border-primary/30 dark:bg-muted/50 dark:border-primary/40 flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-white shadow-sm">
                <ShieldCheck className="text-primary h-6 w-6 stroke-[1.5] dark:text-orange-200" />
              </div>
              <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember text-xs font-bold tracking-wider uppercase">
                {t("verify")}
              </span>
            </div>
            <div className="bg-muted-foreground/30 h-8 w-0.5 rounded-full md:h-0.5 md:w-8 lg:w-16" />
            <div className="flex flex-col items-center gap-3">
              <div className="border-muted dark:bg-muted/50 dark:border-muted-foreground/30 flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-white shadow-sm">
                <CircleCheckBig className="text-muted-foreground h-6 w-6 stroke-[1.5]" />
              </div>
              <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                {t("confirm")}
              </span>
            </div>
          </FeatureCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
