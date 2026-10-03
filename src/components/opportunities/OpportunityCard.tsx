"use client";

import Link from "next/link";
import type { MatchResult } from "@/lib/data/types";
import { CATEGORY_LABELS } from "@/lib/data/types";
import { agencyFor } from "@/lib/data/agencies";
import { BurdenTag, DeadlineChip, EntityMark, FitBadge, Money, RECOMMENDATION_META, SourceTag } from "@/components/ui";
import { useLanguage } from "@/state/language";
import { FitScorePanel } from "./FitScorePanel";

export function OpportunityCard({ r, today, showAgency = true }: { r: MatchResult; today: string; showAgency?: boolean }) {
  const { t } = useLanguage();
  const s = r.solicitation;
  const c = r.classification;
  const closed = c.availability === "closed";
  const v = s.estimatedValue;
  const agency = agencyFor(s.agencyId);
  const accent = closed ? "border-l-line" : RECOMMENDATION_META[r.fitScore.recommendation].accent;
  return (
    <article className={`card p-4 sm:p-5 flex flex-col gap-3 border-l-4 ${accent} ${closed ? "opacity-80" : ""}`}>
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
        <p className="text-sm text-muted mt-1 flex items-center gap-2 min-w-0">
          {showAgency && <EntityMark agency={agency} size="sm" />}
          <span className="min-w-0 flex-1 truncate">
            {showAgency ? `${agency.displayName} · ` : ""}
            {s.department} · {s.number}
          </span>
        </p>
      </div>
      <p className="text-sm text-ink/90">{s.summary}</p>
      <FitScorePanel match={r} variant="compact" />
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
          {t("card.plan")}
        </Link>
      </div>
    </article>
  );
}
