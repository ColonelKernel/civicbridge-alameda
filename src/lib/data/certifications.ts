/**
 * One catalog of the certifications, registrations and self-certifications a
 * vendor can list on their profile. Profile storage stays a plain string[] of
 * codes; this file supplies labels, grouping, what each status measures, who
 * issues it, and the program (src/lib/data/programs.ts) behind it. Listing a
 * code is self-reported; nothing here verifies it.
 *
 * `basis` is what the status measures. Size, location and age statuses feed
 * the shared status taxonomy. Ownership-based federal statuses (8(a), WOSB,
 * SDVOSB, DVBE, DBE) apply only where a solicitation states them; they never
 * change a score on their own (California Constitution, art. I, § 31).
 */
import type { StatusTag } from "./programs";

export type CertGroup = "county-regional" | "state" | "federal" | "trade";
export type CertBasis = "size" | "size-location" | "size-age" | "ownership" | "location" | "income" | "registration" | "credential";
export type CertKind = "certification" | "registration" | "self-certification";

export interface CertificationDef {
  /** Stored on the profile, uppercase. */
  code: string;
  label: string;
  short: string;
  group: CertGroup;
  /** What the status measures. */
  basis: CertBasis;
  /** Who grants or records it. */
  issuer: string;
  /** A reviewed certification, a registration, or a self-representation. */
  kind: CertKind;
  /** programs.ts id of the issuing program, when one exists. */
  programId?: string;
  /** Shared status-taxonomy tags this certification evidences. */
  statusTags?: StatusTag[];
}

export const CERTIFICATIONS: CertificationDef[] = [
  // Alameda County and regional buyers
  { code: "SLEB", label: "Alameda County SLEB certified", short: "SLEB", group: "county-regional", basis: "size-location", issuer: "Alameda County Auditor-Controller, SLEB Certification Unit", kind: "certification", programId: "alameda-county-sleb", statusTags: ["county-local", "small"] },
  { code: "ACTC_LBCE", label: "Alameda CTC LBE / SLBE / VSLBE", short: "Alameda CTC LBCE", group: "county-regional", basis: "size-location", issuer: "Alameda County Transportation Commission", kind: "certification", programId: "alameda-ctc-lbce", statusTags: ["county-local", "small"] },
  { code: "OAKLAND_LSLBE", label: "City of Oakland L/SLBE certified", short: "Oakland L/SLBE", group: "county-regional", basis: "size-location", issuer: "City of Oakland, Contracts and Compliance", kind: "certification", programId: "oakland-lslbe", statusTags: ["jurisdiction-local", "small"] },
  { code: "PORT_SBE", label: "Port of Oakland SBE / VSBE", short: "Port SBE", group: "county-regional", basis: "size", issuer: "Port of Oakland, Social Responsibility Division", kind: "certification", programId: "port-oakland-sbe", statusTags: ["small"] },
  { code: "ACTRANSIT_SLBE", label: "AC Transit SBE / SLBE", short: "AC Transit SLBE", group: "county-regional", basis: "size-location", issuer: "AC Transit", kind: "certification", programId: "ac-transit-sbe-slbe", statusTags: ["small"] },
  { code: "BART_LSB", label: "BART Small Business / Local Small Business", short: "BART LSB", group: "county-regional", basis: "size-location", issuer: "BART Office of Civil Rights", kind: "certification", programId: "bart-sbe-lsb", statusTags: ["small"] },
  // California
  { code: "DGS_SB", label: "California DGS Small Business (SB)", short: "DGS SB", group: "state", basis: "size", issuer: "California DGS, Office of Small Business and DVBE Services", kind: "certification", programId: "dgs-sb-mb", statusTags: ["state-certified", "small"] },
  { code: "DGS_MB", label: "California DGS Microbusiness (MB)", short: "DGS MB", group: "state", basis: "size", issuer: "California DGS, Office of Small Business and DVBE Services", kind: "certification", programId: "dgs-sb-mb", statusTags: ["state-certified", "small", "micro"] },
  { code: "DGS_SB_PW", label: "California DGS Small Business for Public Works (SB-PW)", short: "DGS SB-PW", group: "state", basis: "size", issuer: "California DGS, Office of Small Business and DVBE Services", kind: "certification", programId: "dgs-sb-mb", statusTags: ["state-certified", "small"] },
  { code: "DVBE", label: "California DVBE (disabled veteran business enterprise)", short: "DVBE", group: "state", basis: "ownership", issuer: "California DGS, Office of Small Business and DVBE Services", kind: "certification", programId: "dgs-sb-mb", statusTags: ["state-certified"] },
  { code: "DIR", label: "DIR public works contractor registration", short: "DIR", group: "state", basis: "registration", issuer: "California Department of Industrial Relations", kind: "registration" },
  // Federal
  { code: "SAM_REGISTERED", label: "SAM.gov registration (UEI, active)", short: "SAM.gov", group: "federal", basis: "registration", issuer: "SAM.gov (U.S. General Services Administration)", kind: "registration", programId: "sam-gov" },
  { code: "SBA_SMALL", label: "Small business under the SBA size standard (self-represented in SAM.gov)", short: "SBA small", group: "federal", basis: "size", issuer: "Self-represented in SAM.gov by NAICS size standard", kind: "self-certification", programId: "sba-set-aside", statusTags: ["small"] },
  { code: "SBA_8A", label: "SBA 8(a) Business Development participant", short: "8(a)", group: "federal", basis: "ownership", issuer: "U.S. Small Business Administration", kind: "certification", programId: "sba-socioeconomic", statusTags: ["federal-certified"] },
  { code: "HUBZONE", label: "SBA HUBZone certified", short: "HUBZone", group: "federal", basis: "location", issuer: "U.S. Small Business Administration", kind: "certification", programId: "sba-socioeconomic", statusTags: ["federal-certified"] },
  { code: "SDVOSB", label: "Service-disabled veteran-owned small business (SBA VetCert)", short: "SDVOSB", group: "federal", basis: "ownership", issuer: "U.S. Small Business Administration, VetCert", kind: "certification", programId: "sba-socioeconomic", statusTags: ["federal-certified"] },
  { code: "VOSB", label: "Veteran-owned small business (SBA VetCert)", short: "VOSB", group: "federal", basis: "ownership", issuer: "U.S. Small Business Administration, VetCert", kind: "certification", programId: "sba-socioeconomic", statusTags: ["federal-certified"] },
  { code: "WOSB", label: "Women-owned small business (WOSB / EDWOSB)", short: "WOSB", group: "federal", basis: "ownership", issuer: "U.S. Small Business Administration", kind: "certification", programId: "sba-socioeconomic", statusTags: ["federal-certified"] },
  { code: "DBE", label: "Federal DBE (disadvantaged business enterprise, CUCP)", short: "DBE", group: "federal", basis: "ownership", issuer: "California Unified Certification Program (CUCP)", kind: "certification", programId: "federal-dbe", statusTags: ["federal-certified"] },
  { code: "SECTION_3", label: "HUD Section 3 business concern", short: "Section 3", group: "federal", basis: "income", issuer: "Self-certified to HUD rules, per project", kind: "self-certification", programId: "haca-section-3", statusTags: ["federal-certified"] },
  // Trade credentials
  { code: "SERVSAFE", label: "ServSafe / food protection manager", short: "ServSafe", group: "trade", basis: "credential", issuer: "National Restaurant Association (or equivalent ANSI-accredited program)", kind: "certification" },
  { code: "COURT_INTERPRETER", label: "Court interpreter certification", short: "Court interpreter", group: "trade", basis: "credential", issuer: "Judicial Council of California", kind: "certification" },
  { code: "ATA", label: "ATA certified translator", short: "ATA", group: "trade", basis: "credential", issuer: "American Translators Association", kind: "certification" },
  { code: "MEDI_CAL_PROVIDER", label: "Medi-Cal certified provider", short: "Medi-Cal provider", group: "trade", basis: "credential", issuer: "California Department of Health Care Services", kind: "certification" },
  { code: "EVITP", label: "EVITP (EV charger installers)", short: "EVITP", group: "trade", basis: "credential", issuer: "Electric Vehicle Infrastructure Training Program", kind: "certification" },
  { code: "ASE", label: "ASE certified technicians", short: "ASE", group: "trade", basis: "credential", issuer: "National Institute for Automotive Service Excellence", kind: "certification" },
  { code: "BSIS_PPO", label: "BSIS private patrol operator", short: "BSIS PPO", group: "trade", basis: "credential", issuer: "California Bureau of Security and Investigative Services", kind: "certification" },
  { code: "ISA_ARBORIST", label: "ISA certified arborist", short: "ISA arborist", group: "trade", basis: "credential", issuer: "International Society of Arboriculture", kind: "certification" },
  { code: "RID", label: "RID / BEI (ASL)", short: "RID", group: "trade", basis: "credential", issuer: "Registry of Interpreters for the Deaf / BEI", kind: "certification" },
  { code: "QEI", label: "Qualified Elevator Inspector", short: "QEI", group: "trade", basis: "credential", issuer: "ASME QEI-accredited organization", kind: "certification" },
  { code: "BICSI", label: "BICSI (structured cabling)", short: "BICSI", group: "trade", basis: "credential", issuer: "BICSI", kind: "certification" },
];

export const CERT_BY_CODE: Record<string, CertificationDef> = Object.fromEntries(CERTIFICATIONS.map((c) => [c.code, c]));

export const CERT_GROUP_LABELS: Record<CertGroup, string> = {
  "county-regional": "Alameda County and regional buyers",
  state: "California (DGS, DIR)",
  federal: "Federal (SAM.gov, SBA, DOT, HUD)",
  trade: "Trade credentials",
};

export const CERT_BASIS_LABELS: Record<CertBasis, string> = {
  size: "size",
  "size-location": "size and location",
  "size-age": "size and age",
  ownership: "ownership",
  location: "location",
  income: "income",
  registration: "registration",
  credential: "credential",
};

/** Codes that are program statuses (size, location, age, ownership, income, registration), not trade credentials. */
export const PROGRAM_CERT_CODES: string[] = CERTIFICATIONS.filter((c) => c.group !== "trade").map((c) => c.code);

export function certLabel(code: string): string {
  return CERT_BY_CODE[code.toUpperCase()]?.short ?? code.replace(/_/g, " ");
}

export function certLongLabel(code: string): string {
  return CERT_BY_CODE[code.toUpperCase()]?.label ?? code.replace(/_/g, " ");
}
