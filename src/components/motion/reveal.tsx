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
  variant?: "up" | "fade" | "image";
};

export function Reveal({ children, className, delay = 0, variant = "up" }: RevealProps) {
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
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.16 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hidden =
    variant === "image"
      ? "opacity-0 scale-[1.04] blur-[2px]"
      : variant === "fade"
        ? "opacity-0 blur-[2px]"
        : "opacity-0 translate-y-6 blur-[2px]";

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-transform motion-safe:transition-[opacity,transform,filter] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:blur-0",
        delayClass[delay],
        visible ? "translate-y-0 scale-100 opacity-100 blur-0" : hidden,
        className
      )}
    >
      {children}
    </div>
  );
}
