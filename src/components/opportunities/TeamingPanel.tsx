"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MatchResult, Solicitation } from "@/lib/data/types";
import { CERT_BY_CODE, certLabel } from "@/lib/data/certifications";
import { PROGRAM_BY_ID } from "@/lib/data/programs";
import { participationShares } from "@/lib/data/mechanisms";
import { agencyFor } from "@/lib/data/agencies";
import { formatCivic } from "@/lib/engine/dates";
import { useProfile } from "@/state/profile";
import { useLanguage } from "@/state/language";
import { Money, SectionHeading } from "@/components/ui";

/**
 * Help for a stated participation goal, from both sides: a prime that needs
 * certified subcontractors, or a certified firm that primes need. Links to
 * the program's official directory and drafts the outreach note. ProcureFit
 * keeps no vendor list and sends nothing.
 */
export function TeamingPanel({ sol, match }: { sol: Solicitation; match?: MatchResult }) {
  const { profile } = useProfile();
  const { t } = useLanguage();
  const shares = useMemo(() => participationShares(sol), [sol]);
  const agency = agencyFor(sol.agencyId);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  if (shares.length === 0) return null;

  return (
    <section aria-labelledby="teaming-title">
      <SectionHeading title={t("teaming.title")} subtitle="What the share means for you, where to find certified partners, and a note you can send. Nothing here is a listing; the program's own directory is." />
      <div className="space-y-4">
        {shares.map((s) => {
          const def = CERT_BY_CODE[s.code];
          const program = def?.programId ? PROGRAM_BY_ID[def.programId] : undefined;
          const ev = match?.evidence.find((e) => e.ruleId === "participationGoal" && e.requirementKey === `goal:${s.code}`);
          const standing = ev?.status ?? "unknown";
          const name = certLabel(s.code);
          const directory = program?.directoryUrl ?? program?.officialUrl;
          const shareText = s.min !== undefined && s.max !== undefined ? (s.min === s.max ? `about $${Math.round(s.min).toLocaleString()}` : `about $${Math.round(s.min).toLocaleString()} to $${Math.round(s.max).toLocaleString()}`) : "the stated share";
          const key = s.code;
          const draft =
            drafts[key] ??
            (standing === "met"
              ? `Hello,\n\n${profile?.name ?? "[Your company]"} is a certified ${name} firm based in ${profile?.city ?? "[city]"}. We understand ${agency.displayName}'s ${sol.title} (${sol.number}, due ${formatCivic(sol.dates.submissionDue)}) asks primes that are not certified to subcontract ${s.percent}% to certified ${name} firms. We self-perform [trade / scope] and can take on ${shareText} of the work. Could we talk this week about teaming?\n\n${profile?.name ?? ""}`
              : `Hello,\n\n${profile?.name ?? "[Your company]"} is preparing a bid for ${agency.displayName}'s ${sol.title} (${sol.number}), due ${formatCivic(sol.dates.submissionDue)}. The solicitation asks bidders that are not certified ${name} to subcontract at least ${s.percent}% to certified firms. We are looking for a certified ${name} partner for [trade / scope], worth ${shareText}. Could we talk this week?\n\n${profile?.name ?? ""}${profile?.city ? `, ${profile.city}` : ""}`);
          return (
            <article key={key} className="card p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-soft text-blue px-2.5 py-0.5 text-xs font-medium">
                  {s.percent}% {name} participation
                </span>
                {s.min !== undefined && s.max !== undefined && (
                  <span className="text-sm text-muted">
                    ≈ <Money n={s.min} />
                    {s.min !== s.max && (
                      <>
                        –<Money n={s.max} />
                      </>
                    )}{" "}
                    of the agency&apos;s estimate
                  </span>
                )}
                {s.exceptionAllowed && <span className="text-xs text-muted">· written exception allowed</span>}
              </div>
              {standing === "met" ? (
                <p className="text-sm text-ink/90">
                  You are the partner primes need. Bidders that are not certified {name} must commit {s.percent}% of this bid to firms like yours, so make sure you are
                  findable in the program&apos;s directory and keep your contact details current. Your own self-performed work usually counts toward the goal if you bid as the
                  prime; confirm how {agency.displayName} counts it.
                </p>
              ) : standing === "check" ? (
                <p className="text-sm text-ink/90">
                  As a bidder without {name} certification you need certified subcontractors for {s.percent}% of the bid{s.exceptionAllowed ? ", or a written exception on the form" : ""}. Agree the trade split early, name the partner on the forms, and keep their certificate with your packet.{s.exceptionAllowed ? "" : " The posting does not describe an exception; ask the contact before assuming one."}
                </p>
              ) : (
                <p className="text-sm text-ink/90">
                  Tell us whether you hold {name} on your{" "}
                  <Link href="/#describe" className="text-green underline">
                    profile
                  </Link>{" "}
                  and this panel will say which side of the goal you are on.
                </p>
              )}
              <p className="text-sm">
                {directory ? (
                  <a href={directory} target="_blank" rel="noreferrer" className="text-green underline">
                    {program?.directoryUrl ? `Search ${program.buyer}'s certified ${name} directory ↗` : `${program?.buyer ?? name} program page ↗`}
                  </a>
                ) : (
                  <span className="text-muted">No official directory link on file for {name}.</span>
                )}
                {program?.processing && <span className="text-muted"> · Certification: {program.processing}</span>}
              </p>
              <details className="group">
                <summary className="text-sm text-green font-medium select-none cursor-pointer inline-flex items-center gap-1">
                  <span aria-hidden className="group-open:hidden">▸</span>
                  <span aria-hidden className="hidden group-open:inline">▾</span>
                  Draft an outreach note
                </summary>
                <div className="mt-2 space-y-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })}
                    rows={8}
                    className="w-full rounded-lg border border-line bg-paper p-3 text-sm text-ink"
                    aria-label="Outreach note draft"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(draft);
                          setCopied(key);
                          setTimeout(() => setCopied(null), 1500);
                        } catch {
                          /* clipboard unavailable: the text is still selectable */
                        }
                      }}
                      className="rounded-full bg-ink px-3 py-1 text-white hover:bg-ink/90"
                    >
                      {copied === key ? "Copied" : "Copy note"}
                    </button>
                    <span>A draft you edit and send yourself. Switch the language toggle to see the labels in your language; the note stays in English because the agency reads English.</span>
                  </div>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
