"use client";

import { TaglineBadge } from "@/components/shared/tagline-badge/tagline-badge";
import { Button } from "@/components/ui/actions/button";
import { Stack } from "@/components/ui/layout/stack";
import { Typography } from "@/components/ui/layout/typography";
import { FeatureCard } from "@/components/ui/surfaces/feature-card";
import { cn } from "@/lib/class-names";
import { transition, viewport } from "@/utils/animation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePricingSection } from "./hooks/use-pricing-section";

const PLAN_KEYS = ["starter", "professional", "enterprise"] as const;

export function PricingSection() {
  const t = useTranslations("Landing.Pricing");
  const { mounted, containerRef, parallax } = usePricingSection();

  return (
    <section ref={containerRef} className="relative isolate w-full overflow-hidden py-24 md:py-32">
      <motion.div
        style={mounted ? parallax.background : undefined}
        className="gradient-sky-amber dark:gradient-deep-amber absolute inset-0 -z-10 opacity-20 dark:opacity-30"
      />

      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <Stack align="center" gap="3xl" className="w-full">
          <Stack asChild align="center" gap="md" className="mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={transition}
              viewport={viewport}
            >
              <TaglineBadge text={t("tagline")} />

              <h2 className="text-foreground flex flex-col gap-1 overflow-visible py-2 pb-6 text-4xl leading-tight font-semibold tracking-tight lg:text-5xl">
                <span className="overflow-visible pb-1">
                  {t("titlePart1")}{" "}
                  <span className="text-gradient-midnight-citrus dark:text-gradient-midnight-ember overflow-visible py-1 font-bold">
                    {t("titlePart2")}
                  </span>
                </span>
              </h2>

              <p className="text-muted-foreground max-w-4xl text-base leading-relaxed whitespace-pre-line md:text-lg">
                {t("description")}
              </p>
            </motion.div>
          </Stack>

          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3">
            {PLAN_KEYS.map((key, idx) => {
              const isPopular = key === "professional";
              const price = t(`plans.${key}.price`);
              const features = t.raw(`plans.${key}.features`) as string[];

              return (
                <motion.div
                  key={key}
                  initial={{
                    opacity: 0,
                    x: idx === 0 ? -100 : idx === 2 ? 100 : 0,
                    y: idx === 1 ? -100 : 0,
                  }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ ...transition, delay: idx * 0.1 }}
                  viewport={viewport}
                  className="h-full w-full"
                >
                  <FeatureCard
                    gradientClass={cn(
                      "gradient-frosted-neon dark:gradient-ellipse-glow border border-white/10 dark:border-white/5",
                      isPopular &&
                        "border-primary/40 dark:border-primary/30 ring-2 ring-primary/10 shadow-glow-primary",
                    )}
                    shadowClass="shadow-soft dark:shadow-deep"
                    className="flex h-full flex-col p-8 lg:p-10"
                  >
                    {isPopular && (
                      <div className="bg-primary/10 text-primary ring-primary/20 absolute top-4 right-4 rounded-full px-3 py-1 text-[0.625rem] font-bold tracking-widest uppercase ring-1">
                        {t("mostPopular")}
                      </div>
                    )}

                    <div className="mb-8 items-center text-center">
                      <h3 className="text-foreground text-xl font-bold tracking-tight">
                        {t(`plans.${key}.name`)}
                      </h3>
                      <div className="mt-4 flex items-baseline justify-center gap-1">
                        <span className="text-foreground text-5xl font-black">{price}</span>
                        {key !== "enterprise" && (
                          <span className="text-muted-foreground text-sm font-medium">
                            {t("perMonth")}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                        {t(`plans.${key}.description`)}
                      </p>
                    </div>

                    <div className="via-border mb-8 h-px w-full bg-linear-to-r from-transparent to-transparent" />

                    <Stack gap="md" className="mb-10 flex-grow">
                      {features.map((feature) => (
                        <Stack
                          key={feature}
                          direction="row"
                          align="center"
                          gap="sm"
                          className="text-foreground/80 text-sm font-medium"
                        >
                          <Stack
                            align="center"
                            justify="center"
                            className="bg-primary/20 h-5 w-5 shrink-0 rounded-full"
                          >
                            <Check className="text-primary h-3.5 w-3.5 stroke-[3]" />
                          </Stack>
                          <Typography variant="small" as="span" className="text-sm">
                            {feature}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>

                    <Button
                      variant={isPopular ? "default" : "outline"}
                      className={cn(
                        "h-14 w-full cursor-pointer rounded-full text-sm font-bold tracking-wide transition-all active:scale-95",
                        isPopular
                          ? "bg-primary hover:bg-primary/90 shadow-primary/20 text-white shadow-lg"
                          : "text-foreground border-border hover:bg-muted/50",
                      )}
                    >
                      {t(`plans.${key}.buttonText`)}
                    </Button>
                  </FeatureCard>
                </motion.div>
              );
            })}
          </div>
        </Stack>
      </div>
    </section>
  );
}
