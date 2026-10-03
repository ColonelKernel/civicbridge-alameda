import type { SummarySection } from "@/lib/engine/explain";
import { SourceQuote } from "./SourceQuote";

const TONE = {
  warn: { icon: "⚠", cls: "text-amber" },
  good: { icon: "✓", cls: "text-green" },
  info: { icon: "ℹ", cls: "text-blue" },
} as const;

/** The six-section "procurement translator". Every line can show where it came from. */
export function PlainSummary({ sections }: { sections: SummarySection[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((s) => (
        <section key={s.key} className={`card p-4 ${s.key === "watch" ? "md:col-span-2 border-amber/40" : ""}`} aria-labelledby={`sum-${s.key}`}>
          <h3 id={`sum-${s.key}`} className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            {s.title}
          </h3>
          <ul className="space-y-2">
            {s.lines.map((l, i) => (
              <li key={i} className="text-sm text-ink">
                <div className="flex gap-2">
                  {l.tone && (
                    <span aria-hidden className={`${TONE[l.tone].cls} shrink-0`}>
                      {TONE[l.tone].icon}
                    </span>
                  )}
                  <span>{l.text}</span>
                </div>
                <SourceQuote sourceRef={l.sourceRef} compact />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
