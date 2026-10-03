"use client";

import { useMemo } from "react";
import type { Evidence, MatchResult } from "@/lib/data/types";
import { COMPONENT_META, Disclosure, FitBadge, FitConfidenceTag, FitScoreChip, ProgressBar, RECOMMENDATION_META, StatusIcon } from "@/components/ui";
import { useLanguage, useTranslated } from "@/state/language";
import { EvidenceRow } from "./EvidencePanel";
import { fieldLabel } from "./SourceQuote";

/** Strings the engine wrote that should follow the language toggle. */
function textsOf(match: MatchResult): string[] {
  const f = match.fitScore;
  const out: string[] = [RECOMMENDATION_META[f.recommendation].blurb];
  for (const e of [...f.blockers, ...f.risks, ...f.unknowns, ...f.positives]) {
    out.push(e.label, e.detail);
    if (e.action) out.push(e.action);
  }
  return out;
}

export function FitScorePanel({ match, variant }: { match: MatchResult; variant: "full" | "compact" }) {
  const { t, locale } = useLanguage();
  const texts = useMemo(() => (variant === "full" ? textsOf(match) : []), [match, variant]);
  const { tr, status } = useTranslated(texts);
  const f = match.fitScore;
  const meta = RECOMMENDATION_META[f.recommendation];
  const closed = match.classification.availability === "closed";

  if (variant === "compact") {
    const lead: Evidence[] = f.status === "blocked" ? f.blockers.filter((b) => b.ruleId !== "availability").slice(0, 1) : [...f.positives.slice(0, 2), ...f.risks.slice(0, 1)];
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <FitScoreChip score={f.score} status={f.status} recommendation={f.recommendation} size="sm" />
          <FitConfidenceTag confidence={f.confidence} />
        </div>
        {lead.length > 0 && (
          <ul className="space-y-1" aria-label="Top factors">
            {lead.map((e) => (
              <li key={e.ruleId + e.label} className="flex items-start gap-2 text-sm">
                <StatusIcon status={e.status} className="mt-0.5" />
                <span className={e.status === "missing" ? "text-red" : "text-ink"}>{e.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const blockers = f.blockers.filter((b) => b.ruleId !== "availability");
  const firstQuote = blockers.find((b) => b.sourceRef.quote);
  const groups: { key: string; title: string; items: Evidence[]; cls: string; collapsed?: boolean }[] = [
    { key: "blocks", title: t("fit.blocks"), items: blockers, cls: "text-red" },
    { key: "check", title: t("fit.check"), items: f.risks, cls: "text-amber" },
    { key: "tellus", title: t("fit.tellus"), items: f.unknowns, cls: "text-blue" },
    { key: "meet", title: t("fit.meet"), items: f.positives, cls: "text-green", collapsed: true },
  ].filter((g) => g.items.length > 0);

  return (
    <div className={`card p-5 sm:p-6 space-y-5 border-l-4 ${meta.accent}`}>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <div className={`rounded-2xl border px-5 py-4 text-center min-w-[9rem] ${meta.cls}`}>
          {f.status === "scored" ? (
            <>
              <div className="font-display text-5xl font-semibold leading-none tabular-nums">{f.score}</div>
              <div className="text-xs mt-1 opacity-80">out of 100</div>
            </>
          ) : (
            <>
              <div className="font-display text-3xl font-semibold leading-none">{closed ? "Closed" : "Blocked"}</div>
              <div className="text-xs mt-1 opacity-80">no score</div>
            </>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-sm font-medium ${meta.cls}`}>{t(`rec.${f.recommendation}`)}</span>
            <FitConfidenceTag confidence={f.confidence} />
            <FitBadge fit={match.classification.fit} verifyCount={match.classification.verify.length} closed={closed} size="sm" />
          </div>
          <p className="text-sm text-ink/85">{tr(meta.blurb)}</p>
          {f.status === "blocked" && firstQuote?.sourceRef.quote && (
            <blockquote className="border-l-2 border-red/40 pl-3 text-sm italic text-ink/85">
              &ldquo;{firstQuote.sourceRef.quote}&rdquo;
              <span className="not-italic text-xs text-muted"> · {fieldLabel(firstQuote.sourceRef.field)}</span>
            </blockquote>
          )}
          {f.status === "blocked" && !firstQuote && blockers[0] && (
            <p className="text-sm text-red">
              {blockers[0].label} <span className="text-xs text-muted">· from {fieldLabel(blockers[0].sourceRef.field)}</span>
            </p>
          )}
          {locale !== "en" && (
            <p className="text-xs text-muted" aria-live="polite">
              {status === "loading" ? t("lang.translating") : status === "unavailable" || status === "error" ? t("lang.unavailable") : t("lang.note")}
            </p>
          )}
        </div>
      </div>

      {f.status === "scored" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(COMPONENT_META) as (keyof typeof COMPONENT_META)[]).map((k) => (
            <div key={k}>
              <ProgressBar value={f.components[k]} max={COMPONENT_META[k].max} label={t(`comp.${k}`)} />
              <p className="text-[11px] text-muted mt-0.5">{COMPONENT_META[k].hint}</p>
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-muted">The solicitation does not state specific credentials beyond normal business permits. Read the packet anyway.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) =>
            g.collapsed ? (
              <Disclosure key={g.key} summary={<span className={g.cls}>{g.title}</span>} count={g.items.length} className="border-line/70">
                <ul className="divide-y divide-line">
                  {g.items.map((e) => (
                    <EvidenceRow key={e.ruleId + e.label} e={e} dense tr={tr} />
                  ))}
                </ul>
              </Disclosure>
            ) : (
              <section key={g.key} aria-labelledby={`fit-${g.key}`}>
                <h3 id={`fit-${g.key}`} className={`text-sm font-semibold ${g.cls}`}>
                  {g.title} <span className="font-normal text-muted">({g.items.length})</span>
                </h3>
                <ul className="divide-y divide-line">
                  {g.items.map((e) => (
                    <EvidenceRow key={e.ruleId + e.label} e={e} dense tr={tr} />
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}

      <p className="text-[11px] text-muted border-t border-line pt-3">
        {t("fit.disclaimer")} <span className="opacity-70">Scoring v{f.scoringVersion}.</span>
      </p>
    </div>
  );
}
