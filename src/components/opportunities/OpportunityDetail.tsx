"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProfile } from "@/state/profile";
import { buildSummary } from "@/lib/engine/explain";
import { buildChecklist } from "@/lib/engine/checklist";
import { agencyFor } from "@/lib/data/agencies";
import type { CivicDate } from "@/lib/data/types";
import { countdownLabel, formatCivic, urgency } from "@/lib/engine/dates";
import { BurdenTag, Callout, DeadlineChip, FitBadge, SectionHeading, SourceTag } from "@/components/ui";
import { FitEvidence, GapAnalysis } from "./EvidencePanel";
import { PlainSummary } from "./PlainSummary";
import { ChecklistView } from "./ChecklistView";
import { SourcePanel } from "./SourcePanel";

export function OpportunityDetail({ id }: { id: string }) {
  const { hydrated, profile, resultById, allSolicitations, todayISO, ticks, toggleTick } = useProfile();
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

  const due = sol.dates.submissionDue;
  const closed = sol.status !== "open" || due.date < todayISO;
  const dueUnknown = !!due.note && due.date >= "2099-01-01";
  const u = urgency(due.date, todayISO);
  const dueCls = closed ? "bg-slate-soft text-slate" : u === "critical" ? "bg-red-soft text-red" : u === "soon" ? "bg-amber-soft text-amber" : "bg-green-soft text-green";
  const agency = agencyFor(sol.agencyId);
  const next = nextMilestone(sol.dates, todayISO, due.date);
  const blockers = match?.classification.blockers.filter((b) => b.ruleId !== "availability") ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-8">
      <Link href="/dashboard" className="text-sm text-green hover:underline">
        ← Back to your matches
      </Link>

      <header className="card p-5 sm:p-6 grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {sol.type} {sol.number} · {sol.department}
            {agency.shortName !== "County GSA" ? ` · ${agency.shortName}` : ""}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink leading-tight mt-1">{sol.title}</h1>
          <p className="text-ink/85 mt-2">{sol.summary}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {match && <FitBadge fit={match.classification.fit} verifyCount={match.classification.verify.length} closed={closed} />}
            <DeadlineChip due={due} today={todayISO} />
            <SourceTag source={sol.provenance.source} listingOnly={sol.listingOnly} />
            {match && <BurdenTag level={match.adminBurden} reasons={match.adminBurdenReasons} />}
          </div>
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
      {blockers.length > 0 && (
        <Callout tone="warn" title={closed ? "This one has closed" : "Something stands in the way"}>
          <ul className="list-disc pl-5 space-y-1">
            {blockers.map((b) => (
              <li key={b.ruleId + b.label}>
                <span className="font-medium">{b.label}.</span> {b.detail}
                {b.action ? ` ${b.action}` : ""}
              </li>
            ))}
          </ul>
        </Callout>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8 min-w-0">
          {match && (
            <section>
              <SectionHeading title="Does it fit?" subtitle="What the solicitation asks for, compared with what you told us. Nothing here is a legal determination; the County decides." />
              <FitEvidence match={match} />
            </section>
          )}
          {match && (
            <section>
              <SectionHeading title="What you'd need" subtitle="Credentials and conditions the solicitation states, sorted by where you stand." />
              <GapAnalysis match={match} />
            </section>
          )}
          <section>
            <SectionHeading title="In plain English" subtitle="Built only from the solicitation's own fields. Open any line to see the wording it came from." />
            <PlainSummary sections={summary} />
          </section>
          <section>
            <SectionHeading title="Your plan" subtitle="Dated steps, earliest first. Items say whether they come from the solicitation, from general County practice, or are our suggestion." />
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
