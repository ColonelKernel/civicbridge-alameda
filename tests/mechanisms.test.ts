import { describe, expect, it } from "vitest";
import { SolicitationSchema, type CertRequirement, type Solicitation, type SolicitationInput, type BusinessProfileInput } from "@/lib/data/types";
import { prepareProfile, evaluate } from "@/lib/engine/evaluate";
import { buildChecklist } from "@/lib/engine/checklist";
import { buildSummary } from "@/lib/engine/explain";
import { isProgramMatch } from "@/lib/engine/dashboard";
import { mechanismBadges, participationShares, MECHANISM_META } from "@/lib/data/mechanisms";
import { CERT_BY_CODE, certLabel, PROGRAM_CERT_CODES } from "@/lib/data/certifications";
import { PROGRAMS } from "@/lib/data/programs";
import { SOLICITATION_BY_ID, SOLICITATIONS } from "@/lib/data/solicitations";
import { DEMO_PROFILE_BY_ID, DEMO_PROFILES } from "@/lib/data/profiles";
import { REGIONAL_SOLICITATIONS } from "@/lib/data/solicitations.regional";

const TODAY = "2026-10-03";
const NEUTRAL = /\b(eligible|qualifies|qualify|will win|guaranteed)\b/i;

function sol(over: Partial<SolicitationInput> & { requirements?: Partial<SolicitationInput["requirements"]> }): Solicitation {
  const base: SolicitationInput = {
    id: "t",
    number: "T-1",
    title: "Test landscaping solicitation",
    department: "Test Dept",
    type: "RFQ",
    category: "landscaping",
    summary: "Grounds maintenance test.",
    description: "Mowing, pruning and irrigation repair across several sites.",
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
    name: "Test Landscaping Co",
    description: "Commercial grounds maintenance, irrigation and tree care.",
    city: "Hayward",
    county: "Alameda",
    employeeCount: 12,
    yearsInBusiness: 6,
    primaryCategory: "landscaping",
    primaryCategorySource: "user",
    capabilities: ["mowing", "irrigation"],
    keywords: [],
    secondaryCategories: [],
    certifications: [],
    licenses: [{ code: "C-27" }],
    insurance: "unknown",
    typicalContractSize: { min: 50_000, max: 300_000 },
    ...over,
  });
}

const SET_ASIDE_QUOTE = "This request is open only to firms certified as a small business by the Department of General Services";
const setAside = (extra: Partial<CertRequirement> = {}) =>
  sol({
    sourceExcerpt: SET_ASIDE_QUOTE,
    requirements: { certifications: [{ code: "DGS_SB", label: "DGS certified small business", required: true, mechanism: "set-aside", scope: "total", alternatives: ["DGS_MB"], quote: SET_ASIDE_QUOTE, ...extra }] },
  });

describe("set-asides", () => {
  it("a total set-aside you do not hold blocks the bid with the agency's own sentence", () => {
    const m = evaluate(setAside(), profile({ certifications: ["DIR"] }), TODAY);
    const e = m.evidence.find((x) => x.ruleId === "certRequired" && x.requirementKey === "cert:DGS_SB");
    expect(e?.ruleClass).toBe("gate");
    expect(e?.status).toBe("missing");
    expect(e?.label).toMatch(/^Set aside for/);
    expect(e?.detail).toMatch(/cannot bid as the prime/);
    expect(m.fitScore.status).toBe("blocked");
    expect(m.fitScore.blockers[0]?.sourceRef.quote).toBe(SET_ASIDE_QUOTE);
  });

  it("an alternative status satisfies the set-aside and says so", () => {
    const m = evaluate(setAside(), profile({ certifications: ["DGS_MB"] }), TODAY);
    const e = m.evidence.find((x) => x.requirementKey === "cert:DGS_SB");
    expect(e?.status).toBe("met");
    expect(e?.label).toContain(`via ${certLabel("DGS_MB")}`);
    expect(m.fitScore.status).toBe("scored");
  });

  it("unknown certifications never block a set-aside", () => {
    const m = evaluate(setAside(), profile({ certifications: "unknown" }), TODAY);
    const e = m.evidence.find((x) => x.requirementKey === "cert:DGS_SB");
    expect(e?.status).toBe("unknown");
    expect(m.fitScore.status).toBe("scored");
  });

  it("a partial set-aside is a soft check, not a gate", () => {
    const m = evaluate(setAside({ scope: "partial" }), profile({ certifications: [] }), TODAY);
    const e = m.evidence.find((x) => x.requirementKey === "cert:DGS_SB");
    expect(e?.ruleId).toBe("certPreferred");
    expect(e?.ruleClass).toBe("soft");
    expect(e?.status).toBe("check");
    expect(m.fitScore.status).toBe("scored");
  });
});

describe("preferences, goals, directed spending and registrations", () => {
  const PREF = "A 5 percent bid preference will be granted to certified small businesses";
  const GOAL = "A DVBE participation goal of 3 percent applies; bidders who do not meet it must document good faith efforts";
  const combined = sol({
    sourceExcerpt: `${PREF}. ${GOAL}.`,
    requirements: {
      certifications: [
        { code: "DGS_SB", label: "DGS small business", required: false, mechanism: "preference", percent: 5, alternatives: ["DGS_MB"], quote: PREF },
        { code: "DVBE", label: "DVBE participation goal", required: false, mechanism: "participation-goal", goalPercent: 3, exceptionAllowed: true, quote: GOAL },
      ],
    },
  });

  it("a missing preference costs points, not the right to bid", () => {
    const m = evaluate(combined, profile({ certifications: ["DIR"] }), TODAY);
    const e = m.evidence.find((x) => x.requirementKey === "cert:DGS_SB");
    expect(e?.ruleId).toBe("certPreferred");
    expect(e?.status).toBe("check");
    expect(e?.label).toBe(`Not ${certLabel("DGS_SB")} certified: you lose the 5% bid preference, not the right to bid`);
    expect(m.fitScore.status).toBe("scored");
  });

  it("a held preference is a positive with the percentage", () => {
    const m = evaluate(combined, profile({ certifications: ["DGS_SB"] }), TODAY);
    const e = m.evidence.find((x) => x.requirementKey === "cert:DGS_SB");
    expect(e?.status).toBe("met");
    expect(e?.label).toContain("5% bid preference");
    expect(m.fitScore.positives.some((p) => p.requirementKey === "cert:DGS_SB")).toBe(true);
  });

  it("a participation goal is unknown, then a plan, then met, depending on what you hold", () => {
    const unknown = evaluate(combined, profile({ certifications: "unknown" }), TODAY).evidence.find((x) => x.requirementKey === "goal:DVBE");
    expect(unknown?.ruleId).toBe("participationGoal");
    expect(unknown?.status).toBe("unknown");
    const plan = evaluate(combined, profile({ certifications: ["DGS_SB"] }), TODAY).evidence.find((x) => x.requirementKey === "goal:DVBE");
    expect(plan?.status).toBe("check");
    expect(plan?.label).toBe(`3% ${certLabel("DVBE")} participation goal: plan certified subcontractors or a written exception`);
    const met = evaluate(combined, profile({ certifications: ["DVBE"] }), TODAY).evidence.find((x) => x.requirementKey === "goal:DVBE");
    expect(met?.status).toBe("met");
    expect(met?.label).toContain("your own certified work counts");
  });

  it("a goal with no stated exception says so instead of inventing a waiver", () => {
    const s = sol({ sourceExcerpt: GOAL, requirements: { certifications: [{ code: "DVBE", label: "DVBE goal", required: false, mechanism: "participation-goal", goalPercent: 3, quote: GOAL }] } });
    const e = evaluate(s, profile({ certifications: [] }), TODAY).evidence.find((x) => x.requirementKey === "goal:DVBE");
    expect(e?.detail).toMatch(/does not describe an exception/);
    expect(e?.detail).not.toMatch(/good-faith/);
  });

  it("the County's SLEB clause yields a preference and a 20% subcontracting goal", () => {
    const s = SOLICITATION_BY_ID["s-elec-01"];
    const m = evaluate(s, prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-electrician"] }), TODAY);
    const pref = m.evidence.find((x) => x.requirementKey === "cert:SLEB");
    const goal = m.evidence.find((x) => x.requirementKey === "goal:SLEB");
    expect(pref?.ruleId).toBe("certPreferred");
    expect(pref?.status).toBe("check");
    expect(goal?.ruleId).toBe("participationGoal");
    expect(goal?.status).toBe("check");
    expect(goal?.label).toContain("20% SLEB participation goal");
    expect(goal?.glossaryKey).toBe("program:SLEB_SUBCONTRACT");
    const certified = evaluate(s, prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-gc"] }), TODAY);
    expect(certified.evidence.find((x) => x.requirementKey === "goal:SLEB")?.status).toBe("met");
  });

  it("a registration is a gate that reads as a registration, not a certification", () => {
    const s = SOLICITATION_BY_ID["r-fed-01"];
    const m = evaluate(s, profile({ certifications: ["SBA_SMALL"] }), TODAY);
    const e = m.evidence.find((x) => x.requirementKey === "cert:SAM_REGISTERED");
    expect(e?.ruleId).toBe("certRequired");
    expect(e?.status).toBe("missing");
    expect(e?.label).toMatch(/^Requires/);
    expect(m.fitScore.status).toBe("blocked");
  });

  it("directed spending steers, it does not bar", () => {
    const s = SOLICITATION_BY_ID["s-gsa-small-01"];
    const m = evaluate(s, prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-janitorial"], certifications: ["DIR"] }), TODAY);
    const e = m.evidence.find((x) => x.requirementKey === "cert:SLEB");
    expect(e?.ruleClass).toBe("soft");
    expect(e?.status).toBe("check");
    expect(e?.detail).toMatch(/does not bar you/);
    expect(m.fitScore.status).toBe("scored");
  });
});

describe("badges, shares, filters, checklist and summary", () => {
  it("badges name the mechanism and the percentage", () => {
    const texts = (id: string) => mechanismBadges(SOLICITATION_BY_ID[id]).map((b) => b.text);
    expect(texts("r-caltrans-01")).toEqual(expect.arrayContaining([`3% ${certLabel("DVBE")} goal`, `5% ${certLabel("DGS_SB")} preference`, `${certLabel("DIR")} required`]));
    expect(texts("s-elec-01")).toEqual(expect.arrayContaining([`10% ${certLabel("SLEB")} preference`, `20% ${certLabel("SLEB")} subcontracting`]));
    expect(texts("r-fed-02")).toEqual(expect.arrayContaining([`Set-aside: ${certLabel("SBA_SMALL")}`, `${certLabel("SAM_REGISTERED")} required`]));
    expect(texts("r-uc-01")[0]).toBe(`Set-aside: ${certLabel("DGS_SB")} +`);
    expect(texts("s-gsa-small-01")).toContain(`Directed to ${certLabel("SLEB")}`);
    expect(mechanismBadges(SOLICITATION_BY_ID["r-port-01"])[0]?.kind).toBe("set-aside");
  });

  it("participation shares turn the percentage into dollars from the agency's estimate", () => {
    const shares = participationShares(SOLICITATION_BY_ID["r-oak-01"]);
    expect(shares).toHaveLength(1);
    expect(shares[0]).toMatchObject({ code: "OAKLAND_LSLBE", percent: 50, min: 650_000, max: 850_000, exceptionAllowed: false });
    const sleb = participationShares(SOLICITATION_BY_ID["s-elec-01"]);
    expect(sleb[0]).toMatchObject({ code: "SLEB", percent: 20, min: 50_000, max: 80_000, exceptionAllowed: true });
  });

  it("'Your certifications count' is true only when a held program status is met", () => {
    const clearpath = prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-janitorial"] });
    expect(isProgramMatch(evaluate(SOLICITATION_BY_ID["r-fed-02"], clearpath, TODAY))).toBe(true);
    expect(isProgramMatch(evaluate(SOLICITATION_BY_ID["r-port-01"], clearpath, TODAY))).toBe(false);
    const it = prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-it"] });
    expect(isProgramMatch(evaluate(SOLICITATION_BY_ID["r-uc-01"], it, TODAY))).toBe(false);
  });

  it("the checklist adds a teaming step for an unmet goal, linked to the program directory", () => {
    const s = SOLICITATION_BY_ID["r-caltrans-01"];
    const m = evaluate(s, prepareProfile({ ...DEMO_PROFILE_BY_ID["demo-landscaper"] }), TODAY);
    const item = buildChecklist(s, TODAY, m).groups.flatMap((g) => g.items).find((i) => i.id === "teaming-DVBE");
    expect(item).toBeDefined();
    expect(item?.label).toMatch(/3% participation share \(about \$13k–\$17k/);
    expect(item?.link).toMatch(/^https:\/\//);
  });

  it("the summary warns about set-asides and goals in plain words", () => {
    const s = SOLICITATION_BY_ID["r-uc-01"];
    const watch = buildSummary(s, TODAY).find((sec) => sec.key === "watch");
    expect(watch?.lines.some((l) => /^Set aside for/.test(l.text))).toBe(true);
    const oak = buildSummary(SOLICITATION_BY_ID["r-oak-01"], TODAY).find((sec) => sec.key === "watch");
    expect(oak?.lines.some((l) => /50% .*participation/.test(l.text))).toBe(true);
  });
});

describe("data integrity for programs and mechanisms", () => {
  it("every regional record uses catalogued codes and a known mechanism", () => {
    for (const r of REGIONAL_SOLICITATIONS) {
      for (const c of r.requirements?.certifications ?? []) {
        expect(CERT_BY_CODE[c.code], `${r.id} ${c.code}`).toBeDefined();
        expect(c.mechanism, `${r.id} ${c.code} needs a mechanism`).toBeDefined();
        for (const a of c.alternatives ?? []) expect(CERT_BY_CODE[a], `${r.id} alt ${a}`).toBeDefined();
      }
    }
  });

  it("every program states at least one mechanism, and every mechanism has copy", () => {
    // The interagency alliance is a shared application, not a program with a bid effect of its own.
    for (const p of PROGRAMS.filter((x) => x.certificationCodes.length > 0)) expect(p.mechanisms.length, p.id).toBeGreaterThan(0);
    for (const p of PROGRAMS) for (const m of p.mechanisms) expect(MECHANISM_META[m.kind]).toBeDefined();
    expect(PROGRAM_CERT_CODES).toContain("SBA_SMALL");
    expect(PROGRAM_CERT_CODES).not.toContain("SERVSAFE");
  });

  it("no certification evidence or mechanism copy claims eligibility or odds", () => {
    const texts: string[] = [];
    for (const p of DEMO_PROFILES) {
      const prof = prepareProfile({ ...p });
      for (const s of SOLICITATIONS) {
        for (const e of evaluate(s, prof, TODAY).evidence) {
          if (e.ruleId === "certRequired" || e.ruleId === "certPreferred" || e.ruleId === "participationGoal") texts.push(e.label, e.detail ?? "");
        }
      }
    }
    for (const m of Object.values(MECHANISM_META)) texts.push(m.label, m.definition, m.effect);
    for (const b of SOLICITATIONS.flatMap((s) => mechanismBadges(s))) texts.push(b.text);
    const bad = texts.filter((t) => NEUTRAL.test(t));
    expect(bad).toEqual([]);
  });
});
