/**
 * Curated sample solicitations, modeled closely on the format of real County
 * of Alameda GSA solicitations (calendar of events, Exhibit A bid response
 * packet, SLEB preference, 2:00 p.m. portal submission). They are NOT live
 * postings; contacts use the reserved `.example` domain so nobody emails them.
 *
 * Every `quote` must appear in the record's `sourceExcerpt`.
 */
import type { Category, CivicDate, MoneyRange, SolicitationInput } from "./types";
import { COUNTY_PORTAL } from "./solicitations.real";

const BOILERPLATE = `All proposal documents must be completed, successfully uploaded, and submitted online through County of Alameda Procurement Portal BY 2:00 p.m. on the due date specified in the Calendar of Events. Bidders must submit pricing on the County provided Excel Bid Form.
If a Bidder is certified by the County as either a small and local or an emerging and local business (SLEB), the County will provide up to 5% bid preference for procurements over $25,000. If a Bidder is located within Alameda County, the County may provide a 5% local bid preference. Bidders that are not certified SLEBS are required to subcontract with a SLEB for at least 20% of the total estimated bid amount. If a bidder is unable to meet the SLEB requirements, they must take exception to this requirement in the Exceptions and Clarifications section of this solicitation.
The following pages require a signature: Exhibit A – Bid Response Packet, Bidder Acceptance; Exhibit A – Bid Response Packet, Debarment and Suspension Certification; Exhibit A – Bid Response Packet, Small Local Emerging Business (SLEB) Information Sheet.
Insurance certificates are not required at the time of submission; the Bidder agrees to meet the minimum insurance requirements before award. Commercial General Liability $1,000,000 per occurrence; Commercial or Business Automobile Liability $1,000,000 per occurrence; Workers' Compensation and Employers Liability as required by State of California, $1,000,000 per accident for bodily injury or disease.`;

const PUBLIC_WORKS_CLAUSE = `Labor Compliance/Prevailing Wage: This is a public works project and is subject to monitoring by the Department of Industrial Relations (DIR). All contractors performing work on Public Works projects are required to be registered with the DIR and must pay prevailing wages and submit certified payroll.`;

type Bond = { type: "bid" | "performance" | "payment"; percent?: number; quote?: string };

interface CuratedSpec {
  id: string;
  number: string;
  title: string;
  department: string;
  type: SolicitationInput["type"];
  category: Category;
  secondary?: Category[];
  summary: string;
  description: string;
  value: MoneyRange | null;
  term?: string;
  posted: string;
  preBid?: { date: string; time?: string; mandatory: boolean; location: string; virtual?: boolean; quote: string; prerequisite?: { label: string; due: CivicDate; quote: string } };
  siteVisit?: { date: string; time?: string; mandatory: boolean; location: string; quote: string };
  questionsDue?: CivicDate;
  due: CivicDate;
  award?: string;
  start?: string;
  licenses?: { code: string; label: string; quote: string }[];
  certs?: { code: string; label: string; required: boolean; quote: string }[];
  insuranceExtra?: SolicitationInput["requirements"]["insurance"];
  professional?: boolean;
  location?: SolicitationInput["requirements"]["location"];
  experience?: { years: number; description: string; quote: string };
  bonding?: Bond[];
  publicWorks?: boolean;
  livingWage?: boolean;
  statedStaffingMin?: { count: number; quote: string };
  other?: { label: string; quote?: string }[];
  docsExtra?: SolicitationInput["documents"];
  docsMinimal?: boolean;
  scopeTags?: SolicitationInput["scopeTags"];
  contact: { name: string; email: string; phone?: string; title?: string };
  excerpt: string;
  status?: SolicitationInput["status"];
}

function curated(s: CuratedSpec): SolicitationInput {
  const insurance: SolicitationInput["requirements"]["insurance"] = [
    { type: "general-liability", limit: 1_000_000, aggregate: 2_000_000, quote: "Commercial General Liability $1,000,000 per occurrence" },
    { type: "auto", limit: 1_000_000, quote: "Commercial or Business Automobile Liability $1,000,000 per occurrence" },
    { type: "workers-comp", limit: "statutory", quote: "Workers' Compensation and Employers Liability as required by State of California" },
    ...(s.professional ? [{ type: "professional" as const, limit: 1_000_000, quote: "Professional Liability/Errors & Omissions $1,000,000 per occurrence" }] : []),
    ...(s.insuranceExtra ?? []),
  ];
  const docs: SolicitationInput["documents"] = s.docsMinimal
    ? [
        { id: "bidder-acceptance", label: "Exhibit A: Bidder Information and Acceptance (signed)", kind: "form", quote: "Exhibit A – Bid Response Packet, Bidder Acceptance" },
        { id: "debarment", label: "Debarment and Suspension Certification (signed)", kind: "attestation", quote: "Exhibit A – Bid Response Packet, Debarment and Suspension Certification" },
        { id: "sleb-sheet", label: "SLEB Information Sheet (signed)", kind: "form", quote: "Exhibit A – Bid Response Packet, Small Local Emerging Business (SLEB) Information Sheet" },
        { id: "bid-form", label: "County Excel Bid Form (pricing)", kind: "pricing", quote: "Bidders must submit pricing on the County provided Excel Bid Form" },
        ...(s.docsExtra ?? []),
      ]
    : [
        { id: "bidder-acceptance", label: "Exhibit A: Bidder Information and Acceptance (signed)", kind: "form", quote: "Exhibit A – Bid Response Packet, Bidder Acceptance" },
        { id: "debarment", label: "Debarment and Suspension Certification (signed)", kind: "attestation", quote: "Exhibit A – Bid Response Packet, Debarment and Suspension Certification" },
        { id: "sleb-sheet", label: "SLEB Information Sheet (signed; SLEB partner signs too if you subcontract)", kind: "form", quote: "Exhibit A – Bid Response Packet, Small Local Emerging Business (SLEB) Information Sheet" },
        { id: "min-quals", label: "Bidder Minimum Qualifications table with supporting documentation", kind: "proof" },
        { id: "references", label: "References (three recent clients)", kind: "references" },
        { id: "exceptions", label: "Exceptions and Clarifications form", kind: "form", quote: "take exception to this requirement in the Exceptions and Clarifications section" },
        { id: "bid-form", label: "County Excel Bid Form (pricing, uploaded separately)", kind: "pricing", quote: "Bidders must submit pricing on the County provided Excel Bid Form" },
        ...(s.docsExtra ?? []),
      ];
  const sleb = {
    code: "SLEB",
    label: "Alameda County SLEB certification (preference points; not required to bid)",
    required: false,
    quote: "If a Bidder is certified by the County as either a small and local or an emerging and local business (SLEB), the County will provide up to 5% bid preference for procurements over $25,000",
  };
  return {
    id: s.id,
    number: s.number,
    title: s.title,
    department: s.department,
    agencyId: "alameda-county-gsa",
    type: s.type,
    category: s.category,
    secondaryCategories: s.secondary ?? [],
    summary: s.summary,
    description: s.description,
    estimatedValue: s.value,
    term: s.term,
    dates: {
      posted: s.posted,
      preBidMeeting: s.preBid
        ? { when: { date: s.preBid.date, time: s.preBid.time }, mandatory: s.preBid.mandatory, location: s.preBid.location, virtual: s.preBid.virtual, quote: s.preBid.quote, prerequisite: s.preBid.prerequisite }
        : undefined,
      siteVisit: s.siteVisit
        ? { when: { date: s.siteVisit.date, time: s.siteVisit.time }, mandatory: s.siteVisit.mandatory, location: s.siteVisit.location, quote: s.siteVisit.quote }
        : undefined,
      questionsDue: s.questionsDue,
      submissionDue: s.due,
      anticipatedAward: s.award,
      contractStart: s.start,
    },
    submissionMethod:
      "Upload through the County of Alameda Procurement Portal by 2:00 p.m. on the due date: one PDF with the completed Exhibit A Bid Response Packet, plus pricing on the County's Excel Bid Form.",
    requirements: {
      licenses: s.licenses ?? [],
      certifications: [...(s.certs ?? []), sleb],
      insurance,
      location: s.location ?? { type: "local-preference", quote: "If a Bidder is located within Alameda County, the County may provide a 5% local bid preference." },
      experience: s.experience,
      bonding: s.bonding ?? [],
      prevailingWage: !!s.publicWorks,
      livingWage: !!s.livingWage,
      dirRegistration: !!s.publicWorks,
      statedStaffingMin: s.statedStaffingMin,
      other: s.other ?? [],
    },
    documents: docs,
    scopeTags: [...(s.scopeTags ?? []), ...(s.publicWorks ? (["public-works"] as const) : [])],
    contact: { name: s.contact.name, title: s.contact.title ?? "Procurement Specialist (sample contact)", email: s.contact.email, phone: s.contact.phone },
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `${s.excerpt}\n${s.publicWorks ? PUBLIC_WORKS_CLAUSE + "\n" : ""}${BOILERPLATE}`,
    status: s.status ?? "open",
    provenance: {
      source: "curated",
      extractedBy: "human",
      extractedAt: "2026-10-03",
      note: "Sample record written for the hackathon demo in the format of County of Alameda GSA solicitations. Not a live posting.",
    },
  };
}

const bidBond: Bond = { type: "bid", percent: 10, quote: "Bid security in the amount of ten percent (10%) of the total bid" };
const perfBond: Bond = { type: "performance", percent: 100, quote: "performance and payment bonds each in the amount of one hundred percent (100%) of the contract price" };

export const SAMPLE_SOLICITATIONS: SolicitationInput[] = [
  // ======================================================= ELECTRICAL
  curated({
    id: "s-elec-01",
    number: "IFB No. 902810",
    title: "LED Lighting Retrofit at Three County Buildings",
    department: "General Services Agency, Building Maintenance Department",
    type: "IFB",
    category: "electrical",
    summary: "Replace fluorescent fixtures with LED fixtures and controls at three County office buildings in Oakland and Hayward, mostly on nights and weekends.",
    description: "Furnish and install roughly 2,400 LED fixtures, occupancy sensors and daylight controls at 1221 Oak Street (Oakland), 2000 San Pablo Avenue (Oakland) and 24100 Amador Street (Hayward), including disposal of old lamps. Work is in occupied buildings, so most installation happens after hours. This is a public works project: DIR registration and prevailing wage apply, and attendance at the pre-bid conference is mandatory.",
    value: { min: 250_000, max: 400_000, basis: "total", quote: "The County's estimate for this work is $250,000 to $400,000" },
    term: "Single project, 120 working days",
    posted: "2026-10-01",
    preBid: { date: "2026-10-14", time: "10:00", mandatory: true, location: "1221 Oak Street, Oakland, Room 225, followed by walk-through", quote: "Mandatory Pre-Bid Conference and Site Walk October 14, 2026 @ 10:00 a.m., 1221 Oak Street, Oakland. Attendance at the pre-bid conference is mandatory; bids from contractors who did not attend will be rejected." },
    questionsDue: { date: "2026-10-16", time: "17:00" },
    due: { date: "2026-10-28", time: "14:00" },
    award: "2026-12-15",
    start: "2027-01-11",
    licenses: [{ code: "C-10", label: "C-10 Electrical Contractor license", quote: "Bidder must hold a current, active California C-10 Electrical Contractor license at the time of bid" }],
    experience: { years: 3, description: "3 years of commercial lighting retrofit work", quote: "regularly and continuously engaged in commercial lighting retrofit work for at least three (3) years" },
    bonding: [bidBond, perfBond],
    publicWorks: true,
    other: [{ label: "After-hours work in occupied buildings", quote: "The majority of installation work shall be performed between 6:00 p.m. and 6:00 a.m. or on weekends" }],
    docsExtra: [
      { id: "fixture-schedule", label: "Fixture schedule and cut sheets", kind: "pricing" },
      { id: "subcontractor-list", label: "Subcontractor list (Public Contract Code 4104)", kind: "form" },
    ],
    contact: { name: "D. Alvarez", email: "d.alvarez@acgov.example", phone: "(510) 208-0000" },
    excerpt: `COUNTY OF ALAMEDA INVITATION FOR BID No. 902810 for LED LIGHTING RETROFIT AT THREE COUNTY BUILDINGS. General Services Agency – Building Maintenance Department. RESPONSE DUE by 2:00 p.m. on October 28, 2026 through County of Alameda Procurement Portal.
CALENDAR OF EVENTS: Request Issued October 1, 2026. Mandatory Pre-Bid Conference and Site Walk October 14, 2026 @ 10:00 a.m., 1221 Oak Street, Oakland. Attendance at the pre-bid conference is mandatory; bids from contractors who did not attend will be rejected. Written Questions Due October 16, 2026 by 5:00 p.m. Addendum Issued October 21, 2026. Response Due October 28, 2026 by 2:00 p.m. Board Consideration Award Date December 15, 2026. Contract Start Date January 11, 2027.
SCOPE: Furnish and install approximately 2,400 LED fixtures with occupancy sensors and daylight controls at 1221 Oak Street, 2000 San Pablo Avenue and 24100 Amador Street. The County's estimate for this work is $250,000 to $400,000. The majority of installation work shall be performed between 6:00 p.m. and 6:00 a.m. or on weekends.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold a current, active California C-10 Electrical Contractor license at the time of bid. Bidder must have been regularly and continuously engaged in commercial lighting retrofit work for at least three (3) years. Bid security in the amount of ten percent (10%) of the total bid is required. The successful bidder shall furnish performance and payment bonds each in the amount of one hundred percent (100%) of the contract price.`,
  }),

  curated({
    id: "s-elec-02",
    number: "RFQ No. 902815",
    title: "EV Charging Station Installation, Santa Rita Jail Staff Parking",
    department: "Sheriff's Office (procured by GSA)",
    type: "RFQ",
    category: "electrical",
    summary: "Install 24 Level 2 EV chargers and a new panel in the staff parking lot at Santa Rita Jail in Dublin.",
    description: "Trenching, conduit, a 400A panel and 24 networked Level 2 chargers in the staff lot. Public works project with prevailing wage. A non-mandatory site visit is offered; attendees need a visitor clearance form two days ahead.",
    value: { min: 180_000, max: 260_000, basis: "total", quote: "Estimated construction cost: $180,000 – $260,000" },
    posted: "2026-10-02",
    siteVisit: { date: "2026-10-20", time: "09:00", mandatory: false, location: "5325 Broder Blvd, Dublin (clearance form 2 days ahead)", quote: "Non-Mandatory Site Visit October 20, 2026 @ 9:00 a.m., 5325 Broder Blvd, Dublin" },
    questionsDue: { date: "2026-10-23", time: "17:00" },
    due: { date: "2026-11-10", time: "14:00" },
    award: "2027-01-12",
    licenses: [{ code: "C-10", label: "C-10 Electrical Contractor license", quote: "Bidder must hold an active C-10 Electrical Contractor license" }],
    certs: [{ code: "EVITP", label: "EVITP-certified electricians (Electric Vehicle Infrastructure Training Program)", required: true, quote: "Installation shall be performed by EVITP-certified electricians" }],
    experience: { years: 2, description: "2 years installing commercial EV charging", quote: "at least two (2) years of experience installing commercial electric vehicle charging equipment" },
    bonding: [perfBond],
    publicWorks: true,
    scopeTags: ["institutional"],
    contact: { name: "R. Okafor", email: "r.okafor@acgov.example", phone: "(510) 208-0001" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902815 for EV CHARGING STATION INSTALLATION, SANTA RITA JAIL STAFF PARKING. RESPONSE DUE by 2:00 p.m. on November 10, 2026.
CALENDAR OF EVENTS: Request Issued October 2, 2026. Non-Mandatory Site Visit October 20, 2026 @ 9:00 a.m., 5325 Broder Blvd, Dublin. Written Questions Due October 23, 2026 by 5:00 p.m. Response Due November 10, 2026 by 2:00 p.m. Board Consideration Award Date January 12, 2027.
SCOPE: Furnish and install twenty-four (24) networked Level 2 chargers, a new 400A panel, trenching and conduit in the staff parking lot. Estimated construction cost: $180,000 – $260,000. Installation shall be performed by EVITP-certified electricians.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-10 Electrical Contractor license and have at least two (2) years of experience installing commercial electric vehicle charging equipment. The successful bidder shall furnish performance and payment bonds each in the amount of one hundred percent (100%) of the contract price.`,
  }),

  curated({
    id: "s-elec-03",
    number: "RFQ No. 902802",
    title: "As-Needed Electrical Repair Services, County Facilities",
    department: "General Services Agency, Building Maintenance Department",
    type: "RFQ",
    category: "electrical",
    summary: "A three-year on-call contract for electrical repairs at County buildings, with a two-hour emergency response. The mandatory job walk was held September 29.",
    description: "Hourly-rate on-call electrical repair across GSA-maintained buildings, with a two-hour emergency response that requires a dispatch office inside Alameda County. Multiple vendors may be awarded from a shared not-to-exceed pool. The mandatory pre-bid job walk took place on September 29, 2026; bidders who did not sign in cannot submit.",
    value: { min: 1_500_000, max: 1_500_000, basis: "nte-pool", termYears: 3, quote: "not-to-exceed pool of $1,500,000 over three years, shared among awarded vendors" },
    term: "3 years, as-needed task orders",
    posted: "2026-09-15",
    preBid: { date: "2026-09-29", time: "10:00", mandatory: true, location: "1401 Lakeside Drive, Oakland", quote: "Mandatory Pre-Bid Job Walk September 29, 2026 @ 10:00 a.m. Bidders must sign the attendance sheet; bids from firms not on the attendance list will be rejected." },
    questionsDue: { date: "2026-10-01", time: "17:00" },
    due: { date: "2026-10-21", time: "14:00" },
    licenses: [{ code: "C-10", label: "C-10 Electrical Contractor license", quote: "Bidder must hold an active C-10 Electrical Contractor license" }],
    location: { type: "county-required", note: "Dispatch office within Alameda County for 2-hour emergency response", quote: "Contractor must maintain a dispatch office within Alameda County and respond to emergency calls within two (2) hours" },
    experience: { years: 3, description: "3 years of commercial electrical service work", quote: "at least three (3) years of commercial electrical service and repair experience" },
    publicWorks: true,
    scopeTags: ["as-needed"],
    contact: { name: "D. Alvarez", email: "d.alvarez@acgov.example", phone: "(510) 208-0000" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902802 for AS-NEEDED ELECTRICAL REPAIR SERVICES, COUNTY FACILITIES. RESPONSE DUE by 2:00 p.m. on October 21, 2026.
CALENDAR OF EVENTS: Request Issued September 15, 2026. Mandatory Pre-Bid Job Walk September 29, 2026 @ 10:00 a.m. Bidders must sign the attendance sheet; bids from firms not on the attendance list will be rejected. Written Questions Due October 1, 2026 by 5:00 p.m. Response Due October 21, 2026 by 2:00 p.m.
SCOPE: On-call electrical repair services at County facilities on an hourly-rate basis under a not-to-exceed pool of $1,500,000 over three years, shared among awarded vendors. Contractor must maintain a dispatch office within Alameda County and respond to emergency calls within two (2) hours.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-10 Electrical Contractor license and have at least three (3) years of commercial electrical service and repair experience.`,
  }),

  curated({
    id: "s-elec-04",
    number: "RFQ No. 902744",
    title: "Emergency Generator Maintenance and Load Testing",
    department: "General Services Agency, Building Maintenance Department",
    type: "RFQ",
    category: "electrical",
    secondary: ["hvac"],
    summary: "Annual maintenance and load-bank testing of 31 standby generators at County facilities. Closed September 25; this contract recurs every three years.",
    description: "Quarterly inspections, annual load-bank tests and repairs on 31 diesel standby generators. Responses were due September 25, 2026. The previous contract was also competed on a three-year cycle, so a similar solicitation is likely in 2029.",
    value: { min: 110_000, max: 150_000, basis: "annual", quote: "Estimated annual value $110,000 – $150,000" },
    term: "3 years",
    posted: "2026-08-28",
    questionsDue: { date: "2026-09-10", time: "17:00" },
    due: { date: "2026-09-25", time: "14:00" },
    licenses: [{ code: "C-10", label: "C-10 Electrical Contractor license", quote: "Bidder must hold an active C-10 Electrical Contractor license" }],
    experience: { years: 3, description: "3 years servicing standby generators", quote: "at least three (3) years servicing diesel standby generators of 100 kW and larger" },
    publicWorks: true,
    status: "closed",
    contact: { name: "D. Alvarez", email: "d.alvarez@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902744 for EMERGENCY GENERATOR MAINTENANCE AND LOAD TESTING. RESPONSE DUE by 2:00 p.m. on September 25, 2026.
SCOPE: Quarterly inspection, annual load-bank testing and repair of thirty-one (31) diesel standby generators at County facilities. Estimated annual value $110,000 – $150,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-10 Electrical Contractor license and have at least three (3) years servicing diesel standby generators of 100 kW and larger.`,
  }),

  // ======================================================= GENERAL CONSTRUCTION
  curated({
    id: "s-gc-01",
    number: "IFB No. 902805",
    title: "ADA Restroom Renovation, Eden Area Multi-Service Center",
    department: "General Services Agency (for Social Services Agency)",
    type: "IFB",
    category: "general-construction",
    secondary: ["electrical", "plumbing"],
    summary: "Renovate six public restrooms for ADA compliance at the Eden Area Multi-Service Center in Hayward, including plumbing and electrical sub-scope.",
    description: "Demolition and rebuild of six restrooms: new fixtures, partitions, tile, lighting, exhaust and signage to current accessibility code. Electrical and plumbing work may be self-performed or subcontracted to licensed subs listed in the bid. Mandatory pre-bid conference with site walk.",
    value: { min: 450_000, max: 650_000, basis: "total", quote: "Engineer's estimate: $450,000 – $650,000" },
    term: "Single project, 150 working days",
    posted: "2026-10-02",
    preBid: { date: "2026-10-15", time: "13:00", mandatory: true, location: "24100 Amador Street, Hayward, Room 101", quote: "Mandatory Pre-Bid Conference and Site Walk October 15, 2026 @ 1:00 p.m., 24100 Amador Street, Hayward. Attendance is mandatory." },
    questionsDue: { date: "2026-10-20", time: "17:00" },
    due: { date: "2026-11-05", time: "14:00" },
    award: "2026-12-15",
    licenses: [{ code: "B", label: "Class B General Building Contractor license", quote: "Bidder must hold an active Class B General Building Contractor license" }],
    experience: { years: 5, description: "5 years of public building renovation", quote: "at least five (5) years of experience renovating occupied public buildings" },
    bonding: [bidBond, perfBond],
    publicWorks: true,
    other: [{ label: "Subcontractor listing required for electrical and plumbing", quote: "Electrical and plumbing work shall be performed by the bidder or by subcontractors holding C-10 and C-36 licenses listed on the subcontractor list" }],
    docsExtra: [{ id: "subcontractor-list", label: "Subcontractor list with license numbers", kind: "form" }],
    contact: { name: "M. Tran", email: "m.tran@acgov.example", phone: "(510) 208-0002" },
    excerpt: `COUNTY OF ALAMEDA INVITATION FOR BID No. 902805 for ADA RESTROOM RENOVATION, EDEN AREA MULTI-SERVICE CENTER. RESPONSE DUE by 2:00 p.m. on November 5, 2026.
CALENDAR OF EVENTS: Request Issued October 2, 2026. Mandatory Pre-Bid Conference and Site Walk October 15, 2026 @ 1:00 p.m., 24100 Amador Street, Hayward. Attendance is mandatory. Written Questions Due October 20, 2026 by 5:00 p.m. Response Due November 5, 2026 by 2:00 p.m. Board Consideration Award Date December 15, 2026.
SCOPE: Demolition and renovation of six (6) restrooms to current accessibility standards including fixtures, partitions, tile, lighting, exhaust and signage. Engineer's estimate: $450,000 – $650,000. Electrical and plumbing work shall be performed by the bidder or by subcontractors holding C-10 and C-36 licenses listed on the subcontractor list.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active Class B General Building Contractor license and have at least five (5) years of experience renovating occupied public buildings. Bid security in the amount of ten percent (10%) of the total bid is required. The successful bidder shall furnish performance and payment bonds each in the amount of one hundred percent (100%) of the contract price.`,
  }),

  curated({
    id: "s-gc-02",
    number: "RFQ No. 902812",
    title: "Roof Deck Waterproofing and Railing Repair, Public Works Yard",
    department: "Public Works Agency",
    type: "RFQ",
    category: "general-construction",
    secondary: ["roofing"],
    summary: "Re-coat a 9,000 sq ft roof deck and replace corroded guardrails at the Public Works yard in Hayward.",
    description: "Remove failed coating, repair substrate, apply a fluid-applied waterproofing system and replace 310 linear feet of guardrail. Non-mandatory site visit. Public works project.",
    value: { min: 120_000, max: 180_000, basis: "total", quote: "Estimated cost $120,000 – $180,000" },
    posted: "2026-10-01",
    siteVisit: { date: "2026-10-20", time: "10:00", mandatory: false, location: "951 Turner Court, Hayward", quote: "Non-Mandatory Site Visit October 20, 2026 @ 10:00 a.m., 951 Turner Court, Hayward" },
    questionsDue: { date: "2026-10-22", time: "17:00" },
    due: { date: "2026-10-30", time: "14:00" },
    licenses: [{ code: "B", label: "Class B General Building or C-39 Roofing license", quote: "Bidder must hold an active Class B General Building Contractor license or a C-39 Roofing Contractor license" }],
    experience: { years: 3, description: "3 years of waterproofing work", quote: "at least three (3) years of experience with fluid-applied waterproofing systems" },
    bonding: [perfBond],
    publicWorks: true,
    contact: { name: "S. Nakamura", email: "s.nakamura@acgov.example", phone: "(510) 670-0003" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902812 for ROOF DECK WATERPROOFING AND RAILING REPAIR, PUBLIC WORKS YARD. Public Works Agency. RESPONSE DUE by 2:00 p.m. on October 30, 2026.
CALENDAR OF EVENTS: Request Issued October 1, 2026. Non-Mandatory Site Visit October 20, 2026 @ 10:00 a.m., 951 Turner Court, Hayward. Written Questions Due October 22, 2026 by 5:00 p.m. Response Due October 30, 2026 by 2:00 p.m.
SCOPE: Remove failed coating, repair substrate, apply fluid-applied waterproofing to approximately 9,000 square feet of roof deck and replace 310 linear feet of guardrail. Estimated cost $120,000 – $180,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active Class B General Building Contractor license or a C-39 Roofing Contractor license and have at least three (3) years of experience with fluid-applied waterproofing systems. The successful bidder shall furnish performance and payment bonds each in the amount of one hundred percent (100%) of the contract price.`,
  }),

  curated({
    id: "s-gc-03",
    number: "IFB No. 902820",
    title: "Job Order Contract for Facility Repairs and Small Projects",
    department: "General Services Agency, Building Maintenance Department",
    type: "IFB",
    category: "general-construction",
    secondary: ["electrical", "plumbing", "hvac", "painting"],
    summary: "A three-year job order contract: the County issues individual repair and small-project work orders priced from a unit price book. Large pool, but each job is small.",
    description: "Up to three contractors are awarded a job order contract with a shared ceiling of $4,000,000 over three years. Individual job orders typically run $5,000 to $150,000 across general construction, electrical, plumbing, HVAC and painting. Bidders propose an adjustment factor against the County's unit price book. Mandatory pre-bid conference.",
    value: { min: 4_000_000, max: 4_000_000, basis: "nte-pool", termYears: 3, quote: "shared not-to-exceed amount of $4,000,000 over three years; individual job orders are typically $5,000 to $150,000" },
    term: "3 years",
    posted: "2026-10-05",
    preBid: { date: "2026-11-03", time: "10:00", mandatory: true, location: "Microsoft Teams (online)", virtual: true, quote: "Mandatory Pre-Bid Conference November 3, 2026 @ 10:00 a.m. (Microsoft Teams). Attendance is mandatory." },
    questionsDue: { date: "2026-11-06", time: "17:00" },
    due: { date: "2026-12-02", time: "14:00" },
    award: "2027-02-09",
    licenses: [{ code: "B", label: "Class B General Building Contractor license", quote: "Bidder must hold an active Class B General Building Contractor license" }],
    experience: { years: 5, description: "5 years of multi-trade public facility work", quote: "at least five (5) years performing multi-trade repair work for public agencies" },
    bonding: [bidBond, perfBond],
    publicWorks: true,
    scopeTags: ["as-needed", "multi-trade"],
    docsExtra: [{ id: "adjustment-factor", label: "Adjustment factor bid sheet (against the unit price book)", kind: "pricing" }],
    contact: { name: "M. Tran", email: "m.tran@acgov.example", phone: "(510) 208-0002" },
    excerpt: `COUNTY OF ALAMEDA INVITATION FOR BID No. 902820 for JOB ORDER CONTRACT FOR FACILITY REPAIRS AND SMALL PROJECTS. RESPONSE DUE by 2:00 p.m. on December 2, 2026.
CALENDAR OF EVENTS: Request Issued October 5, 2026. Mandatory Pre-Bid Conference November 3, 2026 @ 10:00 a.m. (Microsoft Teams). Attendance is mandatory. Written Questions Due November 6, 2026 by 5:00 p.m. Response Due December 2, 2026 by 2:00 p.m. Board Consideration Award Date February 9, 2027.
SCOPE: Up to three (3) contractors will be awarded job order contracts with a shared not-to-exceed amount of $4,000,000 over three years; individual job orders are typically $5,000 to $150,000 and span general construction, electrical, plumbing, HVAC and painting work.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active Class B General Building Contractor license and have at least five (5) years performing multi-trade repair work for public agencies. Bid security in the amount of ten percent (10%) of the total bid is required. The successful bidder shall furnish performance and payment bonds each in the amount of one hundred percent (100%) of the contract price.`,
  }),

  // ======================================================= PLUMBING / HVAC
  curated({
    id: "s-plumb-01",
    number: "RFQ No. 902808",
    title: "Backflow Preventer Testing and Repair, County-Wide",
    department: "General Services Agency, Building Maintenance Department",
    type: "RFQ",
    category: "plumbing",
    summary: "Annual testing, certification and repair of about 190 backflow prevention assemblies at County buildings.",
    description: "Test and certify each assembly annually per the water purveyor's requirements, file reports, and repair or replace failed units at quoted unit prices. Small, recurring, low-paperwork contract.",
    value: { min: 40_000, max: 70_000, basis: "annual", quote: "Estimated annual value $40,000 – $70,000" },
    term: "3 years",
    posted: "2026-10-01",
    questionsDue: { date: "2026-10-14", time: "17:00" },
    due: { date: "2026-10-27", time: "14:00" },
    licenses: [{ code: "C-36", label: "C-36 Plumbing Contractor license", quote: "Bidder must hold an active C-36 Plumbing Contractor license" }],
    certs: [{ code: "BACKFLOW_TESTER", label: "AWWA-certified backflow prevention assembly tester on staff", required: true, quote: "Testing must be performed by an AWWA-certified backflow prevention assembly tester" }],
    publicWorks: true,
    docsMinimal: true,
    docsExtra: [{ id: "tester-certs", label: "Copies of tester certifications", kind: "proof" }],
    scopeTags: ["as-needed"],
    contact: { name: "J. Whitfield", email: "j.whitfield@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902808 for BACKFLOW PREVENTER TESTING AND REPAIR, COUNTY-WIDE. RESPONSE DUE by 2:00 p.m. on October 27, 2026. Written Questions Due October 14, 2026 by 5:00 p.m.
SCOPE: Annual testing and certification of approximately 190 backflow prevention assemblies and repair of failed units at quoted unit prices. Estimated annual value $40,000 – $70,000. Testing must be performed by an AWWA-certified backflow prevention assembly tester.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-36 Plumbing Contractor license.`,
  }),

  curated({
    id: "s-hvac-01",
    number: "RFQ No. 902811",
    title: "HVAC Preventive Maintenance, Public Health Laboratory and Clinics",
    department: "Public Health Department (procured by GSA)",
    type: "RFQ",
    category: "hvac",
    summary: "Quarterly preventive maintenance and on-call repair of HVAC systems at the Public Health lab and four clinics, with strict filtration standards.",
    description: "Scheduled maintenance of rooftop units, air handlers, exhaust fans and lab pressurization controls, plus 4-hour emergency response. Technicians need EPA 608 certification. Three-year term.",
    value: { min: 150_000, max: 220_000, basis: "annual", quote: "Estimated annual value $150,000 – $220,000" },
    term: "3 years",
    posted: "2026-10-02",
    siteVisit: { date: "2026-10-16", time: "09:00", mandatory: false, location: "1000 Broadway, Oakland", quote: "Non-Mandatory Site Visit October 16, 2026 @ 9:00 a.m., 1000 Broadway, Oakland" },
    questionsDue: { date: "2026-10-21", time: "17:00" },
    due: { date: "2026-11-03", time: "14:00" },
    licenses: [{ code: "C-20", label: "C-20 HVAC Contractor license", quote: "Bidder must hold an active C-20 Warm-Air Heating, Ventilating and Air-Conditioning Contractor license" }],
    certs: [{ code: "EPA_608", label: "EPA Section 608 certified technicians", required: true, quote: "All technicians handling refrigerants must hold EPA Section 608 certification" }],
    experience: { years: 3, description: "3 years maintaining laboratory or healthcare HVAC", quote: "at least three (3) years maintaining HVAC systems in laboratory or healthcare facilities" },
    publicWorks: true,
    scopeTags: ["institutional"],
    contact: { name: "A. Petrov", email: "a.petrov@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902811 for HVAC PREVENTIVE MAINTENANCE, PUBLIC HEALTH LABORATORY AND CLINICS. RESPONSE DUE by 2:00 p.m. on November 3, 2026.
CALENDAR OF EVENTS: Request Issued October 2, 2026. Non-Mandatory Site Visit October 16, 2026 @ 9:00 a.m., 1000 Broadway, Oakland. Written Questions Due October 21, 2026 by 5:00 p.m. Response Due November 3, 2026 by 2:00 p.m.
SCOPE: Quarterly preventive maintenance and on-call repair of HVAC equipment at the Public Health Laboratory and four clinics with four-hour emergency response. Estimated annual value $150,000 – $220,000. All technicians handling refrigerants must hold EPA Section 608 certification.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-20 Warm-Air Heating, Ventilating and Air-Conditioning Contractor license and have at least three (3) years maintaining HVAC systems in laboratory or healthcare facilities.`,
  }),

  // ======================================================= LANDSCAPING
  curated({
    id: "s-land-01",
    number: "RFQ No. 902806",
    title: "Grounds Maintenance, County Buildings in Oakland and San Leandro",
    department: "General Services Agency, Building Maintenance Department",
    type: "RFQ",
    category: "landscaping",
    secondary: ["pest-control"],
    summary: "Weekly grounds maintenance (mowing, pruning, irrigation, litter) at 14 County sites in Oakland and San Leandro for three years.",
    description: "Turf, shrubs, trees under 15 feet, irrigation checks and repairs, and weed control at 14 properties. Herbicide application requires a Qualified Applicator License. Non-mandatory site tour.",
    value: { min: 180_000, max: 260_000, basis: "annual", quote: "Estimated annual value $180,000 – $260,000" },
    term: "3 years",
    posted: "2026-09-29",
    siteVisit: { date: "2026-10-13", time: "08:30", mandatory: false, location: "Starts at 1401 Lakeside Drive, Oakland", quote: "Non-Mandatory Site Tour October 13, 2026 @ 8:30 a.m., starting at 1401 Lakeside Drive, Oakland" },
    questionsDue: { date: "2026-10-15", time: "17:00" },
    due: { date: "2026-10-26", time: "14:00" },
    licenses: [
      { code: "C-27", label: "C-27 Landscaping Contractor license", quote: "Bidder must hold an active C-27 Landscaping Contractor license" },
      { code: "QAL", label: "DPR Qualified Applicator License for herbicide application", quote: "Herbicide application shall be supervised by a holder of a California Qualified Applicator License (QAL)" },
    ],
    experience: { years: 3, description: "3 years of commercial grounds maintenance", quote: "at least three (3) years of commercial grounds maintenance experience" },
    publicWorks: true,
    docsExtra: [{ id: "equipment-list", label: "Equipment list and crew plan", kind: "narrative" }],
    contact: { name: "J. Whitfield", email: "j.whitfield@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902806 for GROUNDS MAINTENANCE, COUNTY BUILDINGS IN OAKLAND AND SAN LEANDRO. RESPONSE DUE by 2:00 p.m. on October 26, 2026.
CALENDAR OF EVENTS: Request Issued September 29, 2026. Non-Mandatory Site Tour October 13, 2026 @ 8:30 a.m., starting at 1401 Lakeside Drive, Oakland. Written Questions Due October 15, 2026 by 5:00 p.m. Response Due October 26, 2026 by 2:00 p.m.
SCOPE: Weekly grounds maintenance at fourteen (14) County properties including turf, shrubs, trees under fifteen feet, irrigation and weed control. Estimated annual value $180,000 – $260,000. Herbicide application shall be supervised by a holder of a California Qualified Applicator License (QAL).
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-27 Landscaping Contractor license and have at least three (3) years of commercial grounds maintenance experience.`,
  }),

  curated({
    id: "s-land-02",
    number: "RFQ No. 902818",
    title: "Tree Trimming and Removal Services, As-Needed",
    department: "Public Works Agency",
    type: "RFQ",
    category: "landscaping",
    summary: "On-call tree trimming, removal and emergency storm response along County roads and at County facilities.",
    description: "Task-order work from a shared pool. Crews must include an ISA Certified Arborist for assessments and a licensed tree contractor. 24-hour storm response required.",
    value: { min: 500_000, max: 500_000, basis: "nte-pool", termYears: 3, quote: "not-to-exceed pool of $500,000 over three years, shared among awarded vendors" },
    term: "3 years, as-needed",
    posted: "2026-10-02",
    questionsDue: { date: "2026-10-28", time: "17:00" },
    due: { date: "2026-11-18", time: "14:00" },
    licenses: [{ code: "C-27", label: "C-27 Landscaping or D-49 Tree Service license", quote: "Bidder must hold an active C-27 Landscaping Contractor or D-49 Tree Service Contractor license" }],
    certs: [{ code: "ISA_ARBORIST", label: "ISA Certified Arborist on staff", required: false, quote: "An ISA Certified Arborist on staff is preferred" }],
    experience: { years: 3, description: "3 years of commercial tree work", quote: "at least three (3) years of commercial tree trimming and removal experience" },
    publicWorks: true,
    scopeTags: ["as-needed"],
    contact: { name: "S. Nakamura", email: "s.nakamura@acgov.example", phone: "(510) 670-0003" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902818 for TREE TRIMMING AND REMOVAL SERVICES, AS-NEEDED. Public Works Agency. RESPONSE DUE by 2:00 p.m. on November 18, 2026. Written Questions Due October 28, 2026 by 5:00 p.m.
SCOPE: On-call tree trimming, removal and emergency storm response under a not-to-exceed pool of $500,000 over three years, shared among awarded vendors. An ISA Certified Arborist on staff is preferred.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-27 Landscaping Contractor or D-49 Tree Service Contractor license and have at least three (3) years of commercial tree trimming and removal experience.`,
  }),

  // ======================================================= JANITORIAL
  curated({
    id: "s-jan-01",
    number: "RFQ No. 902803",
    title: "Janitorial Services, Social Services Agency Offices (Six Sites)",
    department: "Social Services Agency (procured by GSA)",
    type: "RFQ",
    category: "janitorial",
    summary: "Nightly janitorial service at six Social Services offices in Oakland, Hayward and Fremont. Mandatory walk-through on October 9.",
    description: "Nightly cleaning, restroom supplies, floor care and quarterly deep cleaning across about 210,000 square feet. The County's living wage requirement applies to this service contract. A mandatory walk-through of all six sites is scheduled for October 9.",
    value: { min: 420_000, max: 560_000, basis: "annual", quote: "Estimated annual value $420,000 – $560,000" },
    term: "3 years",
    posted: "2026-09-25",
    preBid: { date: "2026-10-09", time: "08:00", mandatory: true, location: "Starts at 2000 San Pablo Avenue, Oakland; bus provided to the other sites", quote: "Mandatory Walk-Through October 9, 2026 @ 8:00 a.m., starting at 2000 San Pablo Avenue, Oakland. Attendance at the walk-through is mandatory." },
    questionsDue: { date: "2026-10-13", time: "17:00" },
    due: { date: "2026-10-23", time: "14:00" },
    experience: { years: 3, description: "3 years cleaning commercial offices of 100,000+ sq ft", quote: "at least three (3) years providing janitorial services to commercial office portfolios of 100,000 square feet or more" },
    livingWage: true,
    statedStaffingMin: { count: 15, quote: "Contractor must staff a minimum of fifteen (15) cleaning personnel across the six sites" },
    other: [{ label: "County living wage applies", quote: "This contract is subject to the Alameda County Living Wage Ordinance" }],
    docsExtra: [{ id: "staffing-plan", label: "Staffing plan by site", kind: "narrative" }],
    contact: { name: "L. Washington", email: "l.washington@acgov.example", phone: "(510) 208-0004" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902803 for JANITORIAL SERVICES, SOCIAL SERVICES AGENCY OFFICES (SIX SITES). RESPONSE DUE by 2:00 p.m. on October 23, 2026.
CALENDAR OF EVENTS: Request Issued September 25, 2026. Mandatory Walk-Through October 9, 2026 @ 8:00 a.m., starting at 2000 San Pablo Avenue, Oakland. Attendance at the walk-through is mandatory. Written Questions Due October 13, 2026 by 5:00 p.m. Response Due October 23, 2026 by 2:00 p.m.
SCOPE: Nightly janitorial services, restroom supplies, floor care and quarterly deep cleaning for approximately 210,000 square feet at six (6) sites. Estimated annual value $420,000 – $560,000. Contractor must staff a minimum of fifteen (15) cleaning personnel across the six sites. This contract is subject to the Alameda County Living Wage Ordinance.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least three (3) years providing janitorial services to commercial office portfolios of 100,000 square feet or more.`,
  }),

  curated({
    id: "s-jan-02",
    number: "RFQ No. 902813",
    title: "Day Porter Services, County Administration Building",
    department: "General Services Agency, Building Maintenance Department",
    type: "RFQ",
    category: "janitorial",
    summary: "Two day porters, Monday to Friday, at the County Administration Building in Oakland: lobbies, restrooms, conference rooms and spills.",
    description: "Daytime porter coverage from 7:00 a.m. to 5:30 p.m. at 1221 Oak Street. Simple hourly-rate quote with a short packet.",
    value: { min: 110_000, max: 150_000, basis: "annual", quote: "Estimated annual value $110,000 – $150,000" },
    term: "2 years",
    posted: "2026-10-05",
    questionsDue: { date: "2026-10-23", time: "17:00" },
    due: { date: "2026-11-06", time: "14:00" },
    experience: { years: 2, description: "2 years of commercial janitorial or porter service", quote: "at least two (2) years providing commercial janitorial or day porter services" },
    livingWage: true,
    docsMinimal: true,
    contact: { name: "L. Washington", email: "l.washington@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902813 for DAY PORTER SERVICES, COUNTY ADMINISTRATION BUILDING. RESPONSE DUE by 2:00 p.m. on November 6, 2026. Written Questions Due October 23, 2026 by 5:00 p.m.
SCOPE: Two (2) day porters Monday through Friday, 7:00 a.m. to 5:30 p.m., at 1221 Oak Street, Oakland. Estimated annual value $110,000 – $150,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least two (2) years providing commercial janitorial or day porter services.`,
  }),

  curated({
    id: "s-jan-03",
    number: "RFQ No. 902796",
    title: "Floor Care and Carpet Cleaning, Library Branches",
    department: "Alameda County Library",
    type: "RFQ",
    category: "janitorial",
    summary: "Strip-and-wax and carpet extraction at ten library branches twice a year. Closes October 16.",
    description: "Semi-annual hard-floor refinishing and carpet extraction at ten branches, scheduled on closed days. Small contract with a short packet.",
    value: { min: 35_000, max: 55_000, basis: "annual", quote: "Estimated annual value $35,000 – $55,000" },
    term: "2 years",
    posted: "2026-09-22",
    questionsDue: { date: "2026-10-06", time: "17:00" },
    due: { date: "2026-10-16", time: "14:00" },
    experience: { years: 2, description: "2 years of commercial floor care", quote: "at least two (2) years of commercial floor care experience" },
    docsMinimal: true,
    contact: { name: "P. Reyes", email: "p.reyes@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902796 for FLOOR CARE AND CARPET CLEANING, LIBRARY BRANCHES. Alameda County Library. RESPONSE DUE by 2:00 p.m. on October 16, 2026. Written Questions Due October 6, 2026 by 5:00 p.m.
SCOPE: Semi-annual hard floor stripping and refinishing and carpet extraction at ten (10) library branches on closed days. Estimated annual value $35,000 – $55,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least two (2) years of commercial floor care experience.`,
  }),

  // ======================================================= FOOD
  curated({
    id: "s-food-01",
    number: "RFQ No. 902807",
    title: "As-Needed Catering for County Meetings and Trainings",
    department: "General Services Agency, Procurement",
    type: "RFQ",
    category: "food-services",
    summary: "Join a small pool of caterers for breakfast, lunch and reception orders at County meetings and staff trainings, ordered a few days ahead.",
    description: "Per-person menu pricing for drop-off and staffed catering, typically 20 to 150 people, in Oakland, Hayward and Dublin. Up to four caterers awarded. Health permit and a certified food protection manager required.",
    value: { min: 150_000, max: 150_000, basis: "nte-pool", termYears: 2, quote: "not-to-exceed pool of $150,000 over two years, shared among up to four awarded caterers" },
    term: "2 years, as-needed",
    posted: "2026-10-01",
    questionsDue: { date: "2026-10-15", time: "17:00" },
    due: { date: "2026-10-30", time: "14:00" },
    licenses: [{ code: "HEALTH_FACILITY_PERMIT", label: "Current Alameda County Environmental Health food facility permit", quote: "Bidder must hold a current Alameda County Environmental Health food facility permit for its kitchen or commissary" }],
    certs: [{ code: "SERVSAFE", label: "Certified Food Protection Manager (ServSafe or equivalent)", required: true, quote: "A Certified Food Protection Manager must be on staff" }],
    experience: { years: 2, description: "2 years of commercial catering", quote: "at least two (2) years of commercial catering experience" },
    docsMinimal: true,
    docsExtra: [{ id: "menu", label: "Sample menus with per-person pricing", kind: "pricing" }],
    scopeTags: ["as-needed", "event"],
    contact: { name: "T. Nguyen", email: "t.nguyen@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902807 for AS-NEEDED CATERING FOR COUNTY MEETINGS AND TRAININGS. RESPONSE DUE by 2:00 p.m. on October 30, 2026. Written Questions Due October 15, 2026 by 5:00 p.m.
SCOPE: Drop-off and staffed catering for County meetings and trainings of 20 to 150 people in Oakland, Hayward and Dublin, under a not-to-exceed pool of $150,000 over two years, shared among up to four awarded caterers. A Certified Food Protection Manager must be on staff.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold a current Alameda County Environmental Health food facility permit for its kitchen or commissary and have at least two (2) years of commercial catering experience.`,
  }),

  curated({
    id: "s-food-02",
    number: "RFP No. 902816",
    title: "Congregate and Home-Delivered Meals for Older Adults",
    department: "Social Services Agency, Area Agency on Aging",
    type: "RFP",
    category: "food-services",
    summary: "Prepare and deliver about 1,100 meals a day for seniors at congregate sites and homes, meeting federal nutrition standards.",
    description: "Older Americans Act funded meal program: menus approved by a registered dietitian, HACCP plan, delivery routes across the County, and monthly reporting. Large for a small caterer; subcontracting delivery is allowed.",
    value: { min: 900_000, max: 1_200_000, basis: "annual", quote: "Estimated annual value $900,000 – $1,200,000" },
    term: "3 years",
    posted: "2026-10-05",
    preBid: { date: "2026-10-21", time: "10:00", mandatory: false, location: "Microsoft Teams (online)", virtual: true, quote: "Networking/Bidders Conference October 21, 2026 @ 10:00 a.m. (Microsoft Teams)" },
    questionsDue: { date: "2026-10-23", time: "17:00" },
    due: { date: "2026-11-13", time: "14:00" },
    licenses: [{ code: "HEALTH_FACILITY_PERMIT", label: "Alameda County food facility permit", quote: "Bidder must hold a current Alameda County Environmental Health food facility permit" }],
    certs: [
      { code: "SERVSAFE", label: "Certified Food Protection Manager", required: true, quote: "A Certified Food Protection Manager must supervise meal production" },
      { code: "RD", label: "Registered Dietitian approving menus", required: true, quote: "Menus must be approved by a Registered Dietitian" },
    ],
    experience: { years: 3, description: "3 years of high-volume meal production", quote: "at least three (3) years producing 500 or more meals per day" },
    professional: true,
    docsExtra: [
      { id: "haccp", label: "HACCP plan", kind: "proof" },
      { id: "sample-menu", label: "Four-week cycle menu with nutrient analysis", kind: "narrative" },
    ],
    scopeTags: ["institutional"],
    contact: { name: "G. Ortiz", email: "g.ortiz@acgov.example", phone: "(510) 577-0005" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902816 for CONGREGATE AND HOME-DELIVERED MEALS FOR OLDER ADULTS. Social Services Agency – Area Agency on Aging. RESPONSE DUE by 2:00 p.m. on November 13, 2026.
CALENDAR OF EVENTS: Request Issued October 5, 2026. Networking/Bidders Conference October 21, 2026 @ 10:00 a.m. (Microsoft Teams). Written Questions Due October 23, 2026 by 5:00 p.m. Response Due November 13, 2026 by 2:00 p.m.
SCOPE: Preparation and delivery of approximately 1,100 meals per day to congregate sites and homebound older adults. Estimated annual value $900,000 – $1,200,000. Menus must be approved by a Registered Dietitian. A Certified Food Protection Manager must supervise meal production.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold a current Alameda County Environmental Health food facility permit and have at least three (3) years producing 500 or more meals per day. Professional Liability/Errors & Omissions $1,000,000 per occurrence.`,
  }),

  curated({
    id: "s-food-03",
    number: "RFQ No. 902799",
    title: "Boxed Lunches for Poll Worker Training Sessions",
    department: "Registrar of Voters",
    type: "RFQ",
    category: "food-services",
    summary: "Deliver about 3,000 boxed lunches across 40 training sessions in Oakland and Dublin from late October through early November. Closes October 14.",
    description: "Boxed lunches (including vegetarian and halal options) delivered to scheduled sessions, with 48-hour order confirmation. Short packet, quick award.",
    value: { min: 25_000, max: 45_000, basis: "total", quote: "Estimated total value $25,000 – $45,000" },
    posted: "2026-10-01",
    questionsDue: { date: "2026-10-08", time: "17:00" },
    due: { date: "2026-10-14", time: "14:00" },
    licenses: [{ code: "HEALTH_FACILITY_PERMIT", label: "Alameda County food facility permit", quote: "Bidder must hold a current Alameda County Environmental Health food facility permit" }],
    docsMinimal: true,
    scopeTags: ["event"],
    contact: { name: "K. Sato", email: "k.sato@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902799 for BOXED LUNCHES FOR POLL WORKER TRAINING SESSIONS. Registrar of Voters. RESPONSE DUE by 2:00 p.m. on October 14, 2026. Written Questions Due October 8, 2026 by 5:00 p.m.
SCOPE: Approximately 3,000 boxed lunches delivered to forty (40) training sessions in Oakland and Dublin between October 26 and November 6, 2026, with vegetarian and halal options. Estimated total value $25,000 – $45,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold a current Alameda County Environmental Health food facility permit.`,
  }),

  // ======================================================= IT
  curated({
    id: "s-it-01",
    number: "RFP No. 902809",
    title: "Website Accessibility Remediation (WCAG 2.1 AA) for Department Sites",
    department: "Information Technology Department",
    type: "RFP",
    category: "it-services",
    secondary: ["design-print"],
    summary: "Audit and fix accessibility issues on twelve County department websites to meet WCAG 2.1 AA, and train content editors.",
    description: "Automated and manual audits, remediation of templates and PDFs, and editor training on the County's web platform. Professional and cyber liability insurance required.",
    value: { min: 120_000, max: 180_000, basis: "total", quote: "Estimated value $120,000 – $180,000" },
    term: "12 months",
    posted: "2026-10-01",
    preBid: { date: "2026-10-15", time: "10:00", mandatory: false, location: "Microsoft Teams (online)", virtual: true, quote: "Networking/Bidders Conference October 15, 2026 @ 10:00 a.m. (Microsoft Teams)" },
    questionsDue: { date: "2026-10-19", time: "17:00" },
    due: { date: "2026-11-04", time: "14:00" },
    experience: { years: 3, description: "3 years of accessibility remediation for public agencies", quote: "at least three (3) years providing web accessibility audits and remediation, including for public agencies" },
    certs: [{ code: "IAAP_CPACC", label: "IAAP certified accessibility professional on the team", required: false, quote: "An IAAP-certified accessibility professional on the team is preferred" }],
    professional: true,
    insuranceExtra: [{ type: "cyber", limit: 1_000_000, quote: "Cyber Liability $1,000,000 per occurrence" }],
    docsExtra: [{ id: "sample-audit", label: "Sample accessibility audit report", kind: "proof" }],
    scopeTags: ["professional-services"],
    contact: { name: "B. Chen", email: "b.chen@acgov.example", phone: "(510) 272-0006" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902809 for WEBSITE ACCESSIBILITY REMEDIATION (WCAG 2.1 AA) FOR DEPARTMENT SITES. Information Technology Department. RESPONSE DUE by 2:00 p.m. on November 4, 2026.
CALENDAR OF EVENTS: Request Issued October 1, 2026. Networking/Bidders Conference October 15, 2026 @ 10:00 a.m. (Microsoft Teams). Written Questions Due October 19, 2026 by 5:00 p.m. Response Due November 4, 2026 by 2:00 p.m.
SCOPE: Audit and remediate twelve (12) County department websites to WCAG 2.1 AA and train content editors. Estimated value $120,000 – $180,000. An IAAP-certified accessibility professional on the team is preferred.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least three (3) years providing web accessibility audits and remediation, including for public agencies. Professional Liability/Errors & Omissions $1,000,000 per occurrence. Cyber Liability $1,000,000 per occurrence.`,
  }),

  curated({
    id: "s-it-02",
    number: "RFQ No. 902814",
    title: "Structured Cabling (Cat6A) for Public Defender's New Office",
    department: "Public Defender (procured by GSA)",
    type: "RFQ",
    category: "it-services",
    secondary: ["electrical"],
    summary: "Install about 380 Cat6A drops, patch panels and fiber backbone in the Public Defender's new office at 1401 Lakeside Drive. Low-voltage or electrical license required. Closes October 16.",
    description: "Cabling, racks, patch panels, testing and labeling to TIA-568 standards. Because cabling installation in a public building is public works, DIR registration and prevailing wage apply. Non-mandatory site walk on October 9; short packet.",
    value: { min: 60_000, max: 90_000, basis: "total", quote: "Estimated value $60,000 – $90,000" },
    posted: "2026-09-30",
    siteVisit: { date: "2026-10-09", time: "14:00", mandatory: false, location: "1401 Lakeside Drive, 3rd floor, Oakland", quote: "Non-Mandatory Site Walk October 9, 2026 @ 2:00 p.m., 1401 Lakeside Drive, Oakland" },
    questionsDue: { date: "2026-10-12", time: "17:00" },
    due: { date: "2026-10-16", time: "14:00" },
    licenses: [{ code: "C-7", label: "C-7 Low Voltage Systems or C-10 Electrical license", quote: "Bidder must hold an active C-7 Low Voltage Systems Contractor license or a C-10 Electrical Contractor license" }],
    certs: [{ code: "BICSI", label: "Manufacturer-certified installer (25-year system warranty)", required: false, quote: "Installers certified by the cabling manufacturer for a 25-year system warranty are preferred" }],
    experience: { years: 3, description: "3 years of commercial structured cabling", quote: "at least three (3) years of commercial structured cabling experience" },
    publicWorks: true,
    docsMinimal: true,
    contact: { name: "B. Chen", email: "b.chen@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902814 for STRUCTURED CABLING (CAT6A) FOR PUBLIC DEFENDER'S NEW OFFICE. RESPONSE DUE by 2:00 p.m. on October 16, 2026.
CALENDAR OF EVENTS: Request Issued September 30, 2026. Non-Mandatory Site Walk October 9, 2026 @ 2:00 p.m., 1401 Lakeside Drive, Oakland. Written Questions Due October 12, 2026 by 5:00 p.m. Response Due October 16, 2026 by 2:00 p.m.
SCOPE: Furnish and install approximately 380 Cat6A drops, patch panels, racks and fiber backbone, tested and labeled to TIA-568. Estimated value $60,000 – $90,000. Installers certified by the cabling manufacturer for a 25-year system warranty are preferred.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-7 Low Voltage Systems Contractor license or a C-10 Electrical Contractor license and have at least three (3) years of commercial structured cabling experience.`,
  }),

  curated({
    id: "s-it-03",
    number: "RFP No. 902822",
    title: "Managed IT and Help Desk Services, Alameda County Fire Department",
    department: "Alameda County Fire Department",
    type: "RFP",
    category: "it-services",
    summary: "Run the help desk, endpoint management and network monitoring for the Fire Department's 30 stations and offices, around the clock.",
    description: "24/7 help desk for about 650 users, patching, endpoint security, Microsoft 365 administration and network monitoring, with a CJIS-compliant staff background process. Five years of managed services experience and $2M cyber coverage required.",
    value: { min: 350_000, max: 480_000, basis: "annual", quote: "Estimated annual value $350,000 – $480,000" },
    term: "3 years with two option years",
    posted: "2026-10-05",
    preBid: { date: "2026-10-27", time: "10:00", mandatory: false, location: "Microsoft Teams (online)", virtual: true, quote: "Networking/Bidders Conference October 27, 2026 @ 10:00 a.m. (Microsoft Teams)" },
    questionsDue: { date: "2026-10-30", time: "17:00" },
    due: { date: "2026-12-01", time: "14:00" },
    experience: { years: 5, description: "5 years of managed IT services for organizations of 500+ users", quote: "at least five (5) years providing managed IT services to organizations of 500 or more users" },
    professional: true,
    insuranceExtra: [{ type: "cyber", limit: 2_000_000, quote: "Cyber Liability $2,000,000 per occurrence" }],
    statedStaffingMin: { count: 6, quote: "Contractor must dedicate at least six (6) help desk staff to this contract" },
    other: [{ label: "CJIS background checks for all staff", quote: "All personnel must pass a CJIS-compliant background check before accessing County systems" }],
    docsExtra: [{ id: "sla", label: "Proposed service level agreement and staffing plan", kind: "narrative" }],
    scopeTags: ["professional-services"],
    contact: { name: "E. Haddad", email: "e.haddad@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902822 for MANAGED IT AND HELP DESK SERVICES, ALAMEDA COUNTY FIRE DEPARTMENT. RESPONSE DUE by 2:00 p.m. on December 1, 2026.
CALENDAR OF EVENTS: Request Issued October 5, 2026. Networking/Bidders Conference October 27, 2026 @ 10:00 a.m. (Microsoft Teams). Written Questions Due October 30, 2026 by 5:00 p.m. Response Due December 1, 2026 by 2:00 p.m.
SCOPE: 24/7 help desk for approximately 650 users, patching, endpoint security, Microsoft 365 administration and network monitoring across thirty (30) stations and offices. Estimated annual value $350,000 – $480,000. Contractor must dedicate at least six (6) help desk staff to this contract. All personnel must pass a CJIS-compliant background check before accessing County systems.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least five (5) years providing managed IT services to organizations of 500 or more users. Professional Liability/Errors & Omissions $1,000,000 per occurrence. Cyber Liability $2,000,000 per occurrence.`,
  }),

  // ======================================================= TRANSLATION
  curated({
    id: "s-trans-01",
    number: "RFQ No. 902804",
    title: "As-Needed Document Translation Services (Spanish, Chinese, Vietnamese, Tagalog)",
    department: "Social Services Agency (procured by GSA)",
    type: "RFQ",
    category: "translation",
    summary: "Translate client notices, forms and outreach materials into Spanish, Chinese (Traditional and Simplified), Vietnamese and Tagalog on a per-word basis, with a 3-business-day turnaround.",
    description: "Per-word pricing by language, 3-business-day standard turnaround, 24-hour rush, and a second-linguist review step. Multiple vendors may be awarded; you can bid on one or more languages.",
    value: { min: 200_000, max: 200_000, basis: "nte-pool", termYears: 3, quote: "not-to-exceed pool of $200,000 over three years, shared among awarded vendors" },
    term: "3 years, as-needed",
    posted: "2026-10-01",
    questionsDue: { date: "2026-10-14", time: "17:00" },
    due: { date: "2026-10-27", time: "14:00" },
    certs: [{ code: "ATA", label: "ATA certification or equivalent for each language pair", required: false, quote: "ATA certification or equivalent credentials for each language pair are preferred" }],
    experience: { years: 2, description: "2 years translating public-benefit or healthcare documents", quote: "at least two (2) years translating public benefit, healthcare or legal documents" },
    docsMinimal: true,
    docsExtra: [{ id: "sample-translations", label: "Two sample translations per language with reviewer notes", kind: "proof" }],
    scopeTags: ["as-needed", "professional-services"],
    contact: { name: "L. Washington", email: "l.washington@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902804 for AS-NEEDED DOCUMENT TRANSLATION SERVICES (SPANISH, CHINESE, VIETNAMESE, TAGALOG). RESPONSE DUE by 2:00 p.m. on October 27, 2026. Written Questions Due October 14, 2026 by 5:00 p.m.
SCOPE: Translation of client notices, forms and outreach materials on a per-word basis with three-business-day standard turnaround and second-linguist review, under a not-to-exceed pool of $200,000 over three years, shared among awarded vendors. Bidders may respond for one or more languages. ATA certification or equivalent credentials for each language pair are preferred.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least two (2) years translating public benefit, healthcare or legal documents.`,
  }),

  curated({
    id: "s-trans-02",
    number: "RFP No. 902817",
    title: "Court-Certified Interpreter Services for Public Defender Client Meetings",
    department: "Public Defender",
    type: "RFP",
    category: "translation",
    summary: "On-call certified interpreters (Spanish, Cantonese, Mandarin, Vietnamese and others) for attorney-client meetings at the Public Defender's offices and jails.",
    description: "Scheduled and same-day interpretation for confidential attorney-client meetings, including inside Santa Rita Jail. Interpreters must hold California court interpreter certification (or registration for non-designated languages) and pass a background check.",
    value: { min: 150_000, max: 250_000, basis: "annual", quote: "Estimated annual value $150,000 – $250,000" },
    term: "3 years",
    posted: "2026-10-02",
    preBid: { date: "2026-10-20", time: "10:00", mandatory: false, location: "Microsoft Teams (online)", virtual: true, quote: "Networking/Bidders Conference October 20, 2026 @ 10:00 a.m. (Microsoft Teams)" },
    questionsDue: { date: "2026-10-22", time: "17:00" },
    due: { date: "2026-11-17", time: "14:00" },
    certs: [{ code: "COURT_INTERPRETER", label: "California court interpreter certification (or registration for non-designated languages)", required: true, quote: "All interpreters must hold current California Judicial Council court interpreter certification, or registration for non-designated languages" }],
    experience: { years: 3, description: "3 years of legal interpretation", quote: "at least three (3) years providing interpretation in legal settings" },
    professional: true,
    other: [{ label: "Background check for jail access", quote: "Interpreters entering County jail facilities must pass a Sheriff's Office background check" }],
    scopeTags: ["professional-services", "as-needed"],
    contact: { name: "V. Ramirez", email: "v.ramirez@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902817 for COURT-CERTIFIED INTERPRETER SERVICES FOR PUBLIC DEFENDER CLIENT MEETINGS. Public Defender. RESPONSE DUE by 2:00 p.m. on November 17, 2026.
CALENDAR OF EVENTS: Request Issued October 2, 2026. Networking/Bidders Conference October 20, 2026 @ 10:00 a.m. (Microsoft Teams). Written Questions Due October 22, 2026 by 5:00 p.m. Response Due November 17, 2026 by 2:00 p.m.
SCOPE: Scheduled and same-day interpretation for confidential attorney-client meetings at Public Defender offices and County jail facilities. Estimated annual value $150,000 – $250,000. All interpreters must hold current California Judicial Council court interpreter certification, or registration for non-designated languages. Interpreters entering County jail facilities must pass a Sheriff's Office background check.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least three (3) years providing interpretation in legal settings. Professional Liability/Errors & Omissions $1,000,000 per occurrence.`,
  }),

  curated({
    id: "s-trans-03",
    number: "RFQ No. 902798A",
    title: "ASL and Spoken-Language Interpretation for Public Meetings",
    department: "Clerk of the Board of Supervisors",
    type: "RFQ",
    category: "translation",
    summary: "Interpreters for Board of Supervisors and commission meetings: American Sign Language plus Spanish and Cantonese on request, in person and on Zoom. Closes October 15.",
    description: "Roughly 60 meetings a year, booked at least 72 hours ahead; hourly rates with two-hour minimums. ASL interpreters must be RID or BEI certified.",
    value: { min: 40_000, max: 70_000, basis: "annual", quote: "Estimated annual value $40,000 – $70,000" },
    term: "2 years",
    posted: "2026-09-24",
    questionsDue: { date: "2026-10-06", time: "17:00" },
    due: { date: "2026-10-15", time: "14:00" },
    certs: [{ code: "RID", label: "RID or BEI certification for ASL interpreters", required: true, quote: "ASL interpreters must hold RID or BEI certification" }],
    experience: { years: 2, description: "2 years interpreting public meetings", quote: "at least two (2) years interpreting for public meetings or similar settings" },
    docsMinimal: true,
    scopeTags: ["as-needed"],
    contact: { name: "H. Lindqvist", email: "h.lindqvist@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902798A for ASL AND SPOKEN-LANGUAGE INTERPRETATION FOR PUBLIC MEETINGS. Clerk of the Board of Supervisors. RESPONSE DUE by 2:00 p.m. on October 15, 2026. Written Questions Due October 6, 2026 by 5:00 p.m.
SCOPE: Interpretation at approximately sixty (60) public meetings per year, in person and on Zoom, booked at least 72 hours ahead, with two-hour minimums. Estimated annual value $40,000 – $70,000. ASL interpreters must hold RID or BEI certification.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least two (2) years interpreting for public meetings or similar settings.`,
  }),

  // ======================================================= DESIGN / PRINT
  curated({
    id: "s-design-01",
    number: "RFQ No. 902801",
    title: "Graphic Design for Public Health Campaign Materials (Multilingual)",
    department: "Public Health Department (procured by GSA)",
    type: "RFQ",
    category: "design-print",
    summary: "Design a flu and respiratory illness campaign: posters, bus ads, social media and a printed guide in six languages, print-ready, by mid-November.",
    description: "Concept, layout and production files for a multilingual campaign from County-supplied copy and translations, plus a short brand guide for departments to reuse. Small fixed-price job with a short packet.",
    value: { min: 30_000, max: 60_000, basis: "total", quote: "Estimated value $30,000 – $60,000" },
    posted: "2026-10-01",
    questionsDue: { date: "2026-10-12", time: "17:00" },
    due: { date: "2026-10-21", time: "14:00" },
    experience: { years: 2, description: "2 years of multilingual print and digital design", quote: "at least two (2) years of professional graphic design experience including multilingual print and digital materials" },
    docsMinimal: true,
    docsExtra: [{ id: "portfolio", label: "Portfolio of three comparable campaigns", kind: "proof" }],
    scopeTags: ["professional-services"],
    contact: { name: "A. Petrov", email: "a.petrov@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902801 for GRAPHIC DESIGN FOR PUBLIC HEALTH CAMPAIGN MATERIALS (MULTILINGUAL). RESPONSE DUE by 2:00 p.m. on October 21, 2026. Written Questions Due October 12, 2026 by 5:00 p.m.
SCOPE: Concept, layout and print-ready production files for posters, transit ads, social media and a printed guide in six languages from County-supplied copy and translations. Estimated value $30,000 – $60,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least two (2) years of professional graphic design experience including multilingual print and digital materials.`,
  }),

  curated({
    id: "s-design-02",
    number: "RFQ No. 902800",
    title: "Printing and Mailing of Voter Information Guides",
    department: "Registrar of Voters",
    type: "RFQ",
    category: "design-print",
    summary: "Print and mail about 870,000 voter information guides in four languages on a fixed election schedule. Mostly printing capacity, not design.",
    description: "Offset printing, bindery, addressing and USPS mail entry of county voter information guides, with proofs within 48 hours and strict mail-drop dates. Requires a mailing permit and production capacity for 870,000 pieces in ten days.",
    value: { min: 400_000, max: 700_000, basis: "total", quote: "Estimated value $400,000 – $700,000 per election" },
    posted: "2026-09-30",
    questionsDue: { date: "2026-10-09", time: "17:00" },
    due: { date: "2026-10-20", time: "14:00" },
    experience: { years: 3, description: "3 years printing and mailing election or similar high-volume materials", quote: "at least three (3) years printing and mailing runs of 500,000 pieces or more" },
    statedStaffingMin: { count: 10, quote: "Bidder must demonstrate production capacity to print, bind and mail 870,000 pieces within ten (10) calendar days" },
    other: [{ label: "USPS mailing permit required", quote: "Bidder must hold a USPS mailing permit and perform mail entry" }],
    contact: { name: "K. Sato", email: "k.sato@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902800 for PRINTING AND MAILING OF VOTER INFORMATION GUIDES. Registrar of Voters. RESPONSE DUE by 2:00 p.m. on October 20, 2026. Written Questions Due October 9, 2026 by 5:00 p.m.
SCOPE: Offset printing, bindery, addressing and USPS mail entry of approximately 870,000 voter information guides in four languages. Estimated value $400,000 – $700,000 per election. Bidder must demonstrate production capacity to print, bind and mail 870,000 pieces within ten (10) calendar days. Bidder must hold a USPS mailing permit and perform mail entry.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least three (3) years printing and mailing runs of 500,000 pieces or more.`,
  }),

  curated({
    id: "s-design-03",
    number: "RFP No. 902819",
    title: "Branding and Website Design, Alameda County Library Strategic Plan",
    department: "Alameda County Library",
    type: "RFP",
    category: "design-print",
    secondary: ["it-services"],
    summary: "Create a visual identity and a small public website for the Library's new five-year strategic plan, with templates staff can keep using.",
    description: "Discovery workshops, logo and identity system, print templates, and a lightweight accessible website on the County's platform. Fixed-price proposal with a six-month schedule.",
    value: { min: 45_000, max: 80_000, basis: "total", quote: "Estimated value $45,000 – $80,000" },
    term: "6 months",
    posted: "2026-10-05",
    questionsDue: { date: "2026-11-02", time: "17:00" },
    due: { date: "2026-11-24", time: "14:00" },
    experience: { years: 3, description: "3 years of branding work for public or nonprofit clients", quote: "at least three (3) years delivering branding and website projects for public agencies or nonprofits" },
    professional: true,
    docsExtra: [{ id: "portfolio", label: "Portfolio with three case studies", kind: "proof" }],
    scopeTags: ["professional-services"],
    contact: { name: "P. Reyes", email: "p.reyes@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902819 for BRANDING AND WEBSITE DESIGN, ALAMEDA COUNTY LIBRARY STRATEGIC PLAN. RESPONSE DUE by 2:00 p.m. on November 24, 2026. Written Questions Due November 2, 2026 by 5:00 p.m.
SCOPE: Discovery workshops, logo and identity system, print templates and an accessible website for the Library's five-year strategic plan. Estimated value $45,000 – $80,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least three (3) years delivering branding and website projects for public agencies or nonprofits. Professional Liability/Errors & Omissions $1,000,000 per occurrence.`,
  }),

  // ======================================================= OTHER TRADES
  curated({
    id: "s-sec-01",
    number: "RFQ No. 902821",
    title: "Unarmed Security Guard Services, Social Services Lobbies",
    department: "Social Services Agency (procured by GSA)",
    type: "RFQ",
    category: "security",
    summary: "Unarmed guards at five Social Services lobbies during business hours, with de-escalation training. Living wage applies.",
    description: "About 11,000 guard hours a year across five sites, BSIS-licensed company and guard cards, 40 hours of de-escalation and trauma-informed training per guard.",
    value: { min: 600_000, max: 800_000, basis: "annual", quote: "Estimated annual value $600,000 – $800,000" },
    term: "3 years",
    posted: "2026-10-05",
    preBid: { date: "2026-10-16", time: "10:00", mandatory: false, location: "Microsoft Teams (online)", virtual: true, quote: "Networking/Bidders Conference October 16, 2026 @ 10:00 a.m. (Microsoft Teams)" },
    questionsDue: { date: "2026-10-20", time: "17:00" },
    due: { date: "2026-11-02", time: "14:00" },
    licenses: [{ code: "BSIS_PPO", label: "BSIS Private Patrol Operator license", quote: "Bidder must hold a current BSIS Private Patrol Operator license and all guards must hold valid guard cards" }],
    experience: { years: 3, description: "3 years guarding public-facing government lobbies", quote: "at least three (3) years providing guard services at public-facing government or healthcare facilities" },
    livingWage: true,
    other: [{ label: "County living wage applies", quote: "This contract is subject to the Alameda County Living Wage Ordinance" }],
    contact: { name: "L. Washington", email: "l.washington@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902821 for UNARMED SECURITY GUARD SERVICES, SOCIAL SERVICES LOBBIES. RESPONSE DUE by 2:00 p.m. on November 2, 2026.
CALENDAR OF EVENTS: Request Issued October 5, 2026. Networking/Bidders Conference October 16, 2026 @ 10:00 a.m. (Microsoft Teams). Written Questions Due October 20, 2026 by 5:00 p.m. Response Due November 2, 2026 by 2:00 p.m.
SCOPE: Approximately 11,000 unarmed guard hours per year at five (5) lobbies with de-escalation training. Estimated annual value $600,000 – $800,000. This contract is subject to the Alameda County Living Wage Ordinance.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold a current BSIS Private Patrol Operator license and all guards must hold valid guard cards. Bidder must have at least three (3) years providing guard services at public-facing government or healthcare facilities.`,
  }),

  curated({
    id: "s-haul-01",
    number: "RFQ No. 902823",
    title: "Debris Hauling and Disposal Services, As-Needed",
    department: "Public Works Agency",
    type: "RFQ",
    category: "hauling",
    summary: "On-call hauling of construction debris, green waste and illegally dumped material from County roads and facilities to permitted disposal sites.",
    description: "Roll-off and dump truck service on 24-hour notice with disposal tickets, from a shared pool. Pollution liability insurance required.",
    value: { min: 300_000, max: 300_000, basis: "nte-pool", termYears: 3, quote: "not-to-exceed pool of $300,000 over three years" },
    term: "3 years, as-needed",
    posted: "2026-10-05",
    questionsDue: { date: "2026-10-19", time: "17:00" },
    due: { date: "2026-10-29", time: "14:00" },
    experience: { years: 2, description: "2 years of commercial hauling", quote: "at least two (2) years of commercial debris hauling experience" },
    insuranceExtra: [{ type: "pollution", limit: 1_000_000, quote: "Pollution Liability $1,000,000 per occurrence" }],
    other: [{ label: "CA motor carrier permit", quote: "Bidder must hold a valid California motor carrier permit" }],
    docsMinimal: true,
    scopeTags: ["as-needed"],
    contact: { name: "S. Nakamura", email: "s.nakamura@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902823 for DEBRIS HAULING AND DISPOSAL SERVICES, AS-NEEDED. Public Works Agency. RESPONSE DUE by 2:00 p.m. on October 29, 2026. Written Questions Due October 19, 2026 by 5:00 p.m.
SCOPE: Roll-off and dump truck hauling of construction debris, green waste and illegally dumped material on 24-hour notice under a not-to-exceed pool of $300,000 over three years. Bidder must hold a valid California motor carrier permit. Pollution Liability $1,000,000 per occurrence.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least two (2) years of commercial debris hauling experience.`,
  }),

  curated({
    id: "s-veh-01",
    number: "RFQ No. 902824",
    title: "Fleet Smog, Brake and Tire Services, GSA Motor Pool",
    department: "General Services Agency, Motor Pool",
    type: "RFQ",
    category: "vehicle-maintenance",
    summary: "Smog checks, brake jobs and tire service for about 400 County pool vehicles at your shop, with a 48-hour turnaround.",
    description: "Per-service pricing for light-duty vehicles, STAR-certified smog station, ASE-certified technicians, shop within 15 miles of Oakland.",
    value: { min: 90_000, max: 130_000, basis: "annual", quote: "Estimated annual value $90,000 – $130,000" },
    term: "3 years",
    posted: "2026-10-05",
    questionsDue: { date: "2026-10-22", time: "17:00" },
    due: { date: "2026-11-05", time: "14:00" },
    licenses: [{ code: "BAR_STAR", label: "Bureau of Automotive Repair license; STAR-certified smog station", quote: "Bidder must be a Bureau of Automotive Repair licensed, STAR-certified smog check station" }],
    certs: [{ code: "ASE", label: "ASE-certified technicians", required: true, quote: "Work must be performed by ASE-certified technicians" }],
    location: { type: "radius", radiusMiles: 15, note: "Shop within 15 miles of downtown Oakland", quote: "Bidder's shop must be located within fifteen (15) miles of 1221 Oak Street, Oakland" },
    docsMinimal: true,
    scopeTags: ["as-needed"],
    contact: { name: "F. Dominguez", email: "f.dominguez@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902824 for FLEET SMOG, BRAKE AND TIRE SERVICES, GSA MOTOR POOL. RESPONSE DUE by 2:00 p.m. on November 5, 2026. Written Questions Due October 22, 2026 by 5:00 p.m.
SCOPE: Smog checks, brake and tire service for approximately 400 light-duty pool vehicles with 48-hour turnaround. Estimated annual value $90,000 – $130,000. Work must be performed by ASE-certified technicians. Bidder's shop must be located within fifteen (15) miles of 1221 Oak Street, Oakland.
BIDDER MINIMUM QUALIFICATIONS: Bidder must be a Bureau of Automotive Repair licensed, STAR-certified smog check station.`,
  }),

  curated({
    id: "s-fm-01",
    number: "RFQ No. 902825",
    title: "As-Needed Facility Maintenance for Housing and Community Development Properties",
    department: "Community Development Agency, Housing and Community Development",
    type: "RFQ",
    category: "facility-maintenance",
    secondary: ["electrical", "plumbing", "hvac", "painting"],
    summary: "On-call repairs (electrical, plumbing, HVAC, painting, general) at County-owned housing sites. Specialty contractors may bid on their trade only.",
    description: "Task orders under $25,000 at twelve County-owned residential and community properties. Bidders may respond for all trades or for a single trade with the matching license; the County will award by trade. Public works rules apply.",
    value: { min: 900_000, max: 900_000, basis: "nte-pool", termYears: 3, quote: "not-to-exceed pool of $900,000 over three years across all trades" },
    term: "3 years, as-needed",
    posted: "2026-10-05",
    questionsDue: { date: "2026-10-23", time: "17:00" },
    due: { date: "2026-11-06", time: "14:00" },
    licenses: [{ code: "B", label: "Class B, or the C-license matching the trade you bid on (C-10, C-36, C-20, C-33)", quote: "Bidders may respond for all trades with a Class B license, or for a single trade with the corresponding C-10, C-36, C-20 or C-33 license" }],
    experience: { years: 3, description: "3 years of residential or commercial repair work", quote: "at least three (3) years of residential or commercial repair and maintenance experience" },
    publicWorks: true,
    scopeTags: ["as-needed", "multi-trade"],
    contact: { name: "N. Okoye", email: "n.okoye@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902825 for AS-NEEDED FACILITY MAINTENANCE FOR HOUSING AND COMMUNITY DEVELOPMENT PROPERTIES. RESPONSE DUE by 2:00 p.m. on November 6, 2026. Written Questions Due October 23, 2026 by 5:00 p.m.
SCOPE: On-call electrical, plumbing, HVAC, painting and general repairs at twelve (12) County-owned residential and community properties in task orders under $25,000, under a not-to-exceed pool of $900,000 over three years across all trades. Bidders may respond for all trades with a Class B license, or for a single trade with the corresponding C-10, C-36, C-20 or C-33 license; the County will award by trade.
BIDDER MINIMUM QUALIFICATIONS: Bidder must have at least three (3) years of residential or commercial repair and maintenance experience.`,
  }),

  curated({
    id: "s-pest-01",
    number: "RFQ No. 902826",
    title: "Integrated Pest Management Services, County Facilities",
    department: "General Services Agency, Building Maintenance Department",
    type: "RFQ",
    category: "pest-control",
    summary: "Monthly integrated pest management at 40 County buildings, with rodent exclusion work and an IPM-first approach.",
    description: "Monthly service, logs, exclusion repairs and emergency response, favoring non-chemical controls. Structural Pest Control Board licensed operator required.",
    value: { min: 70_000, max: 100_000, basis: "annual", quote: "Estimated annual value $70,000 – $100,000" },
    term: "3 years",
    posted: "2026-10-05",
    questionsDue: { date: "2026-10-28", time: "17:00" },
    due: { date: "2026-11-12", time: "14:00" },
    licenses: [{ code: "SPCB", label: "Structural Pest Control Board operator license (Branch 2)", quote: "Bidder must hold a current Structural Pest Control Board Branch 2 operator license" }],
    experience: { years: 3, description: "3 years of commercial IPM", quote: "at least three (3) years providing integrated pest management to commercial or public facilities" },
    docsMinimal: true,
    contact: { name: "J. Whitfield", email: "j.whitfield@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902826 for INTEGRATED PEST MANAGEMENT SERVICES, COUNTY FACILITIES. RESPONSE DUE by 2:00 p.m. on November 12, 2026. Written Questions Due October 28, 2026 by 5:00 p.m.
SCOPE: Monthly integrated pest management at forty (40) County buildings with exclusion repairs and emergency response. Estimated annual value $70,000 – $100,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold a current Structural Pest Control Board Branch 2 operator license and have at least three (3) years providing integrated pest management to commercial or public facilities.`,
  }),

  curated({
    id: "s-paint-01",
    number: "RFQ No. 902827",
    title: "Interior Repainting, Dublin and Castro Valley Library Branches",
    department: "Alameda County Library",
    type: "RFQ",
    category: "painting",
    summary: "Repaint public areas and staff rooms at two library branches over winter closures.",
    description: "Surface prep, low-VOC paint, and minor drywall repair at the Dublin and Castro Valley branches, scheduled around closed days in December and January. Public works project.",
    value: { min: 60_000, max: 95_000, basis: "total", quote: "Estimated value $60,000 – $95,000" },
    posted: "2026-10-05",
    siteVisit: { date: "2026-10-21", time: "09:00", mandatory: false, location: "Dublin Library, 200 Civic Plaza", quote: "Non-Mandatory Site Visit October 21, 2026 @ 9:00 a.m., Dublin Library, 200 Civic Plaza" },
    questionsDue: { date: "2026-10-23", time: "17:00" },
    due: { date: "2026-10-29", time: "14:00" },
    licenses: [{ code: "C-33", label: "C-33 Painting and Decorating Contractor license", quote: "Bidder must hold an active C-33 Painting and Decorating Contractor license" }],
    experience: { years: 2, description: "2 years of commercial interior painting", quote: "at least two (2) years of commercial interior painting experience" },
    publicWorks: true,
    contact: { name: "P. Reyes", email: "p.reyes@acgov.example" },
    excerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902827 for INTERIOR REPAINTING, DUBLIN AND CASTRO VALLEY LIBRARY BRANCHES. RESPONSE DUE by 2:00 p.m. on October 29, 2026.
CALENDAR OF EVENTS: Request Issued October 5, 2026. Non-Mandatory Site Visit October 21, 2026 @ 9:00 a.m., Dublin Library, 200 Civic Plaza. Written Questions Due October 23, 2026 by 5:00 p.m. Response Due October 29, 2026 by 2:00 p.m.
SCOPE: Surface preparation, minor drywall repair and low-VOC repainting of public and staff areas at two branches during closed days. Estimated value $60,000 – $95,000.
BIDDER MINIMUM QUALIFICATIONS: Bidder must hold an active C-33 Painting and Decorating Contractor license and have at least two (2) years of commercial interior painting experience.`,
  }),
];
