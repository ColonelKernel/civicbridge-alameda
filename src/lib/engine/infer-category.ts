/**
 * Infer a business's primary trade category from what it told us, in priority
 * order: declared licenses, then certifications, then text scoring.
 * The result is always shown to the user as an editable chip.
 */
import { CATEGORIES, type BusinessProfile, type Category } from "@/lib/data/types";
import {
  CERT_TO_CATEGORY,
  LICENSE_TO_CATEGORY,
  normalizeLicenseCode,
  scoreCategory,
} from "@/lib/data/synonyms";

export interface CategoryCandidate {
  category: Category;
  score: number;
  hits: string[];
}

export interface CategoryInference {
  category: Category | null;
  source: BusinessProfile["primaryCategorySource"];
  confidence: "high" | "low" | "none";
  candidates: CategoryCandidate[];
}

const TEXT_MATCH = 3;
const TEXT_MARGIN = 2;

export function scoreProfileText(
  profile: Pick<BusinessProfile, "name" | "description" | "capabilities" | "keywords">,
): CategoryCandidate[] {
  const body = [profile.description, ...(profile.capabilities ?? []), ...(profile.keywords ?? [])].join(". ");
  const candidates: CategoryCandidate[] = [];
  for (const category of CATEGORIES) {
    const { score, hits } = scoreCategory(category, body, profile.name);
    if (score > 0) candidates.push({ category, score, hits: hits.filter((h) => h.weight > 0).map((h) => h.phrase) });
  }
  return candidates.sort((a, b) => b.score - a.score);
}

export function inferCategory(
  profile: Pick<BusinessProfile, "name" | "description" | "capabilities" | "keywords" | "licenses" | "certifications">,
): CategoryInference {
  const candidates = scoreProfileText(profile);

  if (profile.licenses !== "unknown") {
    for (const lic of profile.licenses) {
      const cat = LICENSE_TO_CATEGORY[normalizeLicenseCode(lic.code)];
      if (cat) return { category: cat, source: "inferred-license", confidence: "high", candidates };
    }
  }
  if (profile.certifications !== "unknown") {
    for (const cert of profile.certifications) {
      const cat = CERT_TO_CATEGORY[cert.toUpperCase()];
      if (cat) return { category: cat, source: "inferred-cert", confidence: "high", candidates };
    }
  }

  const [top, second] = candidates;
  if (top && top.score >= TEXT_MATCH) {
    const margin = top.score - (second?.score ?? 0);
    return {
      category: top.category,
      source: "inferred-text",
      confidence: margin >= TEXT_MARGIN ? "high" : "low",
      candidates,
    };
  }
  return { category: null, source: "none", confidence: "none", candidates };
}

/**
 * Fill in `primaryCategory` / `secondaryCategories` when the user did not pick
 * one. Low-confidence inference keeps all plausible candidates as secondary
 * categories so nothing is falsely marked a poor fit.
 */
export function applyCategoryInference(profile: BusinessProfile): BusinessProfile {
  if (profile.primaryCategory && profile.primaryCategorySource === "user") return profile;
  const inf = inferCategory(profile);
  const extras = inf.candidates
    .filter((c) => c.score >= TEXT_MATCH && c.category !== inf.category)
    .slice(0, 3)
    .map((c) => c.category);
  const secondary = Array.from(new Set([...(profile.secondaryCategories ?? []), ...extras]));
  return {
    ...profile,
    primaryCategory: inf.category ?? profile.primaryCategory,
    primaryCategorySource: inf.category ? inf.source : profile.primaryCategorySource,
    secondaryCategories: secondary.filter((c) => c !== (inf.category ?? profile.primaryCategory)),
  };
}
