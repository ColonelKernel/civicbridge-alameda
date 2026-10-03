/**
 * Dashboard sections, common-gap aggregation and filters, all derived from
 * MatchResults. Pure functions, no React.
 */
import type { Category, Evidence, Fit, MatchResult } from "@/lib/data/types";
import { glossaryFor, type GlossaryEntry } from "@/lib/data/glossary";
import { rankScore } from "./fit-score";

export type GapBucket = "missing" | "verify" | "tell-us";

export interface GapSummary {
  requirementKey: string;
  label: string;
  bucket: GapBucket;
  count: number;
  solicitationIds: string[];
  glossary?: GlossaryEntry;
  action?: string;
}

export interface DashboardSections {
  topMatches: MatchResult[];
  topMatchesBackfilled: boolean;
  closingSoon: MatchResult[];
  easyWins: MatchResult[];
  larger: MatchResult[];
  blocked: MatchResult[];
  commonGaps: GapSummary[];
  counts: { strong: number; possible: number; poor: number; open: number };
}

const byScoreThenDate = (a: MatchResult, b: MatchResult) =>
  rankScore(b) - rankScore(a) || a.classification.daysUntilDue - b.classification.daysUntilDue || a.solicitation.id.localeCompare(b.solicitation.id);

const byDate = (a: MatchResult, b: MatchResult) => a.classification.daysUntilDue - b.classification.daysUntilDue;

// ---------------------------------------------------------------------------
// Quick filters: the same predicates drive the dashboard sections and the chips
// over the single list, so a chip always shows exactly what its section did.
// ---------------------------------------------------------------------------

export type QuickFilter = "none" | "closing" | "easy" | "larger" | "blocked";

const isOpen = (r: MatchResult) => r.classification.availability === "open";
const isCandidate = (r: MatchResult) => isOpen(r) && r.classification.fit !== "poor";
const tradeMet = (r: MatchResult) => r.evidence.some((e) => e.ruleId === "tradeFit" && e.status === "met");
const sizeCheck = (r: MatchResult) => r.evidence.some((e) => e.ruleId === "contractSize" && e.status === "check");

export const isClosingSoon = (r: MatchResult) => isCandidate(r) && r.classification.daysUntilDue >= 0 && r.classification.daysUntilDue <= 14;
export const isEasyWin = (r: MatchResult) => isCandidate(r) && r.adminBurden === "low" && !r.solicitation.listingOnly && !sizeCheck(r);
export const isLarger = (r: MatchResult) => isOpen(r) && tradeMet(r) && sizeCheck(r);
export const isBlocked = (r: MatchResult) => isOpen(r) && r.classification.fit === "poor" && tradeMet(r);

export const QUICK_PREDICATE: Record<Exclude<QuickFilter, "none">, (r: MatchResult) => boolean> = {
  closing: isClosingSoon,
  easy: isEasyWin,
  larger: isLarger,
  blocked: isBlocked,
};

export const QUICK_META: Record<QuickFilter, { subtitle: string; empty: string }> = {
  none: { subtitle: "All opportunities we track, filtered however you like.", empty: "No opportunities match these filters." },
  closing: { subtitle: "Due within 14 days. Mandatory meetings and questions deadlines may be sooner than the due date.", empty: "Nothing that fits you closes in the next two weeks." },
  easy: { subtitle: "Lighter paperwork, our estimate: no bonds, no mandatory meetings, a short document list, and a size in your usual range.", empty: "No light-paperwork matches right now." },
  larger: { subtitle: "Your trade, but bigger than you said you usually take. Size is not an eligibility rule; teaming or subcontracting is common.", empty: "Nothing above your usual contract size." },
  blocked: { subtitle: "These fit what you do, yet one stated requirement is missing from your profile. Open one to see what it would take.", empty: "No blocked matches. Nice." },
};

export function buildDashboard(results: MatchResult[]): DashboardSections {
  const open = results.filter(isOpen);
  const candidates = open.filter((r) => r.classification.fit !== "poor");
  const strong = candidates.filter((r) => r.classification.fit === "strong").sort(byScoreThenDate);
  const possible = candidates.filter((r) => r.classification.fit === "possible").sort(byScoreThenDate);

  let topMatches = strong.slice(0, 6);
  let backfilled = false;
  if (topMatches.length < 3) {
    topMatches = [...topMatches, ...possible.slice(0, 3 - topMatches.length)];
    backfilled = possible.length > 0 && strong.length < 3;
  }

  const closingSoon = results.filter(isClosingSoon).sort(byDate);
  const easyWins = results.filter(isEasyWin).sort(byScoreThenDate).slice(0, 6);
  const larger = results.filter(isLarger).sort(byDate);
  const blocked = results.filter(isBlocked).sort(byDate);

  return {
    topMatches,
    topMatchesBackfilled: backfilled,
    closingSoon,
    easyWins,
    larger,
    blocked,
    commonGaps: commonGaps(candidates),
    counts: {
      strong: strong.length,
      possible: possible.length,
      poor: open.length - candidates.length,
      open: open.length,
    },
  };
}

/** Group check/unknown/missing evidence across the owner's real candidates by requirement. */
export function commonGaps(results: MatchResult[]): GapSummary[] {
  const map = new Map<string, GapSummary>();
  for (const r of results) {
    for (const e of r.evidence) {
      if (!e.requirementKey) continue;
      if (e.status !== "missing" && e.status !== "check" && e.status !== "unknown") continue;
      if (e.ruleId === "availability" || e.ruleId === "listingOnly") continue;
      const bucket: GapBucket = e.status === "missing" ? "missing" : e.status === "check" ? "verify" : "tell-us";
      const key = `${e.requirementKey}|${bucket}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.solicitationIds.push(r.solicitation.id);
      } else {
        const g = glossaryFor(e.glossaryKey ?? e.requirementKey);
        map.set(key, {
          requirementKey: e.requirementKey,
          label: g?.term ?? humanizeKey(e.requirementKey, e),
          bucket,
          count: 1,
          solicitationIds: [r.solicitation.id],
          glossary: g,
          action: e.action ?? g?.action,
        });
      }
    }
  }
  const order: Record<GapBucket, number> = { missing: 0, verify: 1, "tell-us": 2 };
  return Array.from(map.values()).sort((a, b) => order[a.bucket] - order[b.bucket] || b.count - a.count);
}

function humanizeKey(key: string, e: Evidence): string {
  const [kind, rest] = key.split(":");
  switch (kind) {
    case "license":
      return `${rest} license`;
    case "cert":
      return `${rest} certification`;
    case "insurance":
      return e.label.split(":")[0];
    case "staffing":
      return "Stated minimum staffing";
    default:
      return e.label;
  }
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export type DeadlineWindow = "any" | "7" | "14" | "30" | "60";
export type SizeBucket = "any" | "under50k" | "50k-250k" | "250k-1m" | "over1m" | "not-stated";

export interface Filters {
  categories: Category[];
  departments: string[];
  agencies: string[];
  deadline: DeadlineWindow;
  size: SizeBucket;
  certification: string[];
  fit: Fit[];
  includeClosed: boolean;
  search: string;
  quick: QuickFilter;
}

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  departments: [],
  agencies: [],
  deadline: "any",
  size: "any",
  certification: [],
  fit: [],
  includeClosed: false,
  search: "",
  quick: "none",
};

function sizeBucketOf(r: MatchResult): SizeBucket {
  const v = r.solicitation.estimatedValue;
  if (!v) return "not-stated";
  const n = v.basis === "nte-pool" ? v.max / Math.max(1, v.termYears ?? 1) / 3 : v.max;
  if (n < 50_000) return "under50k";
  if (n < 250_000) return "50k-250k";
  if (n < 1_000_000) return "250k-1m";
  return "over1m";
}

export function applyFilters(results: MatchResult[], f: Filters): MatchResult[] {
  const q = f.search.trim().toLowerCase();
  return results.filter((r) => {
    const s = r.solicitation;
    if (!f.includeClosed && r.classification.availability === "closed") return false;
    if (f.quick !== "none" && !QUICK_PREDICATE[f.quick](r)) return false;
    if (f.categories.length && !f.categories.some((c) => c === s.category || s.secondaryCategories.includes(c))) return false;
    if (f.departments.length && !f.departments.includes(s.department)) return false;
    if (f.agencies.length && !f.agencies.includes(s.agencyId)) return false;
    if (f.deadline !== "any") {
      const d = r.classification.daysUntilDue;
      if (d < 0 || d > Number(f.deadline)) return false;
    }
    if (f.size !== "any" && sizeBucketOf(r) !== f.size) return false;
    if (f.certification.length) {
      const codes = s.requirements.certifications.map((c) => c.code.toUpperCase());
      if (!f.certification.some((c) => codes.includes(c.toUpperCase()))) return false;
    }
    if (f.fit.length && !f.fit.includes(r.classification.fit)) return false;
    if (q && !`${s.title} ${s.department} ${s.summary} ${s.number}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export const FIT_ORDER: Record<Fit, number> = { strong: 0, possible: 1, poor: 2 };

export function sortForList(results: MatchResult[], quick: QuickFilter = "none"): MatchResult[] {
  if (quick === "closing" || quick === "larger" || quick === "blocked") return [...results].sort(byDate);
  return [...results].sort(
    (a, b) =>
      (a.classification.availability === "closed" ? 1 : 0) - (b.classification.availability === "closed" ? 1 : 0) ||
      FIT_ORDER[a.classification.fit] - FIT_ORDER[b.classification.fit] ||
      byScoreThenDate(a, b),
  );
}
