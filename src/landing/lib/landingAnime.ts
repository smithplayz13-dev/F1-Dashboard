import { animate } from "animejs";

export const LP_EASE_OUT = "outExpo";
export const LP_EASE_SNAP = "outQuart";
export const LP_EASE_LAUNCH = "inQuad";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function isCoarsePointer(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(pointer: coarse)").matches
  );
}

type Targets = string | Element | Element[] | NodeList | null | undefined;

function toArray(t: Targets): Element[] {
  if (!t) return [];
  if (typeof t === "string") return Array.from(document.querySelectorAll(t));
  if (t instanceof Element) return [t];
  return Array.from(t as ArrayLike<Element>);
}

/** Reveal a set of targets once (entrance). Never leaves them hidden. */
export function lpEntrance(targets: Targets, delay = 0) {
  const els = toArray(targets);
  if (!els.length) return;
  if (prefersReducedMotion()) {
    for (const el of els) (el as HTMLElement).style.opacity = "1";
    return;
  }
  try {
    animate(els as Parameters<typeof animate>[0], {
      opacity: [0, 1],
      translateY: [26, 0],
      duration: 850,
      delay: (delay ?? 0) as never,
      ease: LP_EASE_OUT,
    });
  } catch {
    for (const el of els) (el as HTMLElement).style.opacity = "1";
  }
}

/** Observe an element; call onEnter once when visible. Returns cleanup. */
export function lpOnEnter(
  el: Element | null,
  onEnter: () => void,
  threshold = 0.2
): () => void {
  if (!el || typeof IntersectionObserver === "undefined") {
    onEnter();
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.disconnect();
        onEnter();
      }
    },
    { threshold, rootMargin: "0px 0px -8% 0px" }
  );
  io.observe(el);
  return () => io.disconnect();
}

/** Observe visibility continuously (for pausing loops). */
export function lpOnVisible(
  el: Element | null,
  onChange: (visible: boolean) => void,
  threshold = 0.05
): () => void {
  if (!el || typeof IntersectionObserver === "undefined") return () => {};
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) onChange(e.isIntersecting);
    },
    { threshold }
  );
  io.observe(el);
  return () => io.disconnect();
}

/** Tween a number into an element's textContent. Returns the animation handle. */
export function lpTweenNumber(
  el: HTMLElement | null,
  from: number,
  to: number,
  opts?: { duration?: number; decimals?: number; prefix?: string; suffix?: string; ease?: string }
) {
  if (!el) return null;
  const { duration = 700, decimals = 3, prefix = "", suffix = "" } = opts ?? {};
  if (prefersReducedMotion()) {
    el.textContent = `${prefix}${to.toFixed(decimals)}${suffix}`;
    return null;
  }
  const state = { v: from };
  const fmt = () => `${prefix}${state.v.toFixed(decimals)}${suffix}`;
  el.textContent = fmt();
  try {
    return animate(state as never, {
      v: [from, to],
      duration,
      ease: (opts?.ease ?? "outCubic") as never,
      onUpdate: () => {
        el.textContent = fmt();
      },
    });
  } catch {
    el.textContent = `${prefix}${to.toFixed(decimals)}${suffix}`;
    return null;
  }
}

/** FLIP helper: measure children tops, run mutator, animate deltas. */
export function lpFlip(
  container: HTMLElement | null,
  keyOf: (el: Element, index: number) => string,
  mutate: () => void,
  duration = 550
) {
  if (!container) {
    mutate();
    return;
  }
  const kids = Array.from(container.children);
  const first = new Map<string, number>();
  for (let i = 0; i < kids.length; i++) {
    first.set(keyOf(kids[i], i), kids[i].getBoundingClientRect().top);
  }
  mutate();
  requestAnimationFrame(() => {
    const next = Array.from(container.children);
    for (let i = 0; i < next.length; i++) {
      const el = next[i] as HTMLElement;
      const dy = (first.get(keyOf(el, i)) ?? el.getBoundingClientRect().top) - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;
      if (prefersReducedMotion()) continue;
      try {
        animate(el as never, {
          translateY: [dy, 0],
          duration,
          ease: LP_EASE_OUT,
        });
      } catch {
        /* static fallback */
      }
    }
  });
}
