import { describe, expect, it } from "vitest";
import { ExtractionDraftSchema, heuristicExtract, materialize, quoteVerified } from "@/lib/engine/extract/validate";
import { SAMPLE_PASTE_TEXT } from "@/lib/engine/extract/sample";
import { findUnverifiedQuotes } from "@/lib/data/sources";
import { evaluate, prepareProfile } from "@/lib/engine/evaluate";
import { DEMO_PROFILE_BY_ID } from "@/lib/data/profiles";

const TODAY = "2026-10-03";

describe("T9 paste extraction", () => {
  it("verifies quotes after normalization and rejects weak ones", () => {
    const text = "Bidder must possess a C-10 Elec-\ntrical Contractor license. The County’s “Exhibit A” is required.";
    expect(quoteVerified("C-10 Electrical Contractor license", text)).toBe(true);
    expect(quoteVerified("The County's \"Exhibit A\" is required", text)).toBe(true);
    expect(quoteVerified("Bidder must", text)).toBe(false);
    expect(quoteVerified("Bidder must possess ... license", text)).toBe(false);
    expect(quoteVerified("a performance bond of 100%", text)).toBe(false);
  });

  it("heuristic parser reads the sample solicitation", () => {
    const d = heuristicExtract(SAMPLE_PASTE_TEXT);
    expect(ExtractionDraftSchema.safeParse(d).success).toBe(true);
    expect(d.title).toBe("Fire Alarm Testing, Inspection and Repair Services");
    expect(d.number).toBe("RFQ No. 902888");
    expect(d.department).toBe("General Services Agency");
    expect(d.dates.submissionDue).toMatchObject({ date: "2026-11-05", time: "14:00" });
    expect(d.dates.preBidMeeting).toMatchObject({ date: "2026-10-15", time: "10:00", mandatory: true });
    expect(d.dates.questionsDue).toMatchObject({ date: "2026-10-19", time: "17:00" });
    expect(d.dates.anticipatedAward?.date).toBe("2026-12-15");
    expect(d.licenses.map((l) => l.code)).toEqual(["C-10"]);
    expect(d.certifications.find((c) => c.code === "SLEB")?.required).toBe(false);
    expect(d.dirRegistration).not.toBeNull();
    expect(d.prevailingWage).not.toBeNull();
    expect(d.insurance.find((i) => i.type === "general-liability")?.limit).toBe(2_000_000);
    expect(d.insurance.find((i) => i.type === "auto")?.limit).toBe(1_000_000);
    expect(d.insurance.find((i) => i.type === "workers-comp")?.limit).toBeNull();
    expect(d.estimatedValue).toMatchObject({ min: 180_000, max: 220_000, basis: "annual", termYears: 3 });
    expect(d.term).toBe("3-year term");
    expect(d.documents.length).toBeGreaterThanOrEqual(7);
    expect(d.documents.find((x) => /references/i.test(x.label))?.kind).toBe("references");
    expect(d.experience?.years).toBe(5);
    expect(d.statedStaffingMin?.count).toBe(2);
    expect(d.submissionMethod?.text).toMatch(/Procurement Portal/);
    expect(d.contact).toMatchObject({ name: "Dana Whitfield", email: "dana.whitfield@acgov.example", phone: "(510) 555-0142" });
  });

  it("materialize keeps verified facts, drops unverifiable ones, never invents", () => {
    const d = heuristicExtract(SAMPLE_PASTE_TEXT);
    d.bonding.push({ type: "performance", percent: 100, quote: "performance bond of one hundred percent" });
    d.licenses.push({ code: "C-16", label: "C-16", quote: "C-16 Fire Protection Contractor" });
    const { solicitation, dropped } = materialize(d, SAMPLE_PASTE_TEXT, { extractedBy: "heuristic", today: TODAY });
    expect(solicitation.requirements.bonding).toHaveLength(0);
    expect(solicitation.requirements.licenses.map((l) => l.code)).toEqual(["C-10"]);
    expect(dropped).toHaveLength(2);
    expect(findUnverifiedQuotes(solicitation)).toEqual([]);
    expect(solicitation.category).toBe("electrical");
    expect(solicitation.status).toBe("open");
    expect(solicitation.scopeTags).toContain("public-works");
    expect(solicitation.dates.preBidMeeting?.mandatory).toBe(true);
    expect(solicitation.provenance).toMatchObject({ source: "pasted", extractedBy: "heuristic" });
    expect(solicitation.id).toMatch(/^pasted-/);

    // Flows through the engine like any built-in record.
    const r = evaluate(solicitation, prepareProfile(DEMO_PROFILE_BY_ID["demo-electrician"]), TODAY);
    expect(r.classification.fit).not.toBe("poor");
    expect(r.evidence.some((e) => e.ruleId === "license" && e.status === "met")).toBe(true);
    expect(r.evidence.some((e) => e.ruleId === "mandatoryMeeting" && e.status === "check")).toBe(true);
  });

  it("a meeting is mandatory only when the quoted text says so", () => {
    const text = "Pre-bid conference: October 20, 2026 at 10:00 a.m. Attendance is encouraged.\nResponses are due November 10, 2026 at 2:00 p.m.";
    const d = heuristicExtract(text);
    expect(d.dates.preBidMeeting?.mandatory).toBe(false);
    expect(d.dates.submissionDue?.date).toBe("2026-11-10");
    const forced = { ...d, dates: { ...d.dates, preBidMeeting: { ...d.dates.preBidMeeting!, mandatory: true } } };
    const { solicitation, notes } = materialize(forced, text, { extractedBy: "claude", today: TODAY });
    expect(solicitation.dates.preBidMeeting?.mandatory).toBe(false);
    expect(notes.some((n) => /mandatory/.test(n))).toBe(true);
  });

  it("records a missing due date instead of inventing one", () => {
    const text = "The County seeks a vendor for janitorial services at the Hayward library. Bidders must hold a business license. Submit through the Procurement Portal.";
    const { solicitation, dropped } = materialize(heuristicExtract(text), text, { extractedBy: "heuristic", today: TODAY });
    expect(solicitation.dates.submissionDue.note).toBeTruthy();
    expect(dropped.some((x) => x.field === "dates.submissionDue")).toBe(true);
    expect(solicitation.category).toBe("janitorial");
  });
});
