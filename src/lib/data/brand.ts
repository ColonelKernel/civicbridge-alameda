/**
 * Product identity, in one place. Agencies are named the way they name
 * themselves (see Agency.displayName); their seals and logos are never
 * reproduced, and the footer states that ProcureFit is not affiliated with
 * any of them.
 */
export const BRAND = {
  product: "ProcureFit",
  tagline: "Alameda County and East Bay contracts, explained in your language",
  short: "Find the public contracts that fit your business, see exactly why, and know what to do before each deadline.",
  audience: "small businesses selling to Alameda County, its 14 cities, and East Bay agencies",
  region: "Alameda County & East Bay buyers",
  challenge: "OTW 10X Hackathon, Alameda County procurement challenge",
  nonAffiliation:
    "ProcureFit is an independent hackathon prototype. It is not affiliated with, or endorsed by, Alameda County or any agency listed here. Agency names are used to identify where opportunities are posted.",
  builtOn: "2026-10-03",
} as const;
