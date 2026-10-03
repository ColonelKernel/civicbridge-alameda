/**
 * Regional small-business and local-preference programs, encoded as data for
 * the Regional SLEB Passport and for the mechanism badges on every posting.
 * Each program lists its mechanisms: how it actually changes a bid (a
 * set-aside, directed spending, a preference, a participation goal, a
 * registration, or reporting only). Benefit sentences are neutral summaries
 * of the program's own public description; `urlVerifiedOn` records the day
 * the cited page was read.
 *
 * Nothing here is an eligibility finding. The Passport shows what a program
 * recognizes and whether a vendor's self-reported profile suggests they could
 * apply; only each agency can certify a business.
 */
import type { ProgramMechanism } from "./types";

export type StatusTag = "county-local" | "jurisdiction-local" | "small" | "emerging" | "micro" | "state-certified" | "federal-certified";
export type FundingLane = "local" | "state" | "federal" | "hud";
export type JurisdictionKind = "county" | "city" | "multi-county" | "state" | "federal" | "none";

export interface StatusTagDef {
  tag: StatusTag;
  label: string;
  definition: string;
  derivedFrom: string;
}

/** The shared status taxonomy: one vocabulary that every program below maps onto. */
export const STATUS_TAGS: Record<StatusTag, StatusTagDef> = {
  "county-local": {
    tag: "county-local",
    label: "County-local",
    definition: "A fixed office with a street address in Alameda County and a business license from the County or a city in it for at least six months (the County SLEB definition).",
    derivedFrom: "Your county on the profile. The office, license and six-month rules are not checked here.",
  },
  "jurisdiction-local": {
    tag: "jurisdiction-local",
    label: "City-local",
    definition: "Located in the city that is buying (Oakland-local, Hayward-local, and so on), under that city's own definition.",
    derivedFrom: "Your city on the profile, matched against the 14 cities in Alameda County.",
  },
  small: {
    tag: "small",
    label: "Small",
    definition: "At or under the SBA size standard for your industry, measured by headcount or receipts depending on the NAICS code.",
    derivedFrom: "Headcount of 100 or fewer on the profile. Receipts-based standards are not checked.",
  },
  emerging: {
    tag: "emerging",
    label: "Emerging",
    definition: "Meets one half of the SBA size standard, for up to five years (the County SLEB definition).",
    derivedFrom: "Headcount of 50 or fewer and fewer than five years in business on the profile.",
  },
  micro: {
    tag: "micro",
    label: "Micro",
    definition: "A California DGS microbusiness: a certified small business under the DGS microbusiness receipts and headcount caps.",
    derivedFrom: "Headcount of 25 or fewer on the profile. The receipts cap is not checked.",
  },
  "state-certified": {
    tag: "state-certified",
    label: "State-certified",
    definition: "Holds a California DGS certification: SB, MB, SB-PW or DVBE.",
    derivedFrom: "A DGS certification code listed on the profile.",
  },
  "federal-certified": {
    tag: "federal-certified",
    label: "Federal-certified",
    definition: "Holds a federal program status such as 8(a), HUBZone, SDVOSB, WOSB, DBE or HUD Section 3.",
    derivedFrom: "A federal program code listed on the profile.",
  },
};

export interface ProgramMechanismDef {
  kind: ProgramMechanism;
  /** One sentence in the program's own terms. */
  summary: string;
  percent?: number;
  threshold?: string;
}

export interface Program {
  id: string;
  name: string;
  /** How the buyer styles itself; matches Agency.displayName when agencyId is set. */
  buyer: string;
  agencyId?: string;
  recognizes: StatusTag[];
  tiers?: { code: string; label: string }[];
  /** Profile certification codes that mean "recognized" here. */
  certificationCodes: string[];
  /** Other agencies' certifications this program accepts. */
  acceptsCertificationCodes?: string[];
  benefit: string;
  /** How the program changes a bid, in the program's own terms. */
  mechanisms: ProgramMechanismDef[];
  fundingLane: FundingLane[];
  jurisdiction: { kind: JurisdictionKind; counties?: string[]; cities?: string[] };
  /** Status tags a vendor would need for "likely to apply". */
  requires?: { tags?: StatusTag[]; anyOf?: StatusTag[][] };
  /** False for ownership- or income-based programs that a size/location profile cannot suggest. */
  derivable: boolean;
  reciprocity: string;
  officialUrl: string;
  urlVerifiedOn: "2026-10-03" | null;
  /** Where to find certified firms (for teaming) and where to apply. */
  directoryUrl?: string;
  applyUrl?: string;
  processing?: string;
  definitions?: string;
  notes?: string;
}

export const PROGRAMS: Program[] = [
  {
    id: "alameda-county-sleb",
    name: "Small, Local and Emerging Business (SLEB) Program",
    buyer: "Alameda County GSA",
    agencyId: "alameda-county-gsa",
    recognizes: ["county-local", "small", "emerging"],
    certificationCodes: ["SLEB"],
    benefit:
      "Up to a 10% bid preference (5% for certified small or emerging status plus 5% for local). On contracts over $25,000, bidders that are not certified SLEBs must subcontract at least 20% of the estimated contract amount with a SLEB to be considered for award; departmental discretionary spending of $25,000 and under is directed to SLEBs. Race- and gender-neutral.",
    mechanisms: [
      { kind: "preference", percent: 10, summary: "Certified businesses receive a 5% bid preference and County-local businesses a further 5%; the maximum per contract is 10%.", threshold: "County solicitations apply it to procurements over $25,000" },
      {
        kind: "participation-goal",
        percent: 20,
        summary:
          "Businesses not meeting the local small or emerging definition must subcontract a minimum of 20% of the estimated contract amount with a SLEB to be considered for award. The County may waive it when no SLEB is available and the cost exceeds 5% of the contract or $10,000; its solicitations carry an Exceptions form.",
        threshold: "contracts over $25,000",
      },
      { kind: "directed-spend", summary: "Departmental discretionary spending for items $25,000 and under is directed towards SLEBs.", threshold: "$25,000 and under" },
    ],
    fundingLane: ["local"],
    jurisdiction: { kind: "county", counties: ["Alameda"] },
    requires: { tags: ["county-local", "small"] },
    derivable: true,
    reciprocity: "County certification only, shared through the East Bay Interagency Alliance common application. Accepted by OUSD's Local Business Utilization policy when the firm operates in Oakland.",
    officialUrl: "https://sleb.alamedacountyca.gov/about-sleb-alameda-county/components-sleb-alameda-county/",
    urlVerifiedOn: "2026-10-03",
    directoryUrl: "https://sleb.alamedacountyca.gov/sleb-alameda-county/find-a-supplier-sleb-alameda-county/",
    applyUrl: "https://sleb.alamedacountyca.gov/supplier-corner-sleb-alameda-county/certification-recertification-sleb-alameda-county/",
    processing: "Allow up to 45 business days; businesses are generally certified for one or two years. The County recommends certifying before you bid.",
    definitions:
      "Local: a fixed office with street address in Alameda County and a valid business license from the County or a city within it for at least six months. Small: meets the SBA size standard for its classification. Emerging: meets one half of the SBA size standard, for a maximum of five years.",
  },
  {
    id: "alameda-ctc-lbce",
    name: "Local Business Contract Equity (LBCE) Program",
    buyer: "Alameda CTC",
    agencyId: "alameda-ctc",
    recognizes: ["county-local", "small"],
    tiers: [
      { code: "LBE", label: "Local Business Enterprise" },
      { code: "SLBE", label: "Small Local Business Enterprise" },
      { code: "VSLBE", label: "Very Small Local Business Enterprise" },
    ],
    certificationCodes: ["ACTC_LBCE"],
    benefit: "Local, small-local and very-small-local participation goals on contracts paid with local funds only; not applied to state or federal funds.",
    mechanisms: [{ kind: "participation-goal", summary: "LBE, SLBE and VSLBE participation goals on contracts paid with local funds; primes meet them with certified subcontractors or their own certified work." }],
    fundingLane: ["local"],
    jurisdiction: { kind: "county", counties: ["Alameda"] },
    requires: { tags: ["county-local"] },
    derivable: true,
    reciprocity: "Separate certification. Shares the East Bay Interagency Alliance common application for information only.",
    officialUrl: "https://www.alamedactc.org/get-involved/contract-equity/",
    urlVerifiedOn: "2026-10-03",
  },
  {
    id: "oakland-lslbe",
    name: "Local and Small Local Business Enterprise (L/SLBE) Program",
    buyer: "City of Oakland",
    agencyId: "city-oakland",
    recognizes: ["jurisdiction-local", "small"],
    tiers: [
      { code: "LBE", label: "Local Business Enterprise" },
      { code: "SLBE", label: "Small Local Business Enterprise" },
      { code: "VSLBE", label: "Very Small Local Business Enterprise" },
    ],
    certificationCodes: ["OAKLAND_LSLBE"],
    benefit:
      "A 50% L/SLBE participation requirement on construction contracts at or over $100,000 and on professional services, commodities and goods at or over $50,000, met with at least 25% LBE and 25% SLBE participation; smaller contracts require outreach to at least three certified local firms. A 2% bid discount for meeting the 50% requirement, rising to 5% for L/SLBE and 10% for VSLBE participation; professional services use preference points (up to 5, or 10 for VSLBE) instead.",
    mechanisms: [
      {
        kind: "participation-goal",
        percent: 50,
        summary: "A 50% minimum participation requirement, met with at least 25% LBE and 25% SLBE participation (or 50% SLBE); VSLBE participation counts double.",
        threshold: "construction at or over $100,000; professional services, commodities and goods at or over $50,000",
      },
      { kind: "preference", percent: 2, summary: "A 2% bid discount for achieving the 50% requirement, up to 5% for L/SLBE and 10% for VSLBE participation; professional services earn up to 5 (or 10) preference points instead." },
    ],
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["Oakland"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "City certification only. Accepted by OUSD's Local Business Utilization policy.",
    officialUrl: "https://www.oaklandca.gov/topics/certification-recertification-for-small-and-local-businesses",
    urlVerifiedOn: "2026-10-03",
    applyUrl: "https://oaklandca.diversitycompliance.com/",
    definitions: "Certification requires a City of Oakland business tax certificate and a substantial presence in Oakland (the headquartered-in-Oakland rule ended January 6, 2025), plus the City's size standards.",
    notes: "Percentages from the L/SLBE Program Manual dated January 6, 2025.",
  },
  {
    id: "port-oakland-sbe",
    name: "Small and Very Small Business Enterprise (SBE / VSBE) Program",
    buyer: "Port of Oakland",
    agencyId: "port-of-oakland",
    recognizes: ["small", "county-local"],
    tiers: [
      { code: "SBE", label: "Small Business Enterprise" },
      { code: "VSBE", label: "Very Small Business Enterprise" },
    ],
    certificationCodes: ["PORT_SBE"],
    benefit:
      "Preference points for local-area, small (SBE, up to $36 million average gross revenue over three years) and very small (VSBE, up to $5 million) businesses: up to 10 points on construction bids, each translated to a percentage of the base bid, and up to 15 of 100 points in consultant selection. A Very Small Business Program limits selected projects to certified very small local businesses.",
    mechanisms: [
      { kind: "preference", summary: "Up to 10 preference points on public works bids, translated to a percentage of the total base bid, and up to 15 of 100 points in consultant selection. Certifications must be complete at the time of bid." },
      { kind: "set-aside", summary: "Very Small Business Program: bids or proposals for selected projects are limited to certified very small local businesses." },
    ],
    fundingLane: ["local"],
    jurisdiction: { kind: "multi-county", counties: ["Alameda", "Contra Costa"] },
    requires: { tags: ["small"] },
    derivable: true,
    reciprocity: "Port certification only. Accepted by OUSD's Local Business Utilization policy.",
    officialUrl: "https://www.portofoakland.com/business/small-local-business/",
    urlVerifiedOn: "2026-10-03",
    definitions: "Local Business Area: Alameda County and Contra Costa County, with a fixed location there for the preceding 12 months. SBE: average gross revenue not over $36,000,000 over three years; VSBE: not over $5,000,000.",
    notes: "Mechanisms from the Non-Discrimination and Small Local Business Utilization Policy (January 2019 edition).",
  },
  {
    id: "ac-transit-sbe-slbe",
    name: "Small Business Enterprise and Small Local Business Enterprise (non-federal)",
    buyer: "AC Transit",
    agencyId: "ac-transit",
    recognizes: ["small", "county-local"],
    tiers: [
      { code: "SBE", label: "Small Business Enterprise" },
      { code: "SLBE", label: "Small Local Business Enterprise" },
    ],
    certificationCodes: ["ACTRANSIT_SLBE"],
    benefit: "SBE and SLBE participation goals on contracts without federal funds.",
    mechanisms: [{ kind: "participation-goal", summary: "SBE and SLBE participation goals set per contract on non-federal work." }],
    fundingLane: ["local"],
    jurisdiction: { kind: "multi-county", counties: ["Alameda", "Contra Costa"] },
    requires: { tags: ["small"] },
    derivable: true,
    reciprocity: "District certification only.",
    officialUrl: "https://www.actransit.org/doing-business",
    urlVerifiedOn: "2026-10-03",
  },
  {
    id: "ac-transit-dbe",
    name: "Disadvantaged Business Enterprise (DBE) Program",
    buyer: "AC Transit",
    agencyId: "ac-transit",
    recognizes: ["federal-certified"],
    certificationCodes: ["DBE"],
    benefit: "DBE participation goals on federally funded contracts, under the federal rules described in the DBE entry below.",
    mechanisms: [{ kind: "participation-goal", summary: "DBE participation goals on federally funded contracts; a DBE prime's own work counts, others document good-faith efforts." }],
    fundingLane: ["federal"],
    jurisdiction: { kind: "none" },
    derivable: false,
    reciprocity: "California Unified Certification Program (CUCP) certification is recognized statewide.",
    officialUrl: "https://www.actransit.org/doing-business",
    urlVerifiedOn: "2026-10-03",
  },
  {
    id: "bart-sbe-lsb",
    name: "Small Business, Micro Small Business and Local Small Business programs",
    buyer: "BART",
    agencyId: "bart",
    recognizes: ["small", "county-local"],
    tiers: [
      { code: "SBE", label: "Small Business Enterprise" },
      { code: "MSBE", label: "Micro Small Business Enterprise" },
      { code: "LSB", label: "Local Small Business (Measure RR)" },
    ],
    certificationCodes: ["BART_LSB"],
    benefit: "Small business participation goals and, on Measure RR work, a local small business program for firms in Alameda, Contra Costa and San Francisco counties.",
    mechanisms: [{ kind: "participation-goal", summary: "Small business participation goals per contract; Measure RR projects add a local small business program." }],
    fundingLane: ["local"],
    jurisdiction: { kind: "multi-county", counties: ["Alameda", "Contra Costa", "San Francisco"] },
    requires: { tags: ["small"] },
    derivable: true,
    reciprocity: "District certification; DGS SB certification is commonly accepted as evidence of size.",
    officialUrl: "https://www.bart.gov/",
    urlVerifiedOn: null,
    notes: "Look up the Office of Civil Rights program page.",
  },
  {
    id: "ebmud-contract-equity",
    name: "Contract Equity Program",
    buyer: "EBMUD",
    agencyId: "ebmud",
    recognizes: ["state-certified", "small"],
    certificationCodes: [],
    acceptsCertificationCodes: ["DGS_SB", "DGS_MB"],
    benefit:
      "Accepts California DGS Small and Micro Business certification. A goal of awarding 50% of all annual contract awards of $80,000 or less to SBEs, with at least 25% of those awards set aside for SBEs, and a 7% bid discount (not to exceed $150,000 per contract year) on materials and supplies, on general services where price decides, and on the lump-sum bid for construction.",
    mechanisms: [
      { kind: "set-aside", percent: 25, summary: "A set-aside of at least 25% of all annual contract awards of $80,000 or less to SBEs, against a 50% goal.", threshold: "contract awards of $80,000 or less" },
      { kind: "preference", percent: 7, summary: "A 7% bid discount, not to exceed $150,000 per year of the contract, on materials and supplies contracts, general services contracts where price is the determining factor, and the lump-sum bid amount on construction contracts." },
    ],
    fundingLane: ["local"],
    jurisdiction: { kind: "none" },
    requires: { tags: ["state-certified"] },
    derivable: true,
    reciprocity: "No separate certification; DGS certification is the key.",
    officialUrl: "https://www.ebmud.com/business-center/contract-equity-program/key-components",
    urlVerifiedOn: "2026-10-03",
  },
  {
    id: "ousd-local-business",
    name: "Local Business Utilization Policy",
    buyer: "Oakland Unified School District",
    agencyId: "oakland-usd",
    recognizes: ["jurisdiction-local"],
    certificationCodes: [],
    acceptsCertificationCodes: ["SLEB", "OAKLAND_LSLBE", "PORT_SBE", "ACTC_LBCE"],
    benefit: "A 50% local participation goal and a 2% bid discount. Accepts County SLEB, City of Oakland, Port of Oakland, Alameda CTC, CPUC and Caltrans certifications when the firm operates in Oakland.",
    mechanisms: [
      { kind: "participation-goal", percent: 50, summary: "A 50% local business participation goal on District contracts." },
      { kind: "preference", percent: 2, summary: "A 2% bid discount for local business participation." },
    ],
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["Oakland"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "The clearest reciprocity in the region: other agencies' certifications are accepted outright for Oakland-based firms.",
    officialUrl: "https://www.ousd.org/facilities-planning-management/opportunities/lbu-policy/local-business-utilization",
    urlVerifiedOn: null,
    notes: "Confirm the percentages on the District's Local Business Utilization policy page.",
  },
  {
    id: "uc-berkeley-sb-first",
    name: "Small Business First",
    buyer: "UC Berkeley",
    agencyId: "uc-berkeley",
    recognizes: ["state-certified", "federal-certified", "small"],
    certificationCodes: ["DGS_SB", "DGS_MB", "DVBE"],
    acceptsCertificationCodes: ["SBA_8A", "HUBZONE", "SDVOSB", "VOSB", "WOSB"],
    benefit:
      "Non-construction purchases between $10,000 and $250,000 that are not federally funded are awarded to certified small businesses or DVBEs: one quote is enough below $100,000, two quotes from $100,000 to $250,000. Certification by DGS, the SBA or another recognized certifier counts. Suppliers register in CalUsource and SupplierOne.",
    mechanisms: [
      { kind: "set-aside", summary: "Non-construction contracts and procurements between $10,000 and $250,000 are awarded to certified small businesses and/or DVBEs; one quote below $100,000, two quotes from $100,000 to $250,000.", threshold: "$10,000 to $250,000, non-construction, not federally funded" },
    ],
    fundingLane: ["state"],
    jurisdiction: { kind: "none" },
    requires: { tags: ["small"] },
    derivable: true,
    reciprocity: "DGS or SBA certification is the key; no separate campus certification.",
    officialUrl: "https://procurement.ucop.edu/about-us/programs/small-business-first-program-uc-suppliers",
    urlVerifiedOn: "2026-10-03",
    notes: "Excludes sole-source, emergency, strategically sourced, federally funded, design and construction, interagency, research sub-award and patient-care purchases.",
  },
  {
    id: "haca-section-3",
    name: "HUD Section 3",
    buyer: "Housing Authority of the County of Alameda",
    agencyId: "haca",
    recognizes: ["federal-certified"],
    certificationCodes: ["SECTION_3"],
    benefit: "Hiring and contracting obligations on HUD-funded work that favor low-income residents and the businesses that employ them.",
    mechanisms: [{ kind: "participation-goal", summary: "Section 3 labor-hour benchmarks and priority consideration for Section 3 business concerns on HUD-funded work; contractors document best efforts." }],
    fundingLane: ["hud"],
    jurisdiction: { kind: "none" },
    derivable: false,
    reciprocity: "Section 3 business status is self-certified to HUD rules, per project.",
    officialUrl: "https://www.haca.net/procurement",
    urlVerifiedOn: "2026-10-03",
  },
  {
    id: "city-alameda-local",
    name: "Local business preference",
    buyer: "City of Alameda",
    agencyId: "city-alameda",
    recognizes: ["jurisdiction-local"],
    certificationCodes: [],
    benefit: "5% local preference on qualifying city purchases.",
    mechanisms: [{ kind: "preference", percent: 5, summary: "A 5% local preference on city purchases that qualify under the municipal code." }],
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["Alameda"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "City rule; no certification, usually a business license and local address.",
    officialUrl: "https://www.alamedaca.gov/",
    urlVerifiedOn: null,
  },
  {
    id: "city-berkeley-local",
    name: "Local business preference",
    buyer: "City of Berkeley",
    agencyId: "city-berkeley",
    recognizes: ["jurisdiction-local"],
    certificationCodes: [],
    benefit: "5% local preference on qualifying city purchases.",
    mechanisms: [{ kind: "preference", percent: 5, summary: "A 5% local preference on city purchases that qualify under the municipal code." }],
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["Berkeley"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "City rule; no certification, usually a business license and local address.",
    officialUrl: "https://berkeleyca.gov/",
    urlVerifiedOn: null,
  },
  {
    id: "city-fremont-local",
    name: "Local business preference",
    buyer: "City of Fremont",
    agencyId: "city-fremont",
    recognizes: ["jurisdiction-local"],
    certificationCodes: [],
    benefit: "2.5% preference on purchases of goods from Fremont businesses.",
    mechanisms: [{ kind: "preference", percent: 2.5, summary: "A 2.5% preference on purchases of goods from Fremont businesses." }],
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["Fremont"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "City rule; no certification, usually a business license and local address.",
    officialUrl: "https://www.fremont.gov/",
    urlVerifiedOn: null,
  },
  {
    id: "city-san-leandro-local",
    name: "Local business preference",
    buyer: "City of San Leandro",
    agencyId: "city-san-leandro",
    recognizes: ["jurisdiction-local"],
    certificationCodes: [],
    benefit: "10% local preference on purchases up to $50,000 and a 25% local participation goal on larger work.",
    mechanisms: [
      { kind: "preference", percent: 10, summary: "A 10% local preference on purchases up to $50,000.", threshold: "purchases up to $50,000" },
      { kind: "participation-goal", percent: 25, summary: "A 25% local participation goal on larger work." },
    ],
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["San Leandro"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "City rule; no certification, usually a business license and local address.",
    officialUrl: "https://www.sanleandro.org/",
    urlVerifiedOn: null,
  },
  {
    id: "city-pleasanton-local",
    name: "Local business preference",
    buyer: "City of Pleasanton",
    agencyId: "city-pleasanton",
    recognizes: ["jurisdiction-local"],
    certificationCodes: [],
    benefit: "5% local preference, capped at $5,000 per purchase.",
    mechanisms: [{ kind: "preference", percent: 5, summary: "A 5% local preference, capped at $5,000 per purchase." }],
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["Pleasanton"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "City rule; no certification, usually a business license and local address.",
    officialUrl: "https://www.cityofpleasantonca.gov/",
    urlVerifiedOn: null,
  },
  {
    id: "dgs-sb-mb",
    name: "California Small Business, Microbusiness and DVBE certification",
    buyer: "California DGS",
    agencyId: "cal-eprocure",
    recognizes: ["state-certified", "small", "micro"],
    tiers: [
      { code: "SB", label: "Small Business" },
      { code: "MB", label: "Microbusiness" },
      { code: "SB-PW", label: "Small Business for Public Works" },
      { code: "DVBE", label: "Disabled Veteran Business Enterprise" },
    ],
    certificationCodes: ["DGS_SB", "DGS_MB", "DGS_SB_PW", "DVBE"],
    benefit:
      "A 5% bid preference for certified small businesses on state solicitations, a 25% small business participation goal and a 3% DVBE participation goal. Under the SB/DVBE Option a state agency may award goods, services or IT valued from $5,000.01 to $249,999.99 to a certified SB, microbusiness or DVBE without advertising, after responsive quotes from at least two certified firms; a higher threshold applies to public works. Registration through Cal eProcure; accepted by EBMUD and UC.",
    mechanisms: [
      { kind: "set-aside", summary: "SB/DVBE Option: contracts for goods, services or IT valued from $5,000.01 to $249,999.99 may be awarded to a California certified SB, microbusiness or DVBE without advertising, upon responsive price quotations from at least two certified firms.", threshold: "$5,000.01 to $249,999.99 for goods, services and IT; a separate public works threshold" },
      { kind: "preference", percent: 5, summary: "A 5% small business bid preference on state solicitations." },
      { kind: "participation-goal", percent: 25, summary: "A 25% small business participation goal on state contracts." },
      { kind: "participation-goal", percent: 3, summary: "A 3% DVBE participation goal; a DVBE prime's own work counts, other bidders document good-faith efforts or subcontract." },
    ],
    fundingLane: ["state"],
    jurisdiction: { kind: "state" },
    requires: { tags: ["small"] },
    derivable: true,
    reciprocity: "The most widely accepted size certification in the region.",
    officialUrl: "https://www.dgs.ca.gov/PD/Resources/SCM/TOC/14/14-05-3",
    urlVerifiedOn: "2026-10-03",
    applyUrl: "https://caleprocure.ca.gov/",
    notes: "Certification is free through Cal eProcure; the SB/DVBE Option rules are in State Contracting Manual section 1405.3.",
  },
  {
    id: "sam-gov",
    name: "SAM.gov registration",
    buyer: "SAM.gov",
    agencyId: "sam-gov",
    recognizes: [],
    certificationCodes: ["SAM_REGISTERED"],
    benefit: "Required before any federal award. A registration, not a certification; small-business size is self-represented by NAICS code.",
    mechanisms: [{ kind: "registration", summary: "An active SAM.gov registration with a Unique Entity ID is required before a federal contract award; renew every year." }],
    fundingLane: ["federal"],
    jurisdiction: { kind: "federal" },
    derivable: true,
    reciprocity: "Federal registration only.",
    officialUrl: "https://sam.gov/",
    urlVerifiedOn: null,
  },
  {
    id: "sba-set-aside",
    name: "Small business set-asides (FAR Part 19, the Rule of Two)",
    buyer: "SAM.gov",
    agencyId: "sam-gov",
    recognizes: ["small"],
    certificationCodes: ["SBA_SMALL"],
    benefit:
      "Federal acquisitions above the micro-purchase threshold and up to the simplified acquisition threshold are set aside for small businesses unless the contracting officer does not expect offers from two or more responsible small businesses; above that threshold, set aside when two or more are expected and award at fair market prices (FAR 19.502-2). Size is self-represented in SAM.gov against the NAICS size standard.",
    mechanisms: [
      { kind: "set-aside", summary: "Acquisitions above the micro-purchase threshold but not over the simplified acquisition threshold shall be set aside for small business unless the contracting officer determines there is not a reasonable expectation of offers from two or more responsible small business concerns; larger acquisitions are set aside under the Rule of Two.", threshold: "between the micro-purchase and simplified acquisition thresholds (FAR 2.101; $15,000 and $350,000 as of 2026), and above under the Rule of Two" },
    ],
    fundingLane: ["federal"],
    jurisdiction: { kind: "federal" },
    requires: { tags: ["small"] },
    derivable: true,
    reciprocity: "No certificate: size is a self-representation in SAM.gov against the NAICS size standard, which the SBA may review on protest.",
    officialUrl: "https://www.acquisition.gov/far/19.502-2",
    urlVerifiedOn: "2026-10-03",
  },
  {
    id: "sba-socioeconomic",
    name: "SBA socio-economic set-asides: 8(a), HUBZone, SDVOSB and WOSB",
    buyer: "SAM.gov",
    agencyId: "sam-gov",
    recognizes: ["federal-certified"],
    tiers: [
      { code: "8A", label: "8(a) Business Development" },
      { code: "HUBZONE", label: "HUBZone" },
      { code: "SDVOSB", label: "Service-Disabled Veteran-Owned Small Business" },
      { code: "WOSB", label: "Women-Owned Small Business / EDWOSB" },
    ],
    certificationCodes: ["SBA_8A", "HUBZONE", "SDVOSB", "VOSB", "WOSB"],
    benefit: "Contracting officers may set aside, and in some programs sole-source, federal awards to certified 8(a), HUBZone, service-disabled veteran-owned and women-owned small businesses. Federal lane only; these ownership-based statuses never affect a state or local score.",
    mechanisms: [{ kind: "set-aside", summary: "Set-asides and, within program limits, sole-source awards reserved for firms holding the certification (FAR subparts 19.8, 19.13, 19.14 and 19.15)." }],
    fundingLane: ["federal"],
    jurisdiction: { kind: "federal" },
    derivable: false,
    reciprocity: "SBA certification (certify.sba.gov or VetCert); no reciprocity with state or local programs.",
    officialUrl: "https://www.sba.gov/federal-contracting/contracting-assistance-programs",
    urlVerifiedOn: null,
  },
  {
    id: "federal-dbe",
    name: "Disadvantaged Business Enterprise (DBE)",
    buyer: "U.S. Department of Transportation",
    recognizes: ["federal-certified"],
    certificationCodes: ["DBE"],
    benefit: "Participation goals on federally funded transportation work. An October 2025 rule removed the race- and sex-based presumptions; California is reevaluating certifications and is not setting new DBE goals during the reevaluation.",
    mechanisms: [{ kind: "participation-goal", summary: "Contract-level DBE participation goals on federally funded transportation work; a DBE prime's own work counts." }],
    fundingLane: ["federal"],
    jurisdiction: { kind: "federal" },
    derivable: false,
    reciprocity: "CUCP certification is recognized by every California recipient of federal transportation funds.",
    officialUrl: "https://www.transportation.gov/",
    urlVerifiedOn: null,
  },
  {
    id: "cpuc-go156",
    name: "CPUC General Order 156 supplier program",
    buyer: "CPUC-regulated utilities",
    recognizes: [],
    certificationCodes: [],
    benefit: "Utilities are encouraged to spend 23% with diverse suppliers. A reporting program for private utilities, not a public bid preference.",
    mechanisms: [{ kind: "reporting", summary: "Utilities report spending with Supplier Clearinghouse-certified firms; no bid preference or set-aside." }],
    fundingLane: ["state"],
    jurisdiction: { kind: "none" },
    derivable: false,
    reciprocity: "Supplier Clearinghouse certification; accepted by OUSD's local policy as evidence.",
    officialUrl: "https://www.cpuc.ca.gov/",
    urlVerifiedOn: null,
  },
  {
    id: "east-bay-interagency-alliance",
    name: "East Bay Interagency Alliance common application",
    buyer: "Alameda County, Alameda CTC, City of Oakland and Port of Oakland",
    recognizes: [],
    certificationCodes: [],
    benefit: "One application form shared by four agencies for information only. Each agency still certifies separately under its own rules.",
    mechanisms: [],
    fundingLane: ["local"],
    jurisdiction: { kind: "none" },
    derivable: false,
    reciprocity: "Information-sharing, not reciprocal certification. The gap the Passport proposal is meant to close.",
    officialUrl: "https://sleb.alamedacountyca.gov/supplier-corner-sleb-alameda-county/certification-recertification-sleb-alameda-county/",
    urlVerifiedOn: "2026-10-03",
    notes: "The County's certification page states that it shares a Common Application with the other EBIA agencies.",
  },
];

export const PROGRAM_BY_ID: Record<string, Program> = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

/** The order a small East Bay firm would usually stack certifications. */
export const RECOMMENDED_STACK: string[] = [
  "dgs-sb-mb",
  "alameda-county-sleb",
  "alameda-ctc-lbce",
  "ac-transit-sbe-slbe",
  "bart-sbe-lsb",
  "port-oakland-sbe",
  "ebmud-contract-equity",
  "sam-gov",
];

export const FUNDING_LANE_LABELS: Record<FundingLane, string> = {
  local: "Local funds",
  state: "State funds",
  federal: "Federal funds",
  hud: "HUD funds",
};

export const HARMONIZATION = {
  steps: [
    { title: "One application, shared evidence", detail: "A vendor files one profile with the shared status taxonomy and the same proof documents every agency already asks for." },
    { title: "Common supplier profile and status codes", detail: "Each fact (county-local, small, emerging, state-certified) is checked once and stamped with who verified it and when." },
    { title: "Each agency applies its own rule", detail: "Boundaries, funding lanes and mechanisms stay with the buyer: the County's 20% subcontracting rule, Oakland's 50% participation requirement, EBMUD's set-aside, UC's Small Business First." },
    { title: "Shared directory and outcome dashboard", detail: "One searchable directory and one set of outcome metrics, so every buyer and every vendor can see what the programs actually deliver." },
  ],
  alumniBadge: {
    name: "Regional SLEB alumni badge",
    definition:
      "A supplier that held an active small-local certification (County SLEB or an equivalent in this list) for at least one full term, completed at least one public contract in good standing, and has since outgrown the size threshold.",
    confers: [
      "A portable, verifiable history: certifying agency, dates held, contracts completed, no debarment.",
      "Listing as a mentor or prime for SLEB subcontracting goals.",
      "Inclusion in the shared outcome metrics as a program graduate.",
    ],
    doesNotConfer: [
      "Any bid preference, set-aside, discount or evaluation points.",
      "Any certification, registration or standing with any agency.",
      "Any exemption from an agency's own boundary, funding lane or bid rule.",
    ],
  },
  metrics: [
    "Award dollars to small and local firms, by agency, funding lane and mechanism",
    "Time from first registration to first award",
    "Certifications held per supplier (duplication across agencies)",
    "Subcontracting-goal attainment on larger contracts",
    "Certification lapses and renewals",
    "Bid participation by status tag",
    "Protest rate on preference decisions",
  ],
  legal:
    "California Constitution, Article I, section 31 (Proposition 209, applied to local contracting in Hi-Voltage Wire Works v. City of San Jose) bars race- and sex-based preferences in state and local public contracting. Every state and local status in this taxonomy is based on the size, location or age of the business. Federal ownership-based programs (8(a), WOSB, SDVOSB, DBE) apply only on the federal lane and only when a solicitation states them. Ownership-diversity information is collected for outreach and reporting only and never changes a score, a preference or a standing in this tool.",
  eastBayAlliance:
    "Alameda County, Alameda CTC, the City of Oakland and the Port of Oakland already share a common application through the East Bay Interagency Alliance. It is information-sharing, not reciprocal certification: the proposal above is the next step.",
} as const;
