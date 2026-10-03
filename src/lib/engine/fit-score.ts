/**
 * Bid Effort Fit: an explainable 0-100 score, a recommendation and a separate
 * confidence, built on top of the rules engine (src/lib/engine/rules.ts), which
 * stays the authority on every requirement.
 *
 * Guardrails, enforced by tests/fit-score.test.ts:
 *  - Decision support only. No label or detail may claim that a vendor is
 *    eligible, qualifies, or will win.
 *  - A hard blocker (any gate rule the vendor affirmatively fails) returns
 *    status "blocked" with no number; the UI shows the source quote instead.
 *  - Absent profile information is "unknown". It lowers confidence; it never
 *    blocks and never counts as a failure.
 *  - SLEB, DBE, MBE and similar statuses are never a proxy for award odds. The
 *    only path that awards points for a certification program is the
 *    certPreferred rule, which fires only when the solicitation itself states
 *    the program as preferred, and it is capped at 4 of 100 points. Nothing in
 *    this module reads profile.certifications directly.
 *  - Lexical similarity (src/lib/engine/similarity.ts) feeds only the scope
 *    component, capped at SIMILARITY_MAX, and is computed after blocking has
 *    already been decided, so it cannot un-block anything.
 *
 * Bump SCORING_VERSION whenever any weight or threshold changes.
 */
import type {
  AdminBurden,
  BusinessProfile,
  Classification,
  Evidence,
  FitConfidence,
  FitRecommendation,
  FitScoreComponents,
  FitScoreInputs,
  FitScoreResult,
  MatchResult,
  RuleId,
  Solicitation,
} from "@/lib/data/types";
import { STRONG_INFERRED_SCORE } from "./rules";
import { similarityPoints, SPARSE_TOKEN_MIN, type SimilarityResult } from "./similarity";
import { formatDate } from "./dates";

export const SCORING_VERSION = "1.0.0";

export const COMPONENT_MAX: FitScoreComponents = { scope: 35, readiness: 35, commercial: 15, localAndTiming: 15 };

export const RECOMMENDATION_LABELS: Record<FitRecommendation, string> = {
  strong: "Strong fit",
  investigate: "Worth a closer look",
  verify: "High verification effort",
  blocked: "Blocked as stated",
};

/** Every weight in one place so a reviewer can audit the arithmetic. */
export const WEIGHTS = {
  scope: {
    tradeByScore: [
      [10, 18],
      [7, 15],
      [5, 12],
      [4, 10],
    ] as [number, number][],
    tradeFallback: 8 as number,
    tradeConfirmedBonus: 2 as number,
    tradeMax: 20 as number,
    capabilityMatch: 5 as number,
    scopeCoverageCheck: -6 as number,
  },
  readiness: {
    groups: [
      { key: "license", rules: ["license"] as RuleId[], weight: 10 },
      { key: "certifications", rules: ["certRequired", "dirRegistration"] as RuleId[], weight: 8 },
      { key: "insurance", rules: ["insurance"] as RuleId[], weight: 7 },
      { key: "experience", rules: ["experience"] as RuleId[], weight: 5 },
      { key: "staffing", rules: ["statedStaffing"] as RuleId[], weight: 5 },
    ],
    factor: { met: 1, check: 0.5, unknown: 0, missing: 0, na: 1 } as Record<Evidence["status"], number>,
  },
  commercial: {
    contractSize: { met: 9, unknown: 4, check: 3, missing: 0, na: 4 } as Record<Evidence["status"], number>,
    adminBurden: { low: 6, medium: 3, high: 0 } as Record<AdminBurden, number>,
  },
  local: {
    location: { met: 5, na: 4, check: 1, unknown: 2, missing: 0 } as Record<Evidence["status"], number>,
    preferenceNeutral: 2 as number,
    preferenceMax: 4 as number,
    preferenceFactor: { met: 1, check: 0.25, unknown: 0, missing: 0, na: 0 } as Record<Evidence["status"], number>,
    deadline: [
      [21, 6],
      [14, 5],
      [7, 3],
      [3, 2],
      [0, 1],
    ] as [number, number][],
    deadlineNotStated: 3 as number,
  },
  recommendation: { strong: 70 as number, investigate: 45 as number },
} as const;

const LIST_ORDER: RuleId[] = [
  "tradeFit",
  "mandatoryMeeting",
  "license",
  "certRequired",
  "experience",
  "statedStaffing",
  "location",
  "contractSize",
  "scopeCoverage",
  "capabilityMatch",
  "lexicalSimilarity",
  "certPreferred",
  "participationGoal",
  "insurance",
  "dirRegistration",
  "bonding",
  "prevailingWage",
  "livingWage",
  "adminBurden",
  "deadline",
  "listingOnly",
  "availability",
];
const orderOf = (id: RuleId) => {
  const i = LIST_ORDER.indexOf(id);
  return i === -1 ? LIST_ORDER.length : i;
};
const sortByOrder = (list: Evidence[]) => [...list].sort((a, b) => orderOf(a.ruleId) - orderOf(b.ruleId));

export const evidenceId = (e: Evidence) => `${e.ruleId}|${e.requirementKey ?? e.sourceRef.field}`;

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));

export interface FitScoreArgs {
  sol: Solicitation;
  profile: BusinessProfile;
  evidence: Evidence[];
  classification: Classification;
  adminBurden: { level: AdminBurden; reasons: string[] };
  today: string;
  similarity: SimilarityResult;
}

/** "Due date not stated" records carry a 2099 sentinel with a note (see extract/validate.ts). */
function dueNotStated(sol: Solicitation): boolean {
  return !!sol.dates.submissionDue.note && sol.dates.submissionDue.date >= "2099-01-01";
}

export function computeFitScore(args: FitScoreArgs): FitScoreResult {
  const { sol, profile, evidence, classification, adminBurden, today, similarity } = args;
  const points = new Map<Evidence, number>();
  const find = (id: RuleId) => evidence.find((e) => e.ruleId === id);
  const all = (id: RuleId) => evidence.filter((e) => e.ruleId === id);

  // 1. Blockers first. Nothing below can change this decision.
  const blockers = sortByOrder(
    evidence.filter((e) => e.ruleClass === "gate" && e.status === "missing" && !(e.ruleId === "tradeFit" && e.confidence === "inferred")),
  );
  const blocked = blockers.length > 0;

  const positives: Evidence[] = [];
  const risks: Evidence[] = [];
  const unknowns: Evidence[] = [];

  // 2. Scope relevance (max 35).
  let scope = 0;
  const tradeFit = find("tradeFit");
  if (tradeFit?.status === "met") {
    const s = tradeFit.score ?? 0;
    let pts = WEIGHTS.scope.tradeFallback;
    for (const [min, p] of WEIGHTS.scope.tradeByScore) {
      if (s >= min) {
        pts = p;
        break;
      }
    }
    if (tradeFit.confidence === "confirmed") pts += WEIGHTS.scope.tradeConfirmedBonus;
    pts = Math.min(WEIGHTS.scope.tradeMax, pts);
    points.set(tradeFit, pts);
    scope += pts;
  } else if (tradeFit && tradeFit.status === "missing" && tradeFit.confidence === "inferred") {
    points.set(tradeFit, 0);
  }
  const cap = find("capabilityMatch");
  if (cap?.status === "met") {
    points.set(cap, WEIGHTS.scope.capabilityMatch);
    scope += WEIGHTS.scope.capabilityMatch;
  }
  const simPts = similarityPoints(similarity.cosine);
  scope += simPts;
  const coverage = find("scopeCoverage");
  if (coverage?.status === "check") {
    points.set(coverage, WEIGHTS.scope.scopeCoverageCheck);
    scope += WEIGHTS.scope.scopeCoverageCheck;
  }

  // 3. Requirements readiness (max 35).
  let readiness = 0;
  if (sol.listingOnly) {
    readiness = 0;
  } else {
    for (const g of WEIGHTS.readiness.groups) {
      const items = evidence.filter((e) => g.rules.includes(e.ruleId) && e.status !== "na");
      if (items.length === 0) {
        readiness += g.weight; // the solicitation states no gap in this group
        continue;
      }
      const mean = items.reduce((s, e) => s + WEIGHTS.readiness.factor[e.status], 0) / items.length;
      const pts = g.weight * mean;
      for (const e of items) points.set(e, (g.weight * WEIGHTS.readiness.factor[e.status]) / items.length);
      readiness += pts;
    }
  }

  // 4. Commercial viability (max 15).
  let commercial = 0;
  const size = find("contractSize");
  if (size) {
    const pts = WEIGHTS.commercial.contractSize[size.status];
    points.set(size, pts);
    commercial += pts;
  } else {
    commercial += WEIGHTS.commercial.contractSize.unknown;
  }
  commercial += WEIGHTS.commercial.adminBurden[adminBurden.level];

  // 5. Local, preference and timing (max 15).
  let local = 0;
  const location = find("location");
  if (location) {
    const pts = WEIGHTS.local.location[location.status];
    points.set(location, pts);
    local += pts;
  } else {
    local += WEIGHTS.local.location.na;
  }
  const preferred = all("certPreferred");
  if (preferred.length === 0) {
    local += WEIGHTS.local.preferenceNeutral;
  } else {
    const mean = preferred.reduce((s, e) => s + WEIGHTS.local.preferenceFactor[e.status], 0) / preferred.length;
    const pts = WEIGHTS.local.preferenceMax * mean;
    for (const e of preferred) points.set(e, (WEIGHTS.local.preferenceMax * WEIGHTS.local.preferenceFactor[e.status]) / preferred.length);
    local += pts;
  }
  const days = classification.daysUntilDue;
  const notStated = dueNotStated(sol);
  if (notStated) {
    local += WEIGHTS.local.deadlineNotStated;
  } else if (days >= 0) {
    for (const [min, p] of WEIGHTS.local.deadline) {
      if (days >= min) {
        local += p;
        break;
      }
    }
  }

  const components: FitScoreComponents = {
    scope: Math.round(clamp(scope, COMPONENT_MAX.scope)),
    readiness: Math.round(clamp(readiness, COMPONENT_MAX.readiness)),
    commercial: Math.round(clamp(commercial, COMPONENT_MAX.commercial)),
    localAndTiming: Math.round(clamp(local, COMPONENT_MAX.localAndTiming)),
  };
  const score = components.scope + components.readiness + components.commercial + components.localAndTiming;

  // 6. Evidence lists (rule evidence first, then derived items).
  for (const e of evidence) {
    if (blockers.includes(e)) continue;
    if (e.ruleId === "availability") continue;
    if (e.status === "met") positives.push(e);
    else if (e.status === "check") risks.push(e);
    else if (e.status === "unknown") unknowns.push(e);
    else if (e.status === "missing" && e.ruleId === "tradeFit" && e.confidence === "inferred") unknowns.push(e);
  }

  const derived = (ruleId: RuleId, status: Evidence["status"], label: string, detail: string, sourceRef: Evidence["sourceRef"]): Evidence => ({
    ruleId,
    ruleClass: "soft",
    status,
    confidence: "inferred",
    label,
    detail,
    sourceRef,
  });

  if (tradeFit?.status === "met" || simPts > 0) {
    const pct = Math.round(similarity.cosine * 100);
    const shared = similarity.sharedTerms.length ? `Shared terms: ${similarity.sharedTerms.join(", ")}. ` : "";
    const detail = `${shared}Text overlap only; it does not check requirements.`;
    const ref: Evidence["sourceRef"] = { field: "description" };
    if (simPts >= 5) positives.push(derived("lexicalSimilarity", "met", `Wording overlaps with your profile (${pct}% similar)`, detail, ref));
    else if (simPts >= 1) positives.push(derived("lexicalSimilarity", "met", "Some wording overlap with your profile", detail, ref));
    else if (tradeFit?.status === "met" && !sol.listingOnly) risks.push(derived("lexicalSimilarity", "check", "Little wording overlap with your profile text", detail, ref));
  }

  const burdenReasons = adminBurden.reasons.length ? `: ${adminBurden.reasons.join(", ")}` : "";
  if (adminBurden.level === "low") positives.push(derived("adminBurden", "met", "Lighter paperwork (our estimate)", "No bonds, no mandatory meetings and a short document list, as far as the solicitation states.", { field: "documents" }));
  else risks.push(derived("adminBurden", "check", `${adminBurden.level === "medium" ? "Moderate" : "Heavier"} paperwork (our estimate)${burdenReasons}`, "Budget time for the forms, meetings and payroll steps listed in the solicitation.", { field: "documents" }));

  if (notStated) unknowns.push(derived("deadline", "unknown", "Due date not stated on the listing", sol.dates.submissionDue.note ?? "Open the posting to find the due date.", { field: "dates.submissionDue" }));
  else if (days >= 14) positives.push(derived("deadline", "met", `${days} days to respond`, `Due ${formatDate(sol.dates.submissionDue.date)}.`, { field: "dates.submissionDue" }));
  else if (days >= 0 && days < 7) risks.push(derived("deadline", "check", `Only ${days} day${days === 1 ? "" : "s"} to respond`, `Due ${formatDate(sol.dates.submissionDue.date)}. Mandatory meetings and question deadlines may be sooner.`, { field: "dates.submissionDue" }));

  // 7. Confidence.
  const gateUnknown = evidence.filter((e) => e.ruleClass === "gate" && e.status === "unknown").length;
  const softUnknown = evidence.filter((e) => (e.ruleId === "insurance" || e.ruleId === "dirRegistration") && e.status === "unknown").length;
  const gateCheck = evidence.filter((e) => e.ruleClass === "gate" && e.status === "check" && e.ruleId !== "mandatoryMeeting").length;
  const scopeBacked = !!tradeFit && tradeFit.status === "met" && (tradeFit.confidence === "confirmed" || (tradeFit.score ?? 0) >= STRONG_INFERRED_SCORE);
  const sparse = similarity.solicitationTokens < SPARSE_TOKEN_MIN;
  const confidence: FitConfidence =
    sol.listingOnly || sparse || gateUnknown >= 2 || !scopeBacked ? "low" : gateUnknown === 0 && softUnknown === 0 && gateCheck === 0 ? "high" : "medium";

  // 8. Recommendation.
  let recommendation: FitRecommendation;
  if (blocked) recommendation = "blocked";
  else if (classification.fit === "strong" && score >= WEIGHTS.recommendation.strong && confidence !== "low") recommendation = "strong";
  else if (confidence === "low" || score < WEIGHTS.recommendation.investigate) recommendation = "verify";
  else recommendation = "investigate";

  const inputs: FitScoreInputs = {
    today,
    listingOnly: sol.listingOnly,
    daysUntilDue: days,
    adminBurden: adminBurden.level,
    fit: classification.fit,
    evidence: evidence.map((e) => ({ id: evidenceId(e), ruleId: e.ruleId, status: e.status, confidence: e.confidence, points: points.has(e) ? Math.round(points.get(e)! * 100) / 100 : undefined })),
    similarity: {
      cosine: similarity.cosine,
      points: simPts,
      solicitationTokens: similarity.solicitationTokens,
      vendorTokens: similarity.vendorTokens,
      sharedTerms: similarity.sharedTerms,
    },
    profile: {
      primaryCategorySource: profile.primaryCategorySource,
      licenses: profile.licenses === "unknown" ? "unknown" : "declared",
      certifications: profile.certifications === "unknown" ? "unknown" : "declared",
      insurance: profile.insurance === "unknown" ? "unknown" : "declared",
      typicalContractSize: profile.typicalContractSize === "unknown" ? "unknown" : "declared",
      yearsInBusiness: profile.yearsInBusiness !== undefined,
      employeeCount: profile.employeeCount !== undefined,
    },
  };

  return {
    status: blocked ? "blocked" : "scored",
    score: blocked ? undefined : score,
    recommendation,
    confidence,
    components,
    positives: sortByOrder(positives),
    risks: sortByOrder(risks),
    unknowns: sortByOrder(unknowns),
    blockers,
    inputs,
    scoringVersion: SCORING_VERSION,
  };
}

/** Ordering key for lists: scored results by score, blocked last. */
export function rankScore(r: MatchResult): number {
  return r.fitScore.status === "scored" ? (r.fitScore.score ?? 0) : -1;
}
