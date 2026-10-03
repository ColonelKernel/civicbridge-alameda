"use client";

import Link from "next/link";
import type { Evidence } from "@/lib/data/types";
import { glossaryFor, LEAD_TIME_LABEL, type GlossaryEntry } from "@/lib/data/glossary";
import { ConfidenceTag, StatusIcon } from "@/components/ui";
import { SourceQuote } from "./SourceQuote";

const GATE_TEXT: Record<GlossaryEntry["gate"], string> = {
  yes: "Lacking it can stop a bid.",
  no: "Not required to bid.",
  "at-award": "Needed before award, not with the bid.",
  form: "Handled on a form inside the bid packet.",
};

const shortTerm = (t: string) => t.split(" (")[0];

export function GlossaryDetails({ g, bare = false }: { g: GlossaryEntry; bare?: boolean }) {
  const body = (
    <div className="mt-1 space-y-1 rounded-lg bg-blue-soft/60 p-3 text-ink/85 text-sm">
      <p>{g.meaning}</p>
      <p>
        <span className="font-medium">What to do:</span> {g.action}
      </p>
      <p className="text-xs text-muted">
        {g.leadTime !== "n/a" && `Usually takes: ${LEAD_TIME_LABEL[g.leadTime].toLowerCase()}. `}
        {GATE_TEXT[g.gate]}
        {g.link && (
          <>
            {" "}
            ·{" "}
            <a href={g.link} target="_blank" rel="noreferrer" className="text-green underline">
              official page ↗
            </a>
          </>
        )}
      </p>
    </div>
  );
  if (bare) return body;
  return (
    <details className="text-sm mt-1">
      <summary className="cursor-pointer select-none text-blue hover:underline">What is {shortTerm(g.term)}?</summary>
      {body}
    </details>
  );
}

const identity = (s: string) => s;

/**
 * One line of evidence. `dense` folds the glossary and the source quote into a
 * single collapsed disclosure so a long list stays scannable. `tr` lets the
 * caller substitute translated label and detail text.
 */
export function EvidenceRow({ e, dense = false, tr = identity }: { e: Evidence; dense?: boolean; tr?: (s: string) => string }) {
  const g = glossaryFor(e.glossaryKey ?? e.requirementKey);
  const hasSource = !!(e.sourceRef.quote || e.sourceRef.url);
  return (
    <li className="py-3 flex gap-3">
      <StatusIcon status={e.status} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-medium ${e.status === "missing" ? "text-red" : "text-ink"}`}>{tr(e.label)}</span>
          <ConfidenceTag confidence={e.confidence} />
          {e.ruleClass === "gate" && e.status === "missing" && (
            <span className="text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 bg-red-soft text-red">blocks the bid</span>
          )}
        </div>
        <p className="text-sm text-ink/85 mt-0.5">{tr(e.detail)}</p>
        {e.action && (
          <p className="text-sm text-ink mt-1">
            <span className="font-medium">What you can do:</span> {tr(e.action)}
          </p>
        )}
        {e.status === "unknown" && (
          <p className="text-sm mt-1">
            <Link href="/#describe" className="text-blue underline">
              Add this to your profile
            </Link>{" "}
            and we will re-check.
          </p>
        )}
        {dense ? (
          (g || hasSource) && (
            <details className="text-xs text-muted mt-1">
              <summary className="cursor-pointer select-none hover:text-ink">▸ Why, and where it says this</summary>
              {g && <GlossaryDetails g={g} bare />}
              <SourceQuote sourceRef={e.sourceRef} />
            </details>
          )
        ) : (
          <>
            {g && <GlossaryDetails g={g} />}
            <SourceQuote sourceRef={e.sourceRef} />
          </>
        )}
      </div>
    </li>
  );
}
