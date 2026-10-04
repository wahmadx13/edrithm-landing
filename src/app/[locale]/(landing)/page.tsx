import { DifferentPhilosophySection } from "@/features/landing/different-philosophy-section";
import { HeroSection } from "@/features/landing/hero-section";
import { IntelligenceSection } from "@/features/landing/intelligence-section";
import { OperationalComplexitySection } from "@/features/landing/operational-complexity-section";
import { PricingSection } from "@/features/landing/pricing-section";

export default function Home() {
  return (
    <main className="flex w-full flex-1 flex-col items-center">
      <HeroSection />
      <OperationalComplexitySection />
      <IntelligenceSection />
      <DifferentPhilosophySection />
      <PricingSection />
    </main>
  );
}
