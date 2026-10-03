/**
 * Plain-language glossary of Alameda County procurement terms.
 *
 * Each entry says what the thing is, what a small business owner can do about
 * it, how long that usually takes, and whether lacking it can stop a bid.
 * Figures quoted here come from current County solicitation language; the UI
 * always tells the user to confirm against the solicitation itself.
 */
export type LeadTime = "same-day" | "days" | "weeks" | "months" | "n/a";
export type GateKind = "yes" | "no" | "at-award" | "form";

export interface GlossaryEntry {
  key: string;
  term: string;
  aliases?: string[];
  meaning: string;
  action: string;
  leadTime: LeadTime;
  leadTimeDays?: number;
  gate: GateKind;
  link?: string;
}

const entries: GlossaryEntry[] = [
  {
    key: "cert:SLEB",
    term: "SLEB certification (Small, Local and Emerging Business)",
    aliases: ["SLEB", "small local emerging business"],
    meaning:
      "Alameda County's program for small businesses with a real office in the County. In current County RFPs a certified SLEB gets up to a 10% bid preference on procurements over $25,000 (5% for being local plus 5% for being small or emerging). Bidders that are not certified must usually subcontract at least 20% of the bid to a certified SLEB, or take a written exception on the Exceptions form.",
    action:
      "Apply through the County SLEB program (Auditor-Controller SLEB Certification Unit, OCCR@acgov.org). You will need proof of your office address, business license and recent tax returns. Certification must be valid when you submit, so start early. Not being certified does not stop you from bidding.",
    leadTime: "weeks",
    leadTimeDays: 30,
    gate: "no",
    link: "https://gsa.acgov.org/do-business-with-us/vendor-support/small-local-and-emerging-businesses/",
  },
  {
    key: "program:SLEB_SUBCONTRACT",
    term: "SLEB subcontracting requirement",
    meaning:
      "If you are not a certified SLEB, current County solicitations ask you to partner with one for at least 20% of the bid amount and name them on the SLEB Information Sheet. Compliance is tracked in the Elation Systems website after award.",
    action:
      "Find a certified SLEB partner through the County's certified vendor list, or ask GSA-OAP@acgov.org about subcontracting questions. If you cannot meet it, say so on the Exceptions and Clarifications form.",
    leadTime: "weeks",
    leadTimeDays: 14,
    gate: "form",
    link: "https://gsa.acgov.org/do-business-with-us/vendor-support/small-local-and-emerging-businesses/",
  },
  {
    key: "registration:COUNTY_VENDOR",
    term: "County vendor registration (Procurement Portal account)",
    aliases: ["vendor registration", "bidders list", "plan holder"],
    meaning:
      "A free account on the County of Alameda Procurement Portal (procurement.opengov.com/portal/acgov). You need it to download documents, ask questions in the Q&A tab, receive addenda and upload your bid.",
    action:
      "Create the account once, pick the commodity categories for your trade so you get email alerts, and follow the specific project page for the solicitation.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "yes",
    link: "https://procurement.opengov.com/portal/acgov",
  },
  {
    key: "registration:DIR",
    term: "DIR public works contractor registration",
    aliases: ["DIR", "Department of Industrial Relations"],
    meaning:
      "A State registration with the Department of Industrial Relations that every contractor and subcontractor needs before bidding on or working on a public works project (construction, alteration, repair or maintenance of public buildings). It comes with an annual fee and a duty to file electronic certified payroll.",
    action:
      "Register online at dir.ca.gov. It usually takes days, not weeks. Put your DIR number on the bid forms.",
    leadTime: "days",
    leadTimeDays: 5,
    gate: "yes",
    link: "https://www.dir.ca.gov/Public-Works/PublicWorks.html",
  },
  {
    key: "wage:PREVAILING",
    term: "Prevailing wage",
    aliases: ["labor compliance", "certified payroll"],
    meaning:
      "On public works jobs you must pay State-set hourly rates for each craft and file certified payroll with the DIR. Rates are often well above market, so price your bid with them in mind. Current County RFPs also require apprentices on public works contracts of $30,000 or more unless the trade has none.",
    action:
      "Look up the rates for Alameda County and your craft on dir.ca.gov before pricing. Set up certified payroll reporting (eCPR) and keep daily timesheets.",
    leadTime: "days",
    leadTimeDays: 3,
    gate: "at-award",
    link: "https://www.dir.ca.gov/OPRL/DPreWageDetermination.htm",
  },
  {
    key: "wage:LIVING",
    term: "Living wage requirement",
    meaning:
      "Some County service contracts require a minimum hourly wage plus a health benefit or cash supplement for the staff who work on the contract. Many GSA solicitations say outright that no living wage applies, so check the solicitation.",
    action: "Read the wage section of the solicitation and confirm your pay rates meet it before you price the bid.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "at-award",
  },
  {
    key: "bonding:BID",
    term: "Bid bond (bid security)",
    meaning:
      "A promise from a surety company, usually a percentage of your bid, that you will sign the contract if you win. Sometimes a cashier's check is accepted instead.",
    action:
      "Call a surety broker as soon as you decide to bid; first-time bonding needs financial statements. The SBA Surety Bond Guarantee program helps small firms qualify.",
    leadTime: "weeks",
    leadTimeDays: 14,
    gate: "yes",
    link: "https://www.sba.gov/funding-programs/surety-bonds",
  },
  {
    key: "bonding:PERFORMANCE",
    term: "Performance bond",
    meaning:
      "A surety guarantee that you will finish the work, usually for the full contract amount. It is required after award, not with the bid, but you need to know your bonding capacity before you bid.",
    action: "Ask your surety broker to confirm your single-job and aggregate bonding capacity before you price the bid.",
    leadTime: "weeks",
    leadTimeDays: 14,
    gate: "at-award",
  },
  {
    key: "bonding:PAYMENT",
    term: "Payment bond",
    meaning:
      "A surety guarantee that your subcontractors and suppliers get paid. State law requires one on public works above a dollar threshold. Required after award.",
    action: "Confirm with your surety broker alongside the performance bond.",
    leadTime: "weeks",
    leadTimeDays: 14,
    gate: "at-award",
  },
  {
    key: "doc:EXHIBIT_A",
    term: "Exhibit A, Bid Response Packet",
    aliases: ["bid response packet"],
    meaning:
      "The County's standard bundle of required forms: Bidder Information and Acceptance, Debarment and Suspension Certification, SLEB Information Sheet, Minimum Qualifications table, References, Exceptions and Clarifications, and the narrative sections the RFP asks for. Every page must be completed and signed; incomplete packets can be rejected unread.",
    action:
      "Download the current version (check for addenda), complete every page, sign where marked, and upload it as a PDF on the portal. Do not retype or modify County forms.",
    leadTime: "days",
    leadTimeDays: 3,
    gate: "yes",
  },
  {
    key: "doc:BID_FORM_EXCEL",
    term: "County Excel Bid Form",
    meaning:
      "Pricing is entered on the County-provided Excel bid form and uploaded on the portal, separate from the PDF packet. Prices must be in the format the form asks for (per unit, per hour, per year, and so on).",
    action: "Fill in every line of the Excel form exactly as laid out; the County will not re-key your pricing.",
    leadTime: "days",
    leadTimeDays: 2,
    gate: "yes",
  },
  {
    key: "doc:DEBARMENT",
    term: "Debarment and Suspension Certification",
    meaning:
      "A form you sign saying your business and its owners are not barred from government contracts. Current County RFPs require it for procurements of $25,000 and over. It is a form, not a certification you have to obtain.",
    action: "Check your business at sam.gov (exclusions), then sign the page inside Exhibit A.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "form",
    link: "https://gsa.acgov.org/do-business-with-us/contracting-opportunities/procurement-debarment-suspension-policy/",
  },
  {
    key: "doc:IRAN_ACT",
    term: "Iran Contracting Act certification",
    meaning:
      "For contracts of $1,000,000 or more, bidders certify they are not on the State's list of companies investing in Iran's energy sector. Almost no small business is affected; you just sign it.",
    action: "Sign the form if the packet includes it.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "form",
  },
  {
    key: "doc:EXCEPTIONS",
    term: "Exceptions and Clarifications form",
    meaning:
      "The one place to say which requirements or contract terms you cannot meet. The County can reject your bid for the exceptions you list, but leaving a known gap unsaid is worse.",
    action: "List only what you truly cannot meet, in plain words, with what you propose instead.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "form",
  },
  {
    key: "doc:ADDENDA",
    term: "Addenda",
    meaning:
      "Changes the County posts after the solicitation goes out, including answers to bidder questions. Your bid must use the latest forms and acknowledge every addendum, or it can be rejected.",
    action: "Follow the project on the portal, re-check for addenda the day before you submit, and use the newest version of every form.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "yes",
  },
  {
    key: "meeting:PREBID",
    term: "Networking / Bidders Conference (pre-bid meeting)",
    aliases: ["bidders conference", "pre-bid meeting", "site visit"],
    meaning:
      "The County's pre-bid meeting, usually on Microsoft Teams. If it is marked mandatory you must attend and be on the attendance list or your bid will be rejected. Optional conferences are still the best place to meet larger firms looking for SLEB subcontractors and to hear what the department actually wants.",
    action: "Put it on your calendar, join on time, make sure your name and company are recorded on the attendance list.",
    leadTime: "n/a",
    gate: "yes",
  },
  {
    key: "meeting:PREREQUISITE",
    term: "Pre-meeting clearance form",
    meaning:
      "Some site visits inside secure facilities (jails, juvenile facilities) require a security clearance form days or weeks before the visit. Miss that date and you cannot attend, which can mean you cannot bid.",
    action: "Send the clearance form by its deadline, before anything else.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "yes",
  },
  {
    key: "insurance:general-liability",
    term: "Commercial general liability insurance",
    meaning:
      "Covers injury or property damage caused by your work. The County's standard minimum is $1,000,000 per occurrence and $2,000,000 aggregate, with the County named as additional insured and the policy primary and non-contributory. Certificates are due before award, not with the bid.",
    action: "Send the solicitation's insurance exhibit to your broker and ask for a quote plus a sample certificate with the County endorsements.",
    leadTime: "days",
    leadTimeDays: 5,
    gate: "at-award",
  },
  {
    key: "insurance:auto",
    term: "Business auto liability insurance",
    meaning:
      "Covers vehicles used for the work, including hired and non-owned vehicles. County minimum is typically $1,000,000 per occurrence. Personal auto extended to business use can be acceptable for individual contractors with no hauling.",
    action: "Ask your broker to confirm hired and non-owned coverage is included.",
    leadTime: "days",
    leadTimeDays: 5,
    gate: "at-award",
  },
  {
    key: "insurance:workers-comp",
    term: "Workers' compensation and employer's liability",
    meaning:
      "Required by State law as soon as you have employees. County contracts also ask for employer's liability of $1,000,000 per accident.",
    action: "If you have employees you almost certainly already have this; ask your broker for the certificate with the County's waiver of subrogation.",
    leadTime: "days",
    leadTimeDays: 3,
    gate: "at-award",
  },
  {
    key: "insurance:professional",
    term: "Professional liability (errors and omissions)",
    meaning:
      "Covers mistakes in professional advice or design work. Asked of consultants, engineers, IT firms and clinicians, typically at $1,000,000 per occurrence.",
    action: "Trades usually do not need this. If the solicitation lists it, get a quote from your broker; it is quick to add.",
    leadTime: "days",
    leadTimeDays: 5,
    gate: "at-award",
  },
  {
    key: "insurance:cyber",
    term: "Cyber liability insurance",
    meaning: "Covers data breaches. Asked of IT, telecom and any vendor handling County data.",
    action: "Get a quote from your broker; small-business cyber policies are widely available.",
    leadTime: "days",
    leadTimeDays: 7,
    gate: "at-award",
  },
  {
    key: "insurance:pollution",
    term: "Pollution liability insurance",
    meaning: "Covers contamination claims. Asked of hauling, pest control and some maintenance contracts.",
    action: "Ask your broker; it may be bundled with your general liability.",
    leadTime: "days",
    leadTimeDays: 7,
    gate: "at-award",
  },
  {
    key: "insurance:umbrella",
    term: "Umbrella / excess liability",
    meaning: "Extra coverage above your other policies, asked for on larger or higher-risk contracts.",
    action: "Ask your broker for a quote at the limit the solicitation states.",
    leadTime: "days",
    leadTimeDays: 7,
    gate: "at-award",
  },
  {
    key: "insurance:abuse-molestation",
    term: "Sexual abuse and molestation liability",
    meaning: "Required for services involving minors or vulnerable adults.",
    action: "Ask your broker; providers who work with youth usually carry it already.",
    leadTime: "days",
    leadTimeDays: 7,
    gate: "at-award",
  },
  {
    key: "license:CSLB",
    term: "CSLB contractor license",
    aliases: ["contractors state license board", "contractor license"],
    meaning:
      "A State license from the Contractors State License Board, needed for construction work above a small dollar amount. The class has to match the work: A general engineering, B general building, C-7 low voltage, C-10 electrical, C-20 HVAC, C-27 landscaping, C-33 painting, C-36 plumbing, C-39 roofing, C-45 electric signs. It must be active, bonded, and have workers' comp on file.",
    action:
      "Check your license status and class at cslb.ca.gov and put the number on the bid forms. A new license or class takes months, so if you lack it, look at subcontracting to a licensed prime instead.",
    leadTime: "months",
    leadTimeDays: 120,
    gate: "yes",
    link: "https://www.cslb.ca.gov/",
  },
  {
    key: "cert:SERVSAFE",
    term: "Certified Food Protection Manager (ServSafe)",
    meaning:
      "California requires a certified food protection manager at every food facility and food handler cards for staff. ServSafe is the most common accepted program.",
    action: "Schedule the manager exam (often same-week) and make sure every staff member has a food handler card.",
    leadTime: "days",
    leadTimeDays: 7,
    gate: "yes",
  },
  {
    key: "permit:HEALTH_FACILITY",
    term: "Alameda County health permit (food facility)",
    meaning:
      "Caterers need a current permit from Alameda County Environmental Health for their kitchen or commissary.",
    action: "Confirm your permit is current and keep a copy ready to attach.",
    leadTime: "weeks",
    leadTimeDays: 21,
    gate: "yes",
    link: "https://deh.acgov.org/",
  },
  {
    key: "cert:COURT_INTERPRETER",
    term: "Court interpreter certification",
    meaning:
      "A State credential from the Judicial Council for interpreting in court: 'certified' for designated languages such as Spanish, Cantonese, Mandarin, Vietnamese and Tagalog, 'registered' for others. Written translation work often asks for ATA certification instead; medical settings ask for CCHI or NBCMI.",
    action: "Check exactly which credential the solicitation names. Exams run on a schedule, so plan months ahead; many social-services solicitations accept qualified bilingual staff instead.",
    leadTime: "months",
    leadTimeDays: 120,
    gate: "yes",
  },
  {
    key: "cert:ATA",
    term: "ATA certified translator",
    meaning: "American Translators Association certification for written translation in a language pair.",
    action: "Confirm whether the solicitation requires ATA certification or accepts equivalent experience.",
    leadTime: "months",
    leadTimeDays: 120,
    gate: "yes",
  },
  {
    key: "cert:BSIS_PPO",
    term: "BSIS Private Patrol Operator license",
    meaning: "State license for security guard companies, plus guard cards for each guard.",
    action: "Check status at bsis.ca.gov; a new PPO license takes months.",
    leadTime: "months",
    leadTimeDays: 90,
    gate: "yes",
  },
  {
    key: "cert:SPCB",
    term: "Structural Pest Control Board license",
    meaning: "State license for pest control operators and field representatives.",
    action: "Confirm your branch and license number are current.",
    leadTime: "months",
    leadTimeDays: 90,
    gate: "yes",
  },
  {
    key: "cert:ASE",
    term: "ASE certified technicians",
    meaning: "Automotive Service Excellence certification for mechanics; fleet contracts often require it.",
    action: "List the ASE certifications your technicians hold in the qualifications table.",
    leadTime: "months",
    leadTimeDays: 60,
    gate: "yes",
  },
  {
    key: "cert:QEI",
    term: "Qualified Elevator Inspector (QEI) certification",
    meaning: "A NAESA International credential for elevator inspectors; the County requires it on elevator consulting work.",
    action: "Only firms whose staff already hold QEI should pursue elevator assessment work.",
    leadTime: "months",
    leadTimeDays: 180,
    gate: "yes",
  },
  {
    key: "cert:MEDI_CAL_PROVIDER",
    term: "Medi-Cal certified provider",
    meaning: "Behavioral health treatment contracts require providers to be Medi-Cal certified and not on the DHCS suspended and ineligible list.",
    action: "Confirm your Medi-Cal provider status and that all clinical licenses are current with no restrictions.",
    leadTime: "months",
    leadTimeDays: 90,
    gate: "yes",
  },
  {
    key: "experience:MIN_YEARS",
    term: "Minimum years in business",
    meaning:
      "Most County RFPs require that you have been 'regularly and continuously engaged' in the same kind of work for a set number of years, shown in the Minimum Qualifications table of Exhibit A.",
    action: "Count only years doing this specific kind of work. If you fall short, ask about subcontracting to a prime that qualifies.",
    leadTime: "n/a",
    gate: "yes",
  },
  {
    key: "term:RESPONSIVE",
    term: "Responsive and responsible",
    meaning:
      "Responsive means your bid follows every instruction and includes every form. Responsible means you have the licenses, capacity and track record. Bids that are not responsive are set aside without being scored.",
    action: "Treat the submission checklist as pass/fail.",
    leadTime: "n/a",
    gate: "no",
  },
  {
    key: "term:RFP_RFQ_IFB",
    term: "RFP, RFQ, RFPQ, IFB",
    meaning:
      "RFP: a proposal scored on quality and price. RFQ: a quote, mostly about price. RFPQ: pre-qualification to join a pool of vendors who get work later. IFB: a sealed bid awarded to the lowest responsive bidder.",
    action: "Match your effort to the type: price tightly for an RFQ or IFB, write a strong narrative for an RFP.",
    leadTime: "n/a",
    gate: "no",
  },
  {
    key: "term:AS_NEEDED",
    term: "As-needed / services-as-needed pool",
    meaning:
      "Several vendors are approved and work is handed out later in task orders. The total dollar figure is a ceiling shared across vendors, not the size of any one job, and the County does not guarantee any minimum.",
    action: "Bid even if the pool total looks large; individual orders are usually small.",
    leadTime: "n/a",
    gate: "no",
  },
  {
    key: "term:NOTICE_OF_INTENT",
    term: "Notice of Intent to Award and bid protest",
    meaning:
      "After evaluation the County posts who it intends to award to. Losing bidders have a short window to file a written protest. Awards above certain amounts then go to the Board of Supervisors.",
    action: "Watch the portal after the evaluation period; you can request the evaluation summary.",
    leadTime: "n/a",
    gate: "no",
  },
  {
    key: "program:FIRST_SOURCE",
    term: "First Source Program",
    meaning: "On larger County contracts you agree to consider County-referred job seekers when you hire for the contract. It is a hiring process, not a quota.",
    action: "Sign the First Source agreement if it is in the packet.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "form",
  },
  {
    key: "term:PORTAL_SUBMISSION",
    term: "Portal submission by 2:00 p.m.",
    meaning:
      "Current County solicitations are submitted only through the Procurement Portal, usually by 2:00 p.m. on the due date, as a single PDF of 20 MB or less plus the Excel bid form. Late uploads are not accepted, and the County recommends uploading a day early.",
    action: "Upload the day before. File names must be 64 characters or fewer, including the extension.",
    leadTime: "same-day",
    leadTimeDays: 0,
    gate: "yes",
  },
  {
    key: "term:IRREVOCABLE",
    term: "180-day bid validity",
    meaning: "Your pricing must stay open for at least 180 days after the due date.",
    action: "Price with six months of cost changes in mind.",
    leadTime: "n/a",
    gate: "no",
  },
];

export const GLOSSARY: Record<string, GlossaryEntry> = Object.fromEntries(
  entries.map((e) => [e.key, e]),
);

export function glossaryFor(key: string | undefined): GlossaryEntry | undefined {
  if (!key) return undefined;
  if (GLOSSARY[key]) return GLOSSARY[key];
  // license:C-10 -> license:CSLB
  if (key.startsWith("license:")) return GLOSSARY["license:CSLB"];
  return undefined;
}

export const LEAD_TIME_LABEL: Record<LeadTime, string> = {
  "same-day": "Same day",
  days: "A few days",
  weeks: "A few weeks",
  months: "Months",
  "n/a": "",
};
