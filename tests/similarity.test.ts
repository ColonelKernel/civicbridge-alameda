import { describe, expect, it } from "vitest";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { DEMO_PROFILE_BY_ID } from "@/lib/data/profiles";
import { prepareProfile } from "@/lib/engine/evaluate";
import { cosine, getCorpusIndex, scoreSimilarity, similarityPoints, tokenize, vectorizeVendor, SIMILARITY_MAX } from "@/lib/engine/similarity";

describe("F9 lexical similarity is deterministic, bounded and cached", () => {
  const index = getCorpusIndex(SOLICITATIONS);
  const elec = prepareProfile(DEMO_PROFILE_BY_ID["demo-electrician"]);
  it("returns the same index and the same numbers on every call", () => {
    expect(getCorpusIndex(SOLICITATIONS)).toBe(index);
    const a = scoreSimilarity(index, SOLICITATIONS[0], elec);
    const b = scoreSimilarity(index, SOLICITATIONS[0], elec);
    expect(a).toEqual(b);
    expect(vectorizeVendor(index, elec)).toBe(vectorizeVendor(index, elec));
  });
  it("stays within [0, 1] and maps to at most SIMILARITY_MAX points", () => {
    for (const s of SOLICITATIONS) {
      const r = scoreSimilarity(index, s, elec);
      expect(r.cosine).toBeGreaterThanOrEqual(0);
      expect(r.cosine).toBeLessThanOrEqual(1);
      expect(similarityPoints(r.cosine)).toBeLessThanOrEqual(SIMILARITY_MAX);
      expect(similarityPoints(r.cosine)).toBeGreaterThanOrEqual(0);
    }
  });
  it("identical vectors give 1 and disjoint vectors give 0", () => {
    const v = index.vectorFor(SOLICITATIONS[0]);
    expect(cosine(v, v).value).toBeCloseTo(1, 6);
    expect(cosine(v, { terms: ["zzzz"], weights: [1], tokenCount: 1 }).value).toBe(0);
  });
  it("tokenizes with stopwords and boilerplate removed", () => {
    const { tokens } = tokenize("The County of Alameda requires an electrical contractor to install lighting fixtures.");
    expect(tokens).not.toContain("county");
    expect(tokens).not.toContain("the");
    expect(tokens).toContain("electrical");
    expect(tokens).toContain("light");
  });
});
