import { describe, expect, it } from "vitest";
import { SolicitationSchema, type Solicitation, type SolicitationInput, type BusinessProfileInput } from "@/lib/data/types";
import { prepareProfile, evaluate } from "@/lib/engine/evaluate";
import { inferCategory } from "@/lib/engine/infer-category";
import { buildChecklist, groupHeading } from "@/lib/engine/checklist";
import { subtractBusinessDays, daysBetween } from "@/lib/engine/dates";
import { buildSummary } from "@/lib/engine/explain";
import { applyFilters, buildDashboard, DEFAULT_FILTERS } from "@/lib/engine/dashboard";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { DEMO_PROFILE_BY_ID } from "@/lib/data/profiles";

const TODAY = "2026-10-03";

function sol(over: Partial<SolicitationInput> & { requirements?: Partial<SolicitationInput["requirements"]> }): Solicitation {
  const base: SolicitationInput = {
    id: "t",
    number: "T-1",
    title: "Test solicitation",
    department: "Test Dept",
    type: "RFQ",
    category: "electrical",
    summary: "Test summary.",
    description: "Test description.",
    estimatedValue: { min: 100_000, max: 200_000, basis: "total" },
    dates: { posted: "2026-10-01", submissionDue: { date: "2026-10-20", time: "14:00" } },
    submissionMethod: "Upload via portal.",
    requirements: { location: { type: "none" } },
    documents: [{ id: "d1", label: "Exhibit A", kind: "form" }],
    contact: { name: "X", email: "x@example.org" },
    sourceUrl: "https://example.org",
    sourceExcerpt: "Test excerpt.",
    status: "open",
    provenance: { source: "curated", extractedBy: "human" },
  };
  const merged = { ...base, ...over, requirements: { ...base.requirements, ...(over.requirements ?? {}) } };
  return SolicitationSchema.parse(merged);
}

function profile(over: Partial<BusinessProfileInput>) {
  return prepareProfile({
    name: "Test Co",
    description: "We do things.",
    city: "Oakland",
    county: "Alameda",
    employeeCount: 10,
    yearsInBusiness: 5,
    capabilities: [],
    keywords: [],
    secondaryCategories: [],
    primaryCategorySource: "user",
    certifications: [],
    licenses: [],
    insurance: "unknown",
    typicalContractSize: { min: 50_000, max: 300_000 },
    ...over,
  });
}

describe("T1 electrician vs lighting retrofit", () => {
  const p = profile({ primaryCategory: "electrical", licenses: [{ code: "C10" }], certifications: ["SLEB"], insurance: "unknown" });
  const s = sol({
    requirements: {
      licenses: [{ code: "C-10", label: "C-10 Electrical" }],
      certifications: [{ code: "SLEB", label: "SLEB", required: false }],
      insurance: [{ type: "general-liability", limit: 1_000_000 }],
      prevailingWage: true,
      dirRegistration: true,
      location: { type: "none" },
    },
    scopeTags: ["public-works"],
  });
  const m = evaluate(s, p, TODAY);
  it("is a strong fit with verify items and nothing missing", () => {
    expect(m.classification.fit).toBe("strong");
    expect(m.evidence.find((e) => e.ruleId === "license")).toMatchObject({ status: "met", confidence: "confirmed", requirementKey: "license:C-10" });
    expect(m.evidence.find((e) => e.ruleId === "insurance")).toMatchObject({ status: "unknown" });
    expect(m.evidence.find((e) => e.ruleId === "dirRegistration")).toMatchObject({ status: "check", ruleClass: "soft" });
    expect(m.evidence.some((e) => e.status === "missing")).toBe(false);
    expect(m.classification.verify.length).toBe(3); // insurance unknown, DIR check, prevailing wage check
  });
});

describe("T2 multi-trade facility maintenance", () => {
  const p = profile({ primaryCategory: "electrical", licenses: [{ code: "C-10" }] });
  const s = sol({ category: "facility-maintenance", secondaryCategories: ["electrical", "plumbing", "hvac"], scopeTags: ["multi-trade", "as-needed"] });
  const m = evaluate(s, p, TODAY);
  it("is possible (not poor) with a scope coverage check", () => {
    expect(m.evidence.find((e) => e.ruleId === "tradeFit")).toMatchObject({ status: "met", confidence: "confirmed" });
    expect(m.evidence.find((e) => e.ruleId === "scopeCoverage")).toMatchObject({ status: "check" });
    expect(m.classification.fit).toBe("possible");
  });
});

describe("T3 unknown vs declared gate (caterer)", () => {
  const s = sol({
    category: "food-services",
    requirements: {
      certifications: [{ code: "SERVSAFE", label: "ServSafe Manager", required: true }],
      licenses: [{ code: "HEALTH_FACILITY_PERMIT", label: "Alameda County health permit" }],
      location: { type: "local-preference" },
    },
  });
  const base = { primaryCategory: "food-services" as const, certifications: ["SERVSAFE"] };
  it("licenses unknown -> possible with a nudge", () => {
    const m = evaluate(s, profile({ ...base, licenses: "unknown" }), TODAY);
    expect(m.classification.fit).toBe("possible");
    expect(m.classification.verify.map((e) => e.ruleId)).toContain("license");
  });
  it("license declared -> strong", () => {
    const m = evaluate(s, profile({ ...base, licenses: [{ code: "HEALTH_FACILITY_PERMIT" }] }), TODAY);
    expect(m.classification.fit).toBe("strong");
  });
  it("affirmatively no licenses -> poor with a license blocker", () => {
    const m = evaluate(s, profile({ ...base, licenses: [] }), TODAY);
    expect(m.classification.fit).toBe("poor");
    expect(m.classification.blockers[0]).toMatchObject({ ruleId: "license", status: "missing", ruleClass: "gate" });
  });
});

describe("T4 trade mismatch and negative synonyms", () => {
  it("guard company vs cybersecurity is poor", () => {
    const guard = profile({ primaryCategory: "security" });
    const s = sol({ category: "it-services", title: "Cybersecurity assessment and network security monitoring", description: "Information security services for County systems.", summary: "Security assessment." });
    const m = evaluate(s, guard, TODAY);
    expect(m.evidence.find((e) => e.ruleId === "tradeFit")).toMatchObject({ status: "missing" });
    expect(m.classification.fit).toBe("poor");
  });
  it("electrician matches a GC job that lists electrical sub-scope", () => {
    const e = profile({ primaryCategory: "electrical", licenses: [{ code: "C-10" }] });
    const s = sol({ category: "general-construction", secondaryCategories: ["electrical", "plumbing"], requirements: { licenses: [{ code: "B", label: "Class B" }] } });
    const m = evaluate(s, e, TODAY);
    expect(m.evidence.find((e) => e.ruleId === "tradeFit")?.status).toBe("met");
    expect(m.classification.fit).toBe("poor"); // requires a B license the electrician lacks
    expect(m.classification.blockers[0].ruleId).toBe("license");
  });
});

describe("T5 category inference", () => {
  it("clear landscaping text is high confidence", () => {
    const inf = inferCategory({ name: "Green Co", description: "We mow, trim trees and install drip irrigation for apartment complexes in Hayward.", capabilities: [], keywords: [], licenses: "unknown", certifications: [] });
    expect(inf).toMatchObject({ category: "landscaping", confidence: "high", source: "inferred-text" });
    expect(inf.candidates[0].score).toBeGreaterThanOrEqual(6);
  });
  it("ambiguous web + print text is low confidence with two candidates", () => {
    const inf = inferCategory({ name: "Studio", description: "We design websites and print brochures for nonprofits.", capabilities: [], keywords: [], licenses: "unknown", certifications: [] });
    expect(inf.confidence).toBe("low");
    expect(inf.candidates.slice(0, 2).map((c) => c.category).sort()).toEqual(["design-print", "it-services"]);
  });
  it("a c 36 license infers plumbing", () => {
    const inf = inferCategory({ name: "X", description: "General services", capabilities: [], keywords: [], licenses: [{ code: "c 36" }], certifications: [] });
    expect(inf).toMatchObject({ category: "plumbing", source: "inferred-license", confidence: "high" });
  });
});

describe("T6 mandatory meetings", () => {
  const p = profile({ primaryCategory: "janitorial" });
  it("already held -> poor with blocker", () => {
    const s = sol({ category: "janitorial", dates: { posted: "2026-09-20", preBidMeeting: { when: { date: "2026-10-01" }, mandatory: true, location: "Oakland" }, submissionDue: { date: "2026-10-20" } } });
    const m = evaluate(s, p, TODAY);
    expect(m.classification.fit).toBe("poor");
    expect(m.classification.blockers[0]).toMatchObject({ ruleId: "mandatoryMeeting", status: "missing", confidence: "confirmed" });
    expect(m.classification.blockers[0].label).toMatch(/already/);
  });
  it("upcoming -> check, still strong", () => {
    const s = sol({ category: "janitorial", dates: { posted: "2026-09-20", preBidMeeting: { when: { date: "2026-10-09" }, mandatory: true, location: "Oakland" }, submissionDue: { date: "2026-10-20" } } });
    const m = evaluate(s, p, TODAY);
    expect(m.evidence.find((e) => e.ruleId === "mandatoryMeeting")).toMatchObject({ status: "check", ruleClass: "gate" });
    expect(m.classification.fit).toBe("strong");
  });
  it("clearance form deadline passed -> blocker", () => {
    const s = sol({ category: "janitorial", dates: { posted: "2026-09-20", preBidMeeting: { when: { date: "2026-10-16" }, mandatory: true, location: "Jail", prerequisite: { label: "Exhibit E clearance", due: { date: "2026-10-01" } } }, submissionDue: { date: "2026-11-12" } } });
    const m = evaluate(s, p, TODAY);
    expect(m.classification.fit).toBe("poor");
    expect(m.classification.blockers[0].label).toMatch(/Clearance deadline/);
  });
});

describe("T7 contract size wording", () => {
  const p = profile({ primaryCategory: "painting", typicalContractSize: { min: 20_000, max: 100_000 } });
  it("above band is a check and possible, worded honestly", () => {
    const big = sol({ category: "painting", estimatedValue: { min: 400_000, max: 600_000, basis: "total", termYears: 3 } });
    const m = evaluate(big, p, TODAY);
    expect(m.evidence.find((e) => e.ruleId === "contractSize")).toMatchObject({ status: "check", ruleClass: "soft" });
    expect(m.evidence.find((e) => e.ruleId === "contractSize")!.detail).toMatch(/not an eligibility rule/i);
    expect(m.classification.fit).toBe("possible");
  });
  it("below band is met with a note", () => {
    const small = sol({ category: "painting", estimatedValue: { min: 4_000, max: 4_500, basis: "total" } });
    const e = evaluate(small, p, TODAY).evidence.find((e) => e.ruleId === "contractSize")!;
    expect(e.status).toBe("met");
    expect(e.label).toMatch(/smaller than your usual/i);
  });
  it("as-needed pool is not penalized", () => {
    const pool = sol({ category: "painting", estimatedValue: { min: 2_000_000, max: 2_000_000, basis: "nte-pool" }, scopeTags: ["as-needed"] });
    expect(evaluate(pool, p, TODAY).evidence.find((e) => e.ruleId === "contractSize")).toMatchObject({ status: "met" });
  });
  it("no estimate -> unknown, never guessed", () => {
    const none = sol({ category: "painting", estimatedValue: null });
    expect(evaluate(none, p, TODAY).evidence.find((e) => e.ruleId === "contractSize")).toMatchObject({ status: "unknown" });
  });
});

describe("T8 checklist dates", () => {
  it("business-day math", () => {
    expect(subtractBusinessDays("2026-10-12", 2, [])).toBe("2026-10-08");
    expect(subtractBusinessDays("2026-10-20", 3, [])).toBe("2026-10-15");
    expect(subtractBusinessDays("2026-10-17", 3, [])).toBe("2026-10-14");
    expect(daysBetween("2026-10-03", "2026-11-17")).toBe(45);
  });
  it("groups are ordered by date with the questions-before-meeting note", () => {
    const s = sol({
      dates: { posted: "2026-10-01", questionsDue: { date: "2026-10-09" }, preBidMeeting: { when: { date: "2026-10-12" }, mandatory: false, location: "Teams" }, submissionDue: { date: "2026-10-20", time: "14:00" } },
      documents: [{ id: "d1", label: "Exhibit A Bid Response Packet", kind: "form" }],
    });
    const c = buildChecklist(s, TODAY);
    expect(c.groups.map((g) => g.date)).toEqual(["2026-10-08", "2026-10-09", "2026-10-12", "2026-10-15", "2026-10-20"]);
    expect(c.groups[1].notes.join(" ")).toMatch(/questions are due before the bidders conference/);
    expect(c.groups[0].items.find((i) => i.origin === "standard")!.label).toMatch(/Procurement Portal/i);
    expect(groupHeading(c.groups[0])).toBe("Before Thu, Oct 8");
  });
  it("clamps past prep dates into Do now", () => {
    const soon = sol({ dates: { posted: "2026-09-20", submissionDue: { date: "2026-10-05" } } });
    const c = buildChecklist(soon, TODAY);
    expect(c.groups[0]).toMatchObject({ kind: "do-now", date: TODAY });
  });
  it("marks closed solicitations", () => {
    const closed = sol({ status: "open", dates: { posted: "2026-09-01", submissionDue: { date: "2026-10-01" } } });
    const c = buildChecklist(closed, TODAY);
    expect(c.closed).toBe(true);
    expect(evaluate(closed, profile({ primaryCategory: "electrical" }), TODAY).classification.availability).toBe("closed");
  });
});

describe("T9 summary and dashboard on the real dataset", () => {
  it("summary sections carry source refs and warn about mandatory meetings", () => {
    const tel = SOLICITATIONS.find((s) => s.id === "rfp-902759")!;
    const sections = buildSummary(tel, TODAY);
    expect(sections.map((s) => s.key)).toEqual(["need", "money", "who", "submit", "dates", "watch"]);
    expect(sections.find((s) => s.key === "watch")!.lines.some((l) => /clearance form/i.test(l.text))).toBe(true);
    expect(sections.find((s) => s.key === "money")!.lines[0].text).toMatch(/does not state/);
  });
  it("electrician demo profile gets strong electrical matches and a blocked past-meeting job", () => {
    const p = prepareProfile(DEMO_PROFILE_BY_ID["demo-electrician"]);
    const results = SOLICITATIONS.map((s) => evaluate(s, p, TODAY));
    const dash = buildDashboard(results);
    expect(dash.counts.strong).toBeGreaterThanOrEqual(1);
    const retrofit = results.find((r) => r.solicitation.id === "s-elec-01")!;
    expect(retrofit.classification.fit).toBe("strong");
    const pastWalk = results.find((r) => r.solicitation.id === "s-elec-03")!;
    expect(pastWalk.classification.fit).toBe("poor");
    expect(pastWalk.classification.blockers[0].ruleId).toBe("mandatoryMeeting");
    const translator = results.find((r) => r.solicitation.id === "s-trans-01")!;
    expect(translator.classification.fit).toBe("poor");
    expect(dash.commonGaps.some((g) => g.requirementKey === "cert:SLEB")).toBe(true);
    expect(dash.closingSoon.every((r) => r.classification.daysUntilDue <= 14)).toBe(true);
  });
  it("listing-only records never rate above possible", () => {
    const p = prepareProfile(DEMO_PROFILE_BY_ID["demo-gc"]);
    const results = SOLICITATIONS.filter((s) => s.listingOnly).map((s) => evaluate(s, p, TODAY));
    expect(results.every((r) => r.classification.fit !== "strong")).toBe(true);
  });
  it("no evidence label claims eligibility", () => {
    for (const id of Object.keys(DEMO_PROFILE_BY_ID)) {
      const p = prepareProfile(DEMO_PROFILE_BY_ID[id]);
      for (const s of SOLICITATIONS) {
        for (const e of evaluate(s, p, TODAY).evidence) {
          expect(e.label).not.toMatch(/you are eligible|you qualify|you will win/i);
        }
      }
    }
  });
});

describe("T10 quick-filter chips equal the dashboard sections", () => {
  const p = prepareProfile(DEMO_PROFILE_BY_ID["demo-electrician"]);
  const results = SOLICITATIONS.map((s) => evaluate(s, p, TODAY));
  const dash = buildDashboard(results);
  const ids = (list: { solicitation: { id: string } }[]) => list.map((r) => r.solicitation.id).sort();
  it("closing, larger and blocked chips select exactly their sections", () => {
    expect(ids(applyFilters(results, { ...DEFAULT_FILTERS, quick: "closing" }))).toEqual(ids(dash.closingSoon));
    expect(ids(applyFilters(results, { ...DEFAULT_FILTERS, quick: "larger" }))).toEqual(ids(dash.larger));
    expect(ids(applyFilters(results, { ...DEFAULT_FILTERS, quick: "blocked" }))).toEqual(ids(dash.blocked));
    const easy = ids(applyFilters(results, { ...DEFAULT_FILTERS, quick: "easy" }));
    for (const id of ids(dash.easyWins)) expect(easy).toContain(id);
  });
});

