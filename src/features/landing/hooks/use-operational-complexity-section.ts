import { useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function useOperationalComplexitySection() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const parallax = {
    background: { y: backgroundY },
    content: { y: contentY },
  };

  return { mounted, containerRef, parallax };
}
