"use client";

import type { Checklist, ChecklistItem } from "@/lib/engine/checklist";
import { groupHeading } from "@/lib/engine/checklist";
import { glossaryFor } from "@/lib/data/glossary";
import { urgency } from "@/lib/engine/dates";
import { ProgressBar } from "@/components/ui";
import { GlossaryDetails } from "./EvidencePanel";
import { SourceQuote } from "./SourceQuote";

const ORIGIN: Record<ChecklistItem["origin"], { label: string; cls: string }> = {
  solicitation: { label: "from the solicitation", cls: "bg-slate-soft text-slate" },
  standard: { label: "general County step", cls: "bg-blue-soft text-blue" },
  "glossary-advice": { label: "our suggestion", cls: "bg-amber-soft text-amber" },
};

export function ChecklistView({ checklist, today, ticks, toggleTick }: { checklist: Checklist; today: string; ticks: Record<string, boolean>; toggleTick: (key: string) => void }) {
  const all = checklist.groups.flatMap((g) => g.items);
  const keyFor = (i: ChecklistItem) => `${checklist.storageKey}:${i.id}`;
  const done = all.filter((i) => ticks[keyFor(i)]).length;
  return (
    <div className="card p-5 space-y-6">
      {checklist.closed ? (
        <p className="text-sm text-slate bg-slate-soft rounded-lg px-3 py-2">This solicitation has closed. The steps stay here so you know what a similar one will ask for.</p>
      ) : (
        <ProgressBar value={done} max={all.length} label="Your progress (saved on this device)" />
      )}
      {checklist.groups.map((g) => {
        const u = g.date && g.kind !== "closed" ? urgency(g.date, today) : "past";
        const headCls = g.kind === "do-now" || u === "critical" ? "text-red" : u === "soon" ? "text-amber" : "text-ink";
        return (
          <section key={g.id} aria-labelledby={`cl-${g.id}`}>
            <h3 className="flex flex-wrap items-baseline gap-2">
              <span id={`cl-${g.id}`} className={`font-semibold ${headCls}`}>
                {groupHeading(g)}
              </span>
              <span className="text-sm text-muted">{g.label}</span>
            </h3>
            {g.notes.map((n) => (
              <p key={n} className="text-xs text-amber mt-1">
                {n}
              </p>
            ))}
            <ul className="mt-2 space-y-2">
              {g.items.map((item) => {
                const k = keyFor(item);
                const checked = !!ticks[k];
                const gl = glossaryFor(item.glossaryKey);
                return (
                  <li key={`${g.id}-${item.id}`} className={`rounded-lg border px-3 py-2 ${checked ? "border-green/30 bg-green-soft/40" : "border-line bg-paper"}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--green)]" checked={checked} disabled={checklist.closed} onChange={() => toggleTick(k)} />
                      <span className="min-w-0 flex-1">
                        <span className={`text-sm ${checked ? "line-through text-muted" : "text-ink"}`}>{item.label}</span>
                        {item.mandatory && <span className="ml-2 text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 bg-red-soft text-red">required</span>}
                        <span className={`ml-2 text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 ${ORIGIN[item.origin].cls}`}>{ORIGIN[item.origin].label}</span>
                      </span>
                    </label>
                    <div className="pl-7">
                      {item.detail && <p className="text-xs text-muted mt-0.5">{item.detail}</p>}
                      {item.warning && <p className="text-xs text-amber mt-0.5">{item.warning}</p>}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-green underline">
                          Open the official page ↗
                        </a>
                      )}
                      {gl && <GlossaryDetails g={gl} />}
                      <SourceQuote sourceRef={item.sourceRef} compact />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
