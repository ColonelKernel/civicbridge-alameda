import { describe, expect, it } from "vitest";
import { SolicitationSchema, type Solicitation, type SolicitationInput, type BusinessProfileInput, type FitRecommendation } from "@/lib/data/types";
import { prepareProfile, evaluate, evaluateAll } from "@/lib/engine/evaluate";
import { buildDashboard, sortForList } from "@/lib/engine/dashboard";
import { COMPONENT_MAX, RECOMMENDATION_LABELS, SCORING_VERSION, rankScore } from "@/lib/engine/fit-score";
import { SIMILARITY_MAX } from "@/lib/engine/similarity";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { DEMO_PROFILES, DEMO_PROFILE_BY_ID } from "@/lib/data/profiles";

const TODAY = "2026-10-03";
const CLAIMS = /\b(eligible|qualifies|qualify|will win|guaranteed)\b/i;

/** Realistic wording so the record is not "sparse" (SPARSE_TOKEN_MIN) and confidence can be asserted. */
const ELEC_DESC =
  "Furnish and install LED lighting retrofits, replace fluorescent fixtures, new circuits, panel upgrades, occupancy sensors and lighting controls across County office buildings. Licensed electrical contractor with journeyman electricians, lift equipment and experience with occupied facilities. Work performed after hours with coordination through the facilities manager and certified payroll under prevailing wage rules.";

function sol(over: Partial<SolicitationInput> & { requirements?: Partial<SolicitationInput["requirements"]> }): Solicitation {
  const base: SolicitationInput = {
    id: "t",
    number: "T-1",
    title: "Electrical lighting retrofit",
    department: "General Services Agency",
    type: "RFQ",
    category: "electrical",
    summary: "LED retrofit and electrical upgrades in County buildings.",
    description: ELEC_DESC,
    estimatedValue: { min: 100_000, max: 200_000, basis: "total" },
    dates: { posted: "2026-10-01", submissionDue: { date: "2026-10-20", time: "14:00" } },
    submissionMethod: "Upload via portal.",
    requirements: { location: { type: "none" } },
    documents: [{ id: "d1", label: "Exhibit A", kind: "form" }],
    contact: { name: "X", email: "x@example.org" },
    sourceUrl: "https://example.org",
    sourceExcerpt: ELEC_DESC,
    status: "open",
    provenance: { source: "curated", extractedBy: "human" },
  };
  const merged = { ...base, ...over, requirements: { ...base.requirements, ...(over.requirements ?? {}) } };
  return SolicitationSchema.parse(merged);
}

function profile(over: Partial<BusinessProfileInput>) {
  return prepareProfile({
    name: "Test Electric",
    description: "Commercial electrical contractor: lighting retrofits, LED upgrades, panel replacement, EV charger installation and lighting controls for offices and public buildings.",
    city: "Oakland",
    county: "Alameda",
    employeeCount: 10,
    yearsInBusiness: 5,
    capabilities: ["lighting retrofit", "panel upgrades"],
    keywords: ["LED", "electrical"],
    primaryCategory: "electrical",
    secondaryCategories: [],
    primaryCategorySource: "user",
    certifications: ["DIR", "SLEB"],
    licenses: [{ code: "C-10" }],
    insurance: [
      { type: "general-liability", limit: 2_000_000 },
      { type: "auto", limit: 1_000_000 },
      { type: "workers-comp" },
    ],
    typicalContractSize: { min: 50_000, max: 300_000 },
    ...over,
  });
}

const fullSol = () =>
  sol({
    requirements: {
      licenses: [{ code: "C-10", label: "C-10 Electrical", quote: "C-10 Electrical Contractor license" }],
      certifications: [{ code: "SLEB", label: "SLEB", required: false, quote: "SLEB preference" }],
      insurance: [
        { type: "general-liability", limit: 1_000_000 },
        { type: "auto", limit: 1_000_000 },
        { type: "workers-comp", limit: "statutory" },
      ],
      prevailingWage: true,
      dirRegistration: true,
      location: { type: "none" },
    },
    scopeTags: ["public-works"],
  });

describe("F1 strong match with complete requirements", () => {
  const m = evaluate(fullSol(), profile({}), TODAY);
  it("scores high with high confidence and no unknowns", () => {
    expect(m.fitScore.status).toBe("scored");
    expect(m.fitScore.score).toBeGreaterThanOrEqual(70);
    expect(m.fitScore.confidence).toBe("high");
    expect(m.fitScore.recommendation).toBe("strong");
    expect(m.fitScore.components.readiness).toBeGreaterThanOrEqual(30);
    expect(m.fitScore.blockers).toHaveLength(0);
    expect(m.fitScore.unknowns).toHaveLength(0);
  });
});

describe("F2 similar wording but an explicitly missing required license is blocked", () => {
  const gcJob = sol({
    category: "general-construction",
    secondaryCategories: ["electrical"],
    title: "Building renovation with electrical scope",
    requirements: { licenses: [{ code: "B", label: "Class B General Building", quote: "Contractor must hold a Class B General Building license" }], location: { type: "none" } },
  });
  const m = evaluate(gcJob, profile({ licenses: [{ code: "C-10" }] }), TODAY);
  it("has no number and cites the license requirement", () => {
    expect(m.fitScore.status).toBe("blocked");
    expect(m.fitScore.score).toBeUndefined();
    expect(m.fitScore.recommendation).toBe("blocked");
    expect(m.fitScore.blockers[0]).toMatchObject({ ruleId: "license", status: "missing" });
    expect(m.fitScore.blockers[0].sourceRef.field).toBe("requirements.licenses");
    expect(m.fitScore.blockers[0].sourceRef.quote).toContain("Class B");
    expect(m.fitScore.inputs.similarity.cosine).toBeGreaterThan(0);
  });
  it("F2b: the wrong trade stays blocked no matter how much wording is shared", () => {
    const cyber = sol({
      category: "it-services",
      title: "Cybersecurity monitoring and incident response",
      summary: "Security operations center services.",
      description: "Provide 24x7 security monitoring, incident response, vulnerability scanning, firewall management and penetration testing for County networks. The vendor supplies analysts, a ticketing system and quarterly reports. Guards, patrol and physical security are not part of this scope.",
    });
    const guard = profile({
      primaryCategory: "security",
      description: "Security guard company providing security monitoring, incident response, patrol, firewall of the front desk, quarterly reports and a ticketing system for County networks and buildings.",
      licenses: [{ code: "PPO" }],
      certifications: ["BSIS_PPO"],
    });
    const r = evaluate(cyber, guard, TODAY);
    expect(r.fitScore.status).toBe("blocked");
    expect(r.fitScore.blockers[0].ruleId).toBe("tradeFit");
  });
});

describe("F3 unknown profile fields lower confidence without failing", () => {
  const declared = evaluate(fullSol(), profile({}), TODAY);
  const unknown = evaluate(fullSol(), profile({ insurance: "unknown", certifications: "unknown" }), TODAY);
  it("is scored, medium confidence, with the unknowns listed", () => {
    expect(unknown.fitScore.status).toBe("scored");
    expect(unknown.fitScore.confidence).toBe("medium");
    expect(unknown.fitScore.blockers).toHaveLength(0);
    expect(unknown.fitScore.unknowns.map((e) => e.ruleId)).toEqual(expect.arrayContaining(["insurance", "certPreferred"]));
    expect(declared.fitScore.score! - unknown.fitScore.score!).toBeGreaterThan(0);
    expect(declared.fitScore.score! - unknown.fitScore.score!).toBeLessThanOrEqual(20);
  });
  it("F3b: absent gate information is unknown, never a blocker", () => {
    const s = sol({ requirements: { licenses: [{ code: "C-10", label: "C-10" }], experience: { years: 3, description: "similar work" }, location: { type: "none" } } });
    const m = evaluate(s, profile({ licenses: "unknown", yearsInBusiness: undefined }), TODAY);
    expect(m.fitScore.status).toBe("scored");
    expect(m.fitScore.confidence).toBe("low");
    expect(m.fitScore.blockers).toHaveLength(0);
    expect(m.fitScore.unknowns.map((e) => e.ruleId)).toEqual(expect.arrayContaining(["license", "experience"]));
  });
});

describe("F4 listing-only records", () => {
  const gc = prepareProfile(DEMO_PROFILE_BY_ID["demo-gc"]);
  const listings = SOLICITATIONS.filter((s) => s.listingOnly);
  it("exist in the corpus and score with low confidence and zero readiness", () => {
    expect(listings.length).toBeGreaterThan(0);
    for (const r of evaluateAll(listings, gc, TODAY)) {
      expect(r.fitScore.confidence).toBe("low");
      expect(r.fitScore.components.readiness).toBe(0);
      if (r.fitScore.status === "scored") expect(r.fitScore.recommendation).toBe("verify");
    }
  });
});

describe("F5-F7 invariants over every demo profile and every record", () => {
  const all = DEMO_PROFILES.flatMap((dp) => evaluateAll(SOLICITATIONS, prepareProfile(dp), TODAY));
  it("F5: bounds, sums and version", () => {
    const recs: FitRecommendation[] = ["strong", "investigate", "verify", "blocked"];
    for (const r of all) {
      const f = r.fitScore;
      for (const k of Object.keys(COMPONENT_MAX) as (keyof typeof COMPONENT_MAX)[]) {
        expect(f.components[k]).toBeGreaterThanOrEqual(0);
        expect(f.components[k]).toBeLessThanOrEqual(COMPONENT_MAX[k]);
      }
      if (f.status === "scored") {
        expect(f.score).toBe(f.components.scope + f.components.readiness + f.components.commercial + f.components.localAndTiming);
        expect(f.score).toBeGreaterThanOrEqual(0);
        expect(f.score).toBeLessThanOrEqual(100);
        expect(f.recommendation).not.toBe("blocked");
      } else {
        expect(f.score).toBeUndefined();
        expect(f.recommendation).toBe("blocked");
        expect(f.blockers.length).toBeGreaterThan(0);
      }
      expect(f.scoringVersion).toBe(SCORING_VERSION);
      expect(recs).toContain(f.recommendation);
    }
  });
  it("F6: every listed item carries a source reference", () => {
    for (const r of all) {
      for (const e of [...r.fitScore.positives, ...r.fitScore.risks, ...r.fitScore.unknowns, ...r.fitScore.blockers]) {
        expect(e.sourceRef.field.length).toBeGreaterThan(0);
      }
    }
  });
  it("F7: no label or recommendation claims eligibility or award odds", () => {
    for (const l of Object.values(RECOMMENDATION_LABELS)) expect(l).not.toMatch(CLAIMS);
    for (const r of all) {
      for (const e of [...r.fitScore.positives, ...r.fitScore.risks, ...r.fitScore.unknowns, ...r.fitScore.blockers]) {
        expect(e.label).not.toMatch(CLAIMS);
        expect(e.detail).not.toMatch(CLAIMS);
      }
    }
  });
  it("F12: the inputs snapshot is complete and compact", () => {
    for (const r of all) {
      expect(r.fitScore.inputs.evidence).toHaveLength(r.evidence.length);
      const ids = r.fitScore.inputs.evidence.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(String(r.fitScore.inputs.similarity.cosine).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(4);
    }
    const elec = evaluate(SOLICITATIONS[0], prepareProfile(DEMO_PROFILE_BY_ID["demo-electrician"]), TODAY);
    expect(elec.fitScore.inputs.profile.insurance).toBe("unknown");
  });
});

describe("F8 dashboard ordering uses the new score", () => {
  const results = evaluateAll(SOLICITATIONS, prepareProfile(DEMO_PROFILE_BY_ID["demo-electrician"]), TODAY);
  const dash = buildDashboard(results);
  it("orders top matches by score and never shows blocked records in the positive sections", () => {
    // Strong matches come first, then any backfilled possible ones; within a tier the score is non-increasing.
    for (const tier of ["strong", "possible"] as const) {
      const scores = dash.topMatches.filter((r) => r.classification.fit === tier).map(rankScore);
      for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
    for (const r of [...dash.topMatches, ...dash.easyWins, ...dash.closingSoon]) expect(r.fitScore.status).toBe("scored");
    const list = sortForList(results);
    const firstClosed = list.findIndex((r) => r.classification.availability === "closed");
    if (firstClosed >= 0) for (const r of list.slice(firstClosed)) expect(r.classification.availability).toBe("closed");
  });
});

describe("F10-F11 similarity and preference boundaries", () => {
  it("F10: changing only the vendor description changes only the scope component", () => {
    const a = evaluate(fullSol(), profile({}), TODAY);
    const b = evaluate(fullSol(), profile({ description: "We sell cupcakes and party balloons for birthdays.", capabilities: [], keywords: [] }), TODAY);
    expect(a.fitScore.components.readiness).toBe(b.fitScore.components.readiness);
    expect(a.fitScore.components.commercial).toBe(b.fitScore.components.commercial);
    expect(a.fitScore.components.localAndTiming).toBe(b.fitScore.components.localAndTiming);
    expect(Math.abs(a.fitScore.components.scope - b.fitScore.components.scope)).toBeLessThanOrEqual(SIMILARITY_MAX);
  });
  it("F11: a certification only counts when the solicitation itself states the program", () => {
    const silent = evaluate(sol({}), profile({ certifications: ["SLEB", "DIR"] }), TODAY);
    const lists = [...silent.fitScore.positives, ...silent.fitScore.risks, ...silent.fitScore.unknowns];
    expect(lists.some((e) => e.requirementKey === "cert:SLEB")).toBe(false);
    expect(silent.fitScore.inputs.evidence.some((e) => e.ruleId === "certPreferred")).toBe(false);
    const stated = evaluate(fullSol(), profile({}), TODAY);
    const pref = stated.fitScore.positives.find((e) => e.ruleId === "certPreferred");
    expect(pref?.sourceRef.field).toBe("requirements.certifications");
  });
  it("F13: calibration on the demo corpus", () => {
    const elec = prepareProfile(DEMO_PROFILE_BY_ID["demo-electrician"]);
    const byId = Object.fromEntries(evaluateAll(SOLICITATIONS, elec, TODAY).map((r) => [r.solicitation.id, r]));
    expect(byId["s-elec-01"].fitScore.inputs.similarity.points).toBeGreaterThanOrEqual(4);
    expect(byId["s-trans-01"].fitScore.inputs.similarity.points).toBeLessThanOrEqual(2);
    expect(byId["s-elec-01"].fitScore.recommendation).toBe("strong");
  });
});
