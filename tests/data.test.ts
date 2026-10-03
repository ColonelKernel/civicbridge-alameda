import { describe, expect, it } from "vitest";
import { ALL_SOLICITATION_INPUTS, SOLICITATIONS } from "@/lib/data/solicitations";
import { findUnverifiedQuotes } from "@/lib/data/sources";
import { AGENCIES, AGENCY_BY_ID } from "@/lib/data/agencies";
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

  it("agency registry: unique ids, a platform for every entry, a note on every unchecked link", () => {
    const ids = AGENCIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of AGENCIES) {
      expect(a.platform.length, a.id).toBeGreaterThan(0);
      expect(a.displayName.length, a.id).toBeGreaterThan(0);
      // Entries that only point at an official domain root must say what still has to be looked up.
      if (!a.verified && a.procurementUrl && new URL(a.procurementUrl).pathname === "/") expect(a.notes, `${a.id} needs a look-up note`).toMatch(/Look up/);
    }
    expect(AGENCIES.filter((a) => a.governance === "city").length).toBe(14);
  });
});
