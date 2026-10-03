"use client";

import Link from "next/link";
import type { Evidence, MatchResult, RuleId } from "@/lib/data/types";
import { glossaryFor, LEAD_TIME_LABEL, type GlossaryEntry } from "@/lib/data/glossary";
import { ConfidenceTag, FitBadge, StatusIcon } from "@/components/ui";
import { SourceQuote } from "./SourceQuote";

/** Rules that describe fit, as opposed to credentials the owner must hold. */
export const FIT_RULES = new Set<RuleId>(["availability", "tradeFit", "scopeCoverage", "capabilityMatch", "contractSize", "location", "mandatoryMeeting", "listingOnly"]);

const STATUS_ORDER: Record<Evidence["status"], number> = { missing: 0, check: 1, unknown: 2, met: 3, na: 4 };

const FIT_BLURB: Record<MatchResult["classification"]["fit"], string> = {
  strong: "Your trade matches what they are buying and nothing you told us rules you out.",
  possible: "Worth a look. Some things need checking, or your profile has gaps we could not fill.",
  poor: "Something stated in the solicitation does not match your profile. The details are below.",
};

const GATE_TEXT: Record<GlossaryEntry["gate"], string> = {
  yes: "Lacking it can stop a bid.",
  no: "Not required to bid.",
  "at-award": "Needed before award, not with the bid.",
  form: "Handled on a form inside the bid packet.",
};

const shortTerm = (t: string) => t.split(" (")[0];

export function GlossaryDetails({ g }: { g: GlossaryEntry }) {
  return (
    <details className="text-sm mt-1">
      <summary className="cursor-pointer select-none text-blue hover:underline">What is {shortTerm(g.term)}?</summary>
      <div className="mt-1 space-y-1 rounded-lg bg-blue-soft/60 p-3 text-ink/85">
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
    </details>
  );
}

export function EvidenceRow({ e }: { e: Evidence }) {
  const g = glossaryFor(e.glossaryKey ?? e.requirementKey);
  return (
    <li className="py-3 flex gap-3">
      <StatusIcon status={e.status} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-medium ${e.status === "missing" ? "text-red" : "text-ink"}`}>{e.label}</span>
          <ConfidenceTag confidence={e.confidence} />
          {e.ruleClass === "gate" && e.status === "missing" && (
            <span className="text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 bg-red-soft text-red">blocks the bid</span>
          )}
        </div>
        <p className="text-sm text-ink/85 mt-0.5">{e.detail}</p>
        {e.action && (
          <p className="text-sm text-ink mt-1">
            <span className="font-medium">What you can do:</span> {e.action}
          </p>
        )}
        {e.status === "unknown" && (
          <p className="text-sm mt-1">
            <Link href="/" className="text-blue underline">
              Add this to your profile
            </Link>{" "}
            and we will re-check.
          </p>
        )}
        {g && <GlossaryDetails g={g} />}
        <SourceQuote sourceRef={e.sourceRef} />
      </div>
    </li>
  );
}

export function FitEvidence({ match }: { match: MatchResult }) {
  const c = match.classification;
  const items = match.evidence.filter((e) => FIT_RULES.has(e.ruleId) && e.status !== "na").sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  return (
    <div className="card p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <FitBadge fit={c.fit} verifyCount={c.verify.length} closed={c.availability === "closed"} />
        <span className="text-sm text-muted">{FIT_BLURB[c.fit]}</span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((e) => (
          <EvidenceRow key={e.ruleId + e.label} e={e} />
        ))}
      </ul>
    </div>
  );
}

export function GapAnalysis({ match }: { match: MatchResult }) {
  const reqs = match.evidence.filter((e) => !FIT_RULES.has(e.ruleId) && e.status !== "na");
  if (reqs.length === 0) {
    return <p className="card p-4 text-sm text-muted">The solicitation does not state specific credentials beyond normal business permits. Read the packet anyway.</p>;
  }
  const cols = [
    { key: "met", title: "You appear to meet", blurb: "Based on what you told us. The County verifies at award.", cls: "text-green", items: reqs.filter((e) => e.status === "met") },
    {
      key: "check",
      title: "Check these",
      blurb: "Stated in the solicitation; confirm or arrange. “Tell us” items are gaps in your profile, not necessarily in your business.",
      cls: "text-amber",
      items: reqs.filter((e) => e.status === "check" || e.status === "unknown").sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    },
    { key: "missing", title: "Missing", blurb: "Required, and your profile says you don't have it.", cls: "text-red", items: reqs.filter((e) => e.status === "missing") },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cols.map((col) => (
        <section key={col.key} className="card p-4" aria-labelledby={`gap-${col.key}`}>
          <h3 id={`gap-${col.key}`} className={`font-semibold ${col.cls}`}>
            {col.title} <span className="text-sm font-normal text-muted">({col.items.length})</span>
          </h3>
          <p className="text-xs text-muted mb-1">{col.blurb}</p>
          {col.items.length === 0 ? (
            <p className="text-sm text-muted py-2">Nothing here.</p>
          ) : (
            <ul className="divide-y divide-line">
              {col.items.map((e) => (
                <EvidenceRow key={e.ruleId + e.label} e={e} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
