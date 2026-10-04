import { useScroll, useTransform } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useHeroSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { scrollY } = useScroll();

  const yParallax = useTransform(scrollY, [0, 800], [0, 250]);
  const opacityParallax = useTransform(scrollY, [0, 800], [1, 0.4]);
  const scaleParallax = useTransform(scrollY, [0, 800], [1, 0.95]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return {
    mounted,
    resolvedTheme,
    parallax: { y: yParallax, opacity: opacityParallax, scale: scaleParallax },
  };
}
