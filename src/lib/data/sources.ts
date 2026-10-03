/**
 * Solicitation sources. Every source normalizes its records into the shared
 * `Solicitation` schema so the engine never cares where a record came from.
 *
 * - SampleSource: the hand-entered dataset shipped with the app.
 * - PastedSource: records the user created from pasted text (kept in the browser).
 * - CountyPortalSource / AgencyListingSource: stubs showing where a live feed
 *   (OpenGov JSON, Bonfire, an HTML listing scraper, a CSV export) plugs in.
 */
import { SolicitationSchema, type Solicitation, type SolicitationInput, type SolicitationSource } from "./types";
import { normalizeText } from "./synonyms";

export class SolicitationValidationError extends Error {
  constructor(
    public readonly index: number,
    public readonly id: string | undefined,
    public readonly issues: string[],
  ) {
    super(`Solicitation #${index} (${id ?? "no id"}) failed validation: ${issues.join("; ")}`);
  }
}

/** Parse + validate raw records. Throws on the first invalid record with a readable message. */
export function parseSolicitations(inputs: unknown[]): Solicitation[] {
  return inputs.map((raw, i) => {
    const result = SolicitationSchema.safeParse(raw);
    if (!result.success) {
      const id = typeof raw === "object" && raw && "id" in raw ? String((raw as { id: unknown }).id) : undefined;
      throw new SolicitationValidationError(
        i,
        id,
        result.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`),
      );
    }
    return result.data;
  });
}

/** Every quote in a record should be findable in its sourceExcerpt (after normalization). */
export function findUnverifiedQuotes(s: Solicitation): string[] {
  const hay = normalizeText(s.sourceExcerpt);
  const bad: string[] = [];
  const check = (path: string, quote?: string) => {
    if (!quote) return;
    if (!hay.includes(normalizeText(quote))) bad.push(`${path}: "${quote.slice(0, 60)}…"`);
  };
  s.requirements.licenses.forEach((l, i) => check(`requirements.licenses[${i}]`, l.quote));
  s.requirements.certifications.forEach((c, i) => check(`requirements.certifications[${i}]`, c.quote));
  s.requirements.insurance.forEach((c, i) => check(`requirements.insurance[${i}]`, c.quote));
  s.requirements.bonding.forEach((b, i) => check(`requirements.bonding[${i}]`, b.quote));
  s.requirements.other.forEach((o, i) => check(`requirements.other[${i}]`, o.quote));
  check("requirements.location", s.requirements.location.quote);
  check("requirements.experience", s.requirements.experience?.quote);
  check("requirements.statedStaffingMin", s.requirements.statedStaffingMin?.quote);
  check("estimatedValue", s.estimatedValue?.quote ?? undefined);
  check("dates.preBidMeeting", s.dates.preBidMeeting?.quote);
  check("dates.preBidMeeting.prerequisite", s.dates.preBidMeeting?.prerequisite?.quote);
  check("dates.siteVisit", s.dates.siteVisit?.quote);
  check("dates.siteVisit.prerequisite", s.dates.siteVisit?.prerequisite?.quote);
  s.documents.forEach((d, i) => check(`documents[${i}]`, d.quote));
  return bad;
}

export function makeStaticSource(id: string, label: string, inputs: SolicitationInput[]): SolicitationSource {
  let cache: Solicitation[] | null = null;
  return {
    id,
    label,
    async load() {
      if (!cache) cache = parseSolicitations(inputs);
      return cache;
    },
  };
}

/**
 * Stub for a live County feed. The OpenGov portal is a JavaScript app; a
 * server-side job would fetch its JSON (or scrape the GSA HTML listing at
 * gsa.acgov.org/do-business-with-us/contracting-opportunities/), download each
 * solicitation document, run it through `engine/extract` (Claude or the
 * heuristic parser), validate with `parseSolicitations`, and cache the result.
 */
export const countyPortalSource: SolicitationSource = {
  id: "county-portal",
  label: "County of Alameda Procurement Portal (live, not wired)",
  async load() {
    throw new Error(
      "countyPortalSource.load() is a stub. Implement a server-side fetch of the GSA listing or OpenGov JSON, extract each document, then return parseSolicitations(records).",
    );
  },
};
