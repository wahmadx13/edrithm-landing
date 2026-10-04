import { useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

export function usePricingSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const yBackground = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const yContentSlow = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const yContentFast = useTransform(scrollYProgress, [0, 1], [80, -80]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const parallax = {
    background: { y: yBackground },
    slow: { y: yContentSlow },
    fast: { y: yContentFast },
  };

  return { mounted, isDark, containerRef, parallax };
}
