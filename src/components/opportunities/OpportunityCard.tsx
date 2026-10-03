"use client";

import Link from "next/link";
import type { MatchResult } from "@/lib/data/types";
import { CATEGORY_LABELS } from "@/lib/data/types";
import { agencyFor } from "@/lib/data/agencies";
import { BurdenTag, DeadlineChip, FitBadge, Money, SourceTag, StatusIcon } from "@/components/ui";

export function OpportunityCard({ r, today, showAgency = true }: { r: MatchResult; today: string; showAgency?: boolean }) {
  const s = r.solicitation;
  const c = r.classification;
  const closed = c.availability === "closed";
  const lines = pickLines(r);
  const v = s.estimatedValue;
  return (
    <article className={`card p-4 sm:p-5 flex flex-col gap-3 ${closed ? "opacity-80" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <FitBadge fit={c.fit} verifyCount={c.verify.length} closed={closed} size="sm" />
        <DeadlineChip due={s.dates.submissionDue} today={today} size="sm" />
        <span className="ml-auto">
          <SourceTag source={s.provenance.source} listingOnly={s.listingOnly} />
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-ink leading-snug">
          <Link href={`/opportunities/${encodeURIComponent(s.id)}`} className="hover:underline">
            {s.title}
          </Link>
        </h3>
        <p className="text-sm text-muted mt-0.5">
          {showAgency && agencyFor(s.agencyId).shortName !== "County GSA" ? `${agencyFor(s.agencyId).shortName} · ` : ""}
          {s.department} · {s.number}
        </p>
      </div>
      <p className="text-sm text-ink/90">{s.summary}</p>
      <ul className="space-y-1.5" aria-label="Why it fits">
        {lines.map((e) => (
          <li key={e.ruleId + e.label} className="flex items-start gap-2 text-sm">
            <StatusIcon status={e.status} className="mt-0.5" />
            <span className={e.status === "missing" ? "text-red" : "text-ink"}>{e.label}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted pt-1 border-t border-line mt-auto">
        <span>{CATEGORY_LABELS[s.category]}</span>
        <span>
          {v ? (
            <>
              <Money n={v.min} />
              {v.min !== v.max && (
                <>
                  –<Money n={v.max} />
                </>
              )}{" "}
              {v.basis === "annual" ? "/yr" : v.basis === "nte-pool" ? "pool" : ""}
            </>
          ) : (
            "Value not stated"
          )}
        </span>
        <BurdenTag level={r.adminBurden} reasons={r.adminBurdenReasons} />
        <Link href={`/opportunities/${encodeURIComponent(s.id)}`} className="ml-auto text-green font-medium hover:underline">
          See the plan →
        </Link>
      </div>
    </article>
  );
}

function pickLines(r: MatchResult) {
  const ev = r.evidence.filter((e) => e.status !== "na" && e.ruleId !== "availability" && e.ruleId !== "capabilityMatch");
  const blockers = ev.filter((e) => e.ruleClass === "gate" && e.status === "missing");
  const order: Record<string, number> = { tradeFit: 0, mandatoryMeeting: 1, license: 2, certRequired: 3, contractSize: 4, location: 5, certPreferred: 6, scopeCoverage: 7, experience: 8, listingOnly: 9, insurance: 10 };
  const rest = ev.filter((e) => !blockers.includes(e)).sort((a, b) => (order[a.ruleId] ?? 20) - (order[b.ruleId] ?? 20));
  const picked = [...blockers.slice(0, 2), ...rest];
  const seen = new Set<string>();
  return picked.filter((e) => (seen.has(e.ruleId + e.label) ? false : (seen.add(e.ruleId + e.label), true))).slice(0, 4);
}
