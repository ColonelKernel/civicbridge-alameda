"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/state/profile";
import { applyFilters, buildDashboard, DEFAULT_FILTERS, sortForList, type Filters } from "@/lib/engine/dashboard";
import type { MatchResult } from "@/lib/data/types";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { FiltersBar } from "@/components/dashboard/Filters";
import { CommonGaps } from "@/components/dashboard/CommonGaps";
import { ProfileSummaryBar } from "@/components/dashboard/ProfileSummaryBar";
import { DemoProfilePicker } from "@/components/profile/DemoProfilePicker";
import { Callout, SectionHeading } from "@/components/ui";

const SECTIONS = [
  { id: "top", label: "Top matches" },
  { id: "closing", label: "Closing soon" },
  { id: "easy", label: "Easy wins" },
  { id: "larger", label: "Larger opportunities" },
  { id: "blocked", label: "Blocked" },
  { id: "gaps", label: "What you commonly lack" },
  { id: "all", label: "Everything" },
];

export default function DashboardPage() {
  const { hydrated, profile, results, resultById, todayISO, pasted } = useProfile();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const dash = useMemo(() => buildDashboard(results), [results]);
  const departments = useMemo(() => Array.from(new Set(results.map((r) => r.solicitation.department))).sort(), [results]);
  const filtered = useMemo(() => sortForList(applyFilters(results, filters)), [results, filters]);

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
        <h1 className="text-3xl font-semibold text-ink">First, tell us about your business</h1>
        <p className="text-muted mt-2 mb-6">
          Matches are built from your profile, so there is nothing to show yet. Pick a demo business to see the dashboard in thirty seconds, or{" "}
          <Link href="/" className="text-green underline">
            describe your own
          </Link>
          .
        </p>
        <DemoProfilePicker />
      </div>
    );
  }

  const closedCount = results.filter((r) => r.classification.availability === "closed").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-10">
      <ProfileSummaryBar profile={profile} counts={dash.counts} />

      <nav aria-label="Dashboard sections" className="flex flex-wrap gap-2 text-sm -mt-6">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line bg-paper px-3 py-1 text-ink hover:bg-slate-soft">
            {s.label}
          </a>
        ))}
        {pasted.length > 0 && (
          <Link href="/paste" className="rounded-full bg-amber-soft px-3 py-1 text-amber">
            {pasted.length} pasted by you
          </Link>
        )}
      </nav>

      {dash.counts.open === 0 && (
        <Callout tone="warn" title="Nothing is open right now">
          Every solicitation in the dataset has closed. Turn on &ldquo;Show closed&rdquo; below to browse past postings and see how they would have matched.
        </Callout>
      )}

      <Section
        id="top"
        title="Top matches"
        subtitle={
          dash.topMatchesBackfilled
            ? "Fewer than three strong fits, so we added the closest possible fits. Each card says what to verify."
            : "Strongest evidence first. Every card shows why."
        }
        results={dash.topMatches}
        today={todayISO}
        empty="No open solicitation matches your trade yet. Check back as new postings arrive, or paste one in."
      />

      <Section
        id="closing"
        title="Closing soon"
        subtitle="Due within 14 days. Mandatory meetings and questions deadlines may be sooner than the due date."
        results={dash.closingSoon}
        today={todayISO}
        empty="Nothing that fits you closes in the next two weeks."
      />

      <Section
        id="easy"
        title="Easy wins"
        subtitle="Lighter paperwork, our estimate: no bonds, no mandatory meetings, a short document list, and a size in your usual range."
        results={dash.easyWins}
        today={todayISO}
        empty="No light-paperwork matches right now."
      />

      <Section
        id="larger"
        title="Larger opportunities"
        subtitle="Your trade, but bigger than you said you usually take. Size is not an eligibility rule; teaming or subcontracting is common."
        results={dash.larger}
        today={todayISO}
        empty="Nothing above your usual contract size."
      />

      <Section
        id="blocked"
        title="Your trade, but something blocks it"
        subtitle="These fit what you do, yet one stated requirement is missing from your profile. Open one to see what it would take."
        results={dash.blocked}
        today={todayISO}
        empty="No blocked matches. Nice."
      />

      <section id="gaps" className="scroll-mt-24">
        <SectionHeading title="Requirements you commonly lack" subtitle="Across your strong and possible matches. Fix one of these and several opportunities move up." />
        <div className="card p-4 sm:p-5">
          <CommonGaps gaps={dash.commonGaps} resultById={resultById} />
        </div>
      </section>

      <section id="all" className="scroll-mt-24 space-y-3">
        <SectionHeading title="Everything" subtitle="All opportunities we track, filtered however you like." />
        <FiltersBar value={filters} onChange={setFilters} departments={departments} />
        <p className="text-sm text-muted" aria-live="polite">
          Showing {filtered.length} of {results.length}
          {!filters.includeClosed && closedCount > 0 && ` (${closedCount} closed hidden)`}
        </p>
        {filtered.length === 0 ? (
          <p className="text-muted py-8 text-center">No opportunities match these filters.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((r) => (
              <OpportunityCard key={r.solicitation.id} r={r} today={todayISO} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Section({ id, title, subtitle, results, today, empty }: { id: string; title: string; subtitle: string; results: MatchResult[]; today: string; empty: string }) {
  return (
    <section id={id} className="scroll-mt-24">
      <SectionHeading title={title} subtitle={subtitle} />
      {results.length === 0 ? (
        <p className="text-sm text-muted card p-4">{empty}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => (
            <OpportunityCard key={r.solicitation.id} r={r} today={today} />
          ))}
        </div>
      )}
    </section>
  );
}
