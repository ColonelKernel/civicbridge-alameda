/**
 * How a stated small-business program changes a bid. One vocabulary used by
 * the rules engine, the posting cards, the detail header and the Passport,
 * so a reader always sees the same word for the same mechanism.
 */
import type { CertRequirement, ProgramMechanism, Solicitation } from "./types";
import { certLabel } from "./certifications";

export const MECHANISM_META: Record<ProgramMechanism, { label: string; short: string; definition: string; effect: string; cls: string }> = {
  "set-aside": {
    label: "Set-aside",
    short: "Set-aside",
    definition: "Competition limited to firms holding the status: sheltered bidding, the state's SB/DVBE Option, UC's Small Business First, the federal Rule of Two.",
    effect: "Without the status you cannot bid as the prime on the reserved work.",
    cls: "bg-red-soft text-red",
  },
  "directed-spend": {
    label: "Directed spending",
    short: "Directed",
    definition: "The buyer steers small purchases under a threshold to certified firms without a formal set-aside (County purchases of $25,000 and under).",
    effect: "Certified firms are asked to quote first; others are not barred.",
    cls: "bg-amber-soft text-amber",
  },
  preference: {
    label: "Bid preference",
    short: "Preference",
    definition: "A percentage or points added in evaluation, or a discount applied to price.",
    effect: "Without the status you can still bid; you lose the preference.",
    cls: "bg-green-soft text-green",
  },
  "participation-goal": {
    label: "Participation goal",
    short: "Goal",
    definition: "The prime must meet a subcontracting share with certified firms or document good-faith efforts (or, in the County, take a written exception).",
    effect: "Without the status you plan certified subcontractors; with it, your own work usually counts.",
    cls: "bg-blue-soft text-blue",
  },
  registration: {
    label: "Registration",
    short: "Registration",
    definition: "A registration required before award (SAM.gov, DIR), not a size or ownership test.",
    effect: "Register before the deadline; it is not a certification.",
    cls: "bg-slate-soft text-slate",
  },
  reporting: {
    label: "Reporting only",
    short: "Reporting",
    definition: "A program that tracks spending; it changes no bid.",
    effect: "No effect on who may bid or how bids are scored.",
    cls: "bg-slate-soft text-slate",
  },
};

export const MECHANISM_ORDER: ProgramMechanism[] = ["set-aside", "directed-spend", "participation-goal", "preference", "registration", "reporting"];

export type EffectiveMechanism = ProgramMechanism | "credential";

/** A trade credential (ServSafe, QEI) is "credential"; program statuses carry a mechanism, defaulting to preference when not required. */
export function requirementMechanism(req: CertRequirement): EffectiveMechanism {
  return req.mechanism ?? (req.required ? "credential" : "preference");
}

/** The share a participation goal states: `goalPercent`, or `percent` when that is the only number given. */
export function goalShare(req: CertRequirement): number | undefined {
  return requirementMechanism(req) === "participation-goal" ? (req.goalPercent ?? req.percent) : req.goalPercent;
}

export interface MechanismBadge {
  kind: ProgramMechanism;
  code: string;
  text: string;
  /** The requirement the badge was built from. */
  req: CertRequirement;
}

/** Short badges for a solicitation's stated program mechanisms, in display order. */
export function mechanismBadges(sol: Pick<Solicitation, "requirements">): MechanismBadge[] {
  const out: MechanismBadge[] = [];
  for (const req of sol.requirements.certifications) {
    const m = requirementMechanism(req);
    const code = req.code.toUpperCase();
    const name = certLabel(code);
    const pct = req.percent ? `${req.percent}% ` : "";
    switch (m) {
      case "credential":
        break;
      case "set-aside":
        out.push({ kind: m, code, req, text: `${req.scope === "partial" ? "Partial set-aside" : "Set-aside"}: ${name}${req.alternatives?.length ? " +" : ""}` });
        break;
      case "directed-spend":
        out.push({ kind: m, code, req, text: `Directed to ${name}` });
        break;
      case "preference":
        out.push({ kind: m, code, req, text: `${pct}${name} preference` });
        break;
      case "participation-goal": {
        const share = goalShare(req);
        out.push({ kind: m, code, req, text: `${share ? `${share}% ` : ""}${name} goal` });
        if (req.goalPercent && req.percent) out.push({ kind: "preference", code, req, text: `${req.percent}% discount for meeting the goal` });
        break;
      }
      case "registration":
        out.push({ kind: m, code, req, text: `${name} required` });
        break;
      case "reporting":
        out.push({ kind: m, code, req, text: `${name} reporting` });
        break;
    }
    if (req.goalPercent && m !== "participation-goal") out.push({ kind: "participation-goal", code, req, text: `${req.goalPercent}% ${name} subcontracting` });
  }
  return out.sort((a, b) => MECHANISM_ORDER.indexOf(a.kind) - MECHANISM_ORDER.indexOf(b.kind));
}

/** The participation shares a posting states, with the dollar range they imply. */
export function participationShares(sol: Pick<Solicitation, "requirements" | "estimatedValue">): { code: string; percent: number; exceptionAllowed: boolean; min?: number; max?: number; req: CertRequirement }[] {
  const v = sol.estimatedValue;
  const out: { code: string; percent: number; exceptionAllowed: boolean; min?: number; max?: number; req: CertRequirement }[] = [];
  for (const req of sol.requirements.certifications) {
    const percent = goalShare(req);
    if (!percent) continue;
    out.push({
      code: req.code.toUpperCase(),
      percent,
      exceptionAllowed: !!req.exceptionAllowed,
      min: v ? Math.round((v.min * percent) / 100) : undefined,
      max: v ? Math.round((v.max * percent) / 100) : undefined,
      req,
    });
  }
  return out;
}
