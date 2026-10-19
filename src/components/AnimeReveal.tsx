import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { animate } from "animejs";

interface Props {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
}

/** Staggered entrance wrapper — mounts visible, enhances with anime.js */
export default function AnimeReveal({ children, delay = 0, y = 22, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.style.opacity = "0";
    let anim: unknown = null;
    try {
      anim = animate(el as any, {
        opacity: [0, 1],
        translateY: [y, 0],
        duration: 850,
        delay,
        ease: "outExpo",
      });
    } catch {
      el.style.opacity = "1";
    }
    // hard fallback: never trap content at opacity 0
    const t = window.setTimeout(() => {
      if (el && getComputedStyle(el).opacity === "0") {
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    }, 1400 + delay);
    return () => {
      window.clearTimeout(t);
      try {
        (anim as any)?.revert?.();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} data-anime className={className} style={style}>
      {children}
    </div>
  );
}
