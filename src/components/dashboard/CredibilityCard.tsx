"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { BusinessProfile } from "@/lib/data/types";
import { derivePassport } from "@/lib/engine/passport";
import { HARMONIZATION } from "@/lib/data/programs";
import { Eyebrow } from "@/components/ui";

/** Certifications held, the recommended next certification, and the Passport link. */
export function CredibilityCard({ profile }: { profile: BusinessProfile }) {
  const passport = useMemo(() => derivePassport(profile), [profile]);
  return (
    <section className="card p-4 sm:p-5 space-y-3" aria-labelledby="cred-title">
      <div>
        <Eyebrow>Regional SLEB Passport</Eyebrow>
        <h2 id="cred-title" className="text-lg font-semibold text-ink">
          Certifications and credibility
        </h2>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {passport.held.length === 0 ? (
          <span className="text-sm text-muted">No certifications listed yet.</span>
        ) : (
          passport.held.map((h) => (
            <span key={h.code} className="rounded-full bg-green-soft text-green px-2.5 py-0.5 text-xs font-medium" title="Self-reported, not verified">
              {h.label}
            </span>
          ))
        )}
      </div>
      <div className="text-sm">
        <span className="font-medium text-ink">Recommended next step: </span>
        {passport.nextStep ? (
          <>
            {passport.nextStep.program.name} ({passport.nextStep.program.buyer}). <span className="text-muted">{passport.nextStep.program.benefit}</span>
          </>
        ) : (
          <span className="text-muted">You listed every applicable certification in the recommended stack.</span>
        )}
      </div>
      <ol className="text-xs text-muted flex flex-wrap gap-x-3 gap-y-1" aria-label="Recommended certification stack">
        {passport.stack.map((s, i) => (
          <li key={s.program.id} className="inline-flex items-center gap-1">
            <span aria-hidden className={s.held ? "text-green" : !s.applicable ? "text-slate" : "text-muted"}>
              {s.held ? "✓" : !s.applicable ? "–" : `${i + 1}.`}
            </span>
            <span className={!s.applicable ? "line-through" : ""}>{s.program.buyer}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        <span className="font-medium text-ink">Proposed:</span> a {HARMONIZATION.alumniBadge.name} would carry a verified history across these buyers. A
        harmonization proposal, not a program.
      </p>
      <Link href="/passport" className="inline-block text-sm text-green font-medium hover:underline">
        Open your Passport →
      </Link>
    </section>
  );
}
