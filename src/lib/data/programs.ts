/**
 * Regional small-business and local-preference programs, encoded as data for
 * the Regional SLEB Passport. Every benefit sentence is a neutral summary of
 * the program's own public description, with the official domain cited. Where
 * `urlVerifiedOn` is null the page was not read on 2026-10-03 and the link is
 * the official domain only.
 *
 * Nothing here is an eligibility finding. The Passport shows what a program
 * recognizes and whether a vendor's self-reported profile suggests they could
 * apply; only each agency can certify a business.
 */

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
    definition: "A fixed office in Alameda County, a current business license, and at least six months of operation there.",
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
    definition: "Small, under five years in business, and at or under half the SBA size threshold (the County SLEB definition).",
    derivedFrom: "Headcount of 50 or fewer and fewer than five years in business on the profile.",
  },
  micro: {
    tag: "micro",
    label: "Micro",
    definition: "A California DGS microbusiness: a certified small business with 25 or fewer employees and receipts under the DGS cap.",
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
    definition: "Holds a federal program status such as DBE, HUD Section 3, WOSB, HUBZone or 8(a).",
    derivedFrom: "A federal program code listed on the profile.",
  },
};

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
  fundingLane: FundingLane[];
  jurisdiction: { kind: JurisdictionKind; counties?: string[]; cities?: string[] };
  /** Status tags a vendor would need for "likely to apply". */
  requires?: { tags?: StatusTag[]; anyOf?: StatusTag[][] };
  /** False for ownership- or income-based programs that a size/location profile cannot suggest. */
  derivable: boolean;
  reciprocity: string;
  officialUrl: string;
  urlVerifiedOn: "2026-10-03" | null;
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
    benefit: "Up to a 10% bid preference on County procurements over $25,000 (5% local plus 5% small or emerging); non-SLEB bidders are asked to subcontract 20% to a certified SLEB. Race- and gender-neutral.",
    fundingLane: ["local"],
    jurisdiction: { kind: "county", counties: ["Alameda"] },
    requires: { tags: ["county-local", "small"] },
    derivable: true,
    reciprocity: "County certification only. Accepted by OUSD's Local Business Utilization policy when the firm operates in Oakland.",
    officialUrl: "https://sleb.alamedacountyca.gov/",
    urlVerifiedOn: "2026-10-03",
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
    benefit: "Set-asides, bid discounts and evaluation preference for Oakland-certified local and small local firms, with participation goals on larger contracts.",
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["Oakland"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "City certification only. Accepted by OUSD's Local Business Utilization policy.",
    officialUrl: "https://www.oaklandca.gov/",
    urlVerifiedOn: null,
    notes: "Look up the Contracts and Compliance L/SLBE page.",
  },
  {
    id: "port-oakland-sbe",
    name: "Small and Very Small Business Enterprise (SBE / VSBE) Program",
    buyer: "Port of Oakland",
    agencyId: "port-of-oakland",
    recognizes: ["small"],
    tiers: [
      { code: "SBE", label: "Small Business Enterprise" },
      { code: "VSBE", label: "Very Small Business Enterprise" },
    ],
    certificationCodes: ["PORT_SBE"],
    benefit: "Preference points and set-asides for Port-certified small and very small businesses on Port contracts.",
    fundingLane: ["local"],
    jurisdiction: { kind: "none" },
    requires: { tags: ["small"] },
    derivable: true,
    reciprocity: "Port certification only. Accepted by OUSD's Local Business Utilization policy.",
    officialUrl: "https://www.portofoakland.com/",
    urlVerifiedOn: null,
    notes: "Look up the Social Responsibility Division SBE / VSBE page.",
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
    benefit: "Accepts California DGS SB and MB certification. Targets 50% of awards at or under $80,000 to small businesses, sets aside at least 25% of those, and applies a 7% bid discount.",
    fundingLane: ["local"],
    jurisdiction: { kind: "none" },
    requires: { tags: ["state-certified"] },
    derivable: true,
    reciprocity: "No separate certification; DGS certification is the key.",
    officialUrl: "https://www.ebmud.com/",
    urlVerifiedOn: null,
    notes: "Look up the Contract Equity Program page.",
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
    fundingLane: ["local"],
    jurisdiction: { kind: "city", cities: ["Oakland"] },
    requires: { tags: ["jurisdiction-local"] },
    derivable: true,
    reciprocity: "The clearest reciprocity in the region: other agencies' certifications are accepted outright for Oakland-based firms.",
    officialUrl: "https://www.ousd.org/",
    urlVerifiedOn: null,
    notes: "Look up the Local Business Utilization policy page.",
  },
  {
    id: "uc-berkeley-sb-first",
    name: "Small Business First (sheltered bidding)",
    buyer: "UC Berkeley",
    agencyId: "uc-berkeley",
    recognizes: ["state-certified", "small"],
    certificationCodes: ["DGS_SB", "DGS_MB", "DVBE"],
    benefit: "Sheltered bidding for DGS-certified small, micro and disabled-veteran businesses on qualifying campus purchases.",
    fundingLane: ["state"],
    jurisdiction: { kind: "none" },
    requires: { tags: ["state-certified"] },
    derivable: true,
    reciprocity: "DGS certification is the key; no separate campus certification.",
    officialUrl: "https://supplychain.berkeley.edu/",
    urlVerifiedOn: null,
    notes: "Look up the Small Business First page.",
  },
  {
    id: "haca-section-3",
    name: "HUD Section 3",
    buyer: "Housing Authority of the County of Alameda",
    agencyId: "haca",
    recognizes: ["federal-certified"],
    certificationCodes: ["SECTION_3"],
    benefit: "Hiring and contracting obligations on HUD-funded work that favor low-income residents and the businesses that employ them.",
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
    certificationCodes: ["DGS_SB", "DGS_MB", "DVBE"],
    benefit: "5% bid preference on state purchases, a 25% small business participation goal and a 3% DVBE goal. Registration through Cal eProcure; accepted by EBMUD and UC Berkeley.",
    fundingLane: ["state"],
    jurisdiction: { kind: "state" },
    requires: { tags: ["small"] },
    derivable: true,
    reciprocity: "The most widely accepted size certification in the region.",
    officialUrl: "https://www.dgs.ca.gov/",
    urlVerifiedOn: null,
    notes: "Look up the Office of Small Business and DVBE Services pages.",
  },
  {
    id: "sam-gov",
    name: "SAM.gov registration",
    buyer: "SAM.gov",
    agencyId: "sam-gov",
    recognizes: [],
    certificationCodes: ["SAM_REGISTERED"],
    benefit: "Required to bid on federal work. A registration, not a certification; small-business size is self-represented by NAICS code.",
    fundingLane: ["federal"],
    jurisdiction: { kind: "federal" },
    derivable: true,
    reciprocity: "Federal registration only.",
    officialUrl: "https://sam.gov/",
    urlVerifiedOn: null,
  },
  {
    id: "federal-dbe",
    name: "Disadvantaged Business Enterprise (DBE)",
    buyer: "U.S. Department of Transportation",
    recognizes: ["federal-certified"],
    certificationCodes: ["DBE"],
    benefit: "Participation goals on federally funded transportation work. An October 2025 rule removed the race- and sex-based presumptions; California is reevaluating certifications and is not setting new DBE goals during the reevaluation.",
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
    fundingLane: ["local"],
    jurisdiction: { kind: "none" },
    derivable: false,
    reciprocity: "Information-sharing, not reciprocal certification. The gap the Passport proposal is meant to close.",
    officialUrl: "https://sleb.alamedacountyca.gov/",
    urlVerifiedOn: null,
    notes: "Look up the Alliance page on the County SLEB site.",
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
    { title: "Each agency applies its own rule", detail: "Boundaries, funding lanes and bid rules stay with the buyer. Alameda CTC still excludes state and federal funds; Oakland still defines Oakland-local." },
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
    "Award dollars to small and local firms, by agency and funding lane",
    "Time from first registration to first award",
    "Certifications held per supplier (duplication across agencies)",
    "Subcontracting-goal attainment on larger contracts",
    "Certification lapses and renewals",
    "Bid participation by status tag",
    "Protest rate on preference decisions",
  ],
  legal:
    "California Constitution, Article I, section 31 (Proposition 209, applied to local contracting in Hi-Voltage Wire Works v. City of San Jose) bars race- and sex-based preferences in public contracting. Every status in this taxonomy is based on the size, location or age of the business. Ownership-diversity information is collected for outreach and reporting only and never changes a score, a preference or a standing in this tool.",
  eastBayAlliance:
    "Alameda County, Alameda CTC, the City of Oakland and the Port of Oakland already share a common application through the East Bay Interagency Alliance. It is information-sharing, not reciprocal certification: the proposal above is the next step.",
} as const;
