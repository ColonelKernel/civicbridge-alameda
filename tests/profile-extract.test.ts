import { describe, expect, it } from "vitest";
import { heuristicProfileExtract, htmlToText, verifyDraft } from "@/lib/engine/profile/extract";

const STATEMENT = `Hernández Electric, Inc.
Capability Statement

About us
Hernández Electric is a commercial electrical contractor serving offices, clinics and public buildings across the East Bay since 2012. We specialize in LED lighting retrofits, panel upgrades and EV charger installation for occupied facilities.

Services:
• Lighting retrofits and controls
• Panel and service upgrades
• EV charger installation (EVITP certified crews)
• Emergency repairs

CSLB License #1023456, Class C-10. DIR Public Works Registration No. 1000045678.
NAICS 238210. 12 employees. Oakland, CA 94601.
Insurance: general liability $2M, commercial auto, workers' compensation.
Certified SLEB with Alameda County.`;

describe("profile autofill heuristics", () => {
  const d = heuristicProfileExtract(STATEMENT);
  it("reads name, trade, city, size and years", () => {
    expect(d.name).toBe("Hernández Electric, Inc.");
    expect(d.primaryCategory).toBe("electrical");
    expect(d.city).toBe("Oakland");
    expect(d.county).toBe("Alameda");
    expect(d.employeeCount).toBe(12);
    expect(d.yearsInBusiness).toBe(14);
  });
  it("reads licenses, certifications, insurance and capabilities", () => {
    expect(d.licenses).toContain("C-10");
    expect(d.certifications).toEqual(expect.arrayContaining(["DIR", "EVITP", "SLEB"]));
    expect(d.insurance).toEqual(expect.arrayContaining(["general-liability", "auto", "workers-comp"]));
    expect(d.capabilities).toContain("Lighting retrofits and controls");
    expect(d.keywords).toContain("NAICS 238210");
  });
  it("carries a verifiable quote for every fact and drops unverifiable ones", () => {
    const { dropped } = verifyDraft(d, STATEMENT);
    expect(dropped).toEqual([]);
    const tampered = { ...d, evidence: d.evidence.map((e) => (e.field === "employeeCount" ? { ...e, quote: "forty employees" } : e)) };
    const v = verifyDraft(tampered, STATEMENT);
    expect(v.draft.employeeCount).toBeNull();
    expect(v.dropped).toContain("employeeCount");
  });
  it("turns HTML into readable lines", () => {
    const t = htmlToText("<html><head><style>x{}</style><script>1</script></head><body><h1>Acme</h1><ul><li>One</li><li>Two</li></ul><p>Para &amp; more</p></body></html>");
    expect(t).toContain("Acme");
    expect(t).toContain("• One");
    expect(t).toContain("Para & more");
    expect(t).not.toContain("script");
  });
});
