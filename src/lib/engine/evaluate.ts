import { BusinessProfileSchema, type BusinessProfile, type BusinessProfileInput, type MatchResult, type Solicitation } from "@/lib/data/types";
import { adminBurden, classify } from "./classify";
import { today as todayFn, type ISODate } from "./dates";
import { applyCategoryInference } from "./infer-category";
import { runRules } from "./rules";

/** Normalize a raw profile (from a form or demo) into the shape the rules expect. */
export function prepareProfile(input: BusinessProfileInput): BusinessProfile {
  return applyCategoryInference(BusinessProfileSchema.parse(input));
}

export function evaluate(sol: Solicitation, profile: BusinessProfile, today: ISODate = todayFn()): MatchResult {
  const evidence = runRules({ sol, profile, today });
  const classification = classify(evidence, sol, today);
  const burden = adminBurden(sol, profile);
  return { solicitation: sol, evidence, classification, adminBurden: burden.level, adminBurdenReasons: burden.reasons };
}

export function evaluateAll(sols: Solicitation[], profile: BusinessProfile, today: ISODate = todayFn()): MatchResult[] {
  return sols.map((s) => evaluate(s, profile, today));
}
