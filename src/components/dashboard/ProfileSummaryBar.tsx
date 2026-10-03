"use client";

import Link from "next/link";
import { CATEGORY_LABELS, type BusinessProfile } from "@/lib/data/types";
import { Money } from "@/components/ui";

const CERT_LABELS: Record<string, string> = {
  SLEB: "SLEB",
  DIR: "DIR",
  EVITP: "EVITP",
  SERVSAFE: "ServSafe",
  COURT_INTERPRETER: "Court interpreter",
  ATA: "ATA",
  BSIS_PPO: "BSIS PPO",
  QEI: "QEI",
  ASE: "ASE",
  BICSI: "BICSI",
  MEDI_CAL_PROVIDER: "Medi-Cal provider",
};
const certLabel = (code: string) => CERT_LABELS[code.toUpperCase()] ?? code.replace(/_/g, " ");

export function ProfileSummaryBar({ profile, counts }: { profile: BusinessProfile; counts: { strong: number; possible: number; poor: number; open: number } }) {
  const bits: string[] = [];
  if (profile.primaryCategory) bits.push(CATEGORY_LABELS[profile.primaryCategory]);
  bits.push(`${profile.city}${profile.county === "Alameda" ? ", Alameda County" : ""}`);
  if (profile.employeeCount !== undefined) bits.push(`${profile.employeeCount} ${profile.employeeCount === 1 ? "person" : "people"}`);
  const licenses = profile.licenses === "unknown" ? "licenses not listed" : profile.licenses.length ? `licenses: ${profile.licenses.map((l) => l.code).join(", ")}` : "no licenses";
  const certs = profile.certifications === "unknown" ? "" : profile.certifications.length ? `certs: ${profile.certifications.map(certLabel).join(", ")}` : "no certifications listed";
  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-6">
      <div className="min-w-0 sm:flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold text-ink">{profile.name}</h1>
          <Link href="/" className="text-sm text-green hover:underline">
            change business
          </Link>
        </div>
        <p className="text-sm text-muted mt-0.5">
          {bits.join(" · ")} · {licenses}
          {certs ? ` · ${certs}` : ""}
          {profile.typicalContractSize !== "unknown" && (
            <>
              {" "}
              · usually <Money n={profile.typicalContractSize.min} />–<Money n={profile.typicalContractSize.max} />
            </>
          )}
          {profile.insurance === "unknown" && " · insurance not listed"}
        </p>
        {profile.primaryCategorySource.startsWith("inferred") && profile.primaryCategory && (
          <p className="text-xs text-blue mt-1">
            We guessed your trade as {CATEGORY_LABELS[profile.primaryCategory].toLowerCase()} from your description.{" "}
            <Link href="/" className="underline">
              Change it
            </Link>{" "}
            if that is wrong.
          </p>
        )}
      </div>
      <dl className="flex gap-5 text-center shrink-0">
        <div>
          <dt className="text-xs text-muted">Strong</dt>
          <dd className="text-xl font-semibold text-green">{counts.strong}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Possible</dt>
          <dd className="text-xl font-semibold text-amber">{counts.possible}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Open total</dt>
          <dd className="text-xl font-semibold text-ink">{counts.open}</dd>
        </div>
      </dl>
    </div>
  );
}
