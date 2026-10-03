/**
 * Profile autofill: turn a capability statement, an "about us" page or any
 * pasted text into a draft BusinessProfile. The heuristic path runs anywhere;
 * the Claude path (server only) returns the same shape. Both carry a quote for
 * every extracted fact, and `verifyDraft` drops anything whose quote is not in
 * the text, so nothing reaches the form that the source does not back up.
 * The owner reviews and edits every field before it is saved.
 */
import { z } from "zod";
import { CATEGORIES, INSURANCE_TYPES, type Category, type InsuranceType } from "@/lib/data/types";
import { CERTIFICATIONS } from "@/lib/data/certifications";
import { normalizeLicenseCode, normalizeText } from "@/lib/data/synonyms";
import { inferCategory } from "../infer-category";
import { ALAMEDA_CITIES } from "../passport";

export const ProfileDraftSchema = z.object({
  name: z.string().nullable(),
  description: z.string().nullable(),
  city: z.string().nullable(),
  county: z.enum(["Alameda", "Other"]).nullable(),
  employeeCount: z.number().nullable(),
  yearsInBusiness: z.number().nullable(),
  capabilities: z.array(z.string()),
  keywords: z.array(z.string()),
  licenses: z.array(z.string()),
  certifications: z.array(z.string()),
  insurance: z.array(z.string()),
  primaryCategory: z.enum(CATEGORIES).nullable(),
  evidence: z.array(z.object({ field: z.string(), quote: z.string() })),
});
export type ProfileDraft = z.infer<typeof ProfileDraftSchema>;

const CURRENT_YEAR = 2026;

const CERT_PATTERNS: Record<string, RegExp> = {
  SLEB: /\bSLEB\b|small,? local,? (and|&) emerging/i,
  DIR: /\bDIR\b[^.]{0,40}(regist|number|#)|public works (contractor )?registration/i,
  DGS_SB: /\b(DGS|California|CA|state)[ -]certified small business\b|\bsmall business \(SB\)|\bSB (certified|cert\.?|#)/i,
  DGS_MB: /\bmicro-?business\b/i,
  DVBE: /\bDVBE\b/,
  DBE: /\bDBE\b/,
  SECTION_3: /\bsection 3\b/i,
  SAM_REGISTERED: /\bSAM(\.gov)?\b[^.]{0,30}(regist|active)|\bUEI\b|\bCAGE code\b/i,
  SERVSAFE: /\bserv ?safe\b/i,
  COURT_INTERPRETER: /court[- ]certified interpreter|certified court interpreter/i,
  ATA: /\bATA[- ]certified\b/i,
  MEDI_CAL_PROVIDER: /\bmedi-?cal (certified )?provider\b/i,
  EVITP: /\bEVITP\b/,
  ASE: /\bASE[- ]certified\b/i,
  BSIS_PPO: /\bBSIS\b|\bPPO\s*#?\s*\d+/i,
  ISA_ARBORIST: /\bISA[- ]certified arborist\b|certified arborist/i,
  RID: /\bRID[- ]certified\b|\bBEI\b/,
  QEI: /\bQEI\b/,
  BICSI: /\bBICSI\b/,
  OAKLAND_LSLBE: /\b(L\/SLBE|SLBE|LBE)\b[^.]{0,40}Oakland|Oakland[^.]{0,40}\b(L\/SLBE|SLBE|LBE)\b/i,
  ACTC_LBCE: /Alameda CTC|\bLBCE\b|\bVSLBE\b/i,
  PORT_SBE: /Port of Oakland[^.]{0,40}\b(SBE|VSBE)\b/i,
  ACTRANSIT_SLBE: /AC Transit[^.]{0,40}\b(SLBE|SBE)\b/i,
  BART_LSB: /\bBART\b[^.]{0,40}(small business|\bLSB\b|\bSBE\b)/i,
};

const INSURANCE_PATTERNS: [InsuranceType | string, RegExp][] = [
  ["general-liability", /general liability|\bCGL\b/i],
  ["auto", /\bcommercial auto\b|\bauto(mobile)? (liability|insurance|coverage)\b/i],
  ["workers-comp", /workers'? comp(ensation)?/i],
  ["professional", /professional liability|errors (and|&) omissions|\bE&O\b/i],
  ["umbrella", /\bumbrella\b|excess liability/i],
  ["cyber", /cyber (liability|insurance)/i],
  ["pollution", /pollution liability/i],
];

function sentenceAround(text: string, index: number, len: number): string {
  const start = Math.max(0, text.lastIndexOf("\n", index), text.lastIndexOf(". ", index) + 1);
  const endCandidates = [text.indexOf("\n", index + len), text.indexOf(". ", index + len)].filter((n) => n !== -1);
  const end = endCandidates.length ? Math.min(...endCandidates) + 1 : Math.min(text.length, index + len + 120);
  return text.slice(start, end).trim().slice(0, 240);
}

function quoteFor(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  if (!m || m.index === undefined) return null;
  return sentenceAround(text, m.index, m[0].length);
}

function cleanLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function heuristicProfileExtract(raw: string, hint: { url?: string } = {}): ProfileDraft {
  const text = raw.replace(/\r\n/g, "\n");
  const lines = cleanLines(text);
  const evidence: ProfileDraft["evidence"] = [];
  const push = (field: string, quote: string | null) => {
    if (quote) evidence.push({ field, quote });
  };

  // Name: an explicit label, else a short title-like first line, else the site host.
  let name: string | null = null;
  const nameLine = lines.find((l) => /^(company|business|firm) name\s*[:\-]/i.test(l));
  if (nameLine) name = nameLine.replace(/^(company|business|firm) name\s*[:\-]\s*/i, "").trim();
  else if (lines[0] && lines[0].length <= 60 && !/:$/.test(lines[0]) && lines[0].split(" ").length <= 8) name = lines[0];
  else if (hint.url) {
    try {
      name = new URL(hint.url).hostname.replace(/^www\./, "").split(".")[0].replace(/[-_]/g, " ");
    } catch {
      name = null;
    }
  }
  push("name", name);

  // Description: the first substantial paragraph, preferring an about/overview section.
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 80);
  const aboutIdx = lines.findIndex((l) => /^(about( us)?|overview|company (overview|profile)|who we are|capabilit(y|ies) statement)\b/i.test(l));
  let description: string | null = null;
  if (aboutIdx >= 0) {
    const after = lines.slice(aboutIdx + 1).find((l) => l.length >= 80);
    description = after ?? null;
  }
  if (!description) description = paras[0] ?? null;
  if (description) description = description.slice(0, 600);
  push("description", description);

  // City and county.
  // Prefer "City, CA 9xxxx" style mentions; ignore "Alameda County" (the county, not the city).
  let city: string | null = null;
  const hits: { c: string; index: number; len: number; strong: boolean }[] = [];
  for (const c of ALAMEDA_CITIES) {
    const re = new RegExp(`\\b${c.replace(" ", "\\s+")}\\b(?!\\s+County)(,?\\s*(CA|California)\\b(\\s*\\d{5})?)?`, "gi");
    for (const m of text.matchAll(re)) hits.push({ c, index: m.index ?? 0, len: m[0].length, strong: !!m[1] });
  }
  hits.sort((a, b) => Number(b.strong) - Number(a.strong) || a.index - b.index);
  if (hits[0]) {
    city = hits[0].c;
    push("city", sentenceAround(text, hits[0].index, hits[0].len));
  }
  if (!city) {
    const m = /\b([A-Z][a-z]+(?: [A-Z][a-z]+)?),\s*(CA|California)\b/.exec(text);
    if (m) {
      city = m[1];
      push("city", sentenceAround(text, m.index, m[0].length));
    }
  }
  const county: ProfileDraft["county"] = city && ALAMEDA_CITIES.includes(city) ? "Alameda" : /alameda county/i.test(text) ? "Alameda" : city ? "Other" : null;

  // Headcount and years.
  let employeeCount: number | null = null;
  const emp = /\b(\d{1,4})\+?\s*(employees|staff|people|team members|technicians|workers|crew)\b/i.exec(text) ?? /\bteam of (\d{1,4})\b/i.exec(text);
  if (emp) {
    employeeCount = Number(emp[1]);
    push("employeeCount", sentenceAround(text, emp.index, emp[0].length));
  }
  let yearsInBusiness: number | null = null;
  const yrs = /\b(\d{1,2})\+?\s*years?\s+(of\s+)?(experience|in business|serving|in the (trade|industry))/i.exec(text);
  const since = /\b(since|established|founded|est\.?)\s*(in\s*)?((19|20)\d{2})\b/i.exec(text);
  if (yrs) {
    yearsInBusiness = Number(yrs[1]);
    push("yearsInBusiness", sentenceAround(text, yrs.index, yrs[0].length));
  } else if (since) {
    yearsInBusiness = Math.max(0, CURRENT_YEAR - Number(since[3]));
    push("yearsInBusiness", sentenceAround(text, since.index, since[0].length));
  }

  // Licenses: CSLB classes.
  const licenses = new Set<string>();
  for (const m of text.matchAll(/\b(?:CSLB|contractor'?s? license|license(?: class)?)\s*#?\s*[:\-]?\s*((?:[ABC]-?\d{1,2}|[ABC])\b(?:\s*[,/&]\s*(?:[ABC]-?\d{1,2}|[ABC])\b)*)/gi)) {
    for (const code of m[1].split(/\s*[,/&]\s*/)) {
      const n = normalizeLicenseCode(code);
      if (/^([ABC]|C-\d{1,2})$/.test(n)) {
        licenses.add(n);
        push("licenses", sentenceAround(text, m.index ?? 0, m[0].length));
      }
    }
  }
  for (const m of text.matchAll(/\bClass\s+([ABC])\b(?!-)/g)) {
    licenses.add(m[1]);
    push("licenses", sentenceAround(text, m.index ?? 0, m[0].length));
  }
  for (const m of text.matchAll(/\b(C-\d{1,2})\b/g)) {
    licenses.add(m[1]);
    push("licenses", sentenceAround(text, m.index ?? 0, m[0].length));
  }

  // Certifications from the shared catalog.
  const certifications: string[] = [];
  for (const def of CERTIFICATIONS) {
    const re = CERT_PATTERNS[def.code];
    if (!re) continue;
    const q = quoteFor(text, re);
    if (q) {
      certifications.push(def.code);
      push("certifications", q);
    }
  }

  // Insurance types mentioned.
  const insurance: string[] = [];
  for (const [type, re] of INSURANCE_PATTERNS) {
    if (!(INSURANCE_TYPES as readonly string[]).includes(type)) continue;
    const q = quoteFor(text, re);
    if (q) {
      insurance.push(type);
      push("insurance", q);
    }
  }

  // Capabilities: short bullet lines, or a "Services:" list.
  const capabilities: string[] = [];
  let capQuote: string | null = null;
  for (const l of lines) {
    const b = /^[•\-*–·]\s*(.{3,70})$/.exec(l);
    if (b && !/\d{3}[-.)]\d{3}/.test(b[1]) && !/@/.test(b[1])) {
      capabilities.push(b[1].replace(/[.;]$/, ""));
      capQuote ??= b[1];
    }
    if (capabilities.length >= 12) break;
  }
  const services = lines.find((l) => /^(services|capabilities|core (services|competencies)|what we do)\s*[:\-]/i.test(l));
  if (services) {
    for (const s of services.replace(/^[^:\-]+[:\-]\s*/, "").split(/[,;•|]+/)) {
      const v = s.trim();
      if (v.length >= 3 && v.length <= 60 && !capabilities.includes(v)) capabilities.push(v);
    }
    capQuote ??= services;
  }
  if (capabilities.length) push("capabilities", capQuote);

  // Keywords: NAICS and UNSPSC codes.
  const keywords: string[] = [];
  for (const m of text.matchAll(/\bNAICS\s*(code)?s?\s*[:#]?\s*((\d{6})(\s*[,/]\s*\d{6})*)/gi)) {
    for (const code of m[2].split(/\s*[,/]\s*/)) keywords.push(`NAICS ${code}`);
    push("keywords", sentenceAround(text, m.index ?? 0, m[0].length));
  }

  const inferred = inferCategory({ name: name ?? "", description: description ?? "", capabilities, keywords, licenses: Array.from(licenses).map((code) => ({ code })), certifications });
  const primaryCategory: Category | null = inferred.category ?? null;

  return {
    name,
    description,
    city,
    county,
    employeeCount,
    yearsInBusiness,
    capabilities: Array.from(new Set(capabilities)).slice(0, 12),
    keywords: Array.from(new Set(keywords)).slice(0, 8),
    licenses: Array.from(licenses),
    certifications: Array.from(new Set(certifications)),
    insurance: Array.from(new Set(insurance)),
    primaryCategory,
    evidence,
  };
}

/** Keep only facts whose quote appears in the text (same rule as solicitation extraction). */
export function verifyDraft(draft: ProfileDraft, text: string): { draft: ProfileDraft; dropped: string[] } {
  const hay = normalizeText(text);
  const ok = (q: string) => q.length >= 6 && hay.includes(normalizeText(q));
  const kept = draft.evidence.filter((e) => ok(e.quote));
  const keptFields = new Set(kept.map((e) => e.field));
  const dropped = Array.from(new Set(draft.evidence.filter((e) => !ok(e.quote)).map((e) => e.field)));
  const keep = <T>(field: string, value: T, empty: T): T => (keptFields.has(field) ? value : empty);
  return {
    draft: {
      ...draft,
      name: keep("name", draft.name, null),
      description: keep("description", draft.description, null),
      city: keep("city", draft.city, null),
      county: draft.city && keptFields.has("city") ? draft.county : null,
      employeeCount: keep("employeeCount", draft.employeeCount, null),
      yearsInBusiness: keep("yearsInBusiness", draft.yearsInBusiness, null),
      capabilities: keep("capabilities", draft.capabilities, []),
      keywords: keep("keywords", draft.keywords, []),
      licenses: keep("licenses", draft.licenses, []),
      certifications: keep("certifications", draft.certifications, []),
      insurance: keep("insurance", draft.insurance, []),
      evidence: kept,
    },
    dropped: dropped.filter((f) => !keptFields.has(f)),
  };
}

/** Strip a fetched HTML page down to readable text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
