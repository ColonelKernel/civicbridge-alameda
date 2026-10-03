"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { MatchResult, Solicitation } from "@/lib/data/types";
import type { Checklist } from "@/lib/engine/checklist";
import { agencyFor } from "@/lib/data/agencies";
import { BRAND } from "@/lib/data/brand";
import { formatCivic, formatDate, countdownLabel } from "@/lib/engine/dates";
import { CONFIDENCE_META, EntityMark, FIT_SCORE_DISCLAIMER, FitScoreChip, MechanismBadges, Money, RECOMMENDATION_META } from "@/components/ui";
import { LogoMark } from "@/components/brand/Logo";

/**
 * A one-page pursuit brief: the go / no-go facts a small business owner
 * needs before spending an evening on the packet. Every line comes from the
 * same rules engine as the full page; blockers show the agency's own words.
 */
export function BriefView({ sol, match, checklist, today }: { sol: Solicitation; match: MatchResult; checklist: Checklist; today: string }) {
  useEffect(() => {
    document.documentElement.dataset.brief = "1";
    return () => {
      delete document.documentElement.dataset.brief;
    };
  }, []);

  const fs = match.fitScore;
  const agency = agencyFor(sol.agencyId);
  const v = sol.estimatedValue;
  const due = sol.dates.submissionDue;
  const closed = sol.status !== "open" || due.date < today;
  const steps = checklist.groups
    .filter((g) => g.kind !== "closed")
    .flatMap((g) => g.items.map((i) => ({ ...i, when: g.date, group: g.label })))
    .slice(0, 8);
  const rec = RECOMMENDATION_META[fs.recommendation];
  const comp = fs.components;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 text-[13px] leading-snug text-ink">
      <div className="no-print flex items-center justify-between gap-3 mb-4 text-sm">
        <Link href={`/opportunities/${encodeURIComponent(sol.id)}`} className="text-green hover:underline">
          ← Full page
        </Link>
        <button type="button" onClick={() => window.print()} className="rounded-full bg-ink px-3 py-1.5 text-white text-sm hover:bg-ink/90">
          Print / save as PDF
        </button>
      </div>

      <header className="flex items-start justify-between gap-4 border-b border-line pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <LogoMark size={18} />
            <span className="font-display font-semibold text-ink">{BRAND.product}</span>
            <span>· One-page pursuit brief · prepared {formatDate(today)}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold leading-tight mt-2">{sol.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            <EntityMark agency={agency} size="sm" />
            <span>
              {sol.number} · {sol.department}
            </span>
          </div>
        </div>
        <div className={`rounded-xl px-3 py-2 text-right shrink-0 ${closed ? "bg-slate-soft text-slate" : "bg-green-soft text-green"}`}>
          <div className="text-[10px] uppercase tracking-wide opacity-80">Response due</div>
          <div className="font-semibold">{formatCivic(due, { year: true })}</div>
          <div className="text-xs opacity-90">{closed ? "Closed" : countdownLabel(due.date, today)}</div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start py-3 border-b border-line">
        <div className="flex flex-col gap-1.5">
          <FitScoreChip score={fs.score} status={fs.status} recommendation={fs.recommendation} size="md" />
          <span className="text-xs text-muted">{CONFIDENCE_META[fs.confidence].label}</span>
        </div>
        <div className="min-w-0">
          <p className="font-medium">{rec.label}</p>
          <p className="text-muted">{rec.blurb}</p>
          {fs.status === "scored" && (
            <p className="text-xs text-muted mt-1">
              Scope {comp.scope}/35 · Readiness {comp.readiness}/35 · Commercial {comp.commercial}/15 · Local &amp; timing {comp.localAndTiming}/15
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              Agency estimate:{" "}
              {v ? (
                <>
                  <Money n={v.min} />
                  {v.min !== v.max && (
                    <>
                      –<Money n={v.max} />
                    </>
                  )}
                  {v.basis === "annual" ? " per year" : v.basis === "nte-pool" ? " pool" : ""}
                </>
              ) : (
                "not stated"
              )}
            </span>
            {sol.term && <span>Term: {sol.term}</span>}
            {sol.dates.preBidMeeting && (
              <span>
                {sol.dates.preBidMeeting.mandatory ? "Mandatory" : "Optional"} pre-bid {formatCivic(sol.dates.preBidMeeting.when)}
              </span>
            )}
          </div>
          <MechanismBadges sol={sol} className="mt-2" />
        </div>
      </section>

      {fs.blockers.length > 0 && (
        <section className="py-3 border-b border-line">
          <h2 className="text-xs uppercase tracking-wide text-red font-semibold">Blocks the bid as stated</h2>
          <ul className="mt-1 space-y-1.5">
            {fs.blockers.map((e) => (
              <li key={`${e.ruleId}-${e.requirementKey ?? e.sourceRef.field}`}>
                <span className="font-medium">{e.label}.</span>{" "}
                {e.sourceRef.quote ? <q className="text-ink/80">{e.sourceRef.quote}</q> : <span className="text-muted">From: {e.sourceRef.field}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 py-3 border-b border-line">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-amber font-semibold">Check before you commit</h2>
          {fs.risks.length === 0 ? (
            <p className="text-muted mt-1">Nothing flagged from the stated requirements.</p>
          ) : (
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {fs.risks.slice(0, 6).map((e) => (
                <li key={`${e.ruleId}-${e.requirementKey ?? e.label}`}>{e.label}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-wide text-blue font-semibold">Tell us, and we re-check</h2>
          {fs.unknowns.length === 0 ? (
            <p className="text-muted mt-1">Your profile answers every stated requirement.</p>
          ) : (
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {fs.unknowns.slice(0, 6).map((e) => (
                <li key={`${e.ruleId}-${e.requirementKey ?? e.label}`}>{e.label}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {fs.positives.length > 0 && (
        <section className="py-3 border-b border-line">
          <h2 className="text-xs uppercase tracking-wide text-green font-semibold">What you appear to meet</h2>
          <p className="mt-1 text-ink/85">{fs.positives.slice(0, 6).map((e) => e.label).join(" · ")}</p>
        </section>
      )}

      <section className="py-3 border-b border-line">
        <h2 className="text-xs uppercase tracking-wide text-muted font-semibold">First steps, by date</h2>
        <ol className="mt-1 space-y-1">
          {steps.map((s) => (
            <li key={s.id} className="grid grid-cols-[6.5rem_1fr] gap-2">
              <span className="text-muted tabular-nums">{s.when ? formatDate(s.when) : s.group}</span>
              <span>
                {s.label}
                {s.warning && <span className="text-amber"> · {s.warning}</span>}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="pt-3 text-xs text-muted space-y-1">
        <p>
          Source:{" "}
          <a href={sol.portalUrl ?? sol.sourceUrl} className="underline break-all">
            {sol.portalUrl ?? sol.sourceUrl}
          </a>
          {sol.attachments?.length ? ` · ${sol.attachments.length} solicitation document${sol.attachments.length === 1 ? "" : "s"} on the full page` : ""}
          {sol.provenance.source === "curated" ? " · Sample record written in the agency's format; not a live posting." : ""}
        </p>
        <p>
          {FIT_SCORE_DISCLAIMER} Scoring v{fs.scoringVersion}. {BRAND.nonAffiliation}
        </p>
      </footer>
    </div>
  );
}
