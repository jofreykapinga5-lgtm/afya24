"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const delayClass = {
  0: "",
  60: "motion-safe:delay-[60ms]",
  120: "motion-safe:delay-[120ms]",
  180: "motion-safe:delay-[180ms]",
} as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: keyof typeof delayClass;
  variant?: "swipe" | "fade" | "image";
};

export function Reveal({ children, className, delay = 0, variant = "swipe" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hidden =
    variant === "image"
      ? "translate-x-5 scale-[1.015] opacity-0"
      : variant === "fade"
        ? "opacity-0"
        : "-translate-x-5 opacity-0";

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-transform motion-safe:transition-[opacity,transform] motion-safe:duration-[420ms] motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:translate-x-0 motion-reduce:scale-100",
        delayClass[delay],
        visible ? "translate-x-0 scale-100 opacity-100" : hidden,
        className
      )}
    >
      {children}
    </div>
  );
}
