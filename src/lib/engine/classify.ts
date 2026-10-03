/**
 * Turn a list of evidence into a fit tier. The thresholds are deliberately
 * simple and documented so a judge can audit them:
 *
 *   poor      any gate rule is "missing" (wrong trade, closed, missing a
 *             required license/certification, mandatory meeting already held,
 *             outside a county-required location, below stated staffing).
 *   strong    trade fit is confirmed (or inferred with a strong score), nothing
 *             is "missing", no gate rule is "unknown", the scope is fully
 *             covered, the size is within range, and the requirements have
 *             actually been read.
 *   possible  everything else.
 *
 * "unknown" never counts as "missing". Unknowns on gate rules keep a match at
 * "possible" and nudge the owner to complete their profile.
 */
import type { AdminBurden, Classification, Evidence, Solicitation, BusinessProfile } from "@/lib/data/types";
import { CONSTRUCTION_TRADES } from "@/lib/data/types";
import { daysBetween, type ISODate } from "./dates";
import { STRONG_INFERRED_SCORE } from "./rules";

export function classify(evidence: Evidence[], sol: Solicitation, today: ISODate): Classification {
  const avail = evidence.find((e) => e.ruleId === "availability");
  const availability = avail?.status === "missing" ? "closed" : "open";
  const tradeFit = evidence.find((e) => e.ruleId === "tradeFit");
  const blockers = evidence.filter((e) => e.ruleClass === "gate" && e.status === "missing");
  const gateUnknowns = evidence.filter((e) => e.ruleClass === "gate" && e.status === "unknown");
  const anyMissing = evidence.some((e) => e.status === "missing");
  const scope = evidence.find((e) => e.ruleId === "scopeCoverage");
  const size = evidence.find((e) => e.ruleId === "contractSize");

  const strongTrade =
    !!tradeFit &&
    tradeFit.status === "met" &&
    (tradeFit.confidence === "confirmed" || (tradeFit.score ?? 0) >= STRONG_INFERRED_SCORE);

  let fit: Classification["fit"];
  if (!tradeFit || tradeFit.status === "missing" || blockers.length > 0) fit = "poor";
  else if (
    strongTrade &&
    !anyMissing &&
    gateUnknowns.length === 0 &&
    scope?.status !== "check" &&
    size?.status !== "check" &&
    !sol.listingOnly
  )
    fit = "strong";
  else fit = "possible";

  const verify = evidence.filter(
    (e) => (e.status === "check" || e.status === "unknown") && e.ruleId !== "availability",
  );

  let fitScore = 0;
  if (tradeFit?.status === "met") fitScore += tradeFit.confidence === "confirmed" ? 40 : 25;
  if (evidence.some((e) => e.ruleId === "capabilityMatch" && e.status === "met")) fitScore += 15;
  if (size?.status === "met") fitScore += 20;
  if (evidence.some((e) => e.ruleId === "location" && e.status === "met")) fitScore += 10;
  fitScore += evidence.filter((e) => (e.ruleId === "license" || e.ruleId === "certRequired" || e.ruleId === "certPreferred") && e.status === "met").length * 5;
  fitScore -= evidence.filter((e) => e.status === "missing").length * 15;
  fitScore -= Math.min(10, evidence.filter((e) => e.status === "check").length * 2);

  const reasons = buildReasons(evidence, fit);

  return {
    fit,
    availability,
    blockers,
    verify,
    reasons,
    fitScore,
    daysUntilDue: daysBetween(today, sol.dates.submissionDue.date),
  };
}

/** Three or four plain-language lines a card can show. Each is backed by one Evidence item. */
function buildReasons(evidence: Evidence[], fit: Classification["fit"]): string[] {
  const order: Evidence["ruleId"][] = [
    "tradeFit",
    "mandatoryMeeting",
    "license",
    "certRequired",
    "contractSize",
    "location",
    "certPreferred",
    "scopeCoverage",
    "experience",
    "insurance",
    "bonding",
    "prevailingWage",
  ];
  const picked: Evidence[] = [];
  // Blockers first for poor fits.
  if (fit === "poor") picked.push(...evidence.filter((e) => e.ruleClass === "gate" && e.status === "missing").slice(0, 2));
  for (const id of order) {
    for (const e of evidence.filter((x) => x.ruleId === id && x.status !== "na")) {
      if (picked.length >= 4) break;
      if (!picked.includes(e)) picked.push(e);
    }
  }
  return picked.slice(0, 4).map((e) => e.label);
}

/** Our estimate of paperwork effort, labelled as such in the UI. */
export function adminBurden(sol: Solicitation, profile: BusinessProfile): { level: AdminBurden; reasons: string[] } {
  let points = 0;
  const reasons: string[] = [];
  const isTrade = profile.primaryCategory ? CONSTRUCTION_TRADES.includes(profile.primaryCategory) : false;
  for (const b of sol.requirements.bonding) {
    points += 3;
    reasons.push(`${b.type} bond`);
  }
  const mandatory = [sol.dates.preBidMeeting, sol.dates.siteVisit].filter((m) => m?.mandatory).length;
  if (mandatory) {
    points += 2;
    reasons.push("mandatory meeting");
  }
  if (sol.dates.siteVisit && !sol.dates.siteVisit.mandatory) {
    points += 1;
    reasons.push("site visit");
  }
  if (sol.requirements.prevailingWage) {
    points += isTrade ? 1 : 2;
    reasons.push("prevailing wage payroll");
  }
  const requiredCerts = sol.requirements.certifications.filter((c) => c.required).length;
  if (requiredCerts) {
    points += requiredCerts;
    reasons.push(`${requiredCerts} required certification${requiredCerts > 1 ? "s" : ""}`);
  }
  const extraDocs = Math.max(0, sol.documents.length - 4);
  if (extraDocs) {
    points += extraDocs;
    reasons.push(`${sol.documents.length} documents`);
  }
  if (sol.scopeTags.includes("multi-trade")) {
    points += 1;
    reasons.push("multi-trade scope");
  }
  const level: AdminBurden = points <= 2 ? "low" : points <= 5 ? "medium" : "high";
  return { level, reasons };
}
