"use client";

import { useState, useEffect, type ReactNode } from "react";

export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}

export function AnimatedNumber({
  target,
  suffix = "",
  duration = 1200,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setVal(0);
      return;
    }
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(id);
      } else {
        setVal(Math.round(start));
      }
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);

  return (
    <span>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}
