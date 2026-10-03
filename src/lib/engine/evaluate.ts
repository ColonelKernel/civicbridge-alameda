import { BusinessProfileSchema, type BusinessProfile, type BusinessProfileInput, type MatchResult, type Solicitation } from "@/lib/data/types";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { adminBurden, classify } from "./classify";
import { today as todayFn, type ISODate } from "./dates";
import { computeFitScore } from "./fit-score";
import { applyCategoryInference } from "./infer-category";
import { runRules } from "./rules";
import { getCorpusIndex, scoreSimilarity, vectorizeVendor, type SparseVector } from "./similarity";

/** Normalize a raw profile (from a form or demo) into the shape the rules expect. */
export function prepareProfile(input: BusinessProfileInput): BusinessProfile {
  return applyCategoryInference(BusinessProfileSchema.parse(input));
}

export interface EvaluateOptions {
  /** IDF corpus for lexical similarity. Defaults to the built-in records so scores never shift when a user pastes. */
  corpus?: readonly Solicitation[];
  /** Pre-computed vendor vector, shared across a batch. */
  vendorVector?: SparseVector;
}

export function evaluate(sol: Solicitation, profile: BusinessProfile, today: ISODate = todayFn(), opts: EvaluateOptions = {}): MatchResult {
  const evidence = runRules({ sol, profile, today });
  const classification = classify(evidence, sol, today);
  const burden = adminBurden(sol, profile);
  const index = getCorpusIndex(opts.corpus ?? SOLICITATIONS);
  const similarity = scoreSimilarity(index, sol, profile, opts.vendorVector);
  const fitScore = computeFitScore({ sol, profile, evidence, classification, adminBurden: burden, today, similarity });
  return { solicitation: sol, evidence, classification, adminBurden: burden.level, adminBurdenReasons: burden.reasons, fitScore };
}

export function evaluateAll(sols: Solicitation[], profile: BusinessProfile, today: ISODate = todayFn(), opts: EvaluateOptions = {}): MatchResult[] {
  const index = getCorpusIndex(opts.corpus ?? SOLICITATIONS);
  const vendorVector = opts.vendorVector ?? vectorizeVendor(index, profile);
  return sols.map((s) => evaluate(s, profile, today, { ...opts, vendorVector }));
}
