/**
 * Regional SLEB Passport derivation. Pure and deterministic: it maps a vendor
 * profile onto the shared status taxonomy and each program's rules, and says
 * where the vendor stands. "Recognized" means the vendor listed a certification
 * the program issues or accepts; nothing is verified here. "Likely to apply"
 * is a suggestion from self-reported size and location, never a finding.
 */
import type { BusinessProfile } from "@/lib/data/types";
import { CERT_BY_CODE, certLabel } from "@/lib/data/certifications";
import { PROGRAMS, PROGRAM_BY_ID, RECOMMENDED_STACK, STATUS_TAGS, type Program, type StatusTag } from "@/lib/data/programs";

export type Standing = "recognized" | "likely-to-apply" | "unknown" | "not-applicable";

export interface PassportTag {
  tag: StatusTag;
  label: string;
  basis: "self-reported" | "certification";
  city?: string;
  detail: string;
}

export interface ProgramStanding {
  program: Program;
  standing: Standing;
  why: string;
  viaCodes: string[];
}

export interface StackItem {
  program: Program;
  held: boolean;
  applicable: boolean;
  standing: Standing;
}

export interface Passport {
  tags: PassportTag[];
  held: { code: string; label: string; program?: Program }[];
  programs: ProgramStanding[];
  stack: StackItem[];
  nextStep?: StackItem;
  counts: Record<Standing, number>;
}

export const ALAMEDA_CITIES = ["Alameda", "Albany", "Berkeley", "Dublin", "Emeryville", "Fremont", "Hayward", "Livermore", "Newark", "Oakland", "Piedmont", "Pleasanton", "San Leandro", "Union City"];

const STANDING_ORDER: Record<Standing, number> = { recognized: 0, "likely-to-apply": 1, unknown: 2, "not-applicable": 3 };

export const STANDING_LABELS: Record<Standing, string> = {
  recognized: "Recognized",
  "likely-to-apply": "Likely to apply",
  unknown: "Not derivable from your profile",
  "not-applicable": "Not applicable",
};

export function normalizeCity(city: string): string | undefined {
  const c = city.trim().toLowerCase();
  return ALAMEDA_CITIES.find((x) => x.toLowerCase() === c);
}

export function derivePassport(profile: BusinessProfile): Passport {
  const heldCodes = profile.certifications === "unknown" ? [] : profile.certifications.map((c) => c.toUpperCase());
  const held = heldCodes.map((code) => {
    const def = CERT_BY_CODE[code];
    return { code, label: certLabel(code), program: def?.programId ? PROGRAM_BY_ID[def.programId] : undefined };
  });

  const tags: PassportTag[] = [];
  const add = (tag: StatusTag, basis: PassportTag["basis"], detail: string, city?: string) => {
    if (tags.some((t) => t.tag === tag)) return;
    tags.push({ tag, label: STATUS_TAGS[tag].label, basis, detail, city });
  };

  if (profile.county === "Alameda") add("county-local", "self-reported", "From your county. The County also requires a fixed office, a business license and six months of operation there; we only know your county.");
  const city = normalizeCity(profile.city);
  if (city) add("jurisdiction-local", "self-reported", `From your city, ${city}. Each city defines "local" its own way (business license, office address, sometimes years in the city).`, city);

  const emp = profile.employeeCount;
  const yrs = profile.yearsInBusiness;
  if (emp !== undefined && emp <= 100) add("small", "self-reported", `From your headcount of ${emp}. The SBA standard for your industry may be measured by receipts instead; that is not checked here.`);
  if (emp !== undefined && emp <= 50 && yrs !== undefined && yrs < 5) add("emerging", "self-reported", `From your headcount of ${emp} and ${yrs} year${yrs === 1 ? "" : "s"} in business, matching the County SLEB definition of emerging.`);
  if (emp !== undefined && emp <= 25) add("micro", "self-reported", `From your headcount of ${emp}. DGS microbusiness also caps annual receipts; that is not checked here.`);

  for (const h of held) {
    for (const t of CERT_BY_CODE[h.code]?.statusTags ?? []) {
      if (t === "state-certified" || t === "federal-certified") add(t, "certification", `From the ${h.label} certification you listed. We did not verify it.`);
    }
  }
  const tagSet = new Set(tags.map((t) => t.tag));

  const programs: ProgramStanding[] = PROGRAMS.map((program) => {
    const accepted = [...program.certificationCodes, ...(program.acceptsCertificationCodes ?? [])];
    const via = heldCodes.filter((c) => accepted.includes(c));
    const j = program.jurisdiction;
    const outside =
      (j.kind === "county" && !(profile.county === "Alameda" && (j.counties ?? []).includes("Alameda"))) ||
      (j.kind === "multi-county" && !(profile.county === "Alameda" && (j.counties ?? []).includes("Alameda"))) ||
      (j.kind === "city" && !(city && (j.cities ?? []).includes(city)));
    if (via.length && !outside) {
      return { program, standing: "recognized", why: `You listed ${via.map(certLabel).join(", ")}, which this program issues or accepts. Not verified here.`, viaCodes: via };
    }
    if (outside) {
      const where = j.kind === "city" ? `${(j.cities ?? []).join(", ")}-based firms` : `firms in ${(j.counties ?? []).join(", ")} count${(j.counties ?? []).length === 1 ? "y" : "ies"}`;
      return { program, standing: "not-applicable", why: `Limited to ${where}; your profile says ${profile.city}${profile.county === "Alameda" ? ", Alameda County" : ", outside Alameda County"}.`, viaCodes: [] };
    }
    if (!program.derivable) {
      return { program, standing: "unknown", why: "Based on ownership, income or federal status, which a size-and-location profile cannot suggest. Only the program can tell you.", viaCodes: [] };
    }
    const need = program.requires?.tags ?? [];
    const missingFields = need.filter((t) => (t === "small" || t === "emerging" || t === "micro") && emp === undefined);
    if (missingFields.length) {
      return { program, standing: "unknown", why: "Add your headcount (and years in business) to your profile and we can suggest whether this applies.", viaCodes: [] };
    }
    const unmet = need.filter((t) => !tagSet.has(t));
    if (unmet.length === 0) {
      return { program, standing: "likely-to-apply", why: `Your self-reported ${need.map((t) => STATUS_TAGS[t].label.toLowerCase()).join(" and ")} status matches what this program recognizes. The program decides after its own review.`, viaCodes: [] };
    }
    return { program, standing: "unknown", why: `Needs ${unmet.map((t) => STATUS_TAGS[t].label.toLowerCase()).join(" and ")} status, which your profile does not suggest.`, viaCodes: [] };
  });
  programs.sort((a, b) => STANDING_ORDER[a.standing] - STANDING_ORDER[b.standing]);

  const byId = Object.fromEntries(programs.map((p) => [p.program.id, p]));
  const stack: StackItem[] = RECOMMENDED_STACK.map((id) => {
    const s = byId[id];
    return { program: s.program, held: s.standing === "recognized", applicable: s.standing !== "not-applicable", standing: s.standing };
  });
  const nextStep = stack.find((s) => !s.held && s.applicable);

  const counts: Record<Standing, number> = { recognized: 0, "likely-to-apply": 0, unknown: 0, "not-applicable": 0 };
  for (const p of programs) counts[p.standing] += 1;

  return { tags, held, programs, stack, nextStep, counts };
}
