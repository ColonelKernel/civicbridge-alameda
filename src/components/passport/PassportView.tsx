"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/state/profile";
import { derivePassport, STANDING_LABELS, type Standing } from "@/lib/engine/passport";
import { FUNDING_LANE_LABELS, HARMONIZATION, STATUS_TAGS } from "@/lib/data/programs";
import { agencyFor } from "@/lib/data/agencies";
import { BRAND } from "@/lib/data/brand";
import { Callout, EntityMark, Eyebrow } from "@/components/ui";
import { DemoProfilePicker } from "@/components/profile/DemoProfilePicker";
import { LogoMark } from "@/components/brand/Logo";

const SLIDE_PROGRAM_LIMIT = 6;

const STANDING_CLS: Record<Standing, string> = {
  recognized: "bg-green-soft text-green",
  "likely-to-apply": "bg-blue-soft text-blue",
  unknown: "bg-slate-soft text-slate",
  "not-applicable": "bg-paper text-muted border border-line",
};

export function PassportView() {
  const { hydrated, profile } = useProfile();
  const params = useSearchParams();
  const slide = params.get("slide") === "1";
  const passport = useMemo(() => (profile ? derivePassport(profile) : null), [profile]);

  useEffect(() => {
    if (!slide) return;
    document.documentElement.dataset.slide = "1";
    return () => {
      delete document.documentElement.dataset.slide;
    };
  }, [slide]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted" aria-busy="true">
        Loading your Passport…
      </div>
    );
  }
  if (!profile || !passport) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Eyebrow>Regional SLEB Passport</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-ink mt-1">First, tell us about your business</h1>
        <p className="text-muted mt-2 mb-6">
          The Passport maps your self-reported size and location onto what each regional buyer recognizes. Pick a demo business or{" "}
          <Link href="/#describe" className="text-green underline">
            describe your own
          </Link>
          .
        </p>
        <DemoProfilePicker />
      </div>
    );
  }

  // Slide view fits one 16:9 frame: only the standings worth a glance, capped so the frame never clips.
  const shown = slide
    ? passport.programs.filter((p) => p.standing === "recognized" || p.standing === "likely-to-apply").slice(0, SLIDE_PROGRAM_LIMIT)
    : passport.programs;
  const hidden = passport.programs.length - shown.length;

  return (
    <div className={slide ? "mx-auto w-[1280px] max-w-full aspect-video overflow-hidden px-8 py-6 text-[13px] leading-snug bg-cream" : "mx-auto max-w-6xl px-4 py-6 sm:py-8"}>
      <header className={`flex flex-wrap items-end justify-between gap-3 ${slide ? "mb-4" : "mb-6"}`}>
        <div>
          <Eyebrow>{slide ? `${BRAND.product} · Regional SLEB Passport` : "Regional SLEB Passport"}</Eyebrow>
          <h1 className={`font-display font-semibold text-ink tracking-tight ${slide ? "text-3xl" : "text-3xl sm:text-4xl"}`}>
            {profile.name}: Alameda County and East Bay buyers
          </h1>
          <p className={`text-muted mt-1 ${slide ? "text-sm" : "max-w-3xl"}`}>
            What each regional buyer recognizes today, and a proposal to make it one application. Nothing on this page is a certification or an
            eligibility finding; every status is self-reported and unverified.
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          {slide ? (
            <Link href="/passport" className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink hover:bg-slate-soft">
              Exit slide view
            </Link>
          ) : (
            <>
              <Link href="/passport?slide=1" className="rounded-full bg-ink px-3 py-1.5 text-sm text-white hover:bg-ink/90">
                Print / slide view
              </Link>
              <Link href="/dashboard" className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink hover:bg-slate-soft">
                Back to matches
              </Link>
            </>
          )}
        </div>
      </header>

      <div className={`grid gap-4 ${slide ? "grid-cols-12" : "lg:grid-cols-12"}`}>
        {/* (a) Your status */}
        <section className={`card p-4 ${slide ? "col-span-3" : "lg:col-span-3"} space-y-3`} aria-labelledby="pp-status">
          <h2 id="pp-status" className="font-semibold text-ink">
            Your status tags
          </h2>
          {passport.tags.length === 0 ? (
            <p className="text-sm text-muted">Add your county, city, headcount and years in business to see status tags.</p>
          ) : (
            <ul className="space-y-2">
              {passport.tags.map((t) => (
                <li key={t.tag}>
                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="rounded-full bg-green-soft text-green px-2.5 py-0.5 text-xs font-semibold">
                        {t.label}
                        {t.city ? `: ${t.city}` : ""}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-muted">{t.basis === "certification" ? "from a listed certification" : "self-reported, unverified"}</span>
                    </summary>
                    <p className="text-xs text-muted mt-1 pl-1">
                      {STATUS_TAGS[t.tag].definition} {t.detail}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          )}
          <div>
            <h3 className="text-sm font-medium text-ink">Certifications you listed</h3>
            {passport.held.length === 0 ? (
              <p className="text-xs text-muted">None yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5 mt-1">
                {passport.held.map((h) => (
                  <li key={h.code} className="rounded-full bg-slate-soft text-ink px-2 py-0.5 text-xs">
                    {h.label}
                  </li>
                ))}
              </ul>
            )}
            {!slide && (
              <Link href="/#describe" className="text-xs text-green underline mt-1 inline-block no-print">
                Edit profile
              </Link>
            )}
          </div>
          {!slide && (
            <div className="text-xs text-muted border-t border-line pt-2">
              <p className="font-medium text-ink">Shared status taxonomy</p>
              <ul className="mt-1 space-y-0.5">
                {Object.values(STATUS_TAGS).map((d) => (
                  <li key={d.tag}>
                    <span className="text-ink">{d.label}:</span> {d.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* (b) Program grid */}
        <section className={`card p-4 ${slide ? "col-span-6" : "lg:col-span-6"}`} aria-labelledby="pp-programs">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="pp-programs" className="font-semibold text-ink">
              What each buyer recognizes
            </h2>
            <p className="text-xs text-muted">
              {passport.counts.recognized} recognized · {passport.counts["likely-to-apply"]} likely to apply
            </p>
          </div>
          <ul className={`divide-y divide-line ${slide ? "mt-1" : "mt-2"}`}>
            {shown.map((p) => {
              const agency = p.program.agencyId ? agencyFor(p.program.agencyId) : null;
              return (
                <li key={p.program.id} className={`flex gap-3 ${slide ? "py-1.5" : "py-2.5"}`}>
                  {agency ? (
                    <EntityMark agency={agency} size="sm" className="mt-0.5" />
                  ) : (
                    <span aria-hidden className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-soft text-slate text-[10px] font-bold">
                      ·
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-ink">{p.program.buyer}</span>
                      <span className="text-muted text-xs">{p.program.name}</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${STANDING_CLS[p.standing]}`}>{STANDING_LABELS[p.standing]}</span>
                    </div>
                    <p className={`text-xs text-ink/85 mt-0.5 ${slide ? "line-clamp-1" : ""}`}>{p.program.benefit}</p>
                    {!slide && <p className="text-xs text-muted mt-0.5">{p.why}</p>}
                    <p className="text-[11px] text-muted mt-0.5 flex flex-wrap gap-x-2">
                      {p.program.fundingLane.map((l) => (
                        <span key={l}>{FUNDING_LANE_LABELS[l]}</span>
                      ))}
                      <a href={p.program.officialUrl} target="_blank" rel="noreferrer" className="text-green underline">
                        official page ↗{p.program.urlVerifiedOn ? "" : " (unchecked link)"}
                      </a>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {hidden > 0 && <p className="text-xs text-muted mt-1">and {hidden} more on the full page</p>}
          <p className="text-[11px] text-muted mt-2 border-t border-line pt-2">
            Recognized means you listed the certification; we did not verify it. Likely to apply is a suggestion from self-reported size and location; each
            program decides after its own review.
          </p>
        </section>

        {/* (c) Harmonization proposal */}
        <section className={`card p-4 ${slide ? "col-span-3" : "lg:col-span-3"} space-y-3`} aria-labelledby="pp-proposal">
          <h2 id="pp-proposal" className="font-semibold text-ink">
            Harmonization proposal
          </h2>
          <ol className="space-y-1.5 text-xs">
            {HARMONIZATION.steps.map((s, i) => (
              <li key={s.title} className="flex gap-2">
                <span className="brand-gradient text-white rounded-full h-5 w-5 shrink-0 inline-flex items-center justify-center text-[11px] font-semibold">{i + 1}</span>
                <span>
                  <span className="font-medium text-ink">{s.title}.</span> {!slide && <span className="text-muted">{s.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
          <div className="rounded-xl border border-green/30 bg-green-soft/50 p-3 text-xs space-y-1.5">
            <p className="font-semibold text-green">Proposed: {HARMONIZATION.alumniBadge.name}</p>
            <p className="text-ink/85">{HARMONIZATION.alumniBadge.definition}</p>
            <p>
              <span className="font-medium text-ink">Would confer:</span> {HARMONIZATION.alumniBadge.confers.join(" ")}
            </p>
            <p>
              <span className="font-medium text-ink">Would not confer:</span> {HARMONIZATION.alumniBadge.doesNotConfer.join(" ")}
            </p>
          </div>
          {!slide && (
            <div className="text-xs">
              <p className="font-medium text-ink">Shared outcome metrics</p>
              <ul className="list-disc pl-4 text-muted mt-1 space-y-0.5">
                {HARMONIZATION.metrics.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <Callout tone="info">
            <span className="text-xs">{slide ? HARMONIZATION.legal.split(". ")[0] + "." : HARMONIZATION.legal}</span>
          </Callout>
          {!slide && <p className="text-xs text-muted">{HARMONIZATION.eastBayAlliance}</p>}
        </section>
      </div>

      {slide && (
        <footer className="mt-4 flex items-center justify-between text-xs text-muted">
          <span className="inline-flex items-center gap-2">
            <LogoMark size={18} /> {BRAND.product} · {BRAND.challenge}
          </span>
          <span>Statuses self-reported and unverified · {BRAND.builtOn}</span>
        </footer>
      )}
    </div>
  );
}
