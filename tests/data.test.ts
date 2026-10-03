import { describe, expect, it } from "vitest";
import { ALL_SOLICITATION_INPUTS, SOLICITATIONS } from "@/lib/data/solicitations";
import { findUnverifiedQuotes } from "@/lib/data/sources";
import { AGENCY_BY_ID } from "@/lib/data/agencies";
import { BusinessProfileSchema } from "@/lib/data/types";
import { DEMO_PROFILES } from "@/lib/data/profiles";

describe("sample dataset", () => {
  it("validates every record against the schema", () => {
    expect(SOLICITATIONS.length).toBe(ALL_SOLICITATION_INPUTS.length);
    expect(SOLICITATIONS.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique ids", () => {
    const ids = SOLICITATIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references a known agency", () => {
    for (const s of SOLICITATIONS) {
      expect(AGENCY_BY_ID[s.agencyId], `${s.id} agency ${s.agencyId}`).toBeDefined();
    }
  });

  it("every quote appears in the record's source excerpt", () => {
    const problems = SOLICITATIONS.flatMap((s) => findUnverifiedQuotes(s).map((p) => `${s.id} ${p}`));
    expect(problems).toEqual([]);
  });

  it("every demo profile validates", () => {
    for (const p of DEMO_PROFILES) {
      expect(() => BusinessProfileSchema.parse(p)).not.toThrow();
    }
  });
});
