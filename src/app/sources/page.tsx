import type { Metadata } from "next";
import { AGENCIES, GOVERNANCE_LABELS, type Agency, type Governance } from "@/lib/data/agencies";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import Link from "next/link";
import { Callout, EntityMark } from "@/components/ui";

export const metadata: Metadata = {
  title: "Where we look · ProcureFit",
  description: "The Alameda County departments, cities, districts, regional buyers and state and federal entry points whose procurement postings ProcureFit centralizes.",
};

const ORDER: Governance[] = ["county-department", "county-commission", "special-district", "jpa", "authority", "court", "city", "school-district", "regional", "state", "federal", "other"];

const INGEST_LABEL: Record<Agency["ingest"], string> = {
  "html-list": "HTML listing, fetchable",
  "pdf-list": "PDF listing",
  opengov: "OpenGov portal (needs a browser or API)",
  bonfire: "Bonfire portal (needs a browser or API)",
  planroom: "Plan-room service",
  civicplus: "CivicPlus bid module",
  bidnet: "BidNet Direct portal (needs a browser or API)",
  "public-purchase": "Public Purchase portal (needs a browser or API)",
  unknown: "Not yet mapped",
};

const GROUP_INTRO: Partial<Record<Governance, string>> = {
  city: "All 14 incorporated cities. Their local-preference rules are summarized on the Regional SLEB Passport. Links are the official domain until each bids page is read.",
  "school-district": "K-12 districts and the County Office of Education.",
  state: "State entry points: UC Berkeley, Cal eProcure and Caltrans District 4.",
  federal: "Federal registration and the Contract Opportunities search.",
};

export default function SourcesPage() {
  const countByAgency = new Map<string, number>();
  for (const s of SOLICITATIONS) countByAgency.set(s.agencyId, (countByAgency.get(s.agencyId) ?? 0) + 1);
  const groups = ORDER.map((g) => ({ governance: g, agencies: AGENCIES.filter((a) => a.governance === g) })).filter((g) => g.agencies.length);
  const verified = AGENCIES.filter((a) => a.verified).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-8">
      <header>
        <p className="text-sm font-medium text-green mb-2">Where we look</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight">One place for every Alameda County buyer</h1>
        <p className="text-muted mt-3 max-w-2xl">
          &ldquo;The County&rdquo; is not one buyer. Departments post through General Services, but commissions, special districts, joint powers
          authorities and the courts each run their own portal, and so do the 14 cities, the school districts and the regional buyers. This
          registry is what ProcureFit centralizes, and each entry notes how a live feed would be built. Entries marked
          <em> unchecked</em> link to the agency&apos;s official domain only.
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-4 max-w-md">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Buyers</dt>
            <dd className="text-2xl font-semibold text-ink">{AGENCIES.length}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Links checked</dt>
            <dd className="text-2xl font-semibold text-ink">{verified}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Postings loaded</dt>
            <dd className="text-2xl font-semibold text-ink">{SOLICITATIONS.length}</dd>
          </div>
        </dl>
      </header>

      <Callout tone="info" title="How this becomes live">
        Every record flows through one <code className="font-mono text-xs">SolicitationSource</code> adapter. The County GSA page is plain HTML and can be
        polled today. OpenGov and Bonfire portals render in the browser, so they need a headless fetch or a data export. Each entry below is
        tagged with the kind of adapter it needs.
      </Callout>

      {groups.map((g) => (
        <section key={g.governance} aria-labelledby={`g-${g.governance}`}>
          <h2 id={`g-${g.governance}`} className="text-xl font-semibold text-ink mb-1">
            {GOVERNANCE_LABELS[g.governance]} <span className="text-muted font-normal text-base">({g.agencies.length})</span>
          </h2>
          {GROUP_INTRO[g.governance] ? (
            <p className="text-sm text-muted mb-3">
              {GROUP_INTRO[g.governance]}
              {g.governance === "city" && (
                <>
                  {" "}
                  <Link href="/passport" className="text-green underline">
                    Open the Passport
                  </Link>
                  .
                </>
              )}
            </p>
          ) : (
            <div className="mb-3" />
          )}
          <ul className="grid gap-3 md:grid-cols-2">
            {g.agencies.map((a) => {
              const n = countByAgency.get(a.id) ?? 0;
              return (
                <li key={a.id} className="card p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <EntityMark agency={a} size="sm" />
                        <h3 className="font-semibold text-ink leading-snug">{a.displayName}</h3>
                      </div>
                      {a.name !== a.displayName && <p className="text-xs text-muted mt-0.5">{a.name}</p>}
                      <p className="text-xs text-muted mt-0.5">
                        {a.countyGoverned ? "County-governed" : "Independent, in the County"} · {INGEST_LABEL[a.ingest]}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 ${a.verified ? "bg-green-soft text-green" : "bg-slate-soft text-slate"}`}>
                      {a.verified ? "link checked" : "unchecked"}
                    </span>
                  </div>
                  <p className="text-sm text-ink/90">{a.description}</p>
                  <p className="text-xs text-muted">{a.platform}</p>
                  {a.notes && <p className="text-xs text-muted">{a.notes}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm pt-1 border-t border-line mt-auto">
                    {a.procurementUrl ? (
                      <a href={a.procurementUrl} target="_blank" rel="noreferrer" className="text-green font-medium hover:underline">
                        {a.verified ? "Opportunities page ↗" : "Agency site ↗"}
                      </a>
                    ) : (
                      <span className="text-muted">No public listing found</span>
                    )}
                    {a.preferenceProgram && (
                      <a href={a.preferenceProgram.url} target="_blank" rel="noreferrer" className="text-blue hover:underline">
                        {a.preferenceProgram.name} ↗
                      </a>
                    )}
                    <span className="ml-auto text-xs text-muted">
                      {n === 0 ? "no postings loaded yet" : `${n} posting${n === 1 ? "" : "s"} loaded`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="text-xs text-muted">
        Links were read on October 3, 2026. Portals change; if one is wrong, the agency&apos;s own site wins.
      </p>
    </div>
  );
}
