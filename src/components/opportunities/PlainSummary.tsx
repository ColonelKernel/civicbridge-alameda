"use client";

import { useMemo, useState } from "react";
import type { SectionKey, SummarySection } from "@/lib/engine/explain";
import { useLanguage, useTranslated } from "@/state/language";
import { SourceQuote } from "./SourceQuote";

const TONE = {
  warn: { icon: "⚠", cls: "text-amber" },
  good: { icon: "✓", cls: "text-green" },
  info: { icon: "ℹ", cls: "text-blue" },
} as const;

const TAB_ORDER: SectionKey[] = ["need", "money", "who", "submit", "dates"];

function Lines({ s, tr }: { s: SummarySection; tr: (t: string) => string }) {
  return (
    <ul className="space-y-2">
      {s.lines.map((l, i) => (
        <li key={i} className="text-sm text-ink">
          <div className="flex gap-2">
            {l.tone && (
              <span aria-hidden className={`${TONE[l.tone].cls} shrink-0`}>
                {TONE[l.tone].icon}
              </span>
            )}
            <span>{tr(l.text)}</span>
          </div>
          <SourceQuote sourceRef={l.sourceRef} compact />
        </li>
      ))}
    </ul>
  );
}

/** The six-section procurement translator: "Watch out" always visible, the rest as tabs. */
export function PlainSummary({ sections }: { sections: SummarySection[] }) {
  const { t, locale } = useLanguage();
  const [active, setActive] = useState<SectionKey>("need");
  const texts = useMemo(() => sections.flatMap((s) => s.lines.map((l) => l.text)), [sections]);
  const { tr, status } = useTranslated(texts);
  const watch = sections.find((s) => s.key === "watch");
  const tabs = TAB_ORDER.map((k) => sections.find((s) => s.key === k)).filter((s): s is SummarySection => !!s);
  const current = tabs.find((s) => s.key === active) ?? tabs[0];

  return (
    <div className="space-y-4">
      {locale !== "en" && (
        <p className="text-xs text-muted" aria-live="polite">
          {status === "loading" ? t("lang.translating") : status === "unavailable" || status === "error" ? t("lang.unavailable") : t("lang.note")}
        </p>
      )}
      {watch && watch.lines.length > 0 && (
        <section className="card p-4 border-amber/40" aria-labelledby="sum-watch">
          <h3 id="sum-watch" className="text-xs font-semibold uppercase tracking-wider text-amber mb-2">
            {t("sum.watch")}
          </h3>
          <Lines s={watch} tr={tr} />
        </section>
      )}
      <div className="card p-4">
        <div role="group" aria-label="Summary sections" className="flex gap-1.5 overflow-x-auto whitespace-nowrap pb-2 -mx-1 px-1">
          {tabs.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={s.key === current?.key}
              onClick={() => setActive(s.key)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${s.key === current?.key ? "bg-ink text-white" : "bg-slate-soft text-ink hover:bg-line"}`}
            >
              {t(`sum.${s.key}`)} <span className="opacity-70">{s.lines.length}</span>
            </button>
          ))}
        </div>
        {current && (
          <section aria-labelledby={`sum-${current.key}`} className="mt-2">
            <h3 id={`sum-${current.key}`} className="sr-only">
              {t(`sum.${current.key}`)}
            </h3>
            <Lines s={current} tr={tr} />
          </section>
        )}
      </div>
    </div>
  );
}
