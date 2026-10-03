/**
 * One catalog of the certifications and registrations a vendor can list on
 * their profile. Profile storage stays a plain string[] of codes; this file
 * only supplies labels, grouping and the link to the program that issues each
 * one (src/lib/data/programs.ts). Listing a code is self-reported; nothing here
 * verifies it.
 */
import type { StatusTag } from "./programs";

export type CertGroup = "county-regional" | "state-federal" | "trade";

export interface CertificationDef {
  /** Stored on the profile, uppercase. */
  code: string;
  label: string;
  short: string;
  group: CertGroup;
  /** programs.ts id of the issuing program, when one exists. */
  programId?: string;
  /** Shared status-taxonomy tags this certification evidences. */
  statusTags?: StatusTag[];
}

export const CERTIFICATIONS: CertificationDef[] = [
  // Alameda County and regional buyers
  { code: "SLEB", label: "Alameda County SLEB certified", short: "SLEB", group: "county-regional", programId: "alameda-county-sleb", statusTags: ["county-local", "small"] },
  { code: "ACTC_LBCE", label: "Alameda CTC LBE / SLBE / VSLBE", short: "Alameda CTC LBCE", group: "county-regional", programId: "alameda-ctc-lbce", statusTags: ["county-local", "small"] },
  { code: "OAKLAND_LSLBE", label: "City of Oakland L/SLBE certified", short: "Oakland L/SLBE", group: "county-regional", programId: "oakland-lslbe", statusTags: ["jurisdiction-local", "small"] },
  { code: "PORT_SBE", label: "Port of Oakland SBE / VSBE", short: "Port SBE", group: "county-regional", programId: "port-oakland-sbe", statusTags: ["small"] },
  { code: "ACTRANSIT_SLBE", label: "AC Transit SBE / SLBE", short: "AC Transit SLBE", group: "county-regional", programId: "ac-transit-sbe-slbe", statusTags: ["small"] },
  { code: "BART_LSB", label: "BART Small Business / Local Small Business", short: "BART LSB", group: "county-regional", programId: "bart-sbe-lsb", statusTags: ["small"] },
  // State and federal
  { code: "DGS_SB", label: "California DGS Small Business (SB)", short: "DGS SB", group: "state-federal", programId: "dgs-sb-mb", statusTags: ["state-certified", "small"] },
  { code: "DGS_MB", label: "California DGS Microbusiness (MB)", short: "DGS MB", group: "state-federal", programId: "dgs-sb-mb", statusTags: ["state-certified", "small", "micro"] },
  { code: "DVBE", label: "California DVBE (disabled veteran business)", short: "DVBE", group: "state-federal", programId: "dgs-sb-mb", statusTags: ["state-certified"] },
  { code: "DBE", label: "Federal DBE (disadvantaged business enterprise)", short: "DBE", group: "state-federal", programId: "federal-dbe", statusTags: ["federal-certified"] },
  { code: "SECTION_3", label: "HUD Section 3 business", short: "Section 3", group: "state-federal", programId: "haca-section-3", statusTags: ["federal-certified"] },
  { code: "SAM_REGISTERED", label: "SAM.gov registration (federal)", short: "SAM.gov", group: "state-federal", programId: "sam-gov" },
  { code: "DIR", label: "DIR public works registration", short: "DIR", group: "state-federal" },
  // Trade credentials
  { code: "SERVSAFE", label: "ServSafe / food protection manager", short: "ServSafe", group: "trade" },
  { code: "COURT_INTERPRETER", label: "Court interpreter certification", short: "Court interpreter", group: "trade" },
  { code: "ATA", label: "ATA certified translator", short: "ATA", group: "trade" },
  { code: "MEDI_CAL_PROVIDER", label: "Medi-Cal certified provider", short: "Medi-Cal provider", group: "trade" },
  { code: "EVITP", label: "EVITP (EV charger installers)", short: "EVITP", group: "trade" },
  { code: "ASE", label: "ASE certified technicians", short: "ASE", group: "trade" },
  { code: "BSIS_PPO", label: "BSIS private patrol operator", short: "BSIS PPO", group: "trade" },
  { code: "ISA_ARBORIST", label: "ISA certified arborist", short: "ISA arborist", group: "trade" },
  { code: "RID", label: "RID / BEI (ASL)", short: "RID", group: "trade" },
  { code: "QEI", label: "Qualified Elevator Inspector", short: "QEI", group: "trade" },
  { code: "BICSI", label: "BICSI (structured cabling)", short: "BICSI", group: "trade" },
];

export const CERT_BY_CODE: Record<string, CertificationDef> = Object.fromEntries(CERTIFICATIONS.map((c) => [c.code, c]));

export const CERT_GROUP_LABELS: Record<CertGroup, string> = {
  "county-regional": "Alameda County and regional buyers",
  "state-federal": "State and federal",
  trade: "Trade credentials",
};

export function certLabel(code: string): string {
  return CERT_BY_CODE[code.toUpperCase()]?.short ?? code.replace(/_/g, " ");
}

export function certLongLabel(code: string): string {
  return CERT_BY_CODE[code.toUpperCase()]?.label ?? code.replace(/_/g, " ");
}
