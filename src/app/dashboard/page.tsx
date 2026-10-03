"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/state/profile";
import { useLanguage } from "@/state/language";
import { applyFilters, buildDashboard, DEFAULT_FILTERS, QUICK_META, sortForList, type Filters, type QuickFilter } from "@/lib/engine/dashboard";
import type { StringKey } from "@/lib/i18n/strings";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { activeFilterCount, FiltersBar } from "@/components/dashboard/Filters";
import { CommonGaps } from "@/components/dashboard/CommonGaps";
import { CredibilityCard } from "@/components/dashboard/CredibilityCard";
import { ProfileSummaryBar } from "@/components/dashboard/ProfileSummaryBar";
import { DemoProfilePicker } from "@/components/profile/DemoProfilePicker";
import { Callout, Disclosure, SectionHeading } from "@/components/ui";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { cosine, getCorpusIndex, vectorizeText } from "@/lib/engine/similarity";

const PROMPTS = ["after-hours electrical work in occupied buildings", "janitorial and floor care for public buildings", "Spanish interpretation and document translation", "landscaping and tree care on County grounds", "IT help desk and network support"];


const CHIPS: { quick: QuickFilter; label: StringKey }[] = [
  { quick: "none", label: "chip.all" },
  { quick: "closing", label: "chip.closing" },
  { quick: "easy", label: "chip.easy" },
  { quick: "larger", label: "chip.larger" },
  { quick: "blocked", label: "chip.blocked" },
  { quick: "programs", label: "chip.programs" },
];

export default function DashboardPage() {
  const { hydrated, profile, results, resultById, todayISO, pasted } = useProfile();
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");

  const dash = useMemo(() => buildDashboard(results), [results]);
  const departments = useMemo(() => Array.from(new Set(results.map((r) => r.solicitation.department))).sort(), [results]);
  // Free-text wording match: TF-IDF over the shipped corpus, computed in the browser; it re-orders the list and never changes a rule or a score.
  const wording = useMemo(() => {
    const q = applied.trim();
    if (q.length < 3) return null;
    const index = getCorpusIndex(SOLICITATIONS);
    const qv = vectorizeText(index, q);
    if (qv.terms.length === 0) return null;
    const map = new Map<string, number>();
    for (const r of results) map.set(r.solicitation.id, cosine(qv, index.vectorFor(r.solicitation)).value);
    return map;
  }, [applied, results]);
  const filtered = useMemo(() => {
    const base = sortForList(applyFilters(results, filters), filters.quick);
    if (!wording) return base;
    return [...base].sort((a, b) => (wording.get(b.solicitation.id) ?? 0) - (wording.get(a.solicitation.id) ?? 0));
  }, [results, filters, wording]);
  const chipCounts = useMemo(
    () => Object.fromEntries(CHIPS.map((c) => [c.quick, applyFilters(results, { ...filters, quick: c.quick }).length])) as Record<QuickFilter, number>,
    [results, filters],
  );

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted" aria-busy="true">
        Loading your matches…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-semibold text-ink">First, tell us about your business</h1>
        <p className="text-muted mt-2 mb-6">
          Matches are built from your profile, so there is nothing to show yet. Pick a demo business to see the dashboard in thirty seconds, or{" "}
          <Link href="/#describe" className="text-green underline">
            describe your own
          </Link>
          .
        </p>
        <DemoProfilePicker />
      </div>
    );
  }

  const closedCount = results.filter((r) => r.classification.availability === "closed").length;
  const active = activeFilterCount(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-10">
      <ProfileSummaryBar profile={profile} counts={dash.counts} />

      {dash.counts.open === 0 && (
        <Callout tone="warn" title="Nothing is open right now">
          Every solicitation in the dataset has closed. Turn on &ldquo;Show closed&rdquo; under more filters to browse past postings and see how they would have matched.
        </Callout>
      )}

      <section aria-labelledby="top-title">
        <SectionHeading
          title={t("dash.top")}
          subtitle={
            dash.topMatchesBackfilled
              ? "Fewer than three strong fits, so we added the closest possible fits. Each card says what to verify."
              : "Strongest evidence first. Every card shows why."
          }
        />
        {dash.topMatches.length === 0 ? (
          <p className="text-sm text-muted card p-4">No open solicitation matches your trade yet. Check back as new postings arrive, or paste one in.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dash.topMatches.map((r) => (
              <OpportunityCard key={r.solicitation.id} r={r} today={todayISO} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="all-title" className="space-y-3">
        <SectionHeading
          title={t("dash.all")}
          subtitle={QUICK_META[filters.quick].subtitle}
          action={
            pasted.length > 0 ? (
              <Link href="/paste" className="rounded-full bg-amber-soft px-3 py-1 text-sm text-amber whitespace-nowrap">
                {pasted.length} pasted by you
              </Link>
            ) : undefined
          }
        />
        <div className="card p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search title or department"
              aria-label="Search"
              className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink min-w-[12rem] flex-1"
            />
            <div role="group" aria-label="Quick filters" className="flex gap-1.5 overflow-x-auto whitespace-nowrap -mx-1 px-1 pb-0.5">
              {CHIPS.map((c) => {
                const on = filters.quick === c.quick;
                return (
                  <button
                    key={c.quick}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilters({ ...filters, quick: c.quick })}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${on ? "bg-ink text-white" : "bg-slate-soft text-ink hover:bg-line"}`}
                  >
                    {t(c.label)} <span className="opacity-70 tabular-nums">{chipCounts[c.quick]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <form
            className="rounded-lg border border-line bg-cream/60 p-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(query);
            }}
          >
            <label htmlFor="wording" className="text-sm font-medium text-ink block">
              {t("match.title")}
            </label>
            <textarea
              id="wording"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
              placeholder="e.g. we rewire and relamp office buildings at night, mostly LED and controls"
              className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {PROMPTS.map((p) => (
                <button key={p} type="button" onClick={() => setQuery(p)} className="rounded-full bg-slate-soft px-2.5 py-0.5 text-xs text-ink hover:bg-line">
                  {p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className="rounded-full bg-ink px-3 py-1 text-sm text-white hover:bg-ink/90">
                {t("match.button")}
              </button>
              {applied && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setApplied("");
                  }}
                  className="rounded-full border border-line bg-paper px-3 py-1 text-sm text-ink hover:bg-slate-soft"
                >
                  {t("match.clear")}
                </button>
              )}
              <span className="text-xs text-muted">{t("match.hint")}</span>
            </div>
          </form>
          <details className="group">
            <summary className="text-sm text-green font-medium select-none cursor-pointer inline-flex items-center gap-1">
              <span aria-hidden className="group-open:hidden">▸</span>
              <span aria-hidden className="hidden group-open:inline">▾</span>
              {t("dash.more")}
              {active > 0 && <span className="text-muted font-normal">({active} active)</span>}
            </summary>
            <div className="mt-3">
              <FiltersBar value={filters} onChange={setFilters} departments={departments} hideSearch />
            </div>
          </details>
        </div>
        <p className="text-sm text-muted" aria-live="polite">
          {t("dash.showing", { n: filtered.length, total: results.length })}
          {!filters.includeClosed && closedCount > 0 && ` (${closedCount} closed hidden)`}
        </p>
        {filtered.length === 0 ? (
          <p className="text-muted py-8 text-center">{QUICK_META[filters.quick].empty}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((r) => {
              const w = wording?.get(r.solicitation.id);
              return (
                <OpportunityCard
                  key={r.solicitation.id}
                  r={r}
                  today={todayISO}
                  extra={
                    w !== undefined ? (
                      <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-ink/80 tabular-nums" title="Wording overlap with what you typed; not a requirement check">
                        {Math.round(w * 100)}% wording match
                      </span>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Disclosure summary={t("dash.gaps")} count={dash.commonGaps.length}>
          <p className="text-xs text-muted mb-3">Across your strong and possible matches. Fix one of these and several opportunities move up.</p>
          <CommonGaps gaps={dash.commonGaps} resultById={resultById} />
        </Disclosure>
        <CredibilityCard profile={profile} />
      </div>
    </div>
  );
}
