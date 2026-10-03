/**
 * Curated sample postings from buyers other than the County, written so the
 * dataset exercises every small-business mechanism the engine models: a Port
 * VSBE set-aside, the State's SB/DVBE goal and preference, UC's Small Business
 * First set-aside, two federal total small business set-asides, EBMUD's bid
 * discount, Oakland's L/SLBE participation requirement, HUD Section 3, and the
 * County's directed spending at or under $25,000.
 *
 * Every program rule quoted here was read on the program's official page on
 * 2026-10-03 (see data/programs.ts); the postings themselves are samples with
 * `.example` contacts, labelled as such in provenance. Not live postings.
 */
import type { SolicitationInput } from "./types";

const NOTE = (buyer: string) => `Sample record written for the hackathon demo in the format of ${buyer} solicitations. Not a live posting; the program rules it cites were checked on the program's official page on 2026-10-03.`;
const CURATED = (buyer: string): SolicitationInput["provenance"] => ({ source: "curated", extractedBy: "human", extractedAt: "2026-10-03", note: NOTE(buyer) });

const GL = (quote: string) => ({ type: "general-liability" as const, limit: 1_000_000, aggregate: 2_000_000, quote });
const AUTO = (quote: string) => ({ type: "auto" as const, limit: 1_000_000, quote });
const WC = (quote: string) => ({ type: "workers-comp" as const, limit: "statutory" as const, quote });

export const REGIONAL_SOLICITATIONS: SolicitationInput[] = [
  // ------------------------------------------------------------ Port of Oakland: Very Small Business set-aside
  {
    id: "r-port-01",
    number: "Port RFQ No. 26-114",
    title: "Janitorial Services, Harbor Facilities Administration Buildings",
    department: "Port of Oakland, Purchasing",
    agencyId: "port-of-oakland",
    type: "RFQ",
    category: "janitorial",
    secondaryCategories: ["facility-maintenance"],
    summary: "Nightly janitorial service at two Port administration buildings in Jack London Square. Limited to Port-certified Very Small Business Enterprises under the Port's Very Small Business Program.",
    description: "Five-night-a-week cleaning of roughly 48,000 square feet of office, lobby and restroom space at 530 Water Street and the Harbor Facilities field office, with quarterly floor care. Only firms certified by the Port as Very Small Business Enterprises (three-year average gross revenue of $5 million or less) may bid as the prime. The Port's living wage ordinance applies.",
    estimatedValue: { min: 160_000, max: 220_000, basis: "annual", quote: "The Port's estimate for this work is $160,000 to $220,000 per year" },
    term: "3 years",
    dates: {
      posted: "2026-10-01",
      siteVisit: { when: { date: "2026-10-15", time: "10:00" }, mandatory: false, location: "530 Water Street, Oakland, main lobby", quote: "Non-mandatory site walk October 15, 2026 at 10:00 a.m., 530 Water Street, Oakland" },
      questionsDue: { date: "2026-10-20", time: "16:00" },
      submissionDue: { date: "2026-11-03", time: "14:00" },
      anticipatedAward: "2026-12-10",
      contractStart: "2027-01-04",
    },
    submissionMethod: "Upload the quote and the Port's forms through the Port's bid portal by 2:00 p.m. on the due date.",
    requirements: {
      licenses: [],
      certifications: [
        {
          code: "PORT_SBE",
          label: "Port of Oakland certified Very Small Business Enterprise (VSBE)",
          required: true,
          mechanism: "set-aside",
          scope: "total",
          quote: "This solicitation is issued under the Port's Very Small Business Program and is limited to firms certified by the Port of Oakland as Very Small Business Enterprises (VSBE) at the time of bid",
        },
      ],
      insurance: [GL("Commercial General Liability $1,000,000 per occurrence, $2,000,000 aggregate"), AUTO("Automobile Liability $1,000,000 per occurrence"), WC("Workers' Compensation as required by the State of California")],
      location: { type: "none" },
      experience: { years: 3, description: "3 years of commercial janitorial service", quote: "at least three (3) years of commercial janitorial experience at facilities of comparable size" },
      bonding: [],
      prevailingWage: false,
      livingWage: true,
      dirRegistration: false,
      other: [{ label: "Port of Oakland Living Wage Ordinance applies", quote: "The Port of Oakland Living Wage Ordinance applies to this contract" }],
    },
    documents: [
      { id: "quote-form", label: "Port Quote Form (pricing)", kind: "pricing", quote: "Quote Form" },
      { id: "vsbe-cert", label: "Copy of the Port VSBE certification", kind: "proof", quote: "a copy of the firm's current Port VSBE certification" },
      { id: "references", label: "Three references for comparable facilities", kind: "references", quote: "three (3) references" },
      { id: "living-wage", label: "Living Wage compliance declaration", kind: "attestation", quote: "Living Wage Ordinance" },
    ],
    scopeTags: ["institutional"],
    contact: { name: "D. Nakamura", title: "Port Buyer (sample contact)", email: "d.nakamura@portoakland.example" },
    sourceUrl: "https://www.portofoakland.com/",
    sourceExcerpt: `PORT OF OAKLAND REQUEST FOR QUOTATION No. 26-114, JANITORIAL SERVICES, HARBOR FACILITIES ADMINISTRATION BUILDINGS. Quotes due November 3, 2026 by 2:00 p.m. Non-mandatory site walk October 15, 2026 at 10:00 a.m., 530 Water Street, Oakland. Questions due October 20, 2026 by 4:00 p.m.
VERY SMALL BUSINESS PROGRAM: This solicitation is issued under the Port's Very Small Business Program and is limited to firms certified by the Port of Oakland as Very Small Business Enterprises (VSBE) at the time of bid. Bidders must include a copy of the firm's current Port VSBE certification. A VSBE is a firm whose average gross revenue over the last three years does not exceed $5 million.
SCOPE: Nightly janitorial service five nights per week at 530 Water Street and the Harbor Facilities field office, approximately 48,000 square feet, with quarterly floor care. The Port's estimate for this work is $160,000 to $220,000 per year for a three-year term.
MINIMUM QUALIFICATIONS: at least three (3) years of commercial janitorial experience at facilities of comparable size; three (3) references.
INSURANCE: Commercial General Liability $1,000,000 per occurrence, $2,000,000 aggregate; Automobile Liability $1,000,000 per occurrence; Workers' Compensation as required by the State of California.
The Port of Oakland Living Wage Ordinance applies to this contract. Submit the Quote Form and all forms through the Port's bid portal.`,
    status: "open",
    provenance: CURATED("Port of Oakland"),
  },

  // ------------------------------------------------------------ Caltrans District 4: DVBE goal + SB preference (public works)
  {
    id: "r-caltrans-01",
    number: "Caltrans 04-2026-LM-17",
    title: "Landscape Maintenance, I-580 and SR-13 Interchanges, Oakland",
    department: "Caltrans District 4, Office of Maintenance",
    agencyId: "caltrans-d4",
    type: "IFB",
    category: "landscaping",
    summary: "Two-year highway landscape maintenance at three interchanges in Oakland: irrigation, pruning, litter and weed control. State public works with a 3% DVBE participation goal and a 5% small business preference.",
    description: "Maintain planted areas and irrigation at the I-580/SR-13, I-580/Harrison and SR-13/Moraga interchanges, including weekly litter removal, seasonal pruning, weed abatement and irrigation repair, with lane closures per the Caltrans traffic control plan. C-27 license, DIR registration and prevailing wage apply. Bidders must meet the 3% Disabled Veteran Business Enterprise goal or document good-faith efforts; certified small businesses receive a 5% bid preference.",
    estimatedValue: { min: 420_000, max: 560_000, basis: "total", quote: "Engineer's estimate: $420,000 to $560,000 for the two-year term" },
    term: "2 years",
    dates: {
      posted: "2026-09-29",
      preBidMeeting: { when: { date: "2026-10-14", time: "09:00" }, mandatory: false, location: "Caltrans District 4, 111 Grand Avenue, Oakland, Room 5A", quote: "A non-mandatory pre-bid meeting will be held October 14, 2026 at 9:00 a.m., 111 Grand Avenue, Oakland, Room 5A" },
      questionsDue: { date: "2026-10-21", time: "17:00" },
      submissionDue: { date: "2026-11-05", time: "14:00" },
      anticipatedAward: "2026-12-18",
      contractStart: "2027-02-01",
    },
    submissionMethod: "Sealed bids on the State bid forms, delivered to 111 Grand Avenue, Oakland, by 2:00 p.m. on the bid opening date.",
    requirements: {
      licenses: [{ code: "C-27", label: "C-27 Landscaping Contractor license", quote: "Bidder must possess a valid Class C-27 Landscaping Contractor license at the time of bid" }],
      certifications: [
        {
          code: "DVBE",
          label: "Disabled Veteran Business Enterprise (DVBE) participation goal",
          required: false,
          mechanism: "participation-goal",
          goalPercent: 3,
          exceptionAllowed: true,
          quote: "A Disabled Veteran Business Enterprise (DVBE) participation goal of 3 percent applies to this contract. Bidders who do not meet the goal must document good faith efforts",
        },
        {
          code: "DGS_SB",
          label: "California DGS certified Small Business (5% bid preference)",
          required: false,
          mechanism: "preference",
          percent: 5,
          alternatives: ["DGS_MB", "DGS_SB_PW"],
          quote: "A 5 percent bid preference will be granted to bidders certified by the Department of General Services as a Small Business or Microbusiness",
        },
        { code: "DIR", label: "DIR public works contractor registration", required: true, mechanism: "registration", quote: "No contractor or subcontractor may bid on or perform this public work unless registered with the Department of Industrial Relations" },
      ],
      insurance: [GL("Commercial General Liability of not less than $1,000,000 per occurrence and $2,000,000 aggregate"), AUTO("Automobile Liability of not less than $1,000,000 per occurrence"), WC("Workers' Compensation insurance as required by law")],
      location: { type: "none" },
      experience: { years: 3, description: "3 years of roadside or large-site landscape maintenance", quote: "at least three (3) years of experience maintaining roadside or comparable large-site landscaping" },
      bonding: [
        { type: "bid", percent: 10, quote: "Bidder's security in the amount of 10 percent of the total bid" },
        { type: "performance", percent: 100, quote: "payment and performance bonds, each for 100 percent of the contract amount" },
        { type: "payment", percent: 100, quote: "payment and performance bonds, each for 100 percent of the contract amount" },
      ],
      prevailingWage: true,
      livingWage: false,
      dirRegistration: true,
      other: [{ label: "Traffic control per the Caltrans lane closure plan", quote: "All lane closures shall follow the approved traffic control plan" }],
    },
    documents: [
      { id: "bid-forms", label: "State bid forms (bid, bidder's bond, list of subcontractors)", kind: "form", quote: "State bid forms" },
      { id: "dvbe-forms", label: "DVBE Declarations and Bidder Summary (STD 843 / DVBE participation summary)", kind: "form", quote: "DVBE Declarations" },
      { id: "sb-cert", label: "DGS Small Business certification number, if claiming the preference", kind: "proof", quote: "certification number" },
      { id: "bid-bond", label: "Bidder's bond, 10% of the bid", kind: "proof", quote: "Bidder's security in the amount of 10 percent of the total bid" },
      { id: "dir", label: "DIR registration number on the bid", kind: "attestation", quote: "Department of Industrial Relations" },
    ],
    scopeTags: ["public-works"],
    contact: { name: "R. Castellanos", title: "Contract Analyst (sample contact)", email: "r.castellanos@dot-ca.example" },
    sourceUrl: "https://dot.ca.gov/",
    sourceExcerpt: `STATE OF CALIFORNIA, DEPARTMENT OF TRANSPORTATION, DISTRICT 4. NOTICE TO CONTRACTORS, CONTRACT 04-2026-LM-17, LANDSCAPE MAINTENANCE AT THE I-580/SR-13, I-580/HARRISON AND SR-13/MORAGA INTERCHANGES, OAKLAND. Bids open November 5, 2026 at 2:00 p.m. at 111 Grand Avenue, Oakland. A non-mandatory pre-bid meeting will be held October 14, 2026 at 9:00 a.m., 111 Grand Avenue, Oakland, Room 5A. Questions due October 21, 2026 by 5:00 p.m.
Engineer's estimate: $420,000 to $560,000 for the two-year term. Bidder must possess a valid Class C-27 Landscaping Contractor license at the time of bid and have at least three (3) years of experience maintaining roadside or comparable large-site landscaping.
DVBE PARTICIPATION: A Disabled Veteran Business Enterprise (DVBE) participation goal of 3 percent applies to this contract. Bidders who do not meet the goal must document good faith efforts. Submit the DVBE Declarations and participation summary with the bid.
SMALL BUSINESS PREFERENCE: A 5 percent bid preference will be granted to bidders certified by the Department of General Services as a Small Business or Microbusiness. Enter the certification number on the bid form.
PUBLIC WORKS: No contractor or subcontractor may bid on or perform this public work unless registered with the Department of Industrial Relations. Prevailing wage rates determined by the Director of Industrial Relations apply. All lane closures shall follow the approved traffic control plan.
BONDS: Bidder's security in the amount of 10 percent of the total bid; payment and performance bonds, each for 100 percent of the contract amount.
INSURANCE: Commercial General Liability of not less than $1,000,000 per occurrence and $2,000,000 aggregate; Automobile Liability of not less than $1,000,000 per occurrence; Workers' Compensation insurance as required by law. Submit sealed bids on the State bid forms.`,
    status: "open",
    provenance: CURATED("Caltrans"),
  },

  // ------------------------------------------------------------ UC Berkeley: Small Business First set-aside
  {
    id: "r-uc-01",
    number: "UCB RFQ 2026-ENG-0412",
    title: "Desktop and Help Desk Support, College of Engineering",
    department: "UC Berkeley, Supply Chain Management for the College of Engineering",
    agencyId: "uc-berkeley",
    type: "RFQ",
    category: "it-services",
    summary: "Two years of on-site desktop support and help desk coverage for roughly 900 faculty and staff devices. Issued under the University's Small Business First Program, so only certified small or diverse businesses may quote.",
    description: "Provide two on-site technicians during business hours and a ticketed help desk for the College of Engineering's 900 managed Mac and Windows devices, with imaging, patching, procurement support and after-hours escalation. The University's Small Business First Program applies to non-construction purchases between $10,000 and $250,000: this request is open only to firms certified as a small business by the California Department of General Services, the federal Small Business Administration or another recognized certifier, including DVBE, 8(a), HUBZone, WOSB and SDVOSB firms.",
    estimatedValue: { min: 180_000, max: 240_000, basis: "total", quote: "The anticipated value is $180,000 to $240,000 over two years" },
    term: "2 years",
    dates: {
      posted: "2026-10-02",
      questionsDue: { date: "2026-10-16", time: "17:00" },
      submissionDue: { date: "2026-10-30", time: "17:00" },
      anticipatedAward: "2026-11-20",
      contractStart: "2027-01-04",
    },
    submissionMethod: "Submit the quote through CalUsource by 5:00 p.m. on the due date, including the certification number and the technician résumés.",
    requirements: {
      licenses: [],
      certifications: [
        {
          code: "DGS_SB",
          label: "Certified small business (DGS SB, SBA small business, DVBE, 8(a), HUBZone, WOSB or SDVOSB)",
          required: true,
          mechanism: "set-aside",
          scope: "total",
          alternatives: ["DGS_MB", "SBA_SMALL", "DVBE", "SBA_8A", "HUBZONE", "WOSB", "SDVOSB"],
          quote: "This request is issued under the University of California Small Business First Program and is open only to firms certified as a small business by the California Department of General Services, the U.S. Small Business Administration or another certifier recognized by the University, including DVBE, 8(a), HUBZone, WOSB and SDVOSB firms",
        },
      ],
      insurance: [GL("Commercial General Liability $1,000,000 per occurrence and $2,000,000 aggregate"), AUTO("Business Automobile Liability $1,000,000 per occurrence"), WC("Workers' Compensation as required by California law"), { type: "cyber", limit: 1_000_000, quote: "Cyber liability insurance of $1,000,000 per claim" }],
      location: { type: "none" },
      experience: { years: 3, description: "3 years of enterprise desktop support", quote: "at least three (3) years providing desktop support to organizations with 500 or more managed devices" },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      statedStaffingMin: { count: 2, quote: "two (2) full-time on-site technicians" },
      other: [{ label: "Background checks for on-site staff", quote: "On-site staff must pass a University background check before starting" }],
    },
    documents: [
      { id: "quote", label: "Price quote on the CalUsource form", kind: "pricing", quote: "CalUsource" },
      { id: "cert", label: "Small business certification number and certifier", kind: "proof", quote: "certification number" },
      { id: "resumes", label: "Résumés for the two on-site technicians", kind: "narrative", quote: "technician résumés" },
      { id: "references", label: "Two references of similar size", kind: "references", quote: "two (2) references" },
    ],
    scopeTags: ["institutional"],
    contact: { name: "M. Okafor", title: "Buyer (sample contact)", email: "m.okafor@berkeley.example" },
    sourceUrl: "https://supplychain.berkeley.edu/",
    sourceExcerpt: `UNIVERSITY OF CALIFORNIA, BERKELEY. REQUEST FOR QUOTATION 2026-ENG-0412, DESKTOP AND HELP DESK SUPPORT, COLLEGE OF ENGINEERING. Quotes due October 30, 2026 by 5:00 p.m. through CalUsource. Questions due October 16, 2026 by 5:00 p.m.
SMALL BUSINESS FIRST: This request is issued under the University of California Small Business First Program and is open only to firms certified as a small business by the California Department of General Services, the U.S. Small Business Administration or another certifier recognized by the University, including DVBE, 8(a), HUBZone, WOSB and SDVOSB firms. Enter the certification number and certifier on the quote form.
SCOPE: two (2) full-time on-site technicians and a ticketed help desk for approximately 900 managed devices. The anticipated value is $180,000 to $240,000 over two years. Submit technician résumés and two (2) references.
MINIMUM QUALIFICATIONS: at least three (3) years providing desktop support to organizations with 500 or more managed devices. On-site staff must pass a University background check before starting.
INSURANCE: Commercial General Liability $1,000,000 per occurrence and $2,000,000 aggregate; Business Automobile Liability $1,000,000 per occurrence; Workers' Compensation as required by California law; Cyber liability insurance of $1,000,000 per claim.`,
    status: "open",
    provenance: CURATED("UC Berkeley"),
  },

  // ------------------------------------------------------------ Federal: total small business set-aside (Coast Guard Base Alameda)
  {
    id: "r-fed-01",
    number: "70Z0G327QAL00042",
    title: "Grounds Maintenance, Coast Guard Base Alameda",
    department: "U.S. Coast Guard, Base Alameda Contracting (posted on SAM.gov)",
    agencyId: "sam-gov",
    type: "RFQ",
    category: "landscaping",
    summary: "Mowing, irrigation, tree trimming and litter control across the 67-acre Coast Guard base on Coast Guard Island, Alameda. A 100% small business set-aside under NAICS 561730; quotes require an active SAM.gov registration.",
    description: "Base year plus four option years of grounds maintenance: weekly mowing and edging of turf, irrigation inspection and repair, quarterly tree and shrub pruning, bed maintenance and daily litter patrol along the waterfront. The Service Contract Act wage determination applies. This acquisition is a total small business set-aside; only firms that qualify as small under the $9.5 million size standard for NAICS 561730 may quote, and the quoter must have an active registration in SAM.gov at the time of quote and award.",
    estimatedValue: { min: 210_000, max: 280_000, basis: "annual", quote: "The Government anticipates an annual value between $210,000 and $280,000" },
    term: "1 base year plus 4 option years",
    dates: {
      posted: "2026-09-30",
      siteVisit: { when: { date: "2026-10-14", time: "13:00" }, mandatory: false, location: "Coast Guard Island, Alameda, Building 2 (gate pass required; request by October 9)", quote: "A site visit will be held October 14, 2026 at 1:00 p.m. at Building 2, Coast Guard Island, Alameda. Attendance is not mandatory. Request base access by October 9, 2026", prerequisite: { label: "Request base access (gate pass) by email", due: { date: "2026-10-09" }, quote: "Request base access by October 9, 2026" } },
      questionsDue: { date: "2026-10-19", time: "14:00" },
      submissionDue: { date: "2026-10-29", time: "14:00", note: "Pacific time" },
      anticipatedAward: "2026-12-01",
      contractStart: "2027-01-01",
    },
    submissionMethod: "Email the quote to the Contract Specialist by 2:00 p.m. Pacific on the due date, with the SAM.gov UEI on the first page.",
    requirements: {
      licenses: [],
      certifications: [
        {
          code: "SBA_SMALL",
          label: "Small business under NAICS 561730 ($9.5 million size standard)",
          required: true,
          mechanism: "set-aside",
          scope: "total",
          quote: "This acquisition is a 100 percent total small business set-aside under NAICS 561730 (Landscaping Services), size standard $9.5 million. Only quotes from small business concerns will be considered",
        },
        {
          code: "SAM_REGISTERED",
          label: "Active SAM.gov registration",
          required: true,
          mechanism: "registration",
          quote: "Quoters must have an active registration in the System for Award Management (SAM.gov) at the time of quote submission and at award",
        },
      ],
      insurance: [GL("Commercial general liability of $1,000,000 per occurrence"), AUTO("Automobile liability of $1,000,000 per occurrence"), WC("Workers' compensation as required by state law")],
      location: { type: "none" },
      experience: { years: 3, description: "3 years of grounds maintenance on sites of 25 acres or more", quote: "at least three (3) years of grounds maintenance experience on sites of twenty-five (25) acres or more" },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        { label: "Service Contract Act wage determination applies", quote: "The Service Contract Act applies; the attached wage determination sets minimum wages and fringe benefits" },
        { label: "Base access and background screening for all workers", quote: "All personnel require a base access pass and background screening" },
      ],
    },
    documents: [
      { id: "quote", label: "Price quote by contract line item (base and four option years)", kind: "pricing", quote: "price quote by contract line item" },
      { id: "reps-certs", label: "FAR 52.212-3 representations and certifications (completed in SAM.gov)", kind: "attestation", quote: "representations and certifications" },
      { id: "past-perf", label: "Three past performance references", kind: "references", quote: "three (3) past performance references" },
      { id: "tech", label: "Technical approach, five pages maximum", kind: "narrative", quote: "technical approach not exceeding five (5) pages" },
    ],
    scopeTags: ["institutional"],
    contact: { name: "Contract Specialist", title: "Base Alameda Contracting (sample contact)", email: "contracting.alameda@uscg.example" },
    sourceUrl: "https://sam.gov/",
    sourceExcerpt: `COMBINED SYNOPSIS/SOLICITATION 70Z0G327QAL00042, GROUNDS MAINTENANCE, COAST GUARD BASE ALAMEDA. Quotes due October 29, 2026 at 2:00 p.m. Pacific by email to the Contract Specialist. Questions due October 19, 2026 at 2:00 p.m.
SET-ASIDE: This acquisition is a 100 percent total small business set-aside under NAICS 561730 (Landscaping Services), size standard $9.5 million. Only quotes from small business concerns will be considered. Quoters must have an active registration in the System for Award Management (SAM.gov) at the time of quote submission and at award; include the UEI on the first page.
SCOPE: One base year and four option years of grounds maintenance on the 67-acre base. The Government anticipates an annual value between $210,000 and $280,000. The Service Contract Act applies; the attached wage determination sets minimum wages and fringe benefits. All personnel require a base access pass and background screening.
A site visit will be held October 14, 2026 at 1:00 p.m. at Building 2, Coast Guard Island, Alameda. Attendance is not mandatory. Request base access by October 9, 2026.
MINIMUM QUALIFICATIONS: at least three (3) years of grounds maintenance experience on sites of twenty-five (25) acres or more; three (3) past performance references; technical approach not exceeding five (5) pages; price quote by contract line item; representations and certifications completed in SAM.gov.
INSURANCE: Commercial general liability of $1,000,000 per occurrence; Automobile liability of $1,000,000 per occurrence; Workers' compensation as required by state law.`,
    status: "open",
    provenance: CURATED("federal (SAM.gov)"),
  },

  // ------------------------------------------------------------ Federal: GSA custodial set-aside (Oakland federal building)
  {
    id: "r-fed-02",
    number: "47PF0027Q0031",
    title: "Custodial Services, Ronald V. Dellums Federal Building, Oakland",
    department: "U.S. General Services Administration, Region 9 (posted on SAM.gov)",
    agencyId: "sam-gov",
    type: "RFQ",
    category: "janitorial",
    secondaryCategories: ["facility-maintenance"],
    summary: "Daily custodial service, recycling and periodic floor care for the two-tower federal building at 1301 Clay Street, Oakland. Total small business set-aside under NAICS 561720 with an active SAM.gov registration required.",
    description: "Custodial services for about 1,000,000 gross square feet across the two towers and the plaza level: daily office and restroom cleaning, trash and recycling, and periodic carpet and hard-floor care, on a day-porter plus night-crew schedule. The Service Contract Act applies. This is a total small business set-aside under NAICS 561720 ($22 million size standard); quoters must hold an active SAM.gov registration and all staff must pass a federal background investigation before starting.",
    estimatedValue: { min: 1_600_000, max: 2_100_000, basis: "annual", quote: "Estimated annual value: $1,600,000 to $2,100,000" },
    term: "1 base year plus 4 option years",
    dates: {
      posted: "2026-10-01",
      siteVisit: { when: { date: "2026-10-20", time: "09:00" }, mandatory: false, location: "1301 Clay Street, Oakland, security desk (register by October 16)", quote: "A site visit will be held October 20, 2026 at 9:00 a.m.; register attendees by October 16, 2026", prerequisite: { label: "Register attendees for the site visit", due: { date: "2026-10-16" }, quote: "register attendees by October 16, 2026" } },
      questionsDue: { date: "2026-10-26", time: "16:00" },
      submissionDue: { date: "2026-11-12", time: "16:00", note: "Pacific time" },
      anticipatedAward: "2027-01-15",
      contractStart: "2027-03-01",
    },
    submissionMethod: "Submit the quote through the SAM.gov notice's response link by 4:00 p.m. Pacific on the due date.",
    requirements: {
      licenses: [],
      certifications: [
        {
          code: "SBA_SMALL",
          label: "Small business under NAICS 561720 ($22 million size standard)",
          required: true,
          mechanism: "set-aside",
          scope: "total",
          quote: "This requirement is a total small business set-aside under NAICS 561720 (Janitorial Services), size standard $22 million",
        },
        {
          code: "SAM_REGISTERED",
          label: "Active SAM.gov registration",
          required: true,
          mechanism: "registration",
          quote: "An active SAM.gov registration is required at the time of quote and at award",
        },
      ],
      insurance: [GL("Commercial general liability of $1,000,000 per occurrence"), AUTO("Automobile liability of $1,000,000 per occurrence"), WC("Workers' compensation as required by state law")],
      location: { type: "none" },
      experience: { years: 3, description: "3 years cleaning buildings of 500,000 square feet or more", quote: "at least three (3) years of custodial experience in buildings of 500,000 gross square feet or more" },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      statedStaffingMin: { count: 20, quote: "a minimum of twenty (20) custodial staff" },
      other: [
        { label: "Service Contract Act wage determination applies", quote: "The Service Contract Act applies; the wage determination is attached" },
        { label: "Federal background investigation for all staff", quote: "All staff must pass a federal background investigation before starting work" },
      ],
    },
    documents: [
      { id: "quote", label: "Price quote by line item", kind: "pricing", quote: "price quote by line item" },
      { id: "reps-certs", label: "Representations and certifications in SAM.gov", kind: "attestation", quote: "representations and certifications in SAM.gov" },
      { id: "past-perf", label: "Past performance questionnaires (three)", kind: "references", quote: "three (3) past performance questionnaires" },
      { id: "staffing", label: "Staffing and quality control plan", kind: "narrative", quote: "staffing and quality control plan" },
    ],
    scopeTags: ["institutional"],
    contact: { name: "Contracting Officer", title: "GSA Region 9 (sample contact)", email: "r9.custodial@gsa.example" },
    sourceUrl: "https://sam.gov/",
    sourceExcerpt: `REQUEST FOR QUOTATION 47PF0027Q0031, CUSTODIAL SERVICES, RONALD V. DELLUMS FEDERAL BUILDING, 1301 CLAY STREET, OAKLAND, CALIFORNIA. Quotes due November 12, 2026 at 4:00 p.m. Pacific through the SAM.gov response link. Questions due October 26, 2026 at 4:00 p.m.
SET-ASIDE: This requirement is a total small business set-aside under NAICS 561720 (Janitorial Services), size standard $22 million. An active SAM.gov registration is required at the time of quote and at award. Complete representations and certifications in SAM.gov.
SCOPE: Daily custodial service, recycling and periodic floor care for approximately 1,000,000 gross square feet, with a minimum of twenty (20) custodial staff on a day-porter and night-crew schedule. Estimated annual value: $1,600,000 to $2,100,000; one base year and four option years. The Service Contract Act applies; the wage determination is attached. All staff must pass a federal background investigation before starting work.
A site visit will be held October 20, 2026 at 9:00 a.m.; register attendees by October 16, 2026.
MINIMUM QUALIFICATIONS: at least three (3) years of custodial experience in buildings of 500,000 gross square feet or more; three (3) past performance questionnaires; staffing and quality control plan; price quote by line item.
INSURANCE: Commercial general liability of $1,000,000 per occurrence; Automobile liability of $1,000,000 per occurrence; Workers' compensation as required by state law.`,
    status: "open",
    provenance: CURATED("federal (SAM.gov)"),
  },

  // ------------------------------------------------------------ EBMUD: 7% bid discount for certified small businesses
  {
    id: "r-ebmud-01",
    number: "EBMUD RFQ 2026-093",
    title: "Grounds and Vegetation Management, Oakland and Orinda Facilities",
    department: "EBMUD, Purchasing Division",
    agencyId: "ebmud",
    type: "RFQ",
    category: "landscaping",
    summary: "Annual grounds maintenance and vegetation management at six EBMUD facilities in Oakland and Orinda. Public works; certified small businesses receive a 7% bid discount under the District's Contract Equity Program.",
    description: "Mowing, weed abatement, defensible-space clearing, irrigation checks and tree work at the Administration Building, two pumping plants and three reservoir sites, with fire-season clearing complete by June 1 each year. C-27 license, DIR registration and prevailing wage apply. Under the Contract Equity Program, a bidder certified as a small business by the California Department of General Services (SB or Microbusiness) receives a 7 percent discount in bid evaluation on contracts up to $150,000 per contract year.",
    estimatedValue: { min: 95_000, max: 140_000, basis: "annual", quote: "Estimated annual value $95,000 to $140,000" },
    term: "3 years",
    dates: {
      posted: "2026-10-02",
      siteVisit: { when: { date: "2026-10-16", time: "09:00" }, mandatory: false, location: "EBMUD Administration Building, 375 11th Street, Oakland, then by van to the sites", quote: "Optional site tour October 16, 2026 at 9:00 a.m. from 375 11th Street, Oakland" },
      questionsDue: { date: "2026-10-22", time: "16:00" },
      submissionDue: { date: "2026-11-04", time: "14:00" },
      anticipatedAward: "2026-12-08",
      contractStart: "2027-01-04",
    },
    submissionMethod: "Upload the quote and the District's forms through the EBMUD bid portal by 2:00 p.m. on the due date.",
    requirements: {
      licenses: [{ code: "C-27", label: "C-27 Landscaping Contractor license", quote: "Bidders must hold a current C-27 Landscaping Contractor license" }],
      certifications: [
        {
          code: "DGS_SB",
          label: "DGS certified Small Business or Microbusiness (7% bid discount, Contract Equity Program)",
          required: false,
          mechanism: "preference",
          percent: 7,
          alternatives: ["DGS_MB"],
          quote: "a bidder certified by the California Department of General Services as a Small Business or Microbusiness will receive a seven percent (7%) discount in bid evaluation on contracts up to $150,000 per contract year",
        },
        { code: "DIR", label: "DIR public works contractor registration", required: true, mechanism: "registration", quote: "Contractors and subcontractors must be registered with the Department of Industrial Relations" },
      ],
      insurance: [GL("General Liability $1,000,000 per occurrence and $2,000,000 aggregate"), AUTO("Automobile Liability $1,000,000 combined single limit"), WC("Workers' Compensation as required by California law")],
      location: { type: "none" },
      experience: { years: 2, description: "2 years of grounds or vegetation management for public agencies or utilities", quote: "at least two (2) years of grounds or vegetation management for public agencies or utilities" },
      bonding: [],
      prevailingWage: true,
      livingWage: false,
      dirRegistration: true,
      other: [{ label: "Fire-season defensible-space clearing complete by June 1 each year", quote: "defensible-space clearing shall be complete by June 1 of each contract year" }],
    },
    documents: [
      { id: "quote-form", label: "District quote form (pricing by site)", kind: "pricing", quote: "quote form" },
      { id: "cep-forms", label: "Contract Equity Program forms (P-025 and P-035)", kind: "form", quote: "Contract Equity Program forms" },
      { id: "sb-cert", label: "DGS SB/MB certification, if claiming the discount", kind: "proof", quote: "attach the DGS certification" },
      { id: "references", label: "Three references", kind: "references", quote: "three (3) references" },
    ],
    scopeTags: ["public-works"],
    contact: { name: "L. Fontaine", title: "Buyer (sample contact)", email: "l.fontaine@ebmud.example" },
    sourceUrl: "https://www.ebmud.com/",
    sourceExcerpt: `EAST BAY MUNICIPAL UTILITY DISTRICT, REQUEST FOR QUOTATION 2026-093, GROUNDS AND VEGETATION MANAGEMENT, OAKLAND AND ORINDA FACILITIES. Quotes due November 4, 2026 by 2:00 p.m. through the EBMUD bid portal. Optional site tour October 16, 2026 at 9:00 a.m. from 375 11th Street, Oakland. Questions due October 22, 2026 by 4:00 p.m.
SCOPE: Mowing, weed abatement, defensible-space clearing, irrigation checks and tree work at six facilities; defensible-space clearing shall be complete by June 1 of each contract year. Estimated annual value $95,000 to $140,000 for a three-year term.
CONTRACT EQUITY PROGRAM: a bidder certified by the California Department of General Services as a Small Business or Microbusiness will receive a seven percent (7%) discount in bid evaluation on contracts up to $150,000 per contract year; attach the DGS certification and the Contract Equity Program forms.
PUBLIC WORKS: Contractors and subcontractors must be registered with the Department of Industrial Relations; prevailing wage applies. Bidders must hold a current C-27 Landscaping Contractor license and have at least two (2) years of grounds or vegetation management for public agencies or utilities; three (3) references. Submit pricing by site on the quote form.
INSURANCE: General Liability $1,000,000 per occurrence and $2,000,000 aggregate; Automobile Liability $1,000,000 combined single limit; Workers' Compensation as required by California law.`,
    status: "open",
    provenance: CURATED("EBMUD"),
  },

  // ------------------------------------------------------------ City of Oakland: 50% L/SLBE participation + 2% discount
  {
    id: "r-oak-01",
    number: "Oakland Project No. C612510",
    title: "Curb Ramp Construction, Council District 5, FY 2026-27",
    department: "City of Oakland, Department of Transportation",
    agencyId: "city-oakland",
    type: "IFB",
    category: "general-construction",
    summary: "Construct about 140 ADA curb ramps and related sidewalk, gutter and signal-loop work in the Fruitvale and Glenview areas. Public works with the City's 50% Local and Small Local Business Enterprise participation requirement and a 2% bid discount.",
    description: "Remove and replace curb ramps, adjacent sidewalk and curb and gutter at roughly 140 locations, including detectable warning surfaces, drainage adjustments and traffic control on arterial streets. Class A or C-8 license, DIR registration and prevailing wage apply. Under the City's Local and Small Local Business Enterprise Program, bids must show at least 50 percent L/SLBE participation (at least 25 percent LBE and 25 percent SLBE) to be responsive; bidders meeting the goal receive a 2 percent bid discount.",
    estimatedValue: { min: 1_300_000, max: 1_700_000, basis: "total", quote: "Engineer's estimate: $1,300,000 to $1,700,000" },
    term: "Single project, 200 working days",
    dates: {
      posted: "2026-09-30",
      preBidMeeting: { when: { date: "2026-10-15", time: "10:00" }, mandatory: false, location: "Oakland City Hall, 1 Frank H. Ogawa Plaza, Hearing Room 3 (also on Zoom)", virtual: true, quote: "Pre-bid meeting October 15, 2026 at 10:00 a.m., City Hall Hearing Room 3 and by Zoom; attendance is encouraged but not required" },
      questionsDue: { date: "2026-10-23", time: "17:00" },
      submissionDue: { date: "2026-11-10", time: "14:00" },
      anticipatedAward: "2027-01-12",
      contractStart: "2027-03-01",
    },
    submissionMethod: "Submit sealed bids through the City's iSupplier portal by 2:00 p.m. on the bid due date.",
    requirements: {
      licenses: [{ code: "A", label: "Class A General Engineering or C-8 Concrete Contractor license", quote: "Bidder must hold a Class A General Engineering or Class C-8 Concrete Contractor license" }],
      certifications: [
        {
          code: "OAKLAND_LSLBE",
          label: "City of Oakland L/SLBE participation (50% minimum; 2% bid discount)",
          required: false,
          mechanism: "participation-goal",
          goalPercent: 50,
          percent: 2,
          quote: "Bids must demonstrate at least fifty percent (50%) Local and Small Local Business Enterprise (L/SLBE) participation, of which at least twenty-five percent (25%) must be Local Business Enterprise (LBE) and twenty-five percent (25%) Small Local Business Enterprise (SLBE) participation, to be deemed responsive. Bidders that meet the requirement receive a two percent (2%) bid discount",
        },
        { code: "DIR", label: "DIR public works contractor registration", required: true, mechanism: "registration", quote: "All contractors and subcontractors must be registered with the Department of Industrial Relations" },
      ],
      insurance: [GL("Commercial General Liability $2,000,000 per occurrence and $4,000,000 aggregate"), AUTO("Automobile Liability $1,000,000 per accident"), WC("Workers' Compensation as required by law with $1,000,000 employer's liability")],
      location: { type: "none" },
      experience: { years: 5, description: "5 years of concrete flatwork or ADA ramp construction in the public right-of-way", quote: "at least five (5) years of experience constructing concrete flatwork or ADA curb ramps in the public right-of-way" },
      bonding: [
        { type: "bid", percent: 10, quote: "bid security of ten percent (10%) of the total bid" },
        { type: "performance", percent: 100, quote: "performance and payment bonds each in the amount of one hundred percent (100%) of the contract price" },
        { type: "payment", percent: 100, quote: "performance and payment bonds each in the amount of one hundred percent (100%) of the contract price" },
      ],
      prevailingWage: true,
      livingWage: false,
      dirRegistration: true,
      other: [{ label: "Local employment program: 50% of project work hours by Oakland residents", quote: "fifty percent (50%) of all project work hours shall be performed by Oakland residents" }],
    },
    documents: [
      { id: "bid-forms", label: "City bid forms (schedule of bid items, list of subcontractors)", kind: "form", quote: "schedule of bid items" },
      { id: "lslbe", label: "Schedule E (L/SLBE participation) and Schedule E-2", kind: "form", quote: "Schedule E" },
      { id: "bid-bond", label: "Bid security, 10% of the bid", kind: "proof", quote: "bid security of ten percent (10%) of the total bid" },
      { id: "local-employ", label: "Local employment program forms", kind: "form", quote: "Local Employment Program" },
      { id: "dir", label: "DIR registration numbers for the bidder and listed subcontractors", kind: "attestation", quote: "Department of Industrial Relations" },
    ],
    scopeTags: ["public-works"],
    contact: { name: "T. Alvarado", title: "Contract Administrator (sample contact)", email: "t.alvarado@oaklandca.example" },
    sourceUrl: "https://www.oaklandca.gov/",
    sourceExcerpt: `CITY OF OAKLAND, DEPARTMENT OF TRANSPORTATION. NOTICE INVITING BIDS, PROJECT No. C612510, CURB RAMP CONSTRUCTION, COUNCIL DISTRICT 5, FY 2026-27. Bids due November 10, 2026 at 2:00 p.m. through the City's iSupplier portal. Pre-bid meeting October 15, 2026 at 10:00 a.m., City Hall Hearing Room 3 and by Zoom; attendance is encouraged but not required. Questions due October 23, 2026 by 5:00 p.m.
Engineer's estimate: $1,300,000 to $1,700,000. Bidder must hold a Class A General Engineering or Class C-8 Concrete Contractor license and have at least five (5) years of experience constructing concrete flatwork or ADA curb ramps in the public right-of-way.
L/SLBE PROGRAM: Bids must demonstrate at least fifty percent (50%) Local and Small Local Business Enterprise (L/SLBE) participation, of which at least twenty-five percent (25%) must be Local Business Enterprise (LBE) and twenty-five percent (25%) Small Local Business Enterprise (SLBE) participation, to be deemed responsive. Bidders that meet the requirement receive a two percent (2%) bid discount. Complete Schedule E and Schedule E-2 and the schedule of bid items.
LOCAL EMPLOYMENT PROGRAM: fifty percent (50%) of all project work hours shall be performed by Oakland residents.
PUBLIC WORKS: All contractors and subcontractors must be registered with the Department of Industrial Relations; prevailing wage applies. Bonds: bid security of ten percent (10%) of the total bid; performance and payment bonds each in the amount of one hundred percent (100%) of the contract price.
INSURANCE: Commercial General Liability $2,000,000 per occurrence and $4,000,000 aggregate; Automobile Liability $1,000,000 per accident; Workers' Compensation as required by law with $1,000,000 employer's liability.`,
    status: "open",
    provenance: CURATED("City of Oakland"),
  },

  // ------------------------------------------------------------ HACA: Section 3 priority (HUD funds)
  {
    id: "r-haca-01",
    number: "HACA IFB 2026-18",
    title: "Unit Turnover Painting and Repairs, Scattered Sites",
    department: "Housing Authority of the County of Alameda, Procurement",
    agencyId: "haca",
    type: "IFB",
    category: "painting",
    secondaryCategories: ["facility-maintenance"],
    summary: "As-needed interior repainting, patching and minor repairs when units turn over at HACA-owned properties in Hayward, Union City and Dublin. HUD-funded, so Section 3 business concerns get priority and Davis-Bacon and State prevailing wage apply.",
    description: "Task orders of one to six units at a time: patch and repaint walls and ceilings, repair doors and trim, and replace hardware within a seven-day turnaround. HUD funds this work, so Section 3 business concerns receive priority consideration and the contractor must report Section 3 labor hours (benchmarks: 25 percent of total labor hours to Section 3 workers, 5 percent to targeted Section 3 workers). C-33 license, DIR registration and the higher of Davis-Bacon or State prevailing wage apply.",
    estimatedValue: { min: 150_000, max: 240_000, basis: "annual", quote: "Estimated annual value $150,000 to $240,000 across all task orders" },
    term: "2 years, with one 1-year option",
    dates: {
      posted: "2026-10-01",
      preBidMeeting: { when: { date: "2026-10-13", time: "10:00" }, mandatory: false, location: "HACA, 22941 Atherton Street, Hayward (and by phone)", virtual: true, quote: "Non-mandatory pre-bid conference October 13, 2026 at 10:00 a.m., 22941 Atherton Street, Hayward, and by phone" },
      questionsDue: { date: "2026-10-20", time: "16:00" },
      submissionDue: { date: "2026-10-30", time: "14:00" },
      anticipatedAward: "2026-11-24",
      contractStart: "2026-12-14",
    },
    submissionMethod: "Upload through HACA's Bonfire portal by 2:00 p.m. on the due date, with the HUD forms completed.",
    requirements: {
      licenses: [{ code: "C-33", label: "C-33 Painting and Decorating Contractor license", quote: "Bidder must hold an active C-33 Painting and Decorating Contractor license" }],
      certifications: [
        {
          code: "SECTION_3",
          label: "HUD Section 3 business concern (priority consideration)",
          required: false,
          mechanism: "preference",
          quote: "Section 3 business concerns will receive priority consideration in the award of this contract. All bidders must report Section 3 labor hours; the benchmarks are twenty-five percent (25%) of total labor hours worked by Section 3 workers and five percent (5%) by targeted Section 3 workers",
        },
        { code: "DIR", label: "DIR public works contractor registration", required: true, mechanism: "registration", quote: "Contractors must be registered with the Department of Industrial Relations" },
      ],
      insurance: [GL("Commercial General Liability $1,000,000 per occurrence"), AUTO("Automobile Liability $1,000,000 per occurrence"), WC("Workers' Compensation as required by California law")],
      location: { type: "none" },
      experience: { years: 2, description: "2 years of residential repainting", quote: "at least two (2) years of residential repainting experience" },
      bonding: [],
      prevailingWage: true,
      livingWage: false,
      dirRegistration: true,
      other: [
        { label: "Seven-day unit turnaround", quote: "each unit shall be completed within seven (7) calendar days of the task order" },
        { label: "Section 3 labor-hour reporting", quote: "All bidders must report Section 3 labor hours" },
      ],
    },
    documents: [
      { id: "bid-form", label: "Bid form with unit prices by room type", kind: "pricing", quote: "unit prices by room type" },
      { id: "hud-5369", label: "HUD-5369-A Representations, Certifications and Other Statements of Bidders", kind: "attestation", quote: "HUD-5369-A" },
      { id: "section3", label: "Section 3 business concern self-certification (if claiming priority) and labor-hour reporting plan", kind: "form", quote: "Section 3" },
      { id: "references", label: "Three references for residential repainting", kind: "references", quote: "three (3) references" },
    ],
    scopeTags: ["public-works", "as-needed"],
    contact: { name: "K. Mensah", title: "Procurement Specialist (sample contact)", email: "k.mensah@haca.example" },
    sourceUrl: "https://www.haca.net/procurement",
    sourceExcerpt: `HOUSING AUTHORITY OF THE COUNTY OF ALAMEDA. INVITATION FOR BIDS 2026-18, UNIT TURNOVER PAINTING AND REPAIRS, SCATTERED SITES. Bids due October 30, 2026 by 2:00 p.m. through Bonfire. Non-mandatory pre-bid conference October 13, 2026 at 10:00 a.m., 22941 Atherton Street, Hayward, and by phone. Questions due October 20, 2026 by 4:00 p.m.
SCOPE: Task orders of one to six units at HACA-owned properties in Hayward, Union City and Dublin; each unit shall be completed within seven (7) calendar days of the task order. Estimated annual value $150,000 to $240,000 across all task orders. Bid unit prices by room type.
SECTION 3: This contract is funded by HUD. Section 3 business concerns will receive priority consideration in the award of this contract. All bidders must report Section 3 labor hours; the benchmarks are twenty-five percent (25%) of total labor hours worked by Section 3 workers and five percent (5%) by targeted Section 3 workers. Complete HUD-5369-A.
PUBLIC WORKS: Contractors must be registered with the Department of Industrial Relations; the higher of the Davis-Bacon and State prevailing wage rates applies. Bidder must hold an active C-33 Painting and Decorating Contractor license and have at least two (2) years of residential repainting experience; three (3) references.
INSURANCE: Commercial General Liability $1,000,000 per occurrence; Automobile Liability $1,000,000 per occurrence; Workers' Compensation as required by California law.`,
    status: "open",
    provenance: CURATED("Housing Authority of the County of Alameda"),
  },

  // ------------------------------------------------------------ County: directed spending at or under $25,000
  {
    id: "s-gsa-small-01",
    number: "GSA Small Purchase SP-26-0417",
    title: "Carpet Cleaning, Two Social Services Agency Offices",
    department: "General Services Agency, Building Maintenance Department",
    agencyId: "alameda-county-gsa",
    type: "RFQ",
    category: "janitorial",
    secondaryCategories: ["facility-maintenance"],
    summary: "One-time hot-water-extraction carpet cleaning of about 38,000 square feet at two Social Services Agency offices in Oakland and Hayward, after hours. A small purchase at or under $25,000, which the County directs to certified SLEBs.",
    description: "Pre-treat, extract and spot-clean carpet on three floors at 2000 San Pablo Avenue, Oakland and two floors at 24100 Amador Street, Hayward, on two consecutive weekends in November, moving light furniture as needed. Because the purchase is $25,000 or under, the department's discretionary spending is directed to certified SLEBs: the County requests quotes from certified SLEB firms first and may award to one without further competition.",
    estimatedValue: { min: 14_000, max: 22_000, basis: "total", quote: "The County expects this work to cost between $14,000 and $22,000" },
    term: "One-time, two weekends",
    dates: {
      posted: "2026-10-02",
      questionsDue: { date: "2026-10-13", time: "17:00" },
      submissionDue: { date: "2026-10-20", time: "14:00" },
      anticipatedAward: "2026-10-27",
      contractStart: "2026-11-07",
    },
    submissionMethod: "Email the quote on the County's small purchase quote form to the buyer by 2:00 p.m. on the due date.",
    requirements: {
      licenses: [],
      certifications: [
        {
          code: "SLEB",
          label: "Alameda County SLEB certification (directed spending at or under $25,000)",
          required: false,
          mechanism: "directed-spend",
          quote: "Departmental discretionary spending for items $25,000 and under is directed towards certified SLEBs; quotes are requested from certified SLEB firms first",
        },
      ],
      insurance: [GL("Commercial General Liability $1,000,000 per occurrence"), WC("Workers' Compensation as required by the State of California")],
      location: { type: "local-preference", quote: "quotes are requested from certified SLEB firms first" },
      experience: { years: 1, description: "1 year of commercial carpet cleaning", quote: "at least one (1) year of commercial carpet cleaning experience" },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [{ label: "Weekend work only", quote: "Work shall be performed on two consecutive weekends in November 2026" }],
    },
    documents: [
      { id: "quote-form", label: "County small purchase quote form", kind: "pricing", quote: "small purchase quote form" },
      { id: "sleb-cert", label: "SLEB certification number (if certified)", kind: "proof", quote: "SLEB certification number" },
      { id: "coi", label: "Certificate of insurance", kind: "proof", quote: "certificate of insurance" },
    ],
    scopeTags: ["institutional"],
    contact: { name: "A. Delgado", title: "Buyer (sample contact)", email: "a.delgado@acgov.example" },
    sourceUrl: "https://gsa.acgov.org/do-business-with-us/contracting-opportunities/",
    sourceExcerpt: `COUNTY OF ALAMEDA, GENERAL SERVICES AGENCY. SMALL PURCHASE REQUEST FOR QUOTATION SP-26-0417, CARPET CLEANING, TWO SOCIAL SERVICES AGENCY OFFICES. Quotes due October 20, 2026 by 2:00 p.m. by email on the small purchase quote form. Questions due October 13, 2026 by 5:00 p.m.
SLEB PROGRAM: Departmental discretionary spending for items $25,000 and under is directed towards certified SLEBs; quotes are requested from certified SLEB firms first, and the County may award to a certified SLEB without further competition. Enter the SLEB certification number on the quote form.
SCOPE: Hot-water-extraction carpet cleaning of approximately 38,000 square feet at 2000 San Pablo Avenue, Oakland and 24100 Amador Street, Hayward. Work shall be performed on two consecutive weekends in November 2026. The County expects this work to cost between $14,000 and $22,000.
MINIMUM QUALIFICATIONS: at least one (1) year of commercial carpet cleaning experience; certificate of insurance before the work starts.
INSURANCE: Commercial General Liability $1,000,000 per occurrence; Workers' Compensation as required by the State of California.`,
    status: "open",
    provenance: CURATED("County of Alameda GSA small purchase"),
  },
];
