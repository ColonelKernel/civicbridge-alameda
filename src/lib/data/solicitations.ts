import { REAL_SOLICITATIONS } from "./solicitations.real";
import { SAMPLE_SOLICITATIONS } from "./solicitations.sample";
import { LISTING_SOLICITATIONS } from "./solicitations.listing";
import { parseSolicitations } from "./sources";
import type { Solicitation, SolicitationInput } from "./types";

export const ALL_SOLICITATION_INPUTS: SolicitationInput[] = [
  ...REAL_SOLICITATIONS,
  ...SAMPLE_SOLICITATIONS,
  ...LISTING_SOLICITATIONS,
];

/** The validated, in-memory dataset the app ships with. */
export const SOLICITATIONS: Solicitation[] = parseSolicitations(ALL_SOLICITATION_INPUTS);

export const SOLICITATION_BY_ID: Record<string, Solicitation> = Object.fromEntries(
  SOLICITATIONS.map((s) => [s.id, s]),
);

export function getSolicitation(id: string): Solicitation | undefined {
  return SOLICITATION_BY_ID[id];
}
