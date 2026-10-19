import { animate, stagger } from "animejs";

export const EASE_OUT = "outExpo";
export const EASE_SPRING = "outBack(1.4)";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Targets = string | Element | Element[] | NodeList | HTMLCollection | null | undefined;

function toArray(t: Targets): Element[] {
  if (!t) return [];
  if (typeof t === "string") return Array.from(document.querySelectorAll(t));
  if (t instanceof Element) return [t];
  return Array.from(t as ArrayLike<Element>);
}

function showAll(els: Element[]) {
  for (const el of els) {
    (el as HTMLElement).style.opacity = "1";
    (el as HTMLElement).style.transform = "none";
  }
}

/** Page-load stagger: fades + rises a set of targets. Never leaves them hidden. */
export function entrance(targets: Targets, delay = 0) {
  const els = toArray(targets);
  if (!els.length) return;
  if (reducedMotion()) {
    showAll(els);
    return;
  }
  try {
    animate(els as any, {
      opacity: [0, 1],
      translateY: [22, 0],
      duration: 900,
      delay: stagger(70, { start: delay }),
      ease: EASE_OUT,
    });
  } catch {
    showAll(els);
  }
}

/** Skew-in text — Originkit skew-in-text-effect re-implemented on anime.js */
export function skewIn(el: Element | null, opts?: { delay?: number; x?: number; skew?: number }) {
  if (!el) return;
  const html = el as HTMLElement;
  if (reducedMotion()) {
    html.style.opacity = "1";
    html.style.transform = "none";
    return;
  }
  try {
    animate(el as any, {
      opacity: [0, 1],
      translateX: [opts?.x ?? -90, 0],
      skewX: [opts?.skew ?? 18, 0],
      duration: 1000,
      delay: opts?.delay ?? 0,
      ease: EASE_OUT,
    });
    // hard fallback: if the animation engine silently does nothing, reveal anyway
    window.setTimeout(() => {
      if (getComputedStyle(html).opacity === "0") html.style.opacity = "1";
    }, 1600 + (opts?.delay ?? 0));
  } catch {
    html.style.opacity = "1";
    html.style.transform = "none";
  }
}

const observed = new WeakSet<Element>();

/**
 * Scroll-triggered panel reveal via IntersectionObserver
 * (anime.js onScroll equivalent, without the API-shape risk).
 */
export function scrollReveal(selector: string) {
  if (typeof window === "undefined") return;
  const els = toArray(selector);
  if (!els.length) return;
  if (reducedMotion() || !("IntersectionObserver" in window)) {
    showAll(els);
    return;
  }
  try {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          try {
            animate(el as any, {
              opacity: [0, 1],
              translateY: [34, 0],
              scale: [0.985, 1],
              duration: 800,
              ease: EASE_OUT,
            });
          } catch {
            el.style.opacity = "1";
            el.style.transform = "none";
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );
    for (const el of els) {
      if (observed.has(el)) continue;
      observed.add(el);
      io.observe(el);
    }
  } catch {
    showAll(els);
  }
}

/** Magnetic hover physics for buttons/cards */
export function magnetic(el: HTMLElement | null, strength = 0.28) {
  if (!el || reducedMotion()) return () => {};
  try {
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      animate(el as any, {
        translateX: x * strength,
        translateY: y * strength,
        scale: 1.04,
        duration: 350,
        ease: "outQuad",
        overwrite: true,
      });
    };
    const leave = () => {
      animate(el as any, {
        translateX: 0,
        translateY: 0,
        scale: 1,
        duration: 600,
        ease: "outElastic(1, 0.45)",
        overwrite: true,
      });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  } catch {
    return () => {};
  }
}

/** Lap counter tick — scale pop on value change */
export function tickPop(el: Element | null) {
  if (!el || reducedMotion()) return;
  try {
    animate(el as any, {
      scale: [1.35, 1],
      duration: 450,
      ease: EASE_SPRING,
      overwrite: true,
    });
  } catch {
    /* decorative only */
  }
}

export { stagger, animate };
