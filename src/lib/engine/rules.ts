/**
 * Matching rules. Each rule is a pure function (solicitation, profile, today)
 * -> Evidence[]. No rule invents a requirement: every piece of evidence points
 * at the solicitation field (and quote) it came from.
 *
 * Status meanings:
 *   met      - the solicitation states it and the profile satisfies it
 *   check    - stated; something to verify or arrange (never a disqualifier by itself)
 *   missing  - stated; the profile affirmatively lacks it
 *   unknown  - stated; the profile did not tell us
 *   na       - the solicitation does not state it
 * Confidence: confirmed = explicit requirement + explicit profile statement; inferred = similarity.
 */
import {
  CATEGORY_LABELS,
  CONSTRUCTION_TRADES,
  INSURANCE_LABELS,
  UMBRELLA,
  type BusinessProfile,
  type Category,
  type Evidence,
  type Meeting,
  type Solicitation,
  CertRequirement,
  ProgramMechanism,
} from "@/lib/data/types";
import { findQuote, normalizeLicenseCode, normalizeText, phraseRegex, scoreCategory } from "@/lib/data/synonyms";
import { GLOSSARY, glossaryFor, type GlossaryEntry } from "@/lib/data/glossary";
import { daysBetween, formatCivic, formatDate, type ISODate } from "./dates";
import { certLabel } from "@/lib/data/certifications";
import { agencyFor } from "@/lib/data/agencies";
import { participationShares } from "@/lib/data/mechanisms";

export interface RuleContext {
  sol: Solicitation;
  profile: BusinessProfile;
  today: ISODate;
}

export type Rule = (ctx: RuleContext) => Evidence[];

export const INFERRED_MATCH_SCORE = 3;
/** Score a tradeFit needs before a match can be "strong": a primary-to-primary category match (10) or two strong synonym hits. */
export const STRONG_INFERRED_SCORE = 7;

const money = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1000)}k`;

function profileCategories(profile: BusinessProfile): Category[] {
  const cats: Category[] = [];
  if (profile.primaryCategory) cats.push(profile.primaryCategory);
  for (const c of profile.secondaryCategories ?? []) if (!cats.includes(c)) cats.push(c);
  return cats;
}

function solicitationCategories(sol: Solicitation): Category[] {
  return Array.from(new Set([sol.category, ...sol.secondaryCategories, ...(UMBRELLA[sol.category] ?? [])]));
}

// ---------------------------------------------------------------------------

export const availability: Rule = ({ sol, today }) => {
  const due = sol.dates.submissionDue.date;
  const closed = sol.status !== "open" || due < today;
  if (closed) {
    const why =
      sol.status === "awarded"
        ? "This contract has been awarded."
        : sol.status === "closed"
          ? "Responses are no longer being accepted."
          : `The response deadline (${formatDate(due, { year: true })}) has passed.`;
    return [
      {
        ruleId: "availability",
        ruleClass: "gate",
        status: "missing",
        confidence: "confirmed",
        label: "No longer open",
        detail: `${why} Similar contracts often come back; watch the agency's page.`,
        sourceRef: { field: "dates.submissionDue" },
      },
    ];
  }
  return [
    {
      ruleId: "availability",
      ruleClass: "gate",
      status: "met",
      confidence: "confirmed",
      label: `Open, due ${formatCivic(sol.dates.submissionDue)}`,
      detail: `${daysBetween(today, due)} days from today.`,
      sourceRef: { field: "dates.submissionDue" },
    },
  ];
};

export const tradeFit: Rule = ({ sol, profile }) => {
  const mine = profileCategories(profile);
  const theirs = solicitationCategories(sol);
  const shared = mine.filter((c) => theirs.includes(c));
  const explicitlyDeclared = ["user", "inferred-license", "inferred-cert"].includes(profile.primaryCategorySource);

  if (shared.length > 0) {
    // Prefer the owner's primary trade, then a match on the solicitation's primary category.
    const cat = shared.find((c) => c === profile.primaryCategory) ?? shared.find((c) => c === sol.category) ?? shared[0];
    const confirmed = explicitlyDeclared && cat === profile.primaryCategory;
    const viaUmbrella = !sol.secondaryCategories.includes(cat) && sol.category !== cat;
    const primaryToPrimary = cat === profile.primaryCategory && cat === sol.category;
    const score = primaryToPrimary ? 10 : cat === profile.primaryCategory || cat === sol.category ? 5 : 4;
    return [
      {
        ruleId: "tradeFit",
        ruleClass: "gate",
        status: "met",
        confidence: confirmed ? "confirmed" : "inferred",
        label: `${CATEGORY_LABELS[cat]} work requested`,
        detail: viaUmbrella
          ? `This is a ${CATEGORY_LABELS[sol.category].toLowerCase()} solicitation that covers ${CATEGORY_LABELS[cat].toLowerCase()} work. You told us that is your trade.`
          : sol.category === cat
            ? `The solicitation is for ${CATEGORY_LABELS[cat].toLowerCase()} and you told us that is your trade.`
            : `${CATEGORY_LABELS[cat]} is listed as part of this scope and you told us that is your trade.`,
        sourceRef: { field: "category" },
        profileRef: ["primaryCategory"],
        score,
      },
    ];
  }

  // Synonym scoring of the profile's trades against the solicitation text.
  const text = `${sol.summary} ${sol.description}`;
  let best: { cat: Category; score: number; phrases: string[] } | null = null;
  for (const cat of mine) {
    const { score, hits } = scoreCategory(cat, text, sol.title);
    if (score >= INFERRED_MATCH_SCORE && (!best || score > best.score)) {
      best = { cat, score, phrases: hits.filter((h) => h.weight > 0).map((h) => h.phrase) };
    }
  }
  if (best) {
    const quote = findQuote(`${sol.title}. ${text}`, best.phrases[0]);
    return [
      {
        ruleId: "tradeFit",
        ruleClass: "gate",
        status: "met",
        confidence: "inferred",
        label: `Mentions ${best.phrases.slice(0, 3).join(", ")}`,
        detail: `The solicitation is filed under ${CATEGORY_LABELS[sol.category].toLowerCase()}, but its text mentions ${best.phrases.slice(0, 3).join(", ")}, which matches your trade (${CATEGORY_LABELS[best.cat].toLowerCase()}). Read the scope to confirm.`,
        sourceRef: { field: "description", quote },
        profileRef: ["primaryCategory"],
        score: best.score,
      },
    ];
  }

  // Capability / keyword phrase overlap.
  const phrases = [...(profile.capabilities ?? []), ...(profile.keywords ?? [])].filter((p) => p.trim().length > 2);
  const hay = normalizeText(`${sol.title} ${text}`);
  const found = phrases.filter((p) => phraseRegex(p).test(hay));
  if (found.length >= 2) {
    return [
      {
        ruleId: "tradeFit",
        ruleClass: "gate",
        status: "met",
        confidence: "inferred",
        label: `Mentions ${found.slice(0, 3).join(", ")}`,
        detail: `Your listed capabilities (${found.slice(0, 3).join(", ")}) appear in this solicitation's text. Read the scope to confirm it is really your kind of work.`,
        sourceRef: { field: "description", quote: findQuote(`${sol.title}. ${text}`, found[0]) },
        profileRef: ["capabilities"],
        score: 3,
      },
    ];
  }

  return [
    {
      ruleId: "tradeFit",
      ruleClass: "gate",
      status: "missing",
      confidence: mine.length ? "confirmed" : "inferred",
      label: mine.length ? "Not your trade" : "Tell us what your business does",
      detail: mine.length
        ? `This solicitation is for ${CATEGORY_LABELS[sol.category].toLowerCase()}; you told us you do ${mine.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(" and ")}.`
        : "We could not tell what kind of work you do, so we cannot judge the fit.",
      sourceRef: { field: "category" },
      profileRef: ["primaryCategory"],
      score: 0,
    },
  ];
};

export const scopeCoverage: Rule = ({ sol, profile }) => {
  const trades = Array.from(new Set([sol.category, ...sol.secondaryCategories]));
  const multi = sol.scopeTags.includes("multi-trade") || (UMBRELLA[sol.category] !== undefined);
  if (!multi) return [];
  const scope = UMBRELLA[sol.category] ? Array.from(new Set([...sol.secondaryCategories, ...(UMBRELLA[sol.category] ?? [])])) : trades.filter((t) => t !== sol.category);
  if (scope.length <= 1) return [];
  const mine = profileCategories(profile);
  const covered = scope.filter((t) => mine.includes(t));
  if (covered.length === 0) return [];
  if (covered.length === scope.length) {
    return [{ ruleId: "scopeCoverage", ruleClass: "soft", status: "met", confidence: "inferred", label: "You cover every trade in this scope", detail: `Scope lists ${scope.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(", ")}.`, sourceRef: { field: "secondaryCategories" } }];
  }
  return [
    {
      ruleId: "scopeCoverage",
      ruleClass: "soft",
      status: "check",
      confidence: "confirmed",
      label: `Covers more trades than yours`,
      detail: `The scope lists ${scope.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(", ")}; you cover ${covered.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(", ")}. ${sol.scopeTags.includes("as-needed") ? "Some agencies award by trade; check whether you can bid on your trade alone, or team with a prime." : "You may need to team with a prime contractor or bid as a subcontractor."}`,
      sourceRef: { field: "secondaryCategories" },
      action: "Read the scope section to see whether single-trade bids are accepted; otherwise look for a prime at the bidders conference.",
    },
  ];
};

export const capabilityMatch: Rule = ({ sol, profile }) => {
  const phrases = [...(profile.capabilities ?? []), ...(profile.keywords ?? [])].filter((p) => p.trim().length > 2);
  const text = `${sol.title}. ${sol.summary} ${sol.description}`;
  const hay = normalizeText(text);
  const found = Array.from(new Set(phrases.filter((p) => phraseRegex(p).test(hay))));
  if (found.length === 0) return [];
  return [
    {
      ruleId: "capabilityMatch",
      ruleClass: "soft",
      status: "met",
      confidence: "inferred",
      label: `Mentions ${found.slice(0, 3).join(", ")}`,
      detail: `Your listed capabilities appear in the solicitation text: ${found.join(", ")}.`,
      sourceRef: { field: "description", quote: findQuote(text, found[0]) },
      profileRef: ["capabilities"],
    },
  ];
};

export const contractSize: Rule = ({ sol, profile }) => {
  const v = sol.estimatedValue;
  const base = { ruleId: "contractSize" as const, ruleClass: "soft" as const, sourceRef: { field: "estimatedValue", quote: v?.quote } };
  if (!v) {
    return [{ ...base, status: "unknown", confidence: "confirmed", label: "No dollar estimate stated", detail: "The solicitation does not state an estimated value, so we did not guess. Pricing is set by your quote." }];
  }
  const mine = profile.typicalContractSize;
  const basisWord = v.basis === "annual" ? "per year" : v.basis === "per-order" ? "per order" : v.basis === "nte-pool" ? "shared pool ceiling" : "total";
  const range = v.min === v.max ? money(v.min) : `${money(v.min)}–${money(v.max)}`;
  if (v.basis === "nte-pool") {
    return [{ ...base, status: "met", confidence: "confirmed", label: `${range} pool, split across vendors`, detail: `This is a not-to-exceed ceiling shared by every awarded vendor over ${v.termYears ?? "several"} years. Individual work orders are usually much smaller, so the total is not the size of any one job.`, glossaryKey: "term:AS_NEEDED" }];
  }
  if (mine === "unknown") {
    return [{ ...base, status: "unknown", confidence: "confirmed", label: `County estimate ${range} ${basisWord}`, detail: "Tell us your typical contract size and we will say whether this is in your range." , profileRef: ["typicalContractSize"] }];
  }
  if (v.min > 1.5 * mine.max) {
    return [{
      ...base,
      status: "check",
      confidence: "confirmed",
      label: `Larger than your usual range (${range} ${basisWord})`,
      detail: `You told us you usually take ${money(mine.min)}–${money(mine.max)}. This is not an eligibility rule: the agency sets no minimum business size. What usually matters at this size is bonding capacity, insurance limits and cash flow between invoices. ${sizeOptions(sol)}`,
      profileRef: ["typicalContractSize"],
      action: "Ask your surety and bank what size you can carry, or look for a prime at the bidders conference.",
    }];
  }
  if (v.max < 0.25 * mine.min) {
    return [{ ...base, status: "met", confidence: "confirmed", label: `Smaller than your usual (${range} ${basisWord})`, detail: `Nothing disqualifies you. Small agency contracts are a common way to build past performance with the County.`, profileRef: ["typicalContractSize"] }];
  }
  return [{ ...base, status: "met", confidence: "confirmed", label: `${range} ${basisWord}, within your range`, detail: `County estimate ${range} ${basisWord}; you told us you usually take ${money(mine.min)}–${money(mine.max)}.`, profileRef: ["typicalContractSize"] }];
};

export const location: Rule = ({ sol, profile }) => {
  const loc = sol.requirements.location;
  const base = { ruleId: "location" as const, sourceRef: { field: "requirements.location", quote: loc.quote }, profileRef: ["county", "city"] };
  const local = profile.county === "Alameda";
  switch (loc.type) {
    case "none":
      return [{ ...base, ruleClass: "soft", status: "na", confidence: "confirmed", label: "No location requirement", detail: "The solicitation does not restrict where bidders are located." }];
    case "local-preference":
      return local
        ? [{ ...base, ruleClass: "soft", status: "met", confidence: "confirmed", label: "You're local: 5% local preference", detail: `Your business is in ${profile.city}, Alameda County, so you can claim the County's local bid preference on the SLEB Information Sheet.`, glossaryKey: "cert:SLEB" }]
        : [{ ...base, ruleClass: "soft", status: "check", confidence: "confirmed", label: "Local preference goes to Alameda County firms", detail: "You can still bid, but Alameda County businesses get a 5% preference on the score." }];
    case "county-required":
      return local
        ? [{ ...base, ruleClass: "gate", status: "met", confidence: "confirmed", label: "Alameda County location requirement satisfied", detail: loc.note ?? "The solicitation requires a presence in Alameda County; you are in the County." }]
        : [{ ...base, ruleClass: "gate", status: "missing", confidence: "confirmed", label: "Must be located in Alameda County", detail: loc.note ?? "The solicitation requires a presence inside Alameda County and you told us you are outside it." }];
    case "radius":
      return local
        ? [{ ...base, ruleClass: "soft", status: "met", confidence: "inferred", label: `Within ${loc.radiusMiles ?? "the stated"} miles (likely)`, detail: `${loc.note ?? "There is a distance requirement."} You are in Alameda County, so this is very likely satisfied; confirm the exact measurement.` }]
        : [{ ...base, ruleClass: "soft", status: "check", confidence: "confirmed", label: `Must be within ${loc.radiusMiles ?? "a stated"} miles`, detail: loc.note ?? "Confirm your location meets the distance requirement." }];
  }
};

function profileHasLicense(profile: BusinessProfile, code: string, label: string): boolean {
  if (profile.licenses === "unknown") return false;
  const want = normalizeLicenseCode(code);
  const labelNorm = normalizeText(label);
  return profile.licenses.some((l) => {
    const have = normalizeLicenseCode(l.code);
    if (have === want) return true;
    // "Class B or C-39" style alternatives mentioned in the label.
    return phraseRegex(have).test(labelNorm);
  });
}

export const license: Rule = ({ sol, profile }) => {
  return sol.requirements.licenses.map((req): Evidence => {
    const key = `license:${normalizeLicenseCode(req.code)}`;
    const base = { ruleId: "license" as const, ruleClass: "gate" as const, requirementKey: key, glossaryKey: glossaryFor(key)?.key, sourceRef: { field: "requirements.licenses", quote: req.quote }, profileRef: ["licenses"] };
    if (profile.licenses === "unknown") {
      return { ...base, status: "unknown", confidence: "confirmed", label: `Requires ${req.label}`, detail: "Tell us which licenses you hold and we will check this.", action: "Add your licenses to your profile." };
    }
    if (profileHasLicense(profile, req.code, req.label)) {
      return { ...base, status: "met", confidence: "confirmed", label: `${req.label} required, and you listed it`, detail: "Make sure it is active and the number goes on the bid forms." };
    }
    const wantsC = /^C-\d+$/.test(normalizeLicenseCode(req.code));
    const haveB = profile.licenses.some((l) => normalizeLicenseCode(l.code) === "B");
    if (wantsC && haveB) {
      return { ...base, status: "check", confidence: "confirmed", label: `Requires ${req.label}; you listed a Class B`, detail: "A Class B general building license covers projects involving two or more unrelated trades, not single-trade work. Confirm with the CSLB or the contact whether your B is accepted here.", action: "Ask the procurement contact in the Q&A tab whether a Class B is acceptable." };
    }
    return { ...base, status: "missing", confidence: "confirmed", label: `Requires ${req.label}, which you haven't listed`, detail: `The solicitation states this license is required. ${glossaryFor(key)?.action ?? "If you hold it, add it to your profile; otherwise consider subcontracting to a licensed prime."}` };
  });
};

/** Teaming advice for a bid larger than the vendor's range, naming the stated participation goal when there is one. */
function sizeOptions(sol: Solicitation): string {
  const share = participationShares(sol)[0];
  if (share) return `Options: team with a prime, or respond as a certified ${certLabel(share.code)} subcontractor (primes without the certification must subcontract ${share.percent}% to certified firms).`;
  return "Options: team with a prime, or join another firm's bid as a subcontractor.";
}

export const certifications: Rule = ({ sol, profile }) => {
  const held = profile.certifications === "unknown" ? null : new Set(profile.certifications.map((c) => c.toUpperCase()));
  const out: Evidence[] = [];
  for (const req of sol.requirements.certifications) {
    const code = req.code.toUpperCase();
    const key = `cert:${code}`;
    const g = GLOSSARY[key];
    const codes = [code, ...(req.alternatives ?? []).map((c) => c.toUpperCase())];
    const heldVia = held ? codes.filter((c) => held.has(c)) : [];
    const has = heldVia.length > 0;
    const via = has && heldVia[0] !== code ? ` (via ${certLabel(heldVia[0])})` : "";
    const alt = req.alternatives?.length ? ` or ${req.alternatives.map(certLabel).join(" / ")}` : "";
    const pct = req.percent ? `${req.percent}%` : "";
    const mechanism: ProgramMechanism | "credential" = req.mechanism ?? (req.required ? "credential" : "preference");
    const base = { requirementKey: key, glossaryKey: g?.key, sourceRef: { field: "requirements.certifications", quote: req.quote }, profileRef: ["certifications"] };
    const gate = { ...base, ruleId: "certRequired" as const, ruleClass: "gate" as const };
    const soft = { ...base, ruleId: "certPreferred" as const, ruleClass: "soft" as const };

    switch (mechanism) {
      case "set-aside": {
        if (req.scope === "partial") {
          if (held === null) out.push({ ...soft, status: "unknown", confidence: "confirmed", label: `Part of this work is set aside for ${req.label}${alt}`, detail: "The reserved portion goes only to firms holding that status; the rest is open. Tell us which certifications you hold and we will check this.", action: "Add your certifications to your profile." });
          else if (has) out.push({ ...soft, status: "met", confidence: "confirmed", label: `Part of this work is set aside for ${req.label}, which you listed${via}`, detail: "You can bid on the reserved portion as well as the open portion. Keep the certificate ready; the agency verifies status before award." });
          else out.push({ ...soft, status: "check", confidence: "confirmed", label: `Part of this work is set aside for ${req.label}${alt}; you haven't listed it`, detail: `${g?.meaning ?? "Only firms holding that status may bid on the reserved portion."} The rest of the work is open competition; confirm which portion you can bid on.`, action: g?.action });
          break;
        }
        if (held === null) out.push({ ...gate, status: "unknown", confidence: "confirmed", label: `Set aside for ${req.label}${alt}`, detail: "Only firms holding this status may bid on it. Tell us which certifications you hold and we will check this.", action: "Add your certifications to your profile." });
        else if (has) out.push({ ...gate, status: "met", confidence: "confirmed", label: `Set aside for ${req.label}, and you listed it${via}`, detail: "Competition is limited to firms with this status. Keep the certificate or registration record ready; the agency verifies it before award." });
        else out.push({ ...gate, status: "missing", confidence: "confirmed", label: `Set aside for ${req.label}${alt}, which you haven't listed`, detail: `${g?.meaning ?? "The solicitation limits competition to firms holding this status."} As stated, you cannot bid as the prime without it; subcontracting to a certified prime is the usual route.`, action: g?.action });
        break;
      }
      case "registration":
      case "credential": {
        if (held === null) out.push({ ...gate, status: "unknown", confidence: "confirmed", label: `Requires ${req.label}${alt}`, detail: "Tell us which certifications and registrations you hold and we will check this.", action: "Add your certifications to your profile." });
        else if (has) out.push({ ...gate, status: "met", confidence: "confirmed", label: `${req.label} required, and you listed it${via}`, detail: mechanism === "registration" ? "Keep the registration active through award; agencies check it before signing." : "Keep proof ready to attach." });
        else out.push({ ...gate, status: "missing", confidence: "confirmed", label: `Requires ${req.label}${alt}, which you haven't listed`, detail: g ? `${g.meaning}` : mechanism === "registration" ? "The solicitation states this registration is required before award." : "The solicitation states this certification is required.", action: g?.action });
        break;
      }
      case "preference": {
        const prefWord = pct ? `${pct} bid preference` : "bid preference";
        if (held === null) out.push({ ...soft, status: "unknown", confidence: "confirmed", label: `${req.label}: ${prefWord} if you hold it`, detail: "Tell us whether you hold it. It changes scoring, not whether you may bid." });
        else if (has) out.push({ ...soft, status: "met", confidence: "confirmed", label: `${certLabel(code)} certified: ${prefWord}, and you listed it${via}`, detail: g?.meaning ?? "This is a scoring preference rather than a requirement; you have it." });
        else out.push({ ...soft, status: "check", confidence: "confirmed", label: `Not ${certLabel(code)} certified: you lose the ${prefWord}, not the right to bid`, detail: g?.meaning ?? "This is a preference, not a requirement; you can still bid.", action: g?.action });
        break;
      }
      case "participation-goal":
        out.push(goalEvidence(req, req.goalPercent ?? req.percent ?? 0, held, has, via, g));
        break;
      case "directed-spend": {
        if (held === null) out.push({ ...soft, status: "unknown", confidence: "confirmed", label: `Purchases this size are directed to ${req.label} firms`, detail: "Tell us whether you hold it. Directed spending steers quotes to certified firms; it does not bar others." });
        else if (has) out.push({ ...soft, status: "met", confidence: "confirmed", label: `Purchases this size are directed to ${req.label} firms, and you listed it${via}`, detail: g?.meaning ?? "Buyers steer small purchases to certified firms; being certified is how you get asked to quote." });
        else out.push({ ...soft, status: "check", confidence: "confirmed", label: `Purchases this size are directed to ${req.label} firms; you haven't listed it`, detail: `${g?.meaning ?? "Buyers steer small purchases to certified firms."} Not being certified does not bar you, but certified firms are asked first.`, action: g?.action });
        break;
      }
      case "reporting":
        out.push({ ...soft, status: "na", confidence: "confirmed", label: `${req.label}: reporting program only`, detail: "This program tracks spending; it changes neither who may bid nor how bids are scored." });
        break;
    }
    // A preference program that also carries a subcontracting share for non-certified primes (County SLEB: 20%).
    if (req.goalPercent && mechanism !== "participation-goal") out.push(goalEvidence(req, req.goalPercent, held, has, via, g));
  }
  return out;
};

function goalEvidence(req: CertRequirement, percent: number, held: Set<string> | null, has: boolean, via: string, g: GlossaryEntry | undefined): Evidence {
  const code = req.code.toUpperCase();
  const short = certLabel(code);
  const pct = percent ? `${percent}% ` : "";
  const exception = req.exceptionAllowed ? " or a written exception" : "";
  const noException = req.exceptionAllowed ? "" : " The posting does not describe an exception; ask the contact before assuming one.";
  const base = {
    ruleId: "participationGoal" as const,
    ruleClass: "soft" as const,
    requirementKey: `goal:${code}`,
    glossaryKey: code === "SLEB" ? "program:SLEB_SUBCONTRACT" : g?.key,
    sourceRef: { field: "requirements.certifications", quote: req.quote },
    profileRef: ["certifications"],
  };
  if (held === null) return { ...base, status: "unknown", confidence: "confirmed", label: `${pct}${short} participation goal`, detail: `Tell us whether you hold it. Without it you would need certified ${short} subcontractors for ${pct || "the stated share of "}the bid${exception}.${noException}`, action: "Add your certifications to your profile." };
  if (has) return { ...base, status: "met", confidence: "confirmed", label: `${pct}${short} participation goal: your own certified work counts${via}`, detail: `As a certified ${short} firm, the work you self-perform usually counts toward the goal; confirm how this agency counts it. No subcontracting plan is needed for the goal itself.` };
  return {
    ...base,
    status: "check",
    confidence: "confirmed",
    label: `${pct}${short} participation goal: plan certified subcontractors${req.exceptionAllowed ? " or a written exception" : ""}`,
    detail: `Primes without the certification must commit ${pct || "the stated share of "}the bid to certified ${short} firms${exception}. Line up partners before the deadline and name them on the forms.${noException}`,
    action: code === "SLEB" ? GLOSSARY["program:SLEB_SUBCONTRACT"]?.action : g?.action,
  };
}

export const insurance: Rule = ({ sol, profile }) => {
  return sol.requirements.insurance.map((req): Evidence => {
    const key = `insurance:${req.type}`;
    const label = INSURANCE_LABELS[req.type];
    const limitText = req.limit === "statutory" ? "statutory" : `$${(req.limit / 1_000_000).toFixed(req.limit % 1_000_000 === 0 ? 0 : 1)}M per occurrence`;
    const base = { ruleId: "insurance" as const, ruleClass: "soft" as const, requirementKey: key, glossaryKey: key, sourceRef: { field: "requirements.insurance", quote: req.quote }, profileRef: ["insurance"] };
    if (profile.insurance === "unknown") {
      return { ...base, status: "unknown", confidence: "confirmed", label: `${label}: ${limitText}`, detail: "Tell us what coverage you carry. Certificates are due before award, not with the bid, so a gap is usually fixable with your broker in days.", action: "Send the insurance exhibit to your broker for a quote." };
    }
    const have = profile.insurance.find((p) => p.type === req.type);
    if (!have) {
      return { ...base, status: "check", confidence: "confirmed", label: `${label} not listed (${limitText})`, detail: "Required before award, not with the bid. Brokers usually add this in days.", action: "Ask your broker for a quote at the required limit." };
    }
    if (req.limit !== "statutory" && have.limit !== undefined && have.limit < req.limit) {
      return { ...base, status: "check", confidence: "confirmed", label: `${label} limit below ${limitText}`, detail: `You listed $${(have.limit / 1_000_000).toFixed(1)}M; raising a limit is usually quick with your broker.`, action: "Ask your broker to raise the limit before award." };
    }
    return { ...base, status: "met", confidence: "confirmed", label: `${label} listed`, detail: `You carry this coverage${req.limit === "statutory" ? "" : ` at or above ${limitText}`}. Certificate and ${agencyFor(sol.agencyId).countyGoverned ? "County" : "agency"} endorsements are due before award.` };
  });
};

export const experience: Rule = ({ sol, profile }) => {
  const req = sol.requirements.experience;
  if (!req) return [];
  const base = { ruleId: "experience" as const, ruleClass: "gate" as const, requirementKey: "experience:MIN_YEARS", glossaryKey: "experience:MIN_YEARS", sourceRef: { field: "requirements.experience", quote: req.quote }, profileRef: ["yearsInBusiness"] };
  if (profile.yearsInBusiness === undefined) {
    return [{ ...base, status: "unknown", confidence: "confirmed", label: `Requires ${req.years} year${req.years === 1 ? "" : "s"} of ${req.description}`, detail: "Tell us how long you have been doing this work.", action: "Add years in business to your profile." }];
  }
  if (profile.yearsInBusiness >= req.years) {
    return [{ ...base, status: "met", confidence: "inferred", label: `${req.years}+ years required; you have ${profile.yearsInBusiness}`, detail: `The County counts years "regularly and continuously engaged" in this specific kind of work (${req.description}), not just years in business. Show it in the Minimum Qualifications table.` }];
  }
  return [{ ...base, status: "missing", confidence: "confirmed", label: `Requires ${req.years} years; you listed ${profile.yearsInBusiness}`, detail: `The solicitation requires ${req.years} years of ${req.description}. Consider subcontracting to a prime that meets it.` }];
};

export const bonding: Rule = ({ sol }) => {
  return sol.requirements.bonding.map((b): Evidence => {
    const key = `bonding:${b.type.toUpperCase()}`;
    const g = GLOSSARY[key];
    return {
      ruleId: "bonding",
      ruleClass: "soft",
      status: "check",
      confidence: "confirmed",
      label: `${b.type === "bid" ? "Bid bond" : b.type === "performance" ? "Performance bond" : "Payment bond"}${b.percent ? ` (${b.percent}%)` : ""} required`,
      detail: g?.meaning ?? "A surety bond is required.",
      requirementKey: key,
      glossaryKey: key,
      action: g?.action,
      sourceRef: { field: "requirements.bonding", quote: b.quote },
    };
  });
};

export const wageRules: Rule = ({ sol, profile }) => {
  const out: Evidence[] = [];
  const isTrade = profile.primaryCategory ? CONSTRUCTION_TRADES.includes(profile.primaryCategory) : false;
  if (sol.requirements.prevailingWage) {
    out.push({ ruleId: "prevailingWage", ruleClass: "soft", status: "check", confidence: "confirmed", label: "Prevailing wage applies", detail: isTrade ? "Public works job: pay DIR prevailing rates for each craft and file certified payroll. Price your bid with those rates." : GLOSSARY["wage:PREVAILING"].meaning, requirementKey: "wage:PREVAILING", glossaryKey: "wage:PREVAILING", action: GLOSSARY["wage:PREVAILING"].action, sourceRef: { field: "requirements.prevailingWage" } });
  }
  if (sol.requirements.livingWage) {
    out.push({ ruleId: "livingWage", ruleClass: "soft", status: "check", confidence: "confirmed", label: "County living wage applies", detail: GLOSSARY["wage:LIVING"].meaning, requirementKey: "wage:LIVING", glossaryKey: "wage:LIVING", action: GLOSSARY["wage:LIVING"].action, sourceRef: { field: "requirements.livingWage" } });
  }
  if (sol.requirements.dirRegistration) {
    const held = profile.certifications !== "unknown" && profile.certifications.map((c) => c.toUpperCase()).includes("DIR");
    out.push(held
      ? { ruleId: "dirRegistration", ruleClass: "soft", status: "met", confidence: "confirmed", label: "DIR registered (required for public works)", detail: "Put your DIR number on the bid forms.", requirementKey: "registration:DIR", glossaryKey: "registration:DIR", sourceRef: { field: "requirements.dirRegistration" }, profileRef: ["certifications"] }
      : { ruleId: "dirRegistration", ruleClass: "soft", status: profile.certifications === "unknown" ? "unknown" : "check", confidence: "confirmed", label: "DIR public works registration required", detail: GLOSSARY["registration:DIR"].meaning, requirementKey: "registration:DIR", glossaryKey: "registration:DIR", action: GLOSSARY["registration:DIR"].action, sourceRef: { field: "requirements.dirRegistration" }, profileRef: ["certifications"] });
  }
  return out;
};

function meetingEvidence(m: Meeting, field: string, today: ISODate, kind: string): Evidence | null {
  if (!m.mandatory) return null;
  const when = m.when.date;
  const base = { ruleId: "mandatoryMeeting" as const, requirementKey: "meeting:PREBID", glossaryKey: "meeting:PREBID", sourceRef: { field, quote: m.quote } };
  if (m.prerequisite && m.prerequisite.due.date < today && when >= today) {
    return { ...base, ruleClass: "gate", status: "missing", confidence: "confirmed", label: `Clearance deadline for the mandatory ${kind} passed ${formatDate(m.prerequisite.due.date)}`, detail: `${m.prerequisite.label} was due ${formatCivic(m.prerequisite.due)}. Without it you cannot attend the mandatory ${kind} on ${formatDate(when)}, which means you cannot bid, unless the agency issues an addendum.`, action: "Email the contact to ask whether late clearance forms are accepted." , glossaryKey: "meeting:PREREQUISITE" };
  }
  if (when < today) {
    return { ...base, ruleClass: "gate", status: "missing", confidence: "confirmed", label: `Mandatory ${kind} already held ${formatDate(when)}`, detail: `Attendance was required to bid. If your company was not on the attendance list, you cannot submit for this one.`, action: "Watch for the re-bid or similar solicitations." };
  }
  return { ...base, ruleClass: "gate", status: "check", confidence: "confirmed", label: `Mandatory ${kind} ${formatCivic(m.when)}`, detail: `${m.location}. You must attend and be on the attendance list, or your bid will be rejected.${m.prerequisite ? ` Before that: ${m.prerequisite.label}, due ${formatCivic(m.prerequisite.due)}.` : ""}`, action: "Put it on your calendar now." };
}

export const mandatoryMeeting: Rule = ({ sol, today }) => {
  const out: Evidence[] = [];
  const a = sol.dates.preBidMeeting ? meetingEvidence(sol.dates.preBidMeeting, "dates.preBidMeeting", today, "pre-bid meeting") : null;
  const b = sol.dates.siteVisit ? meetingEvidence(sol.dates.siteVisit, "dates.siteVisit", today, "site visit") : null;
  if (a) out.push(a);
  if (b) out.push(b);
  return out;
};

export const statedStaffing: Rule = ({ sol, profile }) => {
  const req = sol.requirements.statedStaffingMin;
  if (!req) return [];
  const base = { ruleId: "statedStaffing" as const, ruleClass: "gate" as const, requirementKey: "staffing:MIN", sourceRef: { field: "requirements.statedStaffingMin", quote: req.quote }, profileRef: ["employeeCount"] };
  if (profile.employeeCount === undefined) return [{ ...base, status: "unknown", confidence: "confirmed", label: `States a minimum of ${req.count} staff`, detail: "Tell us your company size." }];
  if (profile.employeeCount >= req.count) return [{ ...base, status: "met", confidence: "confirmed", label: `Staffing minimum (${req.count}) met`, detail: `You have ${profile.employeeCount} employees.` }];
  return [{ ...base, status: "missing", confidence: "confirmed", label: `States a minimum of ${req.count} staff; you have ${profile.employeeCount}`, detail: "The solicitation sets a staffing level you do not currently meet. Teaming or hiring for the contract may be options; ask the contact." }];
};

export const listingOnly: Rule = ({ sol }) => {
  if (!sol.listingOnly) return [];
  return [{ ruleId: "listingOnly", ruleClass: "soft", status: "unknown", confidence: "confirmed", label: "Requirements not read yet", detail: "Only the public listing was captured (title, due date, link). Open the posting to read the requirements before deciding.", sourceRef: { field: "sourceUrl", url: sol.sourceUrl }, action: "Open the posting." }];
};

export const ALL_RULES: Rule[] = [
  availability,
  tradeFit,
  scopeCoverage,
  capabilityMatch,
  contractSize,
  location,
  license,
  certifications,
  insurance,
  experience,
  bonding,
  wageRules,
  mandatoryMeeting,
  statedStaffing,
  listingOnly,
];

export function runRules(ctx: RuleContext): Evidence[] {
  return ALL_RULES.flatMap((rule) => rule(ctx));
}
