import type { ReactNode } from "react";

/** Code snippet block — on animejs.com the docs ARE the design. Static colored spans, no highlighter needed. */
export default function CodeBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="lp-code" role="img" aria-label={`Code example: ${title}`}>
      <div className="lp-code-bar" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-[#3a3733]" />
        <span className="h-2 w-2 rounded-full bg-[#3a3733]" />
        <span className="lp-mono ml-2 text-[10px] tracking-[0.18em] text-[#6e6a61]">{title}</span>
      </div>
      <pre aria-hidden>{children}</pre>
    </div>
  );
}
