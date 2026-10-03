/**
 * Real solicitations, entered by hand from documents downloaded from the
 * County of Alameda Procurement Portal on 2026-10-03.
 *
 * Every `quote` below is copied from the solicitation text and must appear in
 * the record's `sourceExcerpt` (tests/data.test.ts enforces this). Where a
 * field could not be confirmed from the documents it is left null / empty
 * rather than guessed.
 */
import type { SolicitationInput } from "./types";

export const COUNTY_PORTAL = "https://procurement.opengov.com/portal/acgov";
export const LEGACY_PORTAL =
  "https://www.acgov.org/gsa_app/gsa/purchasing/bid_content/contractopportunities.jsp";

const GSA_SUBMISSION =
  "Upload through the County of Alameda Procurement Portal by 2:00 p.m. on the due date: one PDF (20 MB or less) with the completed Exhibit A Bid Response Packet, plus pricing on the County's Excel Bid Form.";

/** Boilerplate that appears, nearly verbatim, in every current GSA solicitation. */
const GSA_BOILERPLATE = `All proposal documents must be completed, successfully uploaded, and submitted online through County of Alameda Procurement Portal BY 2:00 p.m. on the due date specified in the Calendar of Events. Bidders must submit an electronic version of their proposal in a PDF file, preferably a single file if 20 MB or less. Bidders must submit pricing on the County provided Excel Bid Form in the County of Alameda Procurement Portal.
If a Bidder is certified by the County as either a small and local or an emerging and local business (SLEB), the County will provide up to 5% bid preference for procurements over $25,000. If a Bidder is located within Alameda County, the County may provide a 5% local bid preference. Bidders that are not certified SLEBS are required to subcontract with a SLEB for at least 20% of the total estimated bid amount in order to be considered for contract award. If a bidder is unable to meet the SLEB requirements, they must take exception to this requirement in the Exceptions and Clarifications section of this solicitation.
The following pages require confirmation, declaration, and/or a signature: Exhibit A – Bid Response Packet, Bidder Acceptance; Exhibit A – Bid Response Packet, Debarment and Suspension Certification; Exhibit A – Bid Response Packet, Small Local Emerging Business (SLEB) Information Sheet.
Insurance certificates are not required at the time of submission; however, by signing the Bid Response Packet and submitting a bid proposal, the Bidder agrees to meet the minimum insurance requirements and provide documentation before award. Commercial General Liability $1,000,000 per occurrence; Commercial or Business Automobile Liability $1,000,000 per occurrence; Workers' Compensation and Employers Liability as required by State of California, $1,000,000 per accident for bodily injury or disease.
All bid proposals must remain open to acceptance and irrevocable for a period of not less than 180 days.`;

const sleb = (quoteExtra = "") => ({
  code: "SLEB",
  label: "Alameda County SLEB certification (preference points; not required to bid)",
  required: false,
  mechanism: "preference" as const,
  percent: 10,
  goalPercent: 20,
  exceptionAllowed: true,
  quote:
    "If a Bidder is certified by the County as either a small and local or an emerging and local business (SLEB), the County will provide up to 5% bid preference for procurements over $25,000" +
    quoteExtra,
});

const gsaInsurance = (professional = false) => {
  const base: SolicitationInput["requirements"]["insurance"] = [
    {
      type: "general-liability",
      limit: 1_000_000,
      aggregate: 2_000_000,
      quote: "Commercial General Liability $1,000,000 per occurrence",
    },
    {
      type: "auto",
      limit: 1_000_000,
      quote: "Commercial or Business Automobile Liability $1,000,000 per occurrence",
    },
    {
      type: "workers-comp",
      limit: "statutory",
      quote:
        "Workers' Compensation and Employers Liability as required by State of California, $1,000,000 per accident for bodily injury or disease",
    },
  ];
  if (professional) {
    base.push({
      type: "professional",
      limit: 1_000_000,
      aggregate: 2_000_000,
      quote: "Professional Liability/Errors & Omissions $1,000,000 per occurrence",
    });
  }
  return base;
};

const gsaDocs = (extra: SolicitationInput["documents"] = []): SolicitationInput["documents"] => [
  {
    id: "bidder-acceptance",
    label: "Exhibit A: Bidder Information and Acceptance (signed)",
    kind: "form",
    quote: "Exhibit A – Bid Response Packet, Bidder Acceptance",
  },
  {
    id: "debarment",
    label: "Debarment and Suspension Certification (signed)",
    kind: "attestation",
    quote: "Exhibit A – Bid Response Packet, Debarment and Suspension Certification",
  },
  {
    id: "sleb-sheet",
    label: "SLEB Information Sheet (signed; your SLEB partner signs too if you subcontract)",
    kind: "form",
    quote: "Exhibit A – Bid Response Packet, Small Local Emerging Business (SLEB) Information Sheet",
  },
  {
    id: "min-quals",
    label: "Bidder Minimum Qualifications table with supporting documentation",
    kind: "proof",
  },
  {
    id: "references",
    label: "References",
    kind: "references",
  },
  {
    id: "exceptions",
    label: "Exceptions and Clarifications form (list anything you cannot meet)",
    kind: "form",
    quote: "take exception to this requirement in the Exceptions and Clarifications section",
  },
  {
    id: "bid-form",
    label: "County Excel Bid Form (pricing, uploaded separately)",
    kind: "pricing",
    quote: "Bidders must submit pricing on the County provided Excel Bid Form",
  },
  ...extra,
];

const portalProvenance = {
  source: "portal" as const,
  extractedBy: "human" as const,
  extractedAt: "2026-10-03",
  note: "Entered by hand from documents downloaded from the County of Alameda Procurement Portal on Oct 3, 2026. Verify every detail against the posted solicitation and any addenda.",
};

const gsaContact = (name: string, phone: string, email: string) => ({
  name,
  title: "Procurement Specialist, GSA Procurement",
  phone,
  email,
});

export const REAL_SOLICITATIONS: SolicitationInput[] = [
  // -------------------------------------------------------------------------
  {
    id: "rfp-902787",
    number: "RFP No. 902787",
    title: "Elevator Condition Assessment & Modernization Plan",
    department: "General Services Agency, Building Maintenance Department",
    agencyId: "alameda-county-gsa",
    type: "RFP",
    category: "engineering",
    secondaryCategories: ["consulting-training"],
    summary:
      "A consulting firm to inspect nine elevators in three County buildings in downtown Oakland, write modernization specs, and support the County through bidding, construction and warranty.",
    description:
      "GSA Building Maintenance wants a turnkey elevator consultant for 1106 Madison, 1111 Jackson and 1401 Lakeside in Oakland: a comprehensive condition assessment of nine passenger elevators, CSI MasterFormat modernization specifications, bid support, submittal review, construction site visits and warranty inspections. Three-year contract with two option years. Services must be performed by the consultant's own employees; the consultant may not later bid on the modernization construction.",
    estimatedValue: null,
    term: "3 years, with an option to renew for 2 more",
    dates: {
      posted: "2026-10-02",
      siteVisit: {
        when: { date: "2026-10-19", time: "10:00" },
        mandatory: false,
        location: "1401 Lakeside Dr, Oakland (RSVP by Oct 13 to n.feigenbaum@acgov.org)",
        prerequisite: {
          label: "RSVP for the site visit",
          due: { date: "2026-10-13" },
          quote: "RSVP Responses Due for Non-Mandatory Site Visit October 13, 2026",
        },
        quote: "Non-Mandatory Site Visit October 19, 2026 10:00 a.m. 1401 Lakeside Dr. Oakland, CA 94612",
      },
      preBidMeeting: {
        when: { date: "2026-10-22", time: "10:00" },
        mandatory: false,
        location: "Microsoft Teams (online)",
        virtual: true,
        quote: "Networking/Bidders Conference October 22, 2026 @ 10:00 a.m.",
      },
      questionsDue: { date: "2026-10-23", time: "17:00" },
      submissionDue: { date: "2026-11-17", time: "14:00" },
      anticipatedAward: "2027-01-12",
      contractStart: "2027-02-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [],
      certifications: [
        {
          code: "QEI",
          label: "NAESA International Qualified Elevator Inspector (QEI) certification for staff on the project",
          required: true,
          quote:
            "Bidder's staff performing work on this project must possess a current National Association of Elevator Safety Authorities (NAESA) International Qualified Elevator Inspector (QEI) certification",
        },
        sleb(),
      ],
      insurance: gsaInsurance(true),
      location: {
        type: "local-preference",
        quote: "If a Bidder is located within Alameda County, the County may provide a 5% local bid preference.",
      },
      experience: {
        years: 5,
        description: "regularly and continuously engaged in consulting services of similar size, scale and scope",
        quote:
          "regularly and continuously engaged in the business of providing consulting services of similar size, scale, and scope as described in Section B above for at least five (5) years",
      },
      bonding: [],
      prevailingWage: true,
      livingWage: false,
      dirRegistration: true,
      other: [
        {
          label: "No subcontractors may perform the direct services",
          quote:
            "services for this RFP must be performed by employees of the Contractor only. No subcontractors are allowed to perform direct services on this project.",
        },
        {
          label: "Consultant may not bid on the resulting modernization construction",
          quote:
            "Contractor shall not submit a bid or proposal, participate as a subcontractor or subconsultant to a bidder, or otherwise have a financial interest in an entity competing for any elevator modernization construction contract",
        },
      ],
    },
    documents: gsaDocs([
      { id: "key-personnel", label: "Table of Key Personnel (with QEI certification shown)", kind: "narrative" },
      { id: "proposed-services", label: "Description of Proposed Services (approach to all six phases)", kind: "narrative" },
      { id: "past-reports", label: "Relevant Experience and submittal of past condition-assessment reports", kind: "proof" },
    ]),
    scopeTags: ["professional-services", "public-works"],
    contact: gsaContact("N. Feigenbaum", "(510) 208-9603", "n.feigenbaum@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902787 for ELEVATOR CONDITION ASSESSMENT & MODERNIZATION PLAN. Contact Person: N. Feigenbaum, (510) 208-9603, n.feigenbaum@acgov.org, General Services Agency (GSA) – Procurement. RESPONSE DUE by 2:00 p.m. on November 17, 2026 through County of Alameda Procurement Portal.
CALENDAR OF EVENTS: Request Issued October 2, 2026. RSVP Responses Due for Non-Mandatory Site Visit October 13, 2026. Non-Mandatory Site Visit October 19, 2026 10:00 a.m. 1401 Lakeside Dr. Oakland, CA 94612. Networking/Bidders Conference October 22, 2026 @ 10:00 a.m. (Microsoft Teams). Written Questions Due via the "Question & Answer" tab October 23, 2026 by 5:00 p.m. Questions & Answers Issued November 5, 2026. Response Due and Submitted through County of Alameda Procurement Portal November 17, 2026 by 2:00 p.m. Notice of Intent to Award Issued December 18, 2026. Board Consideration Award Date January 12, 2027. Contract Start Date February 1, 2027. NOTE: All dates are tentative and subject to change.
INTENT: The County intends to award a three (3) year contract (with the option to renew for two [2] years) to the Bidder selected as the most responsive and responsible Bidder. SCOPE: GSA-BMD intends to procure professional services to perform a comprehensive condition assessment and develop and implement a plan to modernize the elevator equipment at 1106 Madison Street, 1111 Jackson Street, and 1401 Lakeside Drive, all of which are located in Oakland, California.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder and all key personnel assigned to the project are to provide documentation or certify that they have been regularly and continuously engaged in the business of providing consulting services of similar size, scale, and scope as described in Section B above for at least five (5) years. b. Bidder's staff performing work on this project must possess a current National Association of Elevator Safety Authorities (NAESA) International Qualified Elevator Inspector (QEI) certification, which must be clearly stated or demonstrated in the table provided in Exhibit A – Bid Response Packet.
Due to the specialized and safety-related nature of the project, services for this RFP must be performed by employees of the Contractor only. No subcontractors are allowed to perform direct services on this project. Contractor shall not submit a bid or proposal, participate as a subcontractor or subconsultant to a bidder, or otherwise have a financial interest in an entity competing for any elevator modernization construction contract developed substantially from the specifications prepared by Contractor.
Labor Compliance/Prevailing Wage: This is a public works project and is subject to monitoring by the Department of Industrial Relations (DIR). All contractors performing work on Public Works projects are required to be registered with the DIR. The County has no requirements for living wages.
Professional Liability/Errors & Omissions $1,000,000 per occurrence, $2,000,000 project aggregate.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfp-902759",
    number: "RFP No. 902759",
    title: "Telephone Services for Juvenile Facilities",
    department: "Probation Department (procured by GSA)",
    agencyId: "alameda-county-gsa",
    type: "RFP",
    category: "telecom",
    secondaryCategories: ["it-services"],
    summary:
      "A secure youth telephone system for the County's juvenile facilities, installed and run by the vendor, with free calls for youth and a web console for Probation staff.",
    description:
      "Alameda County Probation needs a secure, highly available Youth Telephone System (YTS) for its juvenile facilities: phones, cabling, PIN management, call lists, recording and a WCAG 2.1 AA web platform for staff, with no charge to youth or the people they call. The vendor installs everything, imports the current call list, trains staff and maintains the system. Attendance at the mandatory site visit required a security clearance form (Exhibit E) filed by October 1, 2026.",
    estimatedValue: null,
    term: "Not stated in the calendar; contract start June 1, 2027",
    dates: {
      posted: "2026-09-17",
      preBidMeeting: {
        when: { date: "2026-10-16", time: "10:30" },
        mandatory: true,
        location: "Juvenile facilities site visit and bidders conference (clearance required)",
        prerequisite: {
          label: "Exhibit E site security clearance form emailed to Yulia.Margolin@acgov.org",
          due: { date: "2026-10-01", time: "17:00" },
          quote:
            "Exhibit E needs to be submitted in order to attend the Mandatory Site Visit and Networking/Bidders Conference and emailed to Yulia.Margolin@acgov.org by October 1, 2026, by 5:00 p.m.",
        },
        quote: "Mandatory Site Visit/Bidders Conference October 16, 2026 @ 10:30 AM",
      },
      questionsDue: { date: "2026-10-19", time: "17:00" },
      submissionDue: { date: "2026-11-12", time: "14:00" },
      anticipatedAward: "2027-03-02",
      contractStart: "2027-06-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [],
      certifications: [sleb()],
      insurance: [
        ...gsaInsurance(false),
        { type: "cyber", limit: 1_000_000 },
      ],
      location: {
        type: "local-preference",
        quote: "If a Bidder is located within Alameda County, the County may provide a 5% local bid preference.",
      },
      experience: {
        years: 5,
        description:
          "5 years providing telephone system solutions, including 3 years serving government agencies or detention facilities",
        quote:
          "Bidder must be regularly and continuously engaged in the business of providing telephone system solutions for a minimum of five (5) years, including at least three (3) years of experience providing such services to City, County, State, Federal government agencies, or detention facilities",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        {
          label: "Youth and call recipients may not be charged for calls (vendor-funded system)",
          quote: "Contractor must ensure that youth or the call recipient are not charged for any calls made through the YTS system",
        },
        {
          label: "Staff need PREA background checks for juvenile facilities",
          quote: "PREA background check for juvenile facilities",
        },
      ],
    },
    documents: gsaDocs([
      { id: "implementation-plan", label: "Implementation plan and installation schedule", kind: "narrative", quote: "Bidder must include an implementation plan in their bid proposal" },
      { id: "exhibit-e", label: "Exhibit E site security clearance form (was due Oct 1 to attend the mandatory visit)", kind: "form" },
    ]),
    scopeTags: ["institutional"],
    contact: gsaContact("Yulia Margolin", "(510) 209-9615", "Yulia.Margolin@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902759 for TELEPHONE SERVICES FOR JUVENILE FACILITIES. Contact Person: Yulia Margolin, (510) 209 9615, Yulia.Margolin@acgov.org, General Services Agency (GSA) – Procurement. RESPONSE DUE by 2:00 p.m. on November 12, 2026.
CALENDAR OF EVENTS: Request Issued September 17, 2026. Site Security Clearance Forms Due October 1, 2026, by 5:00 p.m. Exhibit E needs to be submitted in order to attend the Mandatory Site Visit and Networking/Bidders Conference and emailed to Yulia.Margolin@acgov.org by October 1, 2026, by 5:00 p.m. Mandatory Site Visit/Bidders Conference October 16, 2026 @ 10:30 AM. Written Questions Due via the "Question & Answer" tab October 19, 2026, by 5:00 p.m. List of Attendees October 20, 2026. Questions & Answers Issued October 30, 2026. Response Due and Submitted through County of Alameda Procurement Portal November 12, 2026, by 2:00 p.m. Evaluation Period November 12, 2026 – December 22, 2026. Notice of Intent to Award Issued December 23, 2026. Board Consideration Award Date March 2, 2027. Contract Start Date June 1, 2027.
The transition period is to allow the awarded bidder to establish the infrastructure (e.g., PREA background check for juvenile facilities) and training required.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing telephone system solutions for a minimum of five (5) years, including at least three (3) years of experience providing such services to City, County, State, Federal government agencies, or detention facilities. b. Bidder must possess all permits, licenses, and professional credentials necessary to supply products and perform services specified under this RFP.
SPECIFIC REQUIREMENTS: Contractor must deliver a secure, highly available, and fully compliant YTS. Contractor must ensure that youth or the call recipient are not charged for any calls made through the YTS system. Contractor must be responsible for installing all physical plant requirements (e.g. power, security, data, cabling, etc.). Contractor's web-based platform must comply with WCAG 2.1 AA accessibility standards. Bidder must include an implementation plan in their bid proposal.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfq-902753",
    number: "RFQ No. 902753",
    title: "Public Health Immunization Vaccines",
    department: "Public Health Department (procured by GSA)",
    agencyId: "alameda-county-gsa",
    type: "RFQ",
    category: "medical-supplies",
    secondaryCategories: [],
    summary:
      "Supply vaccines to the County Public Health Department at quoted prices for the doses listed on the County bid form.",
    description:
      "A quotation for furnishing immunization vaccine products and the estimated annual doses identified on the County bid form, delivered authentic and in cold chain. Awarded on price to a responsive, responsible bidder with at least three years in wholesale, pharmacy or manufacturer distribution of vaccines into California.",
    estimatedValue: null,
    term: "Contract start February 1, 2027",
    dates: {
      posted: "2026-10-02",
      preBidMeeting: {
        when: { date: "2026-10-14", time: "10:30" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference October 14, 2026 @ 10:30 a.m.",
      },
      questionsDue: { date: "2026-10-15", time: "17:00" },
      submissionDue: { date: "2026-11-16", time: "14:00" },
      anticipatedAward: "2027-01-15",
      contractStart: "2027-02-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [
        {
          code: "WHOLESALE_DRUG",
          label: "California wholesale drug / pharmacy distribution licensing (lawful distribution of vaccines into California)",
          quote: "lawful wholesale distribution, pharmacy distribution, or direct manufacturer supply of vaccines into California",
        },
      ],
      certifications: [sleb()],
      insurance: gsaInsurance(false),
      location: { type: "local-preference" },
      experience: {
        years: 3,
        description: "3 years distributing vaccines into California",
        quote:
          "regularly and continuously engaged for at least three (3) years immediately preceding the bid due date in the lawful wholesale distribution, pharmacy distribution, or direct manufacturer supply of vaccines into California",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [],
    },
    documents: gsaDocs(),
    scopeTags: ["goods"],
    contact: gsaContact("L. Hom", "(510) 208-9606", "L.Hom@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902753 for PUBLIC HEALTH IMMUNIZATION VACCINES. Contact Person: L. Hom, (510) 208-9606, L.Hom@acgov.org, General Services Agency (GSA) – Procurement. RESPONSE DUE by 2:00 p.m. on November 16, 2026.
CALENDAR OF EVENTS: Request Issued October 2, 2026. Networking/Bidders Conference October 14, 2026 @ 10:30 a.m. (PST). Written Questions Due October 15, 2026 by 5:00 p.m. List of Attendees October 16, 2026. Questions & Answers Issued November 6, 2026. Response Due and Submitted through County of Alameda Procurement Portal November 16, 2026 by 2:00 p.m. Evaluation Period November 16, 2026 – December 14, 2026. Notice of Intent to Award Issued December 14, 2026. General Services Agency Consideration Award Date January 15, 2027. Contract Start Date February 1, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged for at least three (3) years immediately preceding the bid due date in the lawful wholesale distribution, pharmacy distribution, or direct manufacturer supply of vaccines into California, which must be clearly stated or demonstrated in the bid response. Product Schedule and Conformance: Contractor must furnish the vaccine products and estimated annual doses identified in the County Bid Form. Each delivered product must be authentic and unadulterated.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfpq-26-05",
    number: "RFPQ 26-05",
    title: "Eating Disorder Treatment Services",
    department: "Alameda County Health, Behavioral Health Department (ACBHD)",
    agencyId: "alameda-county-health",
    type: "RFPQ",
    category: "health-services",
    secondaryCategories: [],
    summary:
      "Join a pool of Medi-Cal providers offering residential, partial hospitalization, intensive outpatient or specialized eating disorder treatment for County clients.",
    description:
      "ACBHD is pre-qualifying providers for Services-as-Needed contracts in one or more modalities: residential treatment, partial hospitalization (PHP, minimum six hours a day), intensive outpatient (IOP) and specialized ED services. In-person PHP and IOP must be within 100 miles of Alameda County; telehealth practitioners must be California-licensed. No minimum or maximum dollar amount is guaranteed. Responses go by email to ACBHD Procurement.",
    estimatedValue: null,
    term: "Services-as-Needed pool; contracts start April 1, 2027",
    dates: {
      posted: "2026-08-13",
      questionsDue: { date: "2026-09-03", time: "14:00" },
      submissionDue: { date: "2026-11-05", time: "14:00" },
      anticipatedAward: "2026-12-03",
      contractStart: "2027-04-01",
    },
    submissionMethod:
      "Email the completed Bid Response Packet to ACBHD Procurement at procurement@acgov.org by 2:00 p.m. on November 5, 2026. Late responses are not accepted.",
    requirements: {
      licenses: [
        {
          code: "CA_CLINICAL_LICENSE",
          label: "California-licensed clinical staff (licenses current with no restrictions)",
          quote: "Licenses are verified to be current with no restrictions",
        },
      ],
      certifications: [
        {
          code: "MEDI_CAL_PROVIDER",
          label: "Medi-Cal provider in good standing (not on the DHCS Suspended & Ineligible list)",
          required: true,
          quote: "California DHCS Medi-Cal Suspended & Ineligible list",
        },
        {
          code: "SLEB",
          mechanism: "preference" as const,
          percent: 10,
          goalPercent: 20,
          exceptionAllowed: true,
          label: "SLEB preference points",
          required: false,
          quote: "SMALL LOCAL EMERGING BUSINESS (SLEB) PREFERENCE POINTS",
        },
      ],
      insurance: [
        { type: "general-liability", limit: 1_000_000, aggregate: 2_000_000 },
        { type: "auto", limit: 1_000_000 },
        { type: "workers-comp", limit: "statutory" },
        { type: "professional", limit: 1_000_000 },
      ],
      location: {
        type: "radius",
        radiusMiles: 100,
        note: "In-person PHP and IOP services within 100 miles of Alameda County",
        quote: "For in-person PHP and IOP, services must be provided within a 100-mile radius of Alameda County",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        {
          label: "Evidence-based practices with individual, group and family therapy",
          quote: "The program model shall utilize Evidence Based Practices (EBPs) for treating EDs and shall offer individual therapy, group therapy, and family therapy",
        },
      ],
    },
    documents: [
      { id: "bid-response-packet", label: "RFPQ 26-05 Bid Response Packet (Exhibit A Bidder Information and Acceptance, signed)", kind: "form" },
      { id: "debarment", label: "Debarment and Suspension Certification (signed)", kind: "attestation" },
      { id: "sleb-sheet", label: "SLEB Information Sheet", kind: "form" },
      { id: "staff-list", label: "Staff List and Schedule spreadsheet (Excel)", kind: "proof" },
      { id: "program-narrative", label: "Program description by modality (residential, PHP, IOP, specialized)", kind: "narrative" },
      { id: "insurance-ack", label: "Exhibit C insurance requirements acknowledgment (certificates due before contract)", kind: "attestation", quote: "Insurance certificates are not required at the time of submission" },
    ],
    scopeTags: ["as-needed", "pool", "professional-services"],
    contact: {
      name: "ACBHD Procurement",
      title: "Behavioral Health Department",
      email: "procurement@acgov.org",
    },
    sourceUrl: LEGACY_PORTAL,
    sourceExcerpt: `ALAMEDA COUNTY HEALTH, BEHAVIORAL HEALTH DEPARTMENT (ACBHD) REQUEST FOR PRE-QUALIFICATION (RFPQ) 26-05 SPECIFICATIONS, TERMS & CONDITIONS FOR EATING DISORDER TREATMENT SERVICES. RFPQ RESPONSES DUE by 2:00 pm on November 5, 2026 to ACBHD Procurement, Email: procurement@acgov.org. Proposals received after this date/time will NOT be accepted.
CALENDAR OF EVENTS: Request for Pre-Qualification (RFPQ) Issued August 13, 2026. Written Questions Due By 2:00 pm on Thursday September 3, 2026. Questions and Answers Issued September 10, 2026. Responses Due Thursday November 5, 2026, by 2:00 pm. Award Date December 3, 2026. Board Agenda Date March 2027. Contract Start Date April 1, 2027.
INTENT: ACBHD intends to award Services as Needed (SAN) contracts to Bidders who meet the Bidder Qualification Criteria, for one or more of the following modalities: Residential Treatment; Partial Hospitalization Program (PHP); Intensive Outpatient Services (IOP); Specialized ED Services. The County does not guarantee any minimum or maximum dollar amount or any awarded scope of services under this contract.
For in-person PHP and IOP, services must be provided within a 100-mile radius of Alameda County, and telehealth services must be provided by a practitioner licensed in California. The program model shall utilize Evidence Based Practices (EBPs) for treating EDs and shall offer individual therapy, group therapy, and family therapy as part of the treatment.
BIDDER QUALIFICATION CRITERIA: Licenses are verified to be current with no restrictions. Bidder is not on the California DHCS Medi-Cal Suspended & Ineligible list. SMALL LOCAL EMERGING BUSINESS (SLEB) PREFERENCE POINTS apply per Section II.C.
EXHIBIT C: INSURANCE REQUIREMENTS. Insurance certificates are not required at the time of submission; however, by signing Exhibit A – Bidder Information and Acceptance, the Bidder agrees to meet the minimum insurance requirements.`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfpq-26-06",
    number: "RFPQ 26-06",
    title: "Housing Support Program",
    department: "Alameda County Health, Behavioral Health Department (ACBHD)",
    agencyId: "alameda-county-health",
    type: "RFPQ",
    category: "social-services",
    secondaryCategories: ["health-services"],
    summary:
      "Pre-qualify to provide housing support services (placement, rental support, tenancy services) for behavioral health clients under Services-as-Needed contracts.",
    description:
      "ACBHD intends to establish new Services-as-Needed contracts or expand existing ones with Housing Support Program providers, funded in part through the Behavioral Health Services Act. Providers place and support clients with serious mental illness in housing, may claim approved unit damage up to one month of rent, and report on outcomes. Same calendar as RFPQ 26-05.",
    estimatedValue: null,
    term: "Services-as-Needed pool; contracts start April 1, 2027",
    dates: {
      posted: "2026-08-13",
      questionsDue: { date: "2026-09-03", time: "14:00" },
      submissionDue: { date: "2026-11-05", time: "14:00" },
      anticipatedAward: "2026-12-03",
      contractStart: "2027-04-01",
    },
    submissionMethod:
      "Email the completed Bid Response Packet to ACBHD Procurement at procurement@acgov.org by 2:00 p.m. on November 5, 2026.",
    requirements: {
      licenses: [],
      certifications: [
        {
          code: "SLEB",
          mechanism: "preference" as const,
          percent: 10,
          goalPercent: 20,
          exceptionAllowed: true,
          label: "SLEB preference points",
          required: false,
          quote: "SMALL LOCAL EMERGING BUSINESS (SLEB) PREFERENCE POINTS",
        },
      ],
      insurance: [
        { type: "general-liability", limit: 1_000_000, aggregate: 2_000_000 },
        { type: "auto", limit: 1_000_000 },
        { type: "workers-comp", limit: "statutory" },
        { type: "professional", limit: 1_000_000 },
      ],
      location: { type: "local-preference" },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        {
          label: "Experience serving behavioral health clients in housing programs",
          quote: "establish new SAN contracts or expand existing SAN contracts with HSP providers",
        },
      ],
    },
    documents: [
      { id: "bid-response-packet", label: "RFPQ 26-06 HSP Bid Response Packet (signed)", kind: "form" },
      { id: "debarment", label: "Debarment and Suspension Certification (signed)", kind: "attestation" },
      { id: "sleb-sheet", label: "SLEB Information Sheet", kind: "form" },
      { id: "staff-list", label: "HSP Staff List and Schedule spreadsheet", kind: "proof" },
      { id: "program-narrative", label: "Program description and housing inventory", kind: "narrative" },
    ],
    scopeTags: ["as-needed", "pool"],
    contact: { name: "ACBHD Procurement", title: "Behavioral Health Department", email: "procurement@acgov.org" },
    sourceUrl: LEGACY_PORTAL,
    sourceExcerpt: `ALAMEDA COUNTY BEHAVIORAL HEALTH DEPARTMENT (ACBHD) REQUEST FOR PRE-QUALIFICATION (RFPQ) 26-06 SPECIFICATIONS, TERMS & CONDITIONS FOR HOUSING SUPPORT PROGRAM. RFPQ Responses Due 2:00 pm on November 5, 2026 to ACBHD Procurement, procurement@acgov.org.
ACBHD intends to establish new SAN contracts or expand existing SAN contracts with HSP providers whose response conforms to this Request for Pre-Qualification (RFPQ) and meets the qualification criteria. HSP contractors may submit claims for units that have been vacated and damaged by program tenants, with the approval of ACBHD. The damage claim is not to exceed one month of rent.
CALENDAR OF EVENTS: Request for Pre-Qualification (RFPQ) Issued August 13, 2026. Bidder's Written Questions Due By 2:00 pm on Thursday September 3, 2026. Questions and Answers Issued September 10, 2026. Responses Due Thursday November 5, 2026, by 2:00 pm. Award Date December 3, 2026. Board Agenda Date March 2027. Contract Start Date April 1, 2027.
SMALL LOCAL EMERGING BUSINESS (SLEB) PREFERENCE POINTS apply. Behavioral Health Services Act (BHSA): Proposition 1, passed by the California voters in March 2024, provides funding for housing interventions.`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfp-acphd-ovp-9000226",
    number: "RFP No. ACPHD-OVP 9000226",
    title: "Hospital-Based Violence Intervention Program (HVIP) Services",
    department: "Alameda County Health, Public Health Department, Office of Violence Prevention",
    agencyId: "alameda-county-health",
    type: "RFP",
    category: "social-services",
    secondaryCategories: ["health-services"],
    summary:
      "Run a hospital-based violence intervention program: meet violently injured patients at the bedside, then provide case management and community follow-up to prevent re-injury.",
    description:
      "Part of the Alameda County Violence Reduction and Recovery Initiative. The Office of Violence Prevention seeks a qualified community-based bidder to deliver HVIP services in partnership with trauma centers: bedside engagement, intensive case management, linkage to services and follow-up. Two online bidders conferences were held October 7 and 8; written questions were due October 9.",
    estimatedValue: null,
    term: "Contract start January 15, 2027",
    dates: {
      posted: "2026-09-30",
      preBidMeeting: {
        when: { date: "2026-10-07", time: "14:30" },
        mandatory: false,
        location: "Zoom (Networking/Bidders Conference No. 1; a second session was held Oct 8 at 10:00 AM)",
        virtual: true,
        quote: "Networking/Bidders Conference No. 1 October 7, 2026, at 02:30 PM PDT",
      },
      questionsDue: { date: "2026-10-09", time: "17:00" },
      submissionDue: { date: "2026-11-09", time: "14:00" },
      anticipatedAward: "2027-01-05",
      contractStart: "2027-01-15",
    },
    submissionMethod: "Upload through the County of Alameda Procurement Portal by 2:00 p.m. on Monday, November 9, 2026, followed by an online public bid opening.",
    requirements: {
      licenses: [],
      certifications: [
        { code: "SLEB", mechanism: "preference" as const, percent: 10, goalPercent: 20, exceptionAllowed: true, label: "SLEB Information Sheet required; certification gives preference", required: false, quote: "Exhibit A – Bid Response Packet, Small Local Emerging Business (SLEB) Information Sheet" },
      ],
      insurance: [
        { type: "general-liability", limit: 1_000_000, aggregate: 2_000_000 },
        { type: "auto", limit: 1_000_000 },
        { type: "workers-comp", limit: "statutory" },
        { type: "professional", limit: 1_000_000 },
      ],
      location: { type: "local-preference" },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        {
          label: "Experience running hospital-based violence intervention with trauma centers",
          quote: "a qualified Bidder to provide a Hospital-Based Violence Intervention Program (HVIP) services",
        },
      ],
    },
    documents: [
      { id: "bidder-acceptance", label: "Exhibit A: Bidder Acceptance (signed)", kind: "form", quote: "Exhibit A – Bid Response Packet, Bidder Acceptance" },
      { id: "debarment", label: "Debarment and Suspension Certification (signed)", kind: "attestation", quote: "Exhibit A – Bid Response Packet, Debarment and Suspension Certification" },
      { id: "sleb-sheet", label: "SLEB Information Sheet (signed)", kind: "form", quote: "Exhibit A – Bid Response Packet, Small Local Emerging Business (SLEB) Information Sheet" },
      { id: "budget-form", label: "HVIP Budget Form (Excel)", kind: "pricing" },
      { id: "program-narrative", label: "Program narrative, staffing plan and hospital partnership letters", kind: "narrative" },
      { id: "references", label: "References", kind: "references" },
    ],
    scopeTags: ["professional-services"],
    contact: {
      name: "Falguni Patel",
      title: "ACPHD Health Promotion, Community Partnerships, and Procurements",
      phone: "(510) 267-8069",
      email: "acphdprocurements@acgov.org",
    },
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. ACPHD-OVP 9000226 for Alameda County Violence Reduction and Recovery Initiative: Hospital-Based Violence Intervention Program (HVIP) Services. Contact Person: Falguni Patel, (510) 267-8069, acphdprocurements@acgov.org. Alameda County Health, Public Health Department (ACPHD) – Health Promotion, Community Partnerships, and Procurements. RESPONSE DUE by 2:00 p.m. on Monday November 9, 2026 through County of Alameda Procurement Portal.
IMPORTANT NOTICE: Please read EXHIBIT A – Bid Response Packet carefully; INCOMPLETE BID RESPONSES WILL BE REJECTED. The following pages require signatures: Exhibit A – Bid Response Packet, Bidder Acceptance; Exhibit A – Bid Response Packet, Debarment and Suspension Certification; Exhibit A – Bid Response Packet, Small Local Emerging Business (SLEB) Information Sheet (Must be signed by Bidder; Must be signed by SLEB Partner if subcontracting to a SLEB).
CALENDAR OF EVENTS: Request Issued September 30, 2026. Networking/Bidders Conference No. 1 October 7, 2026, at 02:30 PM PDT (Zoom). Networking/Bidders Conference No. 2 October 8, 2026, at 10:00 AM PDT. Written Questions Due October 9, 2026, by 5:00 p.m. List of Attendees October 12, 2026. Questions & Answers Issued October 19, 2026. Addendum Issued October 19, 2026. Response Due November 9, 2026, by 2:00 p.m., followed immediately by online Public Bid Opening. Evaluation Period November 9, 2026 – December 13, 2026. Optional Vendor Interviews Week of December 7, 2026. Notice of Intent to Award Issued December 14, 2026. Board Consideration Award Date January 5, 2027. Contract Start Date January 15, 2027.
INTENT: to select a qualified Bidder to provide a Hospital-Based Violence Intervention Program (HVIP) services as part of the Alameda County Violence Reduction and Recovery Initiative.`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfq-902797",
    number: "RFQ No. 902797",
    title: "Uniform Rental Services",
    department: "General Services Agency, Procurement",
    agencyId: "alameda-county-gsa",
    type: "RFQ",
    category: "uniform-laundry",
    secondaryCategories: [],
    summary: "Rent, launder and deliver work uniforms for County staff on a recurring schedule.",
    description:
      "A quotation for uniform rental services (garments, laundering, repairs and route delivery) for County departments, awarded on price to a responsive bidder with at least three years in the uniform rental business. The bidders conference was held September 14; questions closed September 15.",
    estimatedValue: null,
    term: "Contract start January 1, 2027",
    dates: {
      posted: "2026-09-04",
      preBidMeeting: {
        when: { date: "2026-09-14", time: "10:00" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference September 14, 2026 10:00 AM",
      },
      questionsDue: { date: "2026-09-15", time: "17:00" },
      submissionDue: { date: "2026-10-22", time: "14:00" },
      anticipatedAward: "2026-12-15",
      contractStart: "2027-01-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [],
      certifications: [sleb()],
      insurance: gsaInsurance(false),
      location: { type: "local-preference" },
      experience: {
        years: 3,
        description: "3 years providing uniform rental services",
        quote: "Bidder must be regularly and continuously engaged in the business of providing uniform rental services for at least three (3) years",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [],
    },
    documents: gsaDocs([{ id: "exhibit-d", label: "Exhibit D (County-provided form in the packet)", kind: "form" }]),
    scopeTags: [],
    contact: gsaContact("Kevin Huynh", "(510) 208-9624", "Kevin.Huynh2@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902797 for UNIFORM RENTAL SERVICES. Contact Person: Kevin Huynh, (510) 208-9624, Kevin.Huynh2@acgov.org. RESPONSE DUE by 2:00 p.m. on October 22, 2026.
CALENDAR OF EVENTS: Request Issued September 4, 2026. Networking/Bidders Conference September 14, 2026 10:00 AM (PST). Written Questions Due September 15, 2026 by 5:00 p.m. List of Attendees September 16, 2026. Questions & Answers Issued October 12, 2026. Addendum Issued October 12, 2026. Response Due and Submitted through County of Alameda Procurement Portal October 22, 2026 by 2:00 p.m. Evaluation Period October 22, 2026 – November 16, 2026. Notice of Intent to Award Issued November 17, 2026. Board Consideration Award Date December 15, 2026. Contract Start Date January 1, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing uniform rental services for at least three (3) years, which must be clearly stated or demonstrated in the bid response packet. Attendance at the Bidders Conference is highly recommended but are not mandatory. Vendors who attend the Bidders Conference will be added to the Vendor Bid List.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfp-902798",
    number: "RFP No. 902798",
    title: "Forensic Pathology Services",
    department: "Sheriff's Office, Coroner's Bureau (procured by GSA)",
    agencyId: "alameda-county-gsa",
    type: "RFP",
    category: "health-services",
    secondaryCategories: [],
    summary: "Board-certified forensic pathologists to perform autopsies and medical death investigation for the Coroner's Bureau.",
    description:
      "The Sheriff's Office Coroner's Bureau is required by Government Code to provide pathology services and must contract with certified forensic pathologists. Bidders need at least one year of forensic pathology and medical death investigation experience, or completion of a forensic pathology fellowship, plus all required medical licenses.",
    estimatedValue: null,
    term: "Contract start February 1, 2027",
    dates: {
      posted: "2026-09-01",
      preBidMeeting: {
        when: { date: "2026-09-16", time: "10:00" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference September 16, 2026 @10:00 a.m.",
      },
      questionsDue: { date: "2026-09-17", time: "17:00" },
      submissionDue: { date: "2026-10-15", time: "14:00" },
      anticipatedAward: "2027-01-12",
      contractStart: "2027-02-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [
        {
          code: "MD_FORENSIC",
          label: "Board-certified forensic pathologist with California medical license",
          quote: "ACSO Coroner's Bureau must contract with certified forensic pathologists",
        },
      ],
      certifications: [sleb()],
      insurance: gsaInsurance(true),
      location: { type: "local-preference" },
      experience: {
        years: 1,
        description: "1 year of forensic pathology and medical death investigation, or a completed fellowship",
        quote:
          "Bidder must be regularly and continuously engaged in the business of providing forensic pathology services and medical death investigation for at least one year, or completion of a forensic pathology fellowship",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [],
    },
    documents: gsaDocs([{ id: "key-personnel", label: "Table of key personnel with board certifications and licenses", kind: "narrative" }]),
    scopeTags: ["professional-services"],
    contact: gsaContact("P. Biondi", "(510) 208-9613", "p.biondi@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902798 for FORENSIC PATHOLOGY SERVICES. Contact Person: P. Biondi, (510) 208-9613, p.biondi@acgov.org, General Services Agency (GSA) – Procurement. RESPONSE DUE October 15, 2026 by 2:00 p.m.
CALENDAR OF EVENTS: Request Issued September 1, 2026. Networking/Bidders Conference September 16, 2026 @10:00 a.m. Written Questions Due September 17, 2026 by 5:00 p.m. List of Attendees September 18, 2026. Questions & Answers Issued October 5, 2026. Response Due and Submitted through County of Alameda Procurement Portal October 15, 2026 by 2:00 p.m. Evaluation Period October 15, 2026 – November 13, 2026. Vendor Interviews Week of November 2, 2026. Notice of Intent to Award Issued November 16, 2026. Board Consideration Award Date January 12, 2027. Contract Start Date February 1, 2027.
The Alameda County Sheriff's Office (ACSO) Coroner's Bureau is mandated by law to provide pathology services pursuant to Government Code § 27491. ACSO Coroner's Bureau must contract with certified forensic pathologists. BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing forensic pathology services and medical death investigation for at least one year, or completion of a forensic pathology fellowship which must be clearly stated or demonstrated in the bid response. c. Bidder must possess all permits, licenses, and professional credentials necessary to supply products and perform services specified under this RFP. Attendance at the Bidders Conference(s) and Vendor Outreach are highly recommended but are not mandatory.
Professional Liability/Errors & Omissions $1,000,000 per occurrence.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "irfp-902793",
    number: "IRFP No. 902793",
    title: "Signage and Wayfinding Master Planning Services (Alco Park Garage)",
    department: "General Services Agency, Procurement",
    agencyId: "alameda-county-gsa",
    type: "IRFP",
    category: "signage",
    secondaryCategories: ["design-print", "engineering"],
    summary:
      "Assess existing signage at the Alco Park Garage in Oakland and produce a wayfinding master plan with budget and replacement timeline. Planning only, no fabrication.",
    description:
      "An informal RFP for a signage and wayfinding consultant to survey the Alco Park Garage, document deficiencies, and deliver an Existing Conditions Assessment Report with capital planning data, budget information and a recommended replacement timeline. The consultant's recommendations do not authorize any fabrication or installation. No bidders conference was scheduled; questions closed September 24.",
    estimatedValue: null,
    term: "Contract start January 1, 2027",
    dates: {
      posted: "2026-09-14",
      questionsDue: { date: "2026-09-24", time: "17:00" },
      submissionDue: { date: "2026-10-19", time: "14:00" },
      anticipatedAward: "2026-12-15",
      contractStart: "2027-01-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [],
      certifications: [sleb()],
      insurance: gsaInsurance(true),
      location: { type: "local-preference" },
      experience: {
        years: 3,
        description: "signage and wayfinding master planning consulting of similar size and scope",
        quote:
          "Bidder must be regularly and continuously engaged in the business of providing signage and wayfinding master planning consulting services of similar size, scale, and scope as the Alco Park Garage",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        {
          label: "Planning only: no fabrication or installation is authorized by this contract",
          quote: "Contractor recommendations do not constitute County authorization to fabricate, install, relocate, or remove signage",
        },
      ],
    },
    documents: gsaDocs([
      { id: "assessment-sample", label: "Sample Existing Conditions Assessment Report from a comparable project", kind: "proof" },
      { id: "approach", label: "Description of approach and schedule", kind: "narrative" },
    ]),
    scopeTags: ["professional-services"],
    contact: gsaContact("N. Peng", "(510) 208-9636", "n.peng@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA INFORMAL REQUEST FOR PROPOSAL No. 902793 for SIGNAGE AND WAYFINDING MASTER PLANNING SERVICES. Contact Person: N. Peng, (510) 208-9636, n.peng@acgov.org, General Services Agency (GSA) – Procurement. RESPONSE DUE October 19, 2026 by 2:00 p.m. through County of Alameda Procurement Portal.
CALENDAR OF EVENTS: Request Issued September 14, 2026. Written Questions Due September 24, 2026. Addendum Issued October 9, 2026. Response Due and Submitted through County of Alameda Procurement Portal October 19, 2026 by 2:00 p.m. Evaluation Period October 19, 2026 – November 12, 2026. Vendor Interviews Week of November 1, 2026. Notice of Intent to Award Issued November 13, 2026. Board Consideration Award Date December 15, 2026. Contract Start Date January 1, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing signage and wayfinding master planning consulting services of similar size, scale, and scope as the Alco Park Garage (described in Section B) for at least three (3) years. f. Contractor must prepare a comprehensive Existing Conditions Assessment Report summarizing findings, deficiencies, decisions, and recommendations, including preliminary capital-budget planning information for signage replacement. g. Contractor recommendations do not constitute County authorization to fabricate, install, relocate, or remove signage. Bidders are encouraged to attend Vendor Outreach but are not mandatory.
Professional Liability/Errors & Omissions $1,000,000 per occurrence.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfpq-26-07",
    number: "RFPQ 26-07",
    title: "Substance Use Disorder Youth Residential Treatment",
    department: "Alameda County Health, Behavioral Health Department (ACBHD)",
    agencyId: "alameda-county-health",
    type: "RFPQ",
    category: "health-services",
    secondaryCategories: [],
    summary: "Pre-qualify as a youth residential substance use treatment provider for County-referred adolescents.",
    description:
      "ACBHD is pre-qualifying licensed providers of residential substance use disorder treatment for youth. Addendum No. 2 moved the response deadline from October 15 to October 22, 2026 and the award date to November 19. An information session was held September 11; written questions closed the same day.",
    estimatedValue: null,
    term: "Contracts start May 1, 2027",
    dates: {
      posted: "2026-09-04",
      preBidMeeting: {
        when: { date: "2026-09-11", time: "14:30" },
        mandatory: false,
        location: "Online information session",
        virtual: true,
        quote: "Information Session September 11, 2026, 2:30-3:30pm",
      },
      questionsDue: { date: "2026-09-11", time: "16:00" },
      submissionDue: { date: "2026-10-22", time: "14:00" },
      anticipatedAward: "2026-11-19",
      contractStart: "2027-05-01",
    },
    submissionMethod: "Email the completed response to ACBHD Procurement by 2:00 p.m. on October 22, 2026 (revised by Addendum No. 2). ACBHD cannot accept late responses.",
    requirements: {
      licenses: [
        {
          code: "DHCS_RESIDENTIAL_LICENSE",
          label: "DHCS-licensed youth residential treatment facility",
          quote: "Substance Use Disorder Youth Residential Treatment",
        },
      ],
      certifications: [
        { code: "MEDI_CAL_PROVIDER", label: "Medi-Cal certified provider", required: true, quote: "Substance Use Disorder Youth Residential Treatment" },
        { code: "SLEB", mechanism: "preference" as const, percent: 10, goalPercent: 20, exceptionAllowed: true, label: "SLEB preference points", required: false, quote: "SLEB" },
      ],
      insurance: [
        { type: "general-liability", limit: 1_000_000, aggregate: 2_000_000 },
        { type: "auto", limit: 1_000_000 },
        { type: "workers-comp", limit: "statutory" },
        { type: "professional", limit: 1_000_000 },
        { type: "abuse-molestation", limit: 1_000_000 },
      ],
      location: { type: "local-preference" },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        { label: "Budgets judged unrealistic by ACBHD are rejected", quote: "Are unreasonable and/or unrealistic in terms of budget, as solely determined by ACBHD" },
      ],
    },
    documents: [
      { id: "bid-response-packet", label: "RFPQ 26-07 Bid Response Packet (signed)", kind: "form" },
      { id: "debarment", label: "Debarment and Suspension Certification (signed)", kind: "attestation" },
      { id: "sleb-sheet", label: "SLEB Information Sheet", kind: "form" },
      { id: "program-narrative", label: "Program description, licensing and staffing", kind: "narrative" },
      { id: "budget", label: "Program budget", kind: "pricing" },
    ],
    scopeTags: ["as-needed", "pool", "institutional"],
    contact: { name: "ACBHD Procurement", title: "Behavioral Health Department", email: "procurement@acgov.org" },
    sourceUrl: LEGACY_PORTAL,
    sourceExcerpt: `ALAMEDA COUNTY BEHAVIORAL HEALTH DEPARTMENT (ACBHD) REQUEST FOR PRE-QUALIFICATION (RFPQ) 26-07 for Substance Use Disorder Youth Residential Treatment. Responses Due 2:00 pm on October 15, 2026 (revised by Addendum No. 2 to 2:00 pm on October 22, 2026).
CALENDAR OF EVENTS: Request for Proposals (RFPQ) Issued September 4, 2026. Bidder's Written Questions Due By 4:00 pm on September 11, 2026. Information Session September 11, 2026, 2:30-3:30pm. Questions and Answers Issued October 7, 2026 (Addendum No. 2). Responses Due 2:00 pm on October 22, 2026 (Addendum No. 2). Award Date November 19, 2026 (Addendum No. 2). Board Agenda Date April 2027. Contract Start Date May 1, 2027.
All proposals must be received electronically by ACBHD no later than 2:00 pm on the due date. ACBHD cannot accept late proposals. Proposals will be rejected that: Are unreasonable and/or unrealistic in terms of budget, as solely determined by ACBHD. SLEB preference points apply.`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfp-902749",
    number: "RFP No. 902749",
    title: "Fine Art Services (Handling, Framing, Fabrication)",
    department: "General Services Agency, Procurement",
    agencyId: "alameda-county-gsa",
    type: "RFP",
    category: "moving",
    secondaryCategories: ["design-print", "signage"],
    summary:
      "Museum-quality art handling and installation, archival framing, and fabrication for the County's public art collection. You can bid on one service or all three.",
    description:
      "Three service areas, each with its own five-year experience requirement: fine art transportation and installation, archival framing, and fabrication of mounts and display elements, including technical advice on mounting hardware for a variety of circumstances. Bidders may respond to one or more service areas.",
    estimatedValue: null,
    term: "Contract start March 1, 2027",
    dates: {
      posted: "2026-09-11",
      preBidMeeting: {
        when: { date: "2026-09-21", time: "10:00" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference September 21, 2026 @ 10:00 a.m.",
      },
      questionsDue: { date: "2026-09-22", time: "17:00" },
      submissionDue: { date: "2026-10-22", time: "14:00" },
      anticipatedAward: "2027-01-05",
      contractStart: "2027-03-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [],
      certifications: [sleb()],
      insurance: gsaInsurance(false),
      location: { type: "local-preference" },
      experience: {
        years: 5,
        description: "5 years of museum-quality work in the service area you bid on",
        quote:
          "If Bidding on Fine Art Handling Services: Bidder must be regularly and continuously engaged in the business of providing fine art museum-quality transportation and installation as described herein for at least five (5) years",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [],
    },
    documents: gsaDocs([{ id: "portfolio", label: "Examples of comparable museum-quality work", kind: "proof" }]),
    scopeTags: ["as-needed"],
    contact: gsaContact("L. Hom", "(510) 208-9670", "L.Hom@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902749 for FINE ART SERVICES. Contact Person: L.Hom, (510) 208-9670, L.Hom@acgov.org, General Services Agency (GSA) – Procurement. RESPONSE DUE October 22, 2026 by 2:00 p.m.
CALENDAR OF EVENTS: Request Issued September 11, 2026. Networking/Bidders Conference September 21, 2026 @ 10:00 a.m. (Pacific Time). Written Questions Due September 22, 2026 by 5:00 p.m. List of Attendees September 23, 2026. Questions & Answers Issued October 6, 2026. Response Due and Submitted through County of Alameda Procurement Portal October 22, 2026 by 2:00 p.m. Evaluation Period October 22, 2026 – November 17, 2026. Optional Vendor Interviews Week of November 2, 2026. Notice of Intent to Award Issued November 17, 2026. Board Consideration Award Date January 5, 2027. Contract Start Date March 1, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. If Bidding on Fine Art Handling Services: Bidder must be regularly and continuously engaged in the business of providing fine art museum-quality transportation and installation as described herein for at least five (5) years. b. If Bidding on Fine Art Framing Services: Bidder must be regularly and continuously engaged in the business of providing fine art museum-quality, archival framing services as described herein for at least five (5) years. c. If Bidding on Fine Art Fabrication Services: Bidder must be regularly and continuously engaged in the business of providing fine art fabrication services as described herein for at least five (5) years. Contractor must provide expertise, including related technical consulting services regarding appropriate mounting hardware and installation systems for a variety of circumstances.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfp-902769",
    number: "RFP No. 902769",
    title: "Drug Testing Kits and Laboratory Services",
    department: "General Services Agency, Procurement",
    agencyId: "alameda-county-gsa",
    type: "RFP",
    category: "medical-supplies",
    secondaryCategories: ["health-services"],
    summary: "Supply drug testing kits and accredited laboratory confirmation testing for County programs. Closed September 11; now in evaluation.",
    description:
      "Testing supplies plus laboratory services from an accredited lab, from a bidder with five years in laboratory testing supplies and services. Four addenda changed the calendar. Responses were due September 11, 2026; the notice of intent to award was scheduled for October 12.",
    estimatedValue: null,
    term: "Contract start January 24, 2027",
    dates: {
      posted: "2026-08-13",
      preBidMeeting: {
        when: { date: "2026-08-18", time: "10:30" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference August 18, 2026 @ 10:30 A.M.",
      },
      questionsDue: { date: "2026-08-19", time: "17:00" },
      submissionDue: { date: "2026-09-11", time: "14:00" },
      anticipatedAward: "2026-11-17",
      contractStart: "2027-01-24",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [],
      certifications: [
        {
          code: "LAB_ACCREDITATION",
          label: "Laboratory accreditation (one or more of the listed certifications)",
          required: true,
          quote: "All laboratories responsible for testing specimens as a result of this RFP must possess and maintain a minimum of one or more of the following certifications/accreditations",
        },
        sleb(),
      ],
      insurance: gsaInsurance(true),
      location: { type: "local-preference" },
      experience: {
        years: 5,
        description: "5 years providing laboratory testing supplies and services",
        quote: "Bidder must be regularly and continuously engaged in the business of providing laboratory testing supplies and services for at least five (5) years",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [],
    },
    documents: gsaDocs(),
    scopeTags: ["goods", "professional-services"],
    contact: gsaContact("C. Chan", "(510) 208-9623", "C.Chan@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902769 for Drug Testing Kits and Laboratory Services. Contact Person: C. Chan, (510) 208-9623, C.Chan@acgov.org, General Services Agency (GSA) – Procurement. RESPONSE DUE September 11, 2026 by 2:00 p.m.
CALENDAR OF EVENTS: Request Issued August 13, 2026. Networking/Bidders Conference August 18, 2026 @ 10:30 A.M. Written Questions Due August 19, 2026 by 5:00 p.m. Questions & Answers Issued August 31, 2026. Response Due and Submitted through County of Alameda Procurement Portal September 11, 2026 by 2:00 p.m. Evaluation Period September 11, 2026 – October 16, 2026. Notice of Intent to Award Issued October 12, 2026. Board Consideration Award Date November 17, 2026. Contract Start Date January 24, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing laboratory testing supplies and services for at least five (5) years, which must be clearly stated or demonstrated in the bid response. All laboratories responsible for testing specimens as a result of this RFP must possess and maintain a minimum of one or more of the following certifications/accreditations. Attendance at the Bidders Conference(s) and Vendor Outreach are highly recommended but are not mandatory.
Professional Liability/Errors & Omissions $1,000,000 per occurrence.
${GSA_BOILERPLATE}`,
    status: "closed",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfp-902773",
    number: "RFP No. 902773",
    title: "Medical Oversight Services",
    department: "General Services Agency, Procurement",
    agencyId: "alameda-county-gsa",
    type: "RFP",
    category: "health-services",
    secondaryCategories: ["consulting-training"],
    summary: "A designated physician to provide medical oversight for a County program, with guaranteed interim coverage whenever the physician is replaced or absent.",
    description:
      "The County needs a contractor with five years of medical oversight experience to supply a designated physician and protocols, give 30 days' notice before replacing the physician, and keep an interim-coverage plan for unplanned absences. Bidders conference was September 24; questions closed September 25.",
    estimatedValue: null,
    term: "Contract start October 1, 2027",
    dates: {
      posted: "2026-09-18",
      preBidMeeting: {
        when: { date: "2026-09-24", time: "10:30" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference September 24, 2026 @ 10:30 AM",
      },
      questionsDue: { date: "2026-09-25", time: "17:00" },
      submissionDue: { date: "2026-10-19", time: "14:00" },
      anticipatedAward: "2027-01-12",
      contractStart: "2027-10-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [
        { code: "MD_CA", label: "California-licensed physician as the designated medical director", quote: "replacing the designated physician" },
      ],
      certifications: [sleb()],
      insurance: gsaInsurance(true),
      location: { type: "local-preference" },
      experience: {
        years: 5,
        description: "5 years providing medical oversight services",
        quote: "Bidder must be regularly and continuously engaged in the business of providing medical oversight services for at least five (5) years",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        {
          label: "30 days' notice and interim coverage when the physician changes",
          quote: "Contractor must provide written notice at least thirty (30) calendar days advance notice of replacing the designated physician whenever practicable, an immediate interim-coverage plan for unplanned absence",
        },
      ],
    },
    documents: gsaDocs([{ id: "key-personnel", label: "Table of key personnel including the designated physician", kind: "narrative" }]),
    scopeTags: ["professional-services"],
    contact: gsaContact("C. Chan", "(510) 208-9623", "C.Chan@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902773 for Medical Oversight Services. Contact Person: C.Chan, (510) 208-9623, C.Chan@acgov.org, General Services Agency (GSA) – Procurement. RESPONSE DUE October 19, 2026 by 2:00 p.m.
CALENDAR OF EVENTS: Request Issued September 18, 2026. Networking/Bidders Conference September 24, 2026 @ 10:30 AM. Written Questions Due September 25, 2026 by 5:00 p.m. List of Attendees September 29, 2026. Questions & Answers Issued October 6, 2026. Response Due and Submitted through County of Alameda Procurement Portal October 19, 2026 by 2:00 p.m. Evaluation Period October 19, 2026 – November 20, 2026. Notice of Intent to Award Issued November 24, 2026. Board Consideration Award Date January 12, 2027. Contract Start Date October 1, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing medical oversight services for at least five (5) years, which must be clearly stated or demonstrated in the bid response. Contractor must provide written notice at least thirty (30) calendar days advance notice of replacing the designated physician whenever practicable, an immediate interim-coverage plan for unplanned absence, and uninterrupted coverage. Attendance at the Bidders Conference(s) and Vendor Outreach are highly recommended but are not mandatory.
Professional Liability/Errors & Omissions $1,000,000 per occurrence.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfp-902774",
    number: "RFP No. 902774",
    title: "Recruitment and Staffing Services for Clinical Psychologist",
    department: "General Services Agency, Procurement (behavioral health)",
    agencyId: "alameda-county-gsa",
    type: "RFP",
    category: "staffing",
    secondaryCategories: ["health-services"],
    summary: "A staffing agency to recruit and place credentialed clinical psychologists for County behavioral health programs on approved hourly budgets.",
    description:
      "Recruitment and referral of behavioral health providers (clinical psychologists) for a government entity, with credential verification and CAQH profile support. Hiring managers approve hourly rates, budgets and dates on an Authorization to Request Service form. Addendum No. 2 moved the due date to October 20, 2026.",
    estimatedValue: null,
    term: "Contract start January 1, 2027",
    dates: {
      posted: "2026-08-11",
      preBidMeeting: {
        when: { date: "2026-08-20", time: "10:00" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference August 20, 2026 @ 10 a.m.",
      },
      questionsDue: { date: "2026-08-21", time: "17:00" },
      submissionDue: { date: "2026-10-20", time: "14:00" },
      anticipatedAward: "2026-12-08",
      contractStart: "2027-01-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [],
      certifications: [sleb()],
      insurance: gsaInsurance(true),
      location: { type: "local-preference" },
      experience: {
        years: 3,
        description: "recruitment and referral of behavioral health professionals to government and healthcare agencies",
        quote:
          "Bidder must be regularly and continuously engaged in the business of providing recruitment and referral services to a government entity (city, county, state and federal) and to healthcare agencies for behavioral health professionals",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        {
          label: "Placed providers must supply credentials and complete CAQH profiles",
          quote: "All behavioral health care plan providers must possess and provide copies of the following credentials to the Contractor",
        },
      ],
    },
    documents: gsaDocs([{ id: "recruiting-plan", label: "Recruitment approach and candidate credentialing process", kind: "narrative" }]),
    scopeTags: ["professional-services", "as-needed"],
    contact: gsaContact("K. Handy", "(510) 208-9644", "k.handy@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR PROPOSAL No. 902774 for RECRUITMENT AND STAFFING SERVICES FOR CLINICAL PSYCHOLOGIST. Contact Person: K. Handy, (510) 208-9644, k.handy@acgov.org, General Services Agency (GSA) – Procurement.
CALENDAR OF EVENTS (as revised by Addendum No. 2): Request Issued August 11, 2026. Networking/Bidders Conference August 20, 2026 @ 10 a.m. (Pacific Time). Written Questions Due August 21, 2026, by 5:00 p.m. List of Attendees August 24, 2026. Addendum No. 1 Issued September 10, 2026. Addendum No. 2 Issued September 25, 2026. Questions & Answers Issued October 9, 2026. Response Due and Submitted through County of Alameda Procurement Portal October 20, 2026, by 2:00 p.m. Board Consideration Award Date December 8, 2026. Contract Start Date January 1, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing recruitment and referral services to a government entity (city, county, state and federal) and to healthcare agencies for behavioral health professionals. All behavioral health care plan providers must possess and provide copies of the following credentials to the Contractor. The Provider will also electronically upload any documentation required to complete their CAQH profile. The Hiring Manager will coordinate with the finance unit to complete Authorization to Request Service (Exhibit B) form, detailing the hourly rate, total budget per approved hours, and start and end dates. Attendance at the Bidders Conference(s) and Vendor Outreach are highly recommended but are not mandatory.
Professional Liability/Errors & Omissions $1,000,000 per occurrence.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfq-902750",
    number: "RFQ No. 902750",
    title: "Shuttle Bus Services",
    department: "General Services Agency, Procurement",
    agencyId: "alameda-county-gsa",
    type: "RFQ",
    category: "transportation",
    secondaryCategories: [],
    summary: "Provide shuttle buses with licensed drivers for County routes. Closes October 12.",
    description:
      "A quotation for shuttle bus services from a company with three years in the business, a valid California DOT number at bid time, and drivers holding a Class B commercial license with passenger endorsement. Bidders conference was September 9; questions closed September 10; Addendum 1 and Q&A were issued September 28.",
    estimatedValue: null,
    term: "Contract start April 1, 2027",
    dates: {
      posted: "2026-09-01",
      preBidMeeting: {
        when: { date: "2026-09-09", time: "13:00" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference September 9, 2026 @ 1:00 PM",
      },
      questionsDue: { date: "2026-09-10", time: "17:00" },
      submissionDue: { date: "2026-10-12", time: "14:00" },
      anticipatedAward: "2027-02-09",
      contractStart: "2027-04-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [
        { code: "CA_DOT", label: "Valid California DOT number at bid submittal", quote: "Bidder must possess a valid State of California Department of Transportation (DOT) number at the time of bid submittal" },
        { code: "CDL_B_P", label: "Drivers: Class B commercial license with Passenger endorsement", quote: "Must possess a valid State of California Commercial Driver's license (CDL), Class B, with Passenger (P) endorsement" },
      ],
      certifications: [sleb()],
      insurance: [
        ...gsaInsurance(false),
        { type: "umbrella", limit: 5_000_000 },
      ],
      location: { type: "local-preference" },
      experience: {
        years: 3,
        description: "3 years providing shuttle bus services",
        quote: "Bidder must be regularly and continuously engaged in the business of providing shuttle bus services for at least three (3) years",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [],
    },
    documents: gsaDocs([{ id: "fleet-list", label: "Fleet and driver roster with license classes", kind: "proof" }]),
    scopeTags: [],
    contact: gsaContact("Yulia Margolin", "(510) 208-9615", "Yulia.Margolin@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902750 for SHUTTLE BUS SERVICES. Contact Person: Yulia Margolin, (510) 208-9615, Yulia.Margolin@acgov.org. RESPONSE DUE October 12, 2026, by 2:00 p.m.
CALENDAR OF EVENTS: Request Issued September 1, 2026. Networking/Bidders Conference September 9, 2026 @ 1:00 PM (PST). Written Questions Due September 10, 2026 by 5:00 p.m. List of Attendees September 11, 2026. Questions & Answers Issued September 28, 2026. Addendum Issued September 28, 2026. Response Due and Submitted through County of Alameda Procurement Portal October 12, 2026, by 2:00 p.m. Evaluation Period October 12, 2026 – December 18, 2026. Notice of Intent to Award Issued December 21, 2026. Board Consideration Award Date February 9, 2027. Contract Start Date April 1, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing shuttle bus services for at least three (3) years, which must be clearly stated or demonstrated in the bid response packet. b. Bidder must possess a valid State of California Department of Transportation (DOT) number at the time of bid submittal. Drivers: Must possess a valid State of California Commercial Driver's license (CDL), Class B, with Passenger (P) endorsement. Attendance at the Bidders Conference(s) and Vendor Outreach are highly recommended but are not mandatory.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfq-902761",
    number: "RFQ No. 902761",
    title: "Landscape Chemicals",
    department: "General Services Agency, Procurement",
    agencyId: "alameda-county-gsa",
    type: "RFQ",
    category: "landscaping",
    secondaryCategories: [],
    summary: "Supply fertilizers, herbicides and other landscape chemicals to County departments as ordered, with one-day backorder notice. Closes October 15.",
    description:
      "A price quotation for landscape chemicals delivered on order. Bidders need three years supplying landscape chemicals and must notify the ordering department within one business day of any backorder with reason, availability date and partial quantities. Non-SLEB bidders must subcontract 20% to a certified SLEB or take exception.",
    estimatedValue: null,
    term: "Contract start April 1, 2027",
    dates: {
      posted: "2026-09-04",
      preBidMeeting: {
        when: { date: "2026-09-14", time: "10:30" },
        mandatory: false,
        location: "Online (Networking/Bidders Conference)",
        virtual: true,
        quote: "Networking/Bidders Conference September 14, 2026 @ 10:30 a.m.",
      },
      questionsDue: { date: "2026-09-15", time: "17:00" },
      submissionDue: { date: "2026-10-15", time: "14:00" },
      anticipatedAward: "2026-12-16",
      contractStart: "2027-04-01",
    },
    submissionMethod: GSA_SUBMISSION,
    requirements: {
      licenses: [],
      certifications: [sleb()],
      insurance: gsaInsurance(false),
      location: { type: "local-preference" },
      experience: {
        years: 3,
        description: "3 years providing landscape chemicals",
        quote: "Bidder must be regularly and continuously engaged in the business of providing landscape chemicals for at least three (3) years",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        { label: "One-business-day backorder notice", quote: "Contractor must notify the ordering department within one (1) business day of any actual or anticipated backorder" },
      ],
    },
    documents: gsaDocs(),
    scopeTags: ["goods", "as-needed"],
    contact: gsaContact("L. Hom", "(510) 208-9606", "L.Hom@acgov.org"),
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA REQUEST FOR QUOTATION No. 902761 for LANDSCAPE CHEMICALS. Contact Person: L. Hom, (510) 208-9606, L.Hom@acgov.org. RESPONSE DUE October 15, 2026 by 2:00 p.m.
CALENDAR OF EVENTS: Request Issued September 4, 2026. Networking/Bidders Conference September 14, 2026 @ 10:30 a.m. (PST). Written Questions Due September 15, 2026 by 5:00 p.m. List of Attendees September 16, 2026. Questions & Answers Issued October 5, 2026. Response Due and Submitted through County of Alameda Procurement Portal October 15, 2026 by 2:00 p.m. Evaluation Period October 15, 2026 – November 12, 2026. Notice of Intent to Award Issued November 12, 2026. General Services Agency Consideration Award Date December 16, 2026. Contract Start Date April 1, 2027.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing landscape chemicals for at least three (3) years, which must be clearly stated or demonstrated in the bid response packet. Backorder Management: Contractor must notify the ordering department within one (1) business day of any actual or anticipated backorder and provide the reason, estimated availability date, available partial quantities. Attendance at the Bidders Conference(s) and Vendor Outreach are highly recommended but are not mandatory.
${GSA_BOILERPLATE}`,
    status: "open",
    provenance: portalProvenance,
  },

  // -------------------------------------------------------------------------
  {
    id: "rfq-ach-900626-v3",
    number: "RFQ No. ACH-900626.V3",
    title: "Housing and Homelessness Services Vendor Pool (Round 3)",
    department: "Alameda County Health, Housing and Homelessness Services",
    agencyId: "alameda-county-health",
    type: "RFQ",
    category: "social-services",
    secondaryCategories: ["health-services"],
    summary:
      "A standing pool of qualified vendors for housing and homelessness services. Round 3 closed October 2, 2026; the pool reopens in rounds.",
    description:
      "Alameda County Health qualifies vendors with at least three years serving people experiencing or at risk of homelessness. Qualified vendors are later matched to specific contract opportunities and negotiate scope, budget and reporting. Round 1 closed April 14, Round 2 July 31, Round 3 October 2, 2026. Watch for Round 4.",
    estimatedValue: null,
    term: "Pool; individual contracts negotiated per opportunity",
    dates: {
      posted: "2026-03-10",
      questionsDue: { date: "2026-08-25", time: "17:00" },
      submissionDue: { date: "2026-10-02", time: "14:00" },
    },
    submissionMethod: "Upload through the County of Alameda Procurement Portal by the round's due date.",
    requirements: {
      licenses: [],
      certifications: [
        { code: "SLEB", mechanism: "preference" as const, percent: 10, goalPercent: 20, exceptionAllowed: true, label: "SLEB preference points", required: false, quote: "Exhibit A – Bid Response Packet, Debarment and Suspension Certification" },
      ],
      insurance: [
        { type: "general-liability", limit: 1_000_000, aggregate: 2_000_000 },
        { type: "auto", limit: 1_000_000 },
        { type: "workers-comp", limit: "statutory" },
      ],
      location: { type: "local-preference" },
      experience: {
        years: 3,
        description: "3 of the last 5 years serving people experiencing or at risk of homelessness",
        quote:
          "Bidder must be regularly and continuously engaged in the business of providing services to people currently, formerly, or at risk of experiencing homelessness, and/or unstably housed for at least three (3) years",
      },
      bonding: [],
      prevailingWage: false,
      livingWage: false,
      dirRegistration: false,
      other: [
        { label: "Scope, budget and reporting negotiated per opportunity after qualification", quote: "the County and the qualified vendor will negotiate a specific scope of work, implementation plan, budget, reporting requirements" },
      ],
    },
    documents: [
      { id: "bidder-acceptance", label: "Exhibit A: Bidder Acceptance (signed)", kind: "form", quote: "Exhibit A – Bid Response Packet, Bidder Acceptance" },
      { id: "debarment", label: "Debarment and Suspension Certification (signed)", kind: "attestation", quote: "Exhibit A – Bid Response Packet, Debarment and Suspension Certification" },
      { id: "qualifications", label: "Statement of qualifications and service areas", kind: "narrative" },
      { id: "references", label: "References", kind: "references" },
    ],
    scopeTags: ["pool", "as-needed"],
    contact: { name: "Alameda County Health Procurement", email: "procurement@acgov.org" },
    sourceUrl: COUNTY_PORTAL,
    sourceExcerpt: `COUNTY OF ALAMEDA, ALAMEDA COUNTY HEALTH REQUEST FOR QUALIFICATION No. ACH-900626.V3 for HOUSING AND HOMELESSNESS SERVICES VENDOR POOL. Please read EXHIBIT A – Bid Response Packet carefully. Incomplete Bid Responses will be rejected. Exhibit A – Bid Response Packet, Bidder Acceptance. Exhibit A – Bid Response Packet, Debarment and Suspension Certification. All proposal documents must be completed, successfully uploaded, and submitted online through County of Alameda Procurement Portal.
CALENDAR OF EVENTS: Request Issued March 10, 2026. Responses are due for Round 1 on April 14, 2026. Written Questions Due June 23, 2026 by 5:00 p.m. for Round 2; July 31, 2026 for Round 2 response due date. Written Questions Due August 25, 2026 by 5:00 p.m. for Round 3; October 2, 2026 for Round 3 response due date. Notice of Intent to Award Issued for Round 1 June 9, 2026. Contract Start Date for Round 1 July 1, 2026.
BIDDER MINIMUM QUALIFICATIONS: a. Bidder must be regularly and continuously engaged in the business of providing services to people currently, formerly, or at risk of experiencing homelessness, and/or unstably housed for at least three (3) years of the last five years. If a qualified vendor is chosen for a contract opportunity, the County and the qualified vendor will negotiate a specific scope of work, implementation plan, budget, reporting requirements, and other requirements, as appropriate.`,
    status: "closed",
    provenance: portalProvenance,
  },
];
