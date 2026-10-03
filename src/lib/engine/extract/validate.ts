/**
 * Paste-a-solicitation pipeline, shared by the Claude and heuristic paths:
 *
 *   draft (Claude or regexes) -> verify every quote against the text -> Solicitation
 *
 * A fact without a verifiable quote never reaches the record; it is logged in
 * `droppedExtractions` so the UI can say "N items were left out". This is the
 * guarantee behind "never invent requirements".
 */
import { z } from "zod";
import {
  CATEGORIES,
  CategorySchema,
  DOCUMENT_KINDS,
  INSURANCE_TYPES,
  SolicitationSchema,
  type Category,
  type InsuranceType,
  type Solicitation,
  type SolicitationInput,
} from "@/lib/data/types";
import { LICENSE_TO_CATEGORY, normalizeLicenseCode, normalizeText, scoreCategory } from "@/lib/data/synonyms";
import { findUnverifiedQuotes } from "@/lib/data/sources";
import { AGENCY_BY_ID } from "@/lib/data/agencies";
import type { ISODate } from "@/lib/engine/dates";

export const MIN_QUOTE_LENGTH = 12;

// ---------------------------------------------------------------------------
// Draft schema: what an extractor (Claude or heuristic) is allowed to return.
// Every fact carries a verbatim `quote`. Nullable rather than optional so the
// same schema doubles as a strict structured-output format.
// ---------------------------------------------------------------------------

const Q = z.string().describe("Verbatim excerpt from the text that supports this fact: 12+ characters, copied exactly, no ellipses");

const DateDraft = z.object({
  date: z.string().describe("YYYY-MM-DD"),
  time: z.string().nullable().describe("HH:mm, 24-hour, or null if no time is stated"),
  quote: Q,
});

const MeetingDraft = z.object({
  date: z.string().describe("YYYY-MM-DD"),
  time: z.string().nullable(),
  location: z.string().nullable(),
  mandatory: z.boolean().describe("true only if the quote contains the word mandatory"),
  quote: Q,
});

export const ExtractionDraftSchema = z.object({
  title: z.string(),
  number: z.string().nullable().describe('e.g. "RFQ No. 902761"'),
  type: z.enum(["RFP", "RFQ", "RFPQ", "IRFP", "IFB", "RFI"]).nullable(),
  department: z.string().nullable(),
  summary: z.string().nullable().describe("One or two plain sentences: what the agency actually needs"),
  category: CategorySchema.nullable(),
  term: z.string().nullable().describe('e.g. "3-year term"'),
  estimatedValue: z
    .object({
      min: z.number(),
      max: z.number(),
      basis: z.enum(["total", "annual", "per-order", "nte-pool"]),
      termYears: z.number().nullable(),
      quote: Q,
    })
    .nullable(),
  dates: z.object({
    posted: DateDraft.nullable(),
    preBidMeeting: MeetingDraft.nullable(),
    siteVisit: MeetingDraft.nullable(),
    questionsDue: DateDraft.nullable(),
    submissionDue: DateDraft.nullable(),
    anticipatedAward: DateDraft.nullable(),
  }),
  submissionMethod: z.object({ text: z.string(), quote: Q }).nullable(),
  licenses: z.array(z.object({ code: z.string().describe('CSLB class, e.g. "C-10" or "B"'), label: z.string(), quote: Q })),
  certifications: z.array(
    z.object({
      code: z.string().describe("SLEB, DIR, SERVSAFE, COURT_INTERPRETER, BSIS_PPO, QEI, ASE, MEDI_CAL_PROVIDER, or another short code"),
      label: z.string(),
      required: z.boolean().describe("false when it is a preference or scoring bonus"),
      quote: Q,
    }),
  ),
  insurance: z.array(
    z.object({
      type: z.enum(INSURANCE_TYPES),
      limit: z.number().nullable().describe("Per-occurrence limit in dollars; null when statutory"),
      quote: Q,
    }),
  ),
  location: z
    .object({
      type: z.enum(["local-preference", "county-required", "radius"]),
      radiusMiles: z.number().nullable(),
      note: z.string().nullable(),
      quote: Q,
    })
    .nullable(),
  experience: z.object({ years: z.number(), description: z.string(), quote: Q }).nullable(),
  bonding: z.array(z.object({ type: z.enum(["bid", "performance", "payment"]), percent: z.number().nullable(), quote: Q })),
  prevailingWage: z.object({ quote: Q }).nullable(),
  livingWage: z.object({ quote: Q }).nullable(),
  dirRegistration: z.object({ quote: Q }).nullable(),
  statedStaffingMin: z.object({ count: z.number(), quote: Q }).nullable(),
  other: z.array(z.object({ label: z.string(), quote: Q })),
  documents: z.array(z.object({ label: z.string(), kind: z.enum(DOCUMENT_KINDS), note: z.string().nullable(), quote: Q })),
  contact: z
    .object({
      name: z.string().nullable(),
      title: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
    })
    .nullable(),
});

export type ExtractionDraft = z.infer<typeof ExtractionDraftSchema>;
type MeetingDraftT = z.infer<typeof MeetingDraft>;
type DateDraftT = z.infer<typeof DateDraft>;

export function emptyDraft(title: string): ExtractionDraft {
  return {
    title,
    number: null,
    type: null,
    department: null,
    summary: null,
    category: null,
    term: null,
    estimatedValue: null,
    dates: { posted: null, preBidMeeting: null, siteVisit: null, questionsDue: null, submissionDue: null, anticipatedAward: null },
    submissionMethod: null,
    licenses: [],
    certifications: [],
    insurance: [],
    location: null,
    experience: null,
    bonding: [],
    prevailingWage: null,
    livingWage: null,
    dirRegistration: null,
    statedStaffingMin: null,
    other: [],
    documents: [],
    contact: null,
  };
}

// ---------------------------------------------------------------------------
// Quote verification (same normalization the data test uses)
// ---------------------------------------------------------------------------

export function makeVerifier(text: string): (quote: string | null | undefined) => quote is string {
  const hay = normalizeText(text);
  return (quote): quote is string => {
    if (!quote) return false;
    if (/\.\.\.|…/.test(quote)) return false;
    const q = normalizeText(quote);
    if (q.length < MIN_QUOTE_LENGTH) return false;
    return hay.includes(q);
  };
}

export function quoteVerified(quote: string | null | undefined, text: string): boolean {
  return makeVerifier(text)(quote);
}

export function textHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

// ---------------------------------------------------------------------------
// Materialize: draft + text -> validated Solicitation
// ---------------------------------------------------------------------------

export interface MaterializeOptions {
  extractedBy: "claude" | "heuristic";
  today: ISODate;
  sourceUrl?: string;
}

export interface Dropped {
  field: string;
  reason: string;
}

export interface MaterializeResult {
  solicitation: Solicitation;
  dropped: Dropped[];
  notes: string[];
}

const LICENSE_LABELS: Record<string, string> = {
  A: "Class A General Engineering Contractor license",
  B: "Class B General Building Contractor license",
  "C-7": "C-7 Low Voltage Systems Contractor license",
  "C-10": "C-10 Electrical Contractor license",
  "C-16": "C-16 Fire Protection Contractor license",
  "C-20": "C-20 HVAC Contractor license",
  "C-27": "C-27 Landscaping Contractor license",
  "C-33": "C-33 Painting and Decorating Contractor license",
  "C-36": "C-36 Plumbing Contractor license",
  "C-39": "C-39 Roofing Contractor license",
  "C-45": "C-45 Sign Contractor license",
  "C-61": "C-61 Limited Specialty Contractor license",
};

const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TIME = /^\d{2}:\d{2}$/;

const AGENCY_HINTS: [RegExp, string][] = [
  [/Alameda County Transportation Commission|Alameda CTC/i, "alameda-ctc"],
  [/Alameda County Water District|\bACWD\b/, "acwd"],
  [/Zone 7/i, "zone-7"],
  [/StopWaste/i, "stopwaste"],
  [/Alameda Health System/i, "alameda-health-system"],
  [/Alameda Alliance for Health/i, "alameda-alliance"],
  [/Housing Authority of the County of Alameda|\bHACA\b/, "haca"],
  [/First 5 Alameda/i, "first-5"],
  [/Alameda County Office of Education|\bACOE\b/, "acoe"],
  [/Superior Court/i, "alameda-superior-court"],
  [/East Bay Regional Park/i, "ebrpd"],
  [/\bAC Transit\b/, "ac-transit"],
  [/Mosquito Abatement/i, "acmad"],
  [/Public Works Agency/i, "alameda-county-public-works"],
  [/Health Care Services Agency|Behavioral Health|Public Health Department/i, "alameda-county-health"],
  [/Social Services Agency/i, "alameda-county-social-services"],
  [/Housing and Community Development/i, "alameda-county-hcd"],
  [/Fire Department/i, "alameda-county-fire"],
  [/Alameda County Library/i, "alameda-county-library"],
];

function inferAgencyId(text: string): string {
  for (const [re, id] of AGENCY_HINTS) if (re.test(text) && AGENCY_BY_ID[id]) return id;
  return "alameda-county-gsa";
}

function firstSentences(text: string, n: number, max = 300): string {
  const body = text.replace(/\s+/g, " ").trim();
  const parts = body.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
  return (parts.slice(0, n).join(" ") || body).slice(0, max);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function materialize(draft: ExtractionDraft, text: string, opts: MaterializeOptions): MaterializeResult {
  const verified = makeVerifier(text);
  const dropped: Dropped[] = [];
  const notes: string[] = [];

  const keep = <T extends { quote: string }>(field: string, what: string, item: T | null | undefined): item is T => {
    if (!item) return false;
    if (verified(item.quote)) return true;
    dropped.push({ field, reason: `${what} was left out: its supporting quote was not found in the text.` });
    return false;
  };

  const civic = (d: { date: string; time: string | null }) => ({ date: d.date, ...(d.time && VALID_TIME.test(d.time) ? { time: d.time } : {}) });

  const date = (field: string, what: string, d: DateDraftT | null) => {
    if (!d) return undefined;
    if (!VALID_DATE.test(d.date)) {
      dropped.push({ field, reason: `${what} was left out: "${d.date}" could not be read as a date.` });
      return undefined;
    }
    return keep(field, what, d) ? civic(d) : undefined;
  };

  const meeting = (field: string, what: string, m: MeetingDraftT | null) => {
    if (!m) return undefined;
    if (!VALID_DATE.test(m.date)) {
      dropped.push({ field, reason: `${what} was left out: "${m.date}" could not be read as a date.` });
      return undefined;
    }
    if (!keep(field, what, m)) return undefined;
    const mandatory = /mandatory/i.test(m.quote);
    if (m.mandatory && !mandatory) notes.push(`The ${what.toLowerCase()} was flagged mandatory by the extractor, but the quoted text does not say "mandatory", so it is treated as optional.`);
    return { when: civic(m), mandatory, location: m.location?.trim() || "Location not stated in the text", quote: m.quote };
  };

  // Dates
  const dd = draft.dates;
  const dueParsed = date("dates.submissionDue", "Response due date", dd.submissionDue);
  let submissionDue: { date: string; time?: string; note?: string };
  if (dueParsed) submissionDue = dueParsed;
  else {
    if (!dd.submissionDue) dropped.push({ field: "dates.submissionDue", reason: "No response due date was found in the text." });
    submissionDue = { date: "2099-12-31", note: "Due date not found in the pasted text. Check the solicitation." };
  }
  const posted = date("dates.posted", "Posting date", dd.posted);
  if (!posted) notes.push("No posting date was found; the day you pasted it is shown instead.");
  const anticipatedAward = date("dates.anticipatedAward", "Award date", dd.anticipatedAward);

  // Value
  let estimatedValue: SolicitationInput["estimatedValue"] = null;
  if (draft.estimatedValue && keep("estimatedValue", "Estimated value", draft.estimatedValue)) {
    const v = draft.estimatedValue;
    estimatedValue = { min: Math.min(v.min, v.max), max: Math.max(v.min, v.max), basis: v.basis, ...(v.termYears ? { termYears: v.termYears } : {}), quote: v.quote };
  }

  // Requirements
  const licenses = draft.licenses
    .filter((l) => keep("requirements.licenses", `License "${l.code}"`, l))
    .map((l) => {
      const code = normalizeLicenseCode(l.code);
      return { code, label: LICENSE_LABELS[code] ?? (l.label.trim() || `${code} contractor license`), quote: l.quote };
    });
  const seenLic = new Set<string>();
  const uniqueLicenses = licenses.filter((l) => (seenLic.has(l.code) ? false : (seenLic.add(l.code), true)));

  const certifications = draft.certifications
    .filter((c) => keep("requirements.certifications", `Certification "${c.label}"`, c))
    .map((c) => ({ code: c.code.toUpperCase().replace(/[^A-Z0-9_]/g, "_"), label: c.label, required: c.required, quote: c.quote }));

  const insurance = draft.insurance
    .filter((i) => keep("requirements.insurance", `Insurance "${i.type}"`, i))
    .map((i) => ({ type: i.type as InsuranceType, limit: i.limit === null ? ("statutory" as const) : i.limit, quote: i.quote }));

  const location = draft.location && keep("requirements.location", "Location requirement", draft.location)
    ? { type: draft.location.type, ...(draft.location.radiusMiles ? { radiusMiles: draft.location.radiusMiles } : {}), ...(draft.location.note ? { note: draft.location.note } : {}), quote: draft.location.quote }
    : { type: "none" as const };

  const experience = draft.experience && keep("requirements.experience", "Experience requirement", draft.experience) ? { years: draft.experience.years, description: draft.experience.description, quote: draft.experience.quote } : undefined;

  const bonding = draft.bonding.filter((b) => keep("requirements.bonding", `${b.type} bond`, b)).map((b) => ({ type: b.type, ...(b.percent ? { percent: b.percent } : {}), quote: b.quote }));

  const prevailingWage = keep("requirements.prevailingWage", "Prevailing wage", draft.prevailingWage);
  const livingWage = keep("requirements.livingWage", "Living wage", draft.livingWage);
  const dirRegistration = keep("requirements.dirRegistration", "DIR registration", draft.dirRegistration);
  const statedStaffingMin = draft.statedStaffingMin && keep("requirements.statedStaffingMin", "Minimum staffing", draft.statedStaffingMin) ? { count: draft.statedStaffingMin.count, quote: draft.statedStaffingMin.quote } : undefined;
  const other = draft.other.filter((o) => keep("requirements.other", `Requirement "${o.label}"`, o)).map((o) => ({ label: o.label, quote: o.quote }));

  const documents = draft.documents
    .filter((d) => keep("documents", `Document "${d.label}"`, d))
    .map((d, i) => ({ id: `doc-${i + 1}-${slug(d.label) || "item"}`, label: d.label, kind: d.kind, ...(d.note ? { note: d.note } : {}), quote: d.quote }));

  const submissionMethod = draft.submissionMethod && keep("submissionMethod", "Submission method", draft.submissionMethod) ? draft.submissionMethod.text : "Submission method not found in the pasted text. Check the solicitation.";

  // Category: license mapping > extractor's call (if the text agrees) > synonym scorer > default.
  const scored = CATEGORIES.map((c) => ({ c, s: scoreCategory(c, text, draft.title).score })).sort((a, b) => b.s - a.s);
  const best = scored[0];
  const scoreOf = (c: Category) => scored.find((x) => x.c === c)?.s ?? 0;
  const fromLicense = uniqueLicenses.map((l) => LICENSE_TO_CATEGORY[l.code]).find(Boolean);
  let category: Category;
  if (fromLicense) category = fromLicense;
  else if (draft.category && (draft.category === best.c || scoreOf(draft.category) >= 3)) category = draft.category;
  else if (best.s >= 3) {
    category = best.c;
    if (draft.category) notes.push(`The extractor suggested "${draft.category}", but the wording reads more like "${best.c}", which we used.`);
  } else {
    category = draft.category ?? "consulting-training";
    if (!draft.category) notes.push("We could not tell the trade from the text, so it was filed under consulting & training. Matching may be off.");
  }
  const secondaryCategories = scored.filter((x) => x.c !== category && x.s >= 6).slice(0, 2).map((x) => x.c);

  const scopeTags: SolicitationInput["scopeTags"] = [];
  if (prevailingWage || dirRegistration) scopeTags.push("public-works");
  if (/\bas[- ]needed\b|\bon[- ]call\b/i.test(text)) scopeTags.push("as-needed");
  if (/\bpool\b|multiple (?:vendors|awards|contracts)/i.test(text)) scopeTags.push("pool");
  if (/professional services|consult/i.test(text)) scopeTags.push("professional-services");

  const c = draft.contact;
  const input: SolicitationInput = {
    id: `pasted-${textHash(text)}`,
    number: draft.number?.trim() || "No number found",
    title: draft.title.trim() || "Untitled pasted solicitation",
    department: draft.department?.trim() || "Department not stated",
    type: draft.type ?? "RFP",
    agencyId: inferAgencyId(text),
    category,
    secondaryCategories,
    summary: draft.summary?.trim() || firstSentences(text, 2),
    description: text.slice(0, 4000),
    estimatedValue,
    ...(draft.term ? { term: draft.term } : {}),
    dates: {
      posted: posted?.date ?? opts.today,
      preBidMeeting: meeting("dates.preBidMeeting", "Pre-bid meeting", dd.preBidMeeting),
      siteVisit: meeting("dates.siteVisit", "Site visit", dd.siteVisit),
      questionsDue: date("dates.questionsDue", "Questions deadline", dd.questionsDue),
      submissionDue,
      ...(anticipatedAward ? { anticipatedAward: anticipatedAward.date } : {}),
    },
    submissionMethod,
    requirements: {
      licenses: uniqueLicenses,
      certifications,
      insurance,
      location,
      ...(experience ? { experience } : {}),
      bonding,
      prevailingWage,
      livingWage,
      dirRegistration,
      ...(statedStaffingMin ? { statedStaffingMin } : {}),
      other,
    },
    documents,
    scopeTags,
    contact: {
      name: c?.name?.trim() || "Not stated in the text",
      ...(c?.title ? { title: c.title } : {}),
      email: c?.email?.trim() || "",
      ...(c?.phone ? { phone: c.phone } : {}),
    },
    sourceUrl: opts.sourceUrl ?? "",
    sourceExcerpt: text,
    status: submissionDue.date < opts.today ? "closed" : "open",
    listingOnly: false,
    provenance: {
      source: "pasted",
      extractedBy: opts.extractedBy,
      extractedAt: new Date().toISOString(),
      ...(notes.length ? { note: notes.join(" ") } : {}),
    },
    ...(dropped.length ? { droppedExtractions: dropped } : {}),
  };

  const solicitation = SolicitationSchema.parse(input);
  const unverified = findUnverifiedQuotes(solicitation);
  if (unverified.length) throw new Error(`Internal: unverified quotes survived materialize: ${unverified.join(", ")}`);
  return { solicitation, dropped, notes };
}

// ---------------------------------------------------------------------------
// Heuristic parser: deterministic regexes, used when no API key is set
// (and as the fallback when Claude fails). Every fact quotes the text.
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const DATE_RE = /\b(?:(jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})|(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{4})-(\d{2})-(\d{2}))\b/gi;
const TIME_RE = /\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s?m\.?(?![a-z])/i;
const AMT_RE = /\$\s?(\d[\d,]*(?:\.\d+)?)\s*(million|mm|m|k|thousand)?\b/gi;
const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fifteen: 15, twenty: 20 };

const pad = (n: number) => String(n).padStart(2, "0");

function parseDate(m: RegExpMatchArray): string | null {
  if (m[1]) {
    const mon = MONTHS[m[1].toLowerCase().slice(0, 4)] ?? MONTHS[m[1].toLowerCase().slice(0, 3)];
    if (!mon) return null;
    return `${m[3]}-${pad(mon)}-${pad(Number(m[2]))}`;
  }
  if (m[4]) return `${m[6]}-${pad(Number(m[4]))}-${pad(Number(m[5]))}`;
  if (m[7]) return `${m[7]}-${m[8]}-${m[9]}`;
  return null;
}

function parseTime(s: string): string | null {
  const t = s.match(TIME_RE);
  if (!t) return null;
  let h = Number(t[1]);
  const min = t[2] ? Number(t[2]) : 0;
  const pm = t[3].toLowerCase() === "p";
  if (pm && h < 12) h += 12;
  if (!pm && h === 12) h = 0;
  return `${pad(h)}:${pad(min)}`;
}

function parseAmount(num: string, suffix?: string): number {
  const n = parseFloat(num.replace(/,/g, ""));
  const s = (suffix ?? "").toLowerCase();
  if (s === "million" || s === "mm" || s === "m") return n * 1_000_000;
  if (s === "k" || s === "thousand") return n * 1_000;
  return n;
}

function numberWord(s: string): number | null {
  if (/^\d+$/.test(s)) return Number(s);
  return WORDS[s.toLowerCase()] ?? null;
}

/** A verbatim window of text around an index, bounded by sentence/line breaks, at least ~40 chars. */
export function sentenceAround(text: string, idx: number, max = 220): string {
  let start = Math.max(text.lastIndexOf("\n", idx), text.lastIndexOf(". ", idx) + 1, 0);
  if (start > idx) start = Math.max(text.lastIndexOf("\n", idx), 0);
  let end = text.indexOf("\n", idx);
  if (end === -1) end = text.length;
  const dot = text.indexOf(". ", idx);
  if (dot !== -1 && dot + 1 < end) end = dot + 1;
  if (end - start < 40) {
    start = Math.max(0, idx - 60);
    end = Math.min(text.length, idx + 60);
  }
  if (end - start > max) {
    start = Math.max(start, idx - Math.floor(max / 2));
    end = Math.min(end, start + max);
  }
  return text.slice(start, end).trim();
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(And|Of|For|The|In|At|To|A|An)\b/g, (w) => w.toLowerCase()).replace(/^([a-z])/, (c) => c.toUpperCase());
}

const RFX_TYPES: Record<string, ExtractionDraft["type"]> = { proposal: "RFP", proposals: "RFP", quotation: "RFQ", quotations: "RFQ", quote: "RFQ", qualification: "RFPQ", qualifications: "RFPQ", information: "RFI", bid: "IFB", bids: "IFB" };

export function heuristicExtract(raw: string): ExtractionDraft {
  const text = raw.replace(/\r\n/g, "\n");
  const lines = text.split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);
  const head = nonEmpty.slice(0, 14);
  const RFX_LINE = /\b(?:request for|rfp|rfq|rfpq|irfp|ifb|rfi)\b/i;

  // ---- Title
  let title: string | null = null;
  for (let i = 0; i < head.length - 1; i++) {
    if (/^for:?$/i.test(head[i])) {
      title = head[i + 1];
      break;
    }
  }
  if (!title) {
    for (const l of head) {
      const m = l.match(/\b(?:rfp|rfq|rfpq|irfp|ifb|rfi|request for \w+)\b[^\n]*?\bfor\s+(.{6,120})$/i);
      if (m) {
        title = m[1];
        break;
      }
    }
  }
  if (!title) {
    const idx = head.findIndex((l) => RFX_LINE.test(l) && /\d{3,}/.test(l));
    if (idx >= 0) title = head.slice(idx + 1, idx + 4).find((l) => !/^for:?$/i.test(l) && !/county of alameda|^alameda county$/i.test(l) && l.length >= 6 && !RFX_LINE.test(l)) ?? null;
  }
  if (!title) title = head.find((l) => l.length >= 6 && !/county of alameda|^alameda county$/i.test(l) && !RFX_LINE.test(l) && !/^\d/.test(l)) ?? head[0] ?? "Pasted solicitation";
  title = title.replace(/^for\s+/i, "").replace(/[.:]+$/, "").slice(0, 140);
  if (title === title.toUpperCase() && /[A-Z]/.test(title)) title = titleCase(title);

  const draft = emptyDraft(title);

  // ---- Number & type
  const numA = text.match(/\b(RFP|RFQ|RFPQ|IRFP|IFB|RFI)\s*(?:No\.?|Number|#)?\s*:?\s*([A-Z]{0,5}-?\d[\w.-]*)/i);
  const numB = text.match(/request for (proposal|proposals|quotation|quotations|quote|qualification|qualifications|information|bid|bids)(?:\s*\/\s*(proposal|quotation|qualification)s?)?[^\n]*?(?:No\.?|Number|#)\s*:?\s*([\w.-]+)/i);
  if (numA) {
    draft.type = numA[1].toUpperCase() as ExtractionDraft["type"];
    draft.number = `${numA[1].toUpperCase()} No. ${numA[2].replace(/[.,]$/, "")}`;
  } else if (numB) {
    const t = numB[2] ? "RFPQ" : (RFX_TYPES[numB[1].toLowerCase()] ?? "RFP");
    draft.type = t;
    draft.number = `${t} No. ${numB[3].replace(/[.,]$/, "")}`;
  } else {
    const t = text.match(/request for (proposal|quotation|quote|qualification|information|bid)/i);
    if (t) draft.type = RFX_TYPES[t[1].toLowerCase()] ?? "RFP";
  }

  // ---- Department
  const dept = text.match(
    /\b(General Services Agency|Public Works Agency|Health Care Services Agency|Behavioral Health(?: Care Services| Department)?|Public Health Department|Social Services Agency|Probation Department|Sheriff'?s Office|Community Development Agency|Housing and Community Development(?: Department)?|Information Technology Department|Registrar of Voters|Fire Department|Public Defender|Human Resource Services|Office of Violence Prevention|District Attorney|Auditor-Controller|Alameda County Library|Alameda County Transportation Commission|Alameda County Water District|Zone 7 Water Agency|StopWaste|Alameda Health System|Superior Court)\b/,
  );
  if (dept) draft.department = dept[1];
  else {
    const by = text.match(/(?:issued by|on behalf of)\s+(?:the\s+)?([A-Z][^\n.]{5,60}?(?:Agency|Department|Office|Services|Court|District|Authority|Commission))\b/);
    if (by) draft.department = by[1];
  }

  // ---- Summary
  const seek = text.match(/[^.\n]{0,120}\b(?:is seeking|seeks|intends to|invites|is requesting|requests|is soliciting)\b[^.]{10,320}\./i);
  if (seek) draft.summary = seek[0].replace(/\s+/g, " ").trim();

  // ---- Term
  const term = text.match(/\b(\d+|one|two|three|four|five)[- ]year\b[^.\n]{0,40}?\b(?:term|contract|agreement|period)\b/i);
  if (term) {
    const n = numberWord(term[1]);
    if (n) draft.term = `${n}-year term`;
  }

  // ---- Dates: classify each line that holds a date
  const SLOT_RE: [keyof ExtractionDraft["dates"], RegExp][] = [
    ["preBidMeeting", /pre-?bid|pre-?proposal|bidders'? conference|proposers'? conference|networking|vendor conference|pre-?submittal/i],
    ["siteVisit", /site visit|job walk|walk-?through|site inspection|site tour/i],
    ["questionsDue", /question|inquir|clarification|q\s*&\s*a/i],
    ["anticipatedAward", /award|board approval|notice of intent/i],
    ["submissionDue", /\bdue\b|deadline|submission|submittal|bid opening|closing date|\bcloses?\b|must be received/i],
    ["posted", /issued|posted|release|advertis|publication/i],
  ];
  let weakDue: DateDraftT | null = null;
  let prev = "";
  let offset = 0;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    const lineStart = offset;
    offset += rawLine.length + 1;
    if (!line) continue;
    const dm = Array.from(line.matchAll(DATE_RE));
    if (dm.length) {
      const date = parseDate(dm[0]);
      if (date) {
        const quote = line.length > 200 ? sentenceAround(text, lineStart + (dm[0].index ?? 0)) : line;
        const own = SLOT_RE.find(([, re]) => re.test(line))?.[0];
        const ctxSlot = own ?? SLOT_RE.find(([, re]) => re.test(prev))?.[0];
        const time = parseTime(line);
        if (ctxSlot === "preBidMeeting" || ctxSlot === "siteVisit") {
          if (!draft.dates[ctxSlot]) {
            const loc = line.match(/\b(?:at|location:?)\s+([A-Z][^,\n]{4,80}(?:,\s*[^,\n]{2,40}){0,3})/);
            draft.dates[ctxSlot] = { date, time, location: loc ? loc[1].trim() : null, mandatory: /mandatory/i.test(quote), quote };
          }
        } else if (ctxSlot === "submissionDue") {
          const strong = /\b(?:response|proposal|bid|quote|quotation|submission|submittal|offer)s?\b/i.test(line) && /\bdue\b|deadline|received|opening|close/i.test(line);
          if (strong && !draft.dates.submissionDue) draft.dates.submissionDue = { date, time, quote };
          else if (!weakDue && !/addend/i.test(line)) weakDue = { date, time, quote };
        } else if (ctxSlot === "posted") {
          if (!draft.dates.posted && !/addend/i.test(line)) draft.dates.posted = { date, time, quote };
        } else if (ctxSlot && !draft.dates[ctxSlot]) {
          draft.dates[ctxSlot] = { date, time, quote };
        }
      }
    }
    prev = line;
  }
  if (!draft.dates.submissionDue && weakDue) draft.dates.submissionDue = weakDue;

  // ---- Estimated value
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!/\$/.test(line) || !/estimat|budget|not[- ]to[- ]exceed|\bnte\b|value|anticipated|approximate|up to|amount|funding|award|compensation/i.test(line)) continue;
    const amounts = Array.from(line.matchAll(AMT_RE))
      .map((m) => parseAmount(m[1], m[2]))
      .filter((n) => n >= 1000);
    if (!amounts.length) continue;
    const basis = /per year|annual|annually|each year|\/\s?year|\/\s?yr/i.test(line) ? "annual" : /\bpool\b|aggregate|multiple (?:vendors|awards|contracts)|all contracts/i.test(line) ? "nte-pool" : "total";
    const ty = line.match(/\b(\d+|one|two|three|four|five)[- ]year/i);
    draft.estimatedValue = { min: Math.min(...amounts), max: Math.max(...amounts), basis, termYears: ty ? numberWord(ty[1]) : null, quote: line.slice(0, 220) };
    break;
  }

  // ---- Licenses
  const addLicense = (code: string, idx: number) => {
    const norm = normalizeLicenseCode(code);
    if (!/^(?:[AB]|C-\d{1,2})$/.test(norm)) return;
    if (draft.licenses.some((l) => l.code === norm)) return;
    draft.licenses.push({ code: norm, label: LICENSE_LABELS[norm] ?? `${norm} contractor license`, quote: sentenceAround(text, idx) });
  };
  for (const m of text.matchAll(/\bclass\s+["“]?([ABC](?:-?\s?\d{1,2})?)\b/gi)) addLicense(m[1], m.index ?? 0);
  for (const m of text.matchAll(/\b(C-?\s?\d{1,2})\b(?=[^\n]{0,80}\b(?:licen[sc]e|contractor|classification)\b)/gi)) addLicense(m[1], m.index ?? 0);
  for (const m of text.matchAll(/\b(general building|general engineering) contractor/gi)) addLicense(m[1].toLowerCase().startsWith("general b") ? "B" : "A", m.index ?? 0);

  // ---- Certifications and programs
  const window = (idx: number, span = 160) => text.slice(Math.max(0, idx - span), idx + span);
  const sleb = text.match(/\bSLEB\b|small,? local,? (?:and )?emerging business/i);
  if (sleb && sleb.index !== undefined) {
    const w = window(sleb.index, 240);
    const required = /must be (?:a )?(?:certified )?sleb|sleb[- ]certif\w* (?:is )?(?:required|mandatory)|only (?:certified )?slebs? (?:may|can|are)/i.test(w);
    draft.certifications.push({ code: "SLEB", label: "SLEB certification (Small, Local and Emerging Business)", required, quote: sentenceAround(text, sleb.index) });
    if (!required) draft.location = { type: "local-preference", radiusMiles: null, note: null, quote: sentenceAround(text, sleb.index) };
  }
  const CERTS: [string, string, RegExp][] = [
    ["SERVSAFE", "ServSafe food safety certification", /servsafe|food (?:safety|handler) (?:certif|card)/i],
    ["COURT_INTERPRETER", "Court-certified interpreter", /court[- ]certified interpreter|judicial council[- ]certified/i],
    ["BSIS_PPO", "BSIS Private Patrol Operator license", /\bBSIS\b|private patrol operator/i],
    ["QEI", "Qualified Elevator Inspector (QEI) certification", /\bQEI\b|qualified elevator inspector/i],
    ["ASE", "ASE automotive technician certification", /\bASE[- ]certified\b/i],
    ["MEDI_CAL_PROVIDER", "Medi-Cal provider enrollment", /medi-?cal (?:provider|certif|enroll)/i],
  ];
  for (const [code, label, re] of CERTS) {
    const m = text.match(re);
    if (m && m.index !== undefined) draft.certifications.push({ code, label, required: /must|shall|required/i.test(window(m.index, 120)), quote: sentenceAround(text, m.index) });
  }
  const dir = text.match(/\bDIR\b|department of industrial relations/i);
  if (dir && dir.index !== undefined && /regist|public works/i.test(window(dir.index, 200))) draft.dirRegistration = { quote: sentenceAround(text, dir.index) };
  const pw = text.match(/prevailing wage/i);
  if (pw && pw.index !== undefined) draft.prevailingWage = { quote: sentenceAround(text, pw.index) };
  const lw = text.match(/living wage/i);
  if (lw && lw.index !== undefined) draft.livingWage = { quote: sentenceAround(text, lw.index) };

  // ---- Insurance
  const INS: [InsuranceType, RegExp][] = [
    ["general-liability", /commercial general liability|general liability/i],
    ["auto", /auto(?:mobile)? liability|business auto/i],
    ["workers-comp", /workers'? compensation|workers'? comp\b/i],
    ["professional", /professional liability|errors? (?:and|&) omissions|\bE&O\b/i],
    ["cyber", /cyber(?:security)? (?:liability|insurance|coverage)|cyber liability/i],
    ["pollution", /pollution liability|pollution (?:insurance|coverage)/i],
    ["umbrella", /umbrella|excess liability/i],
    ["abuse-molestation", /sexual abuse|abuse (?:and|&|or) molestation/i],
  ];
  for (const [type, re] of INS) {
    const m = text.match(re);
    if (!m || m.index === undefined) continue;
    const w = text.slice(m.index, m.index + 260);
    if (!/insur|coverage|policy|limits?|per occurrence|aggregate|\$/i.test(window(m.index, 200))) continue;
    const amt = Array.from(w.matchAll(AMT_RE)).map((a) => ({ idx: a.index ?? 0, n: parseAmount(a[1], a[2]) })).filter((a) => a.n >= 10_000)[0];
    const stat = w.search(/statutory/i);
    const limit = type === "workers-comp" && stat !== -1 && (!amt || stat < amt.idx) ? null : amt ? amt.n : null;
    draft.insurance.push({ type, limit, quote: sentenceAround(text, m.index) });
  }

  // ---- Bonding
  for (const type of ["bid", "performance", "payment"] as const) {
    const m = text.match(new RegExp(`\\b${type} bond`, "i"));
    if (!m || m.index === undefined) continue;
    const pct = window(m.index, 120).match(/(\d{1,3})\s?(?:%|percent)/);
    draft.bonding.push({ type, percent: pct ? Number(pct[1]) : null, quote: sentenceAround(text, m.index) });
  }

  // ---- Location, experience, staffing
  const cr = text.match(/must (?:be|have|maintain)[^.\n]{0,40}(?:located|office|headquarter|based|place of business)[^.\n]{0,40}alameda county|located (?:in|within) alameda county/i);
  if (cr && cr.index !== undefined) draft.location = { type: "county-required", radiusMiles: null, note: null, quote: sentenceAround(text, cr.index) };
  const rad = text.match(/within (\d{1,3}) miles/i);
  if (rad && rad.index !== undefined) draft.location = { type: "radius", radiusMiles: Number(rad[1]), note: null, quote: sentenceAround(text, rad.index) };

  const exp = text.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:\(\d+\)\s*)?(?:\+|or more)?\s*(?:consecutive\s+)?years?\b[^.\n]{0,60}?\b(?:experience|in business|providing|performing|operating)/i);
  if (exp && exp.index !== undefined) {
    const years = numberWord(exp[1]);
    if (years) draft.experience = { years, description: "of relevant experience, as described in the text", quote: sentenceAround(text, exp.index) };
  }
  const staff = text.match(/(?:minimum|at least|no fewer than)\s+(?:of\s+)?(\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty)\s*(?:\(\d+\)\s*)?(?:[\w-]+\s+){0,6}?(?:staff|employees|personnel|technicians|workers|crew|drivers|guards|interpreters)\b/i);
  if (staff && staff.index !== undefined) {
    const count = numberWord(staff[1]);
    if (count) draft.statedStaffingMin = { count, quote: sentenceAround(text, staff.index) };
  }

  // ---- Submission method
  const sub = Array.from(text.matchAll(/submit/gi)).map((m) => sentenceAround(text, m.index ?? 0)).find((s) => /portal|opengov|bonfire|e-?mail|upload|electronic|hard cop|sealed|hand[- ]deliver|mail/i.test(s));
  if (sub) draft.submissionMethod = { text: sub.replace(/\s+/g, " ").replace(/:$/, "."), quote: sub };

  // ---- Documents: bullets after a "submit the following" style trigger
  const TRIGGER = /(?:must|shall|should|will)\s+(?:include|contain|submit|provide)|required (?:documents|submittals|forms)|response (?:packet|shall|must)|submittal requirements|proposal (?:contents|format)|exhibit a\b|checklist|the following (?:documents|items|forms)/i;
  const BULLET = /^(?:[-•*▪◦▫■□●○☐]|\(?[a-z0-9]{1,2}[.)])\s+(.+)$/i;
  const DOC_WORDS = /form|sheet|certif|statement|narrative|reference|bond|insurance|price|pricing|cost|budget|resume|questionnaire|exception|addend|acknowledg|signature|w-?9|licen|packet|exhibit|proposal|letter|plan|schedule|attachment/i;
  const seenDocs = new Set<string>();
  const addDoc = (label: string, quote: string) => {
    const clean = label.replace(/\s+/g, " ").replace(/[;,.]$/, "").trim();
    const key = clean.toLowerCase();
    if (clean.length < 4 || seenDocs.has(key) || draft.documents.length >= 25) return;
    seenDocs.add(key);
    const kind = /reference/i.test(clean)
      ? "references"
      : /price|pricing|cost|bid form|budget|rate sheet|fee schedule/i.test(clean)
        ? "pricing"
        : /\bcop(?:y|ies)\b|licen[sc]e|certificate of insurance|proof of|w-?9/i.test(clean)
          ? "proof"
          : /certification|affidavit|declaration|debarment|iran|attest/i.test(clean)
            ? "attestation"
            : /narrative|approach|plan|description|statement of|qualifications|resume|experience|methodology|letter/i.test(clean)
              ? "narrative"
              : "form";
    draft.documents.push({ label: clean, kind, note: null, quote: quote.length >= MIN_QUOTE_LENGTH ? quote : clean });
  };
  const triggerIdx = lines.findIndex((l) => TRIGGER.test(l));
  if (triggerIdx >= 0) {
    let misses = 0;
    for (let i = triggerIdx + 1; i < Math.min(lines.length, triggerIdx + 45); i++) {
      const l = lines[i];
      if (!l) continue;
      const b = l.match(BULLET);
      if (b) {
        misses = 0;
        addDoc(b[1], l);
      } else if (++misses >= 3) break;
    }
  }
  if (draft.documents.length === 0) {
    for (const l of lines) {
      const b = l.match(BULLET);
      if (b && DOC_WORDS.test(b[1])) addDoc(b[1], l);
    }
  }

  // ---- Contact
  const email = text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
  if (email && email.index !== undefined) {
    const w = window(email.index, 220);
    const named = w.match(/(?:[Cc]ontact(?: [Pp]erson)?|ATTN|[Aa]ttn\.?|[Aa]ttention|[Bb]uyer|[Qq]uestions to)[:\s,]+(?:is\s+)?([A-Z][\w'.-]+(?:\s[A-Z][\w'.-]+){1,2})/);
    const fallback = text.slice(Math.max(0, email.index - 140), email.index).match(/([A-Z][a-z'.-]+(?:\s[A-Z][a-z'.-]+){1,2})(?=[,\s(]|$)(?![^,]*@)/g);
    const name = named?.[1] ?? fallback?.[fallback.length - 1] ?? null;
    const phone = w.match(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/);
    const title = name ? w.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")},\\s*([^,\\n@]{4,60}?)(?=,|\\n|$)`))?.[1] ?? null : null;
    draft.contact = { name, title, email: email[0], phone: phone ? phone[0] : null };
  }

  return draft;
}
