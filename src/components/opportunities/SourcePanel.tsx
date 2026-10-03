"use client";

import { useRouter } from "next/navigation";
import type { Solicitation } from "@/lib/data/types";
import { CATEGORY_LABELS } from "@/lib/data/types";
import { agencyFor } from "@/lib/data/agencies";
import { formatDate } from "@/lib/engine/dates";
import { Button, Money, SourceTag } from "@/components/ui";
import { useProfile } from "@/state/profile";

function provenanceText(sol: Solicitation): string {
  const p = sol.provenance;
  if (p.source === "pasted") {
    const by = p.extractedBy === "claude" ? "by Claude" : "by pattern matching";
    const when = p.extractedAt ? ` on ${formatDate(p.extractedAt.slice(0, 10), { year: true })}` : "";
    return `Extracted ${by} from text you pasted${when}. Every fact we kept has a matching quote in that text; anything we could not verify was dropped.`;
  }
  if (p.source === "portal") return sol.listingOnly ? "Only the public listing was captured. Requirements have not been read yet." : "Read from the public solicitation documents posted by the agency.";
  return "Sample record written to mirror real County solicitations. Contacts are fictional.";
}

export function SourcePanel({ sol }: { sol: Solicitation }) {
  const { removePasted } = useProfile();
  const router = useRouter();
  const agency = agencyFor(sol.agencyId);
  const v = sol.estimatedValue;
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">Source</h3>
          <SourceTag source={sol.provenance.source} listingOnly={sol.listingOnly} />
        </div>
        {sol.sourceUrl ? (
          <a href={sol.sourceUrl} target="_blank" rel="noreferrer" className="block text-green font-medium hover:underline break-words">
            Open the original posting ↗
          </a>
        ) : (
          <p className="text-muted">No link was provided with this text.</p>
        )}
        <p className="text-xs text-muted">{provenanceText(sol)}</p>
        {sol.provenance.note && <p className="text-xs text-muted">{sol.provenance.note}</p>}
        <div>
          <h4 className="font-medium text-ink">Contact</h4>
          <p>
            {sol.contact.name}
            {sol.contact.title ? `, ${sol.contact.title}` : ""}
          </p>
          {sol.contact.email && sol.contact.email.includes("@") && (
            <a href={`mailto:${sol.contact.email}`} className="text-green underline break-all">
              {sol.contact.email}
            </a>
          )}
          {sol.contact.phone && <p>{sol.contact.phone}</p>}
        </div>
        <div>
          <h4 className="font-medium text-ink">Agency</h4>
          <p>{agency.name}</p>
          {agency.procurementUrl && (
            <a href={agency.procurementUrl} target="_blank" rel="noreferrer" className="text-green underline">
              Agency opportunities page ↗
            </a>
          )}
        </div>
        {sol.droppedExtractions && sol.droppedExtractions.length > 0 && (
          <div className="rounded-lg bg-amber-soft p-3">
            <p className="font-medium text-amber">
              {sol.droppedExtractions.length} item{sol.droppedExtractions.length === 1 ? "" : "s"} left out
            </p>
            <p className="text-xs text-ink/80">Extracted but not verifiable against the text, so we dropped them rather than guess.</p>
            <ul className="text-xs list-disc pl-4 mt-1 space-y-0.5">
              {sol.droppedExtractions.map((d, i) => (
                <li key={i}>{d.reason}</li>
              ))}
            </ul>
          </div>
        )}
        <details>
          <summary className="cursor-pointer text-ink select-none">Read the source text</summary>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-ink/80 max-h-80 overflow-auto rounded-lg bg-cream p-3 border border-line font-sans">{sol.sourceExcerpt}</pre>
        </details>
        {sol.provenance.source === "pasted" && (
          <Button
            variant="secondary"
            onClick={() => {
              removePasted(sol.id);
              router.push("/dashboard");
            }}
          >
            Remove from my list
          </Button>
        )}
      </div>

      <div className="card p-4 text-sm space-y-1.5">
        <h3 className="font-semibold text-ink">At a glance</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">Type</dt>
          <dd>{sol.type}</dd>
          <dt className="text-muted">Trade</dt>
          <dd>
            {CATEGORY_LABELS[sol.category]}
            {sol.secondaryCategories.length > 0 && <span className="text-muted"> + {sol.secondaryCategories.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(", ")}</span>}
          </dd>
          <dt className="text-muted">Value</dt>
          <dd>
            {v ? (
              <>
                <Money n={v.min} />
                {v.min !== v.max && (
                  <>
                    –<Money n={v.max} />
                  </>
                )}
                {v.basis === "annual" ? " per year" : v.basis === "nte-pool" ? " shared pool" : v.basis === "per-order" ? " per order" : ""}
              </>
            ) : (
              "Not stated"
            )}
          </dd>
          {sol.term && (
            <>
              <dt className="text-muted">Term</dt>
              <dd>{sol.term}</dd>
            </>
          )}
          <dt className="text-muted">Documents</dt>
          <dd>{sol.documents.length === 0 ? "Not captured" : `${sol.documents.length} to submit`}</dd>
          {sol.scopeTags.length > 0 && (
            <>
              <dt className="text-muted">Scope</dt>
              <dd>{sol.scopeTags.join(", ")}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
