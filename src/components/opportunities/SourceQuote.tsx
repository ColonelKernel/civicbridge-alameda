import type { SourceRef } from "@/lib/data/types";

const FIELD_LABELS: Record<string, string> = {
  summary: "Summary",
  title: "Title",
  description: "Description",
  category: "Category",
  department: "Department",
  term: "Term",
  status: "Status",
  estimatedValue: "Estimated value",
  "requirements.licenses": "License requirements",
  "requirements.certifications": "Certification requirements",
  "requirements.insurance": "Insurance requirements",
  "requirements.location": "Location requirement",
  "requirements.experience": "Experience requirement",
  "requirements.bonding": "Bonding",
  "requirements.prevailingWage": "Prevailing wage",
  "requirements.livingWage": "Living wage",
  "requirements.dirRegistration": "DIR registration",
  "requirements.statedStaffingMin": "Staffing",
  "requirements.other": "Other requirements",
  documents: "Required documents",
  submissionMethod: "Submission method",
  "dates.preBidMeeting": "Pre-bid meeting",
  "dates.siteVisit": "Site visit",
  "dates.questionsDue": "Questions deadline",
  "dates.submissionDue": "Due date",
  "dates.anticipatedAward": "Award date",
  "dates.contractStart": "Contract start",
  "dates.preBidMeeting.prerequisite": "Meeting prerequisite",
  "dates.siteVisit.prerequisite": "Site visit prerequisite",
  sourceUrl: "Posting",
  standard: "General County practice",
  scopeTags: "Scope",
  secondaryCategories: "Scope",
};

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/^requirements\./, "").replace(/([A-Z])/g, " $1").toLowerCase();
}

/** Expandable "where it says this" quote + link for any evidence, summary line or checklist item. */
export function SourceQuote({ sourceRef, compact = false }: { sourceRef?: SourceRef; compact?: boolean }) {
  if (!sourceRef) return null;
  const { quote, url, field } = sourceRef;
  if (!quote && !url) {
    return compact ? null : <span className="text-[11px] text-muted">From: {fieldLabel(field)}</span>;
  }
  return (
    <details className="text-xs text-muted mt-1">
      <summary className="cursor-pointer select-none hover:text-ink">
        {quote ? "Where it says this" : "Source"} · {fieldLabel(field)}
      </summary>
      {quote && <blockquote className="mt-1 border-l-2 border-line pl-2 italic text-ink/80">&ldquo;{quote}&rdquo;</blockquote>}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="inline-block mt-1 text-green underline">
          Open the source ↗
        </a>
      )}
    </details>
  );
}
