import { describe, expect, it } from "vitest";
import { prepareProfile } from "@/lib/engine/evaluate";
import { derivePassport, STANDING_LABELS } from "@/lib/engine/passport";
import { DEMO_PROFILE_BY_ID } from "@/lib/data/profiles";
import { CERT_BY_CODE, CERTIFICATIONS } from "@/lib/data/certifications";
import { HARMONIZATION, PROGRAMS, STATUS_TAGS } from "@/lib/data/programs";
import { AGENCY_BY_ID } from "@/lib/data/agencies";

const CLAIMS = /\b(eligible|qualif(y|ies)|will win|guaranteed)\b/i;

describe("Regional SLEB Passport derivation", () => {
  it("Bayline Builders (Fremont, 25 staff, 14 years, SLEB + DIR)", () => {
    const p = derivePassport(prepareProfile(DEMO_PROFILE_BY_ID["demo-gc"]));
    const tags = p.tags.map((t) => t.tag);
    expect(tags).toEqual(expect.arrayContaining(["county-local", "jurisdiction-local", "small", "micro"]));
    expect(tags).not.toContain("emerging");
    expect(p.tags.find((t) => t.tag === "jurisdiction-local")?.city).toBe("Fremont");
    const standing = (id: string) => p.programs.find((x) => x.program.id === id)?.standing;
    expect(standing("alameda-county-sleb")).toBe("recognized");
    expect(standing("oakland-lslbe")).toBe("not-applicable");
    expect(standing("city-fremont-local")).toBe("likely-to-apply");
    expect(standing("ousd-local-business")).toBe("not-applicable");
    expect(p.programs[0].standing).toBe("recognized");
  });

  it("Puerta Abierta (Oakland, 2 staff, 4 years, no certifications)", () => {
    const p = derivePassport(prepareProfile(DEMO_PROFILE_BY_ID["demo-designer"]));
    const tags = p.tags.map((t) => t.tag);
    expect(tags).toEqual(expect.arrayContaining(["emerging", "micro", "jurisdiction-local"]));
    const standing = (id: string) => p.programs.find((x) => x.program.id === id)?.standing;
    expect(standing("alameda-county-sleb")).toBe("likely-to-apply");
    expect(standing("oakland-lslbe")).toBe("likely-to-apply");
    expect(p.nextStep?.program.id).toBe("dgs-sb-mb");
  });

  it("outside the County: no county-local tag and County SLEB not applicable", () => {
    const p = derivePassport(prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-gc"], county: "Other", city: "San Jose" }));
    expect(p.tags.some((t) => t.tag === "county-local")).toBe(false);
    expect(p.programs.find((x) => x.program.id === "alameda-county-sleb")?.standing).toBe("not-applicable");
  });

  it("unknown headcount: no size tags and DGS standing unknown", () => {
    const p = derivePassport(prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-designer"], employeeCount: undefined, certifications: [] }));
    expect(p.tags.some((t) => t.tag === "small" || t.tag === "emerging" || t.tag === "micro")).toBe(false);
    expect(p.programs.find((x) => x.program.id === "dgs-sb-mb")?.standing).toBe("unknown");
  });

  it("tags are self-reported unless a certification code backs them", () => {
    const p = derivePassport(prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-gc"], certifications: ["SLEB", "DGS_SB"] }));
    for (const t of p.tags) {
      if (t.tag === "state-certified") expect(t.basis).toBe("certification");
      else expect(t.basis).toBe("self-reported");
    }
    expect(p.programs.find((x) => x.program.id === "ebmud-contract-equity")?.standing).toBe("recognized");
  });
});

describe("program and certification data integrity", () => {
  it("ids are unique and every code and agency exists", () => {
    const ids = PROGRAMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PROGRAMS) {
      for (const c of [...p.certificationCodes, ...(p.acceptsCertificationCodes ?? [])]) expect(CERT_BY_CODE[c], `${p.id} code ${c}`).toBeDefined();
      expect(p.officialUrl.startsWith("https://")).toBe(true);
      expect([null, "2026-10-03"]).toContain(p.urlVerifiedOn);
      if (p.agencyId) {
        expect(AGENCY_BY_ID[p.agencyId], `${p.id} agency ${p.agencyId}`).toBeDefined();
        expect(p.buyer).toBe(AGENCY_BY_ID[p.agencyId].displayName);
      }
    }
    for (const c of CERTIFICATIONS) if (c.programId) expect(PROGRAMS.some((p) => p.id === c.programId), `${c.code} program ${c.programId}`).toBe(true);
    const codes = CERTIFICATIONS.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("no program, tag or proposal text claims eligibility", () => {
    for (const p of PROGRAMS) {
      expect(p.benefit).not.toMatch(CLAIMS);
      expect(p.reciprocity).not.toMatch(CLAIMS);
    }
    for (const t of Object.values(STATUS_TAGS)) expect(t.definition + t.derivedFrom).not.toMatch(CLAIMS);
    for (const l of Object.values(STANDING_LABELS)) expect(l).not.toMatch(CLAIMS);
    expect(HARMONIZATION.alumniBadge.definition).not.toMatch(CLAIMS);
    for (const s of [...HARMONIZATION.alumniBadge.confers, ...HARMONIZATION.alumniBadge.doesNotConfer]) expect(s).not.toMatch(/\b(will win|guaranteed)\b/i);
    const p = derivePassport(prepareProfile(DEMO_PROFILE_BY_ID["demo-gc"]));
    for (const s of p.programs) expect(s.why).not.toMatch(CLAIMS);
  });
});
