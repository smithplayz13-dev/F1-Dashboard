import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { skewIn } from "../lib/anime";

interface Props {
  text: string;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}

/**
 * Originkit `skew-in-text-effect` rebuilt on anime.js (no framer-motion).
 * Sharp skew + offset + fade entrance for panel titles and hero.
 * Renders visible by default; motion is enhancement only.
 */
export default function SkewTitle({ text, className = "", style, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.style.opacity = "0";
    skewIn(el, { delay });
  }, [delay, text]);

  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`} style={style}>
      {text}
    </span>
  );
}
