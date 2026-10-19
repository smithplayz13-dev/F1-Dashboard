import { useEffect, useRef, type ReactNode } from "react";
import { animate, stagger } from "animejs";
import { prefersReducedMotion, lpOnEnter } from "../lib/landingAnime";
import CodeBlock from "./CodeBlock";

/** Giant experiment heading: index, huge display lines, lede, optional live-demo code. */
export default function SectionHead({
  index,
  title,
  lede,
  codeTitle,
  code,
  id,
}: {
  index: string;
  title: ReactNode;
  lede?: string;
  codeTitle?: string;
  code?: ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return lpOnEnter(
      el,
      () => {
        if (prefersReducedMotion()) return;
        try {
          animate(el.querySelectorAll("[data-sh-line]") as never, {
            opacity: [0, 1],
            translateY: [60, 0],
            skewX: [6, 0],
            duration: 1000,
            delay: stagger(110) as never,
            ease: "outExpo" as never,
          });
          animate(el.querySelectorAll("[data-sh-fade]") as never, {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 700,
            delay: stagger(100, { start: 350 }) as never,
            ease: "outExpo" as never,
          });
        } catch { /* visible by default */ }
      },
      0.3
    );
  }, []);

  return (
    <div ref={ref} className="max-w-[1440px]">
      <div data-sh-fade className="flex items-center gap-3">
        <span className="lp-mono text-[11px] font-bold tracking-[0.2em] text-[#ff5a4d]">{index}</span>
        <span className="h-px w-12 bg-[#ff2e1f]/60" aria-hidden />
        <span className="lp-tech">experiment</span>
      </div>
      <h2 id={id} data-sh-line className="lp-display lp-huge mt-5 max-w-5xl font-bold uppercase text-[#f4f1ea]">
        {title}
      </h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
        {lede && (
          <p data-sh-fade className="max-w-xl text-[15px] leading-relaxed text-[#a39e93] md:text-base">
            {lede}
          </p>
        )}
        {code && codeTitle && (
          <div data-sh-fade>
            <CodeBlock title={codeTitle}>{code}</CodeBlock>
          </div>
        )}
      </div>
    </div>
  );
}
