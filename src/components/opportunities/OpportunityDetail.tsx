"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/state/profile";
import { buildSummary } from "@/lib/engine/explain";
import { buildChecklist } from "@/lib/engine/checklist";
import { agencyFor } from "@/lib/data/agencies";
import type { CivicDate } from "@/lib/data/types";
import { countdownLabel, formatCivic, urgency } from "@/lib/engine/dates";
import { BurdenTag, Callout, DeadlineChip, EntityMark, FitBadge, MechanismBadges, SectionHeading, SourceTag } from "@/components/ui";
import { useLanguage } from "@/state/language";
import { FitScorePanel } from "./FitScorePanel";
import { PlainSummary } from "./PlainSummary";
import { ChecklistView } from "./ChecklistView";
import { SourcePanel } from "./SourcePanel";
import { BriefView } from "./BriefView";
import { TeamingPanel } from "./TeamingPanel";

export function OpportunityDetail({ id }: { id: string }) {
  const { hydrated, profile, resultById, allSolicitations, todayISO, ticks, toggleTick } = useProfile();
  const { t } = useLanguage();
  const brief = useSearchParams().get("brief") === "1";
  const sol = allSolicitations.find((s) => s.id === id);
  const match = resultById[id];
  const summary = useMemo(() => (sol ? buildSummary(sol, todayISO, match) : []), [sol, todayISO, match]);
  const checklist = useMemo(() => (sol ? buildChecklist(sol, todayISO, match) : null), [sol, todayISO, match]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted" aria-busy="true">
        Loading…
      </div>
    );
  }
  if (!sol || !checklist) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">We don&apos;t have that one</h1>
        <p className="text-muted mt-2">
          It may have been removed, or the link is wrong.{" "}
          <Link href="/dashboard" className="text-green underline">
            Back to your matches
          </Link>
        </p>
      </div>
    );
  }

  if (brief && match) return <BriefView sol={sol} match={match} checklist={checklist} today={todayISO} />;

  const due = sol.dates.submissionDue;
  const closed = sol.status !== "open" || due.date < todayISO;
  const dueUnknown = !!due.note && due.date >= "2099-01-01";
  const u = urgency(due.date, todayISO);
  const dueCls = closed ? "bg-slate-soft text-slate" : u === "critical" ? "bg-red-soft text-red" : u === "soon" ? "bg-amber-soft text-amber" : "bg-green-soft text-green";
  const agency = agencyFor(sol.agencyId);
  const next = nextMilestone(sol.dates, todayISO, due.date);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-8">
      <Link href="/dashboard" className="text-sm text-green hover:underline">
        ← Back to your matches
      </Link>

      <header className="card p-5 sm:p-6 grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <EntityMark agency={agency} size="md" />
            <span>
              {sol.number.toUpperCase().startsWith(sol.type) ? sol.number : `${sol.type} ${sol.number}`} · {sol.department}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink leading-tight mt-1">{sol.title}</h1>
          <p className="text-ink/85 mt-2">{sol.summary}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {match && <FitBadge fit={match.classification.fit} verifyCount={match.classification.verify.length} closed={closed} />}
            <DeadlineChip due={due} today={todayISO} />
            <SourceTag source={sol.provenance.source} listingOnly={sol.listingOnly} />
            {match && <BurdenTag level={match.adminBurden} reasons={match.adminBurdenReasons} />}
          </div>
          <MechanismBadges sol={sol} size="md" className="mt-2" />
          {match && (
            <div className="mt-3 no-print">
              <Link href={`/opportunities/${encodeURIComponent(sol.id)}?brief=1`} className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink hover:bg-slate-soft">
                {t("detail.brief")}
              </Link>
            </div>
          )}
        </div>
        <div className={`rounded-xl px-4 py-3 min-w-[16rem] ${dueCls}`}>
          <div className="text-xs uppercase tracking-wide opacity-80">Response due</div>
          {dueUnknown ? (
            <>
              <div className="text-lg font-semibold">Not found in the text</div>
              <div className="text-sm opacity-90">{due.note}</div>
            </>
          ) : (
            <>
              <div className="text-xl font-semibold">{formatCivic(due, { year: true })}</div>
              <div className="text-sm opacity-90">
                {closed ? "Closed" : countdownLabel(due.date, todayISO)}
                {due.time && !closed ? " · late responses are rejected" : ""}
              </div>
            </>
          )}
          {next && !closed && (
            <div className="text-sm mt-2 pt-2 border-t border-current/20">
              <span className="opacity-80">Next:</span> {next.label}, {formatCivic(next.when)}
            </div>
          )}
        </div>
      </header>

      {sol.provenance.source === "pasted" && (
        <Callout tone="warn" title="Extracted automatically. Verify against the source.">
          This record was built from text you pasted. We kept only facts we could quote back from that text, but the extraction can still miss or mislabel things. The original document wins.
        </Callout>
      )}
      {sol.listingOnly && (
        <Callout tone="info" title="Listing only">
          We captured the public listing (title, agency, due date, link) but have not read the solicitation documents. Open the posting for requirements.
        </Callout>
      )}
      {!profile && (
        <Callout tone="info" title="Want to know whether this fits you?">
          <Link href="/" className="underline text-green">
            Tell us about your business
          </Link>{" "}
          and this page will show the evidence for and against, plus what you would need.
        </Callout>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8 min-w-0">
          {match && (
            <section>
              <SectionHeading title={t("section.fit")} subtitle={t("section.fit.sub")} />
              <FitScorePanel match={match} variant="full" />
            </section>
          )}
          <TeamingPanel sol={sol} match={match} />
          <section>
            <SectionHeading title={t("section.summary")} subtitle={t("section.summary.sub")} />
            <PlainSummary sections={summary} />
          </section>
          <section>
            <SectionHeading title={t("section.plan")} subtitle={t("section.plan.sub")} />
            <ChecklistView checklist={checklist} today={todayISO} ticks={ticks} toggleTick={toggleTick} />
          </section>
        </div>
        <aside className="lg:sticky lg:top-6 self-start">
          <SourcePanel sol={sol} />
        </aside>
      </div>
    </div>
  );
}

function nextMilestone(d: { preBidMeeting?: { when: CivicDate; mandatory: boolean; prerequisite?: { label: string; due: CivicDate } }; siteVisit?: { when: CivicDate; mandatory: boolean; prerequisite?: { label: string; due: CivicDate } }; questionsDue?: CivicDate }, today: string, dueDate: string) {
  const list: { label: string; when: CivicDate }[] = [];
  if (d.preBidMeeting?.prerequisite) list.push({ label: d.preBidMeeting.prerequisite.label, when: d.preBidMeeting.prerequisite.due });
  if (d.preBidMeeting) list.push({ label: `${d.preBidMeeting.mandatory ? "mandatory" : "optional"} pre-bid meeting`, when: d.preBidMeeting.when });
  if (d.siteVisit?.prerequisite) list.push({ label: d.siteVisit.prerequisite.label, when: d.siteVisit.prerequisite.due });
  if (d.siteVisit) list.push({ label: `${d.siteVisit.mandatory ? "mandatory" : "optional"} site visit`, when: d.siteVisit.when });
  if (d.questionsDue) list.push({ label: "questions due", when: d.questionsDue });
  return list.filter((m) => m.when.date >= today && m.when.date <= dueDate).sort((a, b) => a.when.date.localeCompare(b.when.date))[0];
}
