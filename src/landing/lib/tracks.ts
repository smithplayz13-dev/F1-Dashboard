/** Shared fictional Formula-grade circuits + geometry helpers.
 *  Morph set (A/B/C) shares identical command structure for morphTo(). */

export const CIRCUIT_A =
  "M 120 322 C 92 246 158 164 258 152 C 356 141 398 202 478 192 C 576 180 598 112 698 106 C 806 100 848 170 928 176 C 1018 182 1078 232 1058 300 C 1040 364 960 400 870 386 C 790 374 770 322 700 326 C 620 331 600 400 500 404 C 402 408 382 330 302 340 C 222 350 148 392 120 322 Z";

export const CIRCUIT_B =
  "M 200 340 C 160 250 220 140 340 130 C 450 121 470 210 560 200 C 660 189 640 100 750 96 C 860 92 900 180 980 186 C 1060 192 1090 260 1040 320 C 995 375 900 396 820 380 C 745 365 740 310 670 314 C 595 318 590 390 495 394 C 400 398 390 320 310 330 C 235 339 230 390 200 340 Z";

export const CIRCUIT_C =
  "M 150 300 C 120 220 200 150 300 145 C 400 140 410 220 500 210 C 590 200 580 120 680 115 C 780 110 820 190 900 195 C 980 200 1040 250 1010 310 C 982 366 900 388 830 376 C 762 365 758 318 690 322 C 618 326 610 388 520 390 C 428 392 420 318 340 326 C 262 334 180 360 150 300 Z";

/** Long open racing line for the path-following demo. */
export const RACING_LINE =
  "M -40 268 C 140 268 170 118 335 118 C 500 118 478 282 645 282 C 812 282 828 96 990 96 C 1105 96 1145 178 1250 178";

/** Gentle S-curve for the scroll-race mini circuit. */
export const SCROLL_TRACK =
  "M 60 200 C 180 200 200 80 340 80 C 480 80 460 200 600 200 C 740 200 760 90 900 90";

export function samplePath(
  path: SVGPathElement | null,
  t: number
): { x: number; y: number; angle: number } {
  if (!path) return { x: 0, y: 0, angle: 0 };
  try {
    const len = path.getTotalLength();
    const c = Math.min(Math.max(t, 0), 1);
    const p0 = path.getPointAtLength(c * len);
    const p1 = path.getPointAtLength(Math.min(c + 0.004, 1) * len);
    return {
      x: p0.x,
      y: p0.y,
      angle: (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI,
    };
  } catch {
    return { x: 0, y: 0, angle: 0 };
  }
}

/** Evenly spaced points along a path (for dot fields / markers). */
export function pointsAlong(
  path: SVGPathElement | null,
  n: number,
  inset = 0
): { x: number; y: number }[] {
  if (!path || n <= 0) return [];
  try {
    const len = path.getTotalLength();
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : inset + (i / (n - 1)) * (1 - inset * 2);
      const p = path.getPointAtLength(Math.min(Math.max(t, 0), 1) * len);
      out.push({ x: p.x, y: p.y });
    }
    return out;
  } catch {
    return [];
  }
}
