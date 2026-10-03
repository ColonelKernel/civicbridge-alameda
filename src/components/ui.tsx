import type { ReactNode } from "react";
import type { AdminBurden, EvidenceStatus, Fit, FitConfidence, FitRecommendation } from "@/lib/data/types";
import { countdownLabel, formatCivic, urgency } from "@/lib/engine/dates";
import type { CivicDate } from "@/lib/data/types";
import { GOVERNANCE_LABELS, type Agency, type Governance } from "@/lib/data/agencies";
import { RECOMMENDATION_LABELS } from "@/lib/engine/fit-score";

export function Card({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "article" | "section" | "li" }) {
  return <Tag className={`card p-5 ${className}`}>{children}</Tag>;
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-3">
      <div>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const FIT_META: Record<Fit, { label: string; cls: string; icon: string }> = {
  strong: { label: "Looks like a strong fit", cls: "bg-green-soft text-green border-green/20", icon: "✓" },
  possible: { label: "Possible fit", cls: "bg-amber-soft text-amber border-amber/20", icon: "△" },
  poor: { label: "Unlikely fit", cls: "bg-slate-soft text-slate border-slate/20", icon: "–" },
};

export function FitBadge({ fit, verifyCount, closed, size = "md" }: { fit: Fit; verifyCount?: number; closed?: boolean; size?: "sm" | "md" }) {
  const m = closed ? { label: "Closed", cls: "bg-slate-soft text-slate border-slate/20", icon: "•" } : FIT_META[fit];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"} ${m.cls}`}>
      <span aria-hidden>{m.icon}</span>
      {m.label}
      {!closed && verifyCount !== undefined && verifyCount > 0 && fit !== "poor" && (
        <span className="opacity-75 font-normal">· {verifyCount} to verify</span>
      )}
    </span>
  );
}

export function DeadlineChip({ due, today, size = "md" }: { due: CivicDate; today: string; size?: "sm" | "md" | "lg" }) {
  if (due.note && due.date >= "2099-01-01") {
    const pad = size === "lg" ? "px-3 py-1.5 text-base" : size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-soft text-slate ${pad}`} title={due.note}>
        <span aria-hidden>?</span>
        <span>Due date not stated</span>
      </span>
    );
  }
  const u = urgency(due.date, today);
  const cls =
    u === "past" ? "bg-slate-soft text-slate" : u === "critical" ? "bg-red-soft text-red" : u === "soon" ? "bg-amber-soft text-amber" : "bg-green-soft text-green";
  const icon = u === "past" ? "•" : u === "critical" ? "⏰" : u === "soon" ? "◔" : "◷";
  const pad = size === "lg" ? "px-3 py-1.5 text-base" : size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad} ${cls}`} title={formatCivic(due, { year: true })}>
      <span aria-hidden>{icon}</span>
      <span>{countdownLabel(due.date, today)}</span>
      <span className="opacity-70 font-normal">· {formatCivic(due)}</span>
    </span>
  );
}

export function BurdenTag({ level, reasons }: { level: AdminBurden; reasons: string[] }) {
  const label = level === "low" ? "Light paperwork" : level === "medium" ? "Moderate paperwork" : "Heavy paperwork";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted" title={`Our estimate${reasons.length ? ": " + reasons.join(", ") : ""}`}>
      <span aria-hidden>{level === "low" ? "▪" : level === "medium" ? "▪▪" : "▪▪▪"}</span>
      {label}
    </span>
  );
}

export const STATUS_META: Record<EvidenceStatus, { icon: string; cls: string; word: string }> = {
  met: { icon: "✓", cls: "text-green", word: "Looks good" },
  check: { icon: "△", cls: "text-amber", word: "Check this" },
  missing: { icon: "✕", cls: "text-red", word: "Missing" },
  unknown: { icon: "?", cls: "text-blue", word: "Tell us" },
  na: { icon: "–", cls: "text-slate", word: "Not stated" },
};

export function StatusIcon({ status, className = "" }: { status: EvidenceStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span aria-label={m.word} className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.cls} ${status === "met" ? "bg-green-soft" : status === "check" ? "bg-amber-soft" : status === "missing" ? "bg-red-soft" : status === "unknown" ? "bg-blue-soft" : "bg-slate-soft"} ${className}`}>
      {m.icon}
    </span>
  );
}

export function ConfidenceTag({ confidence }: { confidence: "confirmed" | "inferred" }) {
  return (
    <span className={`text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 ${confidence === "confirmed" ? "bg-slate-soft text-slate" : "bg-blue-soft text-blue"}`}>
      {confidence === "confirmed" ? "stated" : "inferred"}
    </span>
  );
}

export function SourceTag({ source, listingOnly }: { source: "curated" | "portal" | "pasted"; listingOnly?: boolean }) {
  const label = listingOnly ? "listing only" : source === "portal" ? "from the portal" : source === "pasted" ? "pasted by you" : "sample";
  const cls = source === "portal" && !listingOnly ? "bg-blue-soft text-blue" : source === "pasted" ? "bg-amber-soft text-amber" : "bg-slate-soft text-slate";
  return <span className={`text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 ${cls}`}>{label}</span>;
}

export function Callout({ tone = "info", children, title }: { tone?: "info" | "warn" | "good"; children: ReactNode; title?: string }) {
  const cls = tone === "warn" ? "bg-amber-soft border-amber/30 text-ink" : tone === "good" ? "bg-green-soft border-green/30" : "bg-blue-soft border-blue/20";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="prose-plain">{children}</div>
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...rest }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const v =
    variant === "primary" ? "bg-green text-white hover:bg-green/90" : variant === "secondary" ? "border border-line bg-paper text-ink hover:bg-slate-soft" : "text-ink hover:bg-slate-soft";
  return (
    <button className={`${base} ${v} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{label ?? "Progress"}</span>
        <span>
          {value} of {max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-soft overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
        <div className="h-full bg-green transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Money({ n }: { n: number }) {
  return <>{n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1000).toLocaleString()}k`}</>;
}

// ---------------------------------------------------------------------------
// Bid Effort Fit presentation
// ---------------------------------------------------------------------------

export const RECOMMENDATION_META: Record<FitRecommendation, { label: string; short: string; cls: string; accent: string; blurb: string }> = {
  strong: {
    label: RECOMMENDATION_LABELS.strong,
    short: "Strong",
    cls: "bg-green-soft text-green border-green/20",
    accent: "border-l-green",
    blurb: "Scope, readiness and size line up with what you told us. Read the packet and plan the dates.",
  },
  investigate: {
    label: RECOMMENDATION_LABELS.investigate,
    short: "Investigate",
    cls: "bg-blue-soft text-blue border-blue/20",
    accent: "border-l-blue",
    blurb: "The scope fits, but several points are unread or unanswered. Open the posting before you commit time.",
  },
  verify: {
    label: RECOMMENDATION_LABELS.verify,
    short: "Verify",
    cls: "bg-amber-soft text-amber border-amber/20",
    accent: "border-l-amber",
    blurb: "Something stated needs confirming or arranging, or we know too little. Clear the check items first.",
  },
  blocked: {
    label: RECOMMENDATION_LABELS.blocked,
    short: "Blocked",
    cls: "bg-red-soft text-red border-red/20",
    accent: "border-l-red",
    blurb: "A stated requirement is missing from your profile. The quote is the exact wording.",
  },
};

export const CONFIDENCE_META: Record<FitConfidence, { label: string; cls: string; hint: string }> = {
  high: { label: "High confidence", cls: "bg-green-soft text-green", hint: "The requirements were read and your profile answers them." },
  medium: { label: "Medium confidence", cls: "bg-amber-soft text-amber", hint: "Some requirements or profile fields are unknown." },
  low: { label: "Low confidence", cls: "bg-slate-soft text-slate", hint: "Listing only, thin text, or most of your profile is blank." },
};

export const COMPONENT_META = {
  scope: { label: "Scope match", max: 35, hint: "trade, capabilities, wording" },
  readiness: { label: "Readiness", max: 35, hint: "licenses, certifications, insurance, staffing" },
  commercial: { label: "Commercial", max: 15, hint: "size, paperwork effort" },
  localAndTiming: { label: "Local & timing", max: 15, hint: "location rules, stated preferences, days left" },
} as const;

export const FIT_SCORE_DISCLAIMER = "Guidance only, not an eligibility determination or award prediction. The agency decides after reading your full response.";

export function FitScoreChip({ score, status, recommendation, size = "md" }: { score?: number; status: "scored" | "blocked"; recommendation: FitRecommendation; size?: "sm" | "md" | "lg" }) {
  const m = RECOMMENDATION_META[recommendation];
  const pad = size === "lg" ? "px-3 py-1.5 text-base" : size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium tabular-nums ${pad} ${m.cls}`} title={m.label}>
      {status === "scored" ? (
        <>
          <span className="font-semibold">{score}</span>
          <span className="opacity-70 font-normal">/100</span>
        </>
      ) : (
        <span className="font-semibold">Blocked</span>
      )}
      <span className="opacity-90 font-normal">· {m.short}</span>
    </span>
  );
}

export function FitConfidenceTag({ confidence }: { confidence: FitConfidence }) {
  const m = CONFIDENCE_META[confidence];
  return (
    <span className={`text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 ${m.cls}`} title={m.hint}>
      {m.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

/** A <details> with a visible chevron (summary markers are hidden globally). */
export function Disclosure({ summary, children, defaultOpen = false, count, className = "", id }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean; count?: number; className?: string; id?: string }) {
  return (
    <details id={id} open={defaultOpen} className={`group card ${className}`}>
      <summary className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 select-none">
        <span className="font-semibold text-ink flex items-center gap-2">
          <span aria-hidden className="text-muted group-open:hidden">▸</span>
          <span aria-hidden className="text-muted hidden group-open:inline">▾</span>
          {summary}
        </span>
        {count !== undefined && <span className="text-xs text-muted shrink-0">{count}</span>}
      </summary>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </details>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs font-semibold uppercase tracking-[0.14em] text-green ${className}`}>{children}</p>;
}

// ---------------------------------------------------------------------------
// Entity identity: text marks for buyers, never their seals or logos
// ---------------------------------------------------------------------------

const ENTITY_TINT: Record<Governance, string> = {
  "county-department": "bg-green-soft text-green",
  "county-commission": "bg-green-soft text-green",
  "special-district": "bg-slate-soft text-slate",
  jpa: "bg-slate-soft text-slate",
  authority: "bg-slate-soft text-slate",
  court: "bg-slate-soft text-slate",
  city: "bg-blue-soft text-blue",
  "school-district": "bg-amber-soft text-amber",
  regional: "bg-slate-soft text-slate",
  state: "bg-paper text-ink border border-line",
  federal: "bg-paper text-ink border border-line",
  other: "bg-slate-soft text-slate",
};

export function entityMonogram(a: Pick<Agency, "shortName" | "displayName">): string {
  const src = a.shortName.replace(/[^A-Za-z0-9 ]/g, " ").trim();
  if (/^[A-Z0-9]{2,5}$/.test(src)) return src.slice(0, 4);
  const words = src.split(/\s+/).filter((w) => !/^(of|the|and|for|city|county)$/i.test(w));
  const letters = words.map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (letters || src.slice(0, 2)).slice(0, 3);
}

export function EntityMark({ agency, size = "md", showGovernance = false, className = "" }: { agency: Agency; size?: "sm" | "md" | "lg"; showGovernance?: boolean; className?: string }) {
  const tile = size === "lg" ? "h-10 w-10 text-sm" : size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`} title={`${agency.name} · ${GOVERNANCE_LABELS[agency.governance]}`}>
      <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-md font-bold tracking-tight ${tile} ${ENTITY_TINT[agency.governance]}`}>
        {entityMonogram(agency)}
      </span>
      {size !== "sm" && (
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink leading-tight">{agency.displayName}</span>
          {showGovernance && <span className="block text-[11px] text-muted leading-tight">{GOVERNANCE_LABELS[agency.governance]}</span>}
        </span>
      )}
    </span>
  );
}
