/**
 * Keyword table used for inferred trade matching and category inference.
 *
 * strong = 3 points, weak = 1 point, negative = -3 points. Matching is
 * whole-phrase, case-insensitive, after normalizing hyphens and whitespace.
 * Title hits count double. Each phrase is counted once per text.
 */
import type { Category } from "./types";

export interface SynonymSet {
  strong: string[];
  weak: string[];
  negative: string[];
}

export const SYNONYMS: Record<Category, SynonymSet> = {
  electrical: {
    strong: [
      "electrician",
      "electrical contractor",
      "c-10",
      "c-7",
      "electrical work",
      "electrical installation",
      "electrical repair",
      "wiring",
      "rewiring",
      "lighting retrofit",
      "panel upgrade",
      "ev charger",
      "ev charging",
      "low voltage",
      "generator",
      "switchgear",
      "conduit",
      "fire alarm system",
    ],
    weak: ["electrical", "lighting", "led", "solar", "cabling", "power"],
    negative: ["electric vehicle purchase", "electrical engineer of record"],
  },
  "general-construction": {
    strong: [
      "general contractor",
      "class b general building",
      "general building contractor",
      "b license",
      "tenant improvement",
      "renovation",
      "remodel",
      "public works",
      "construction services",
      "job order contract",
      "ada improvements",
      "demolition",
      "seismic retrofit",
      "building construction",
    ],
    weak: ["construction", "facility improvements", "carpentry", "remodeling"],
    negative: ["construction management software", "pre-construction only", "commercial driver"],
  },
  plumbing: {
    strong: [
      "plumber",
      "plumbing",
      "c-36",
      "backflow",
      "water heater",
      "sewer",
      "pipe repair",
      "drain cleaning",
      "hydro jetting",
    ],
    weak: ["fixtures", "piping", "leak"],
    negative: [],
  },
  hvac: {
    strong: [
      "hvac",
      "c-20",
      "heating ventilation",
      "air conditioning",
      "mechanical contractor",
      "boiler",
      "chiller",
      "rooftop unit",
      "refrigeration",
      "building automation",
    ],
    weak: ["ventilation", "filters", "mechanical", "thermostat"],
    negative: ["mechanical engineer"],
  },
  painting: {
    strong: [
      "painting contractor",
      "c-33",
      "interior painting",
      "exterior painting",
      "repainting",
      "paint",
    ],
    weak: ["coatings", "drywall patch", "primer"],
    negative: ["paint booth", "body shop"],
  },
  roofing: {
    strong: ["roofing", "c-39", "roof replacement", "roof repair", "re-roof", "membrane roof"],
    weak: ["gutters", "waterproofing", "flashing"],
    negative: [],
  },
  landscaping: {
    strong: [
      "landscape",
      "landscaping",
      "c-27",
      "grounds maintenance",
      "tree trimming",
      "arborist",
      "irrigation",
      "mowing",
      "weed abatement",
      "vegetation management",
      "tree removal",
      "mow",
      "trim trees",
      "drip irrigation",
    ],
    weak: ["grounds", "turf", "planting", "mulch", "pruning", "trees"],
    negative: ["landscape architect", "landscape architectural"],
  },
  janitorial: {
    strong: [
      "janitorial",
      "custodial",
      "cleaning services",
      "floor care",
      "carpet cleaning",
      "window washing",
      "disinfection",
      "porter services",
      "day porter",
    ],
    weak: ["cleaning", "restroom supplies", "sanitation", "trash removal"],
    negative: ["street sweeping", "data cleaning", "dry cleaning"],
  },
  "food-services": {
    strong: [
      "catering",
      "caterer",
      "food service",
      "meals",
      "meal delivery",
      "boxed lunches",
      "food vendor",
      "servsafe",
      "congregate meals",
      "nutrition services",
      "meal preparation",
    ],
    weak: ["food", "beverages", "refreshments", "kitchen", "snacks"],
    negative: ["food bank software", "food safety inspection", "food waste hauling"],
  },
  "it-services": {
    strong: [
      "it services",
      "it support",
      "information technology",
      "software development",
      "network",
      "cybersecurity",
      "help desk",
      "managed services",
      "cloud migration",
      "web development",
      "systems integration",
      "data analytics",
      "gis",
      "application development",
      "structured cabling",
      "web design",
      "website design",
      "design websites",
    ],
    weak: ["software", "technology", "database", "hardware", "website", "cabling"],
    negative: [],
  },
  telecom: {
    strong: [
      "telephone system",
      "telephone services",
      "voip",
      "pbx",
      "telecommunications",
      "phone system",
      "call recording",
      "inmate telephone",
      "youth telephone",
    ],
    weak: ["telephone", "phones", "voice"],
    negative: [],
  },
  translation: {
    strong: [
      "translation",
      "interpretation",
      "interpreter",
      "translator",
      "language services",
      "asl",
      "sign language",
      "court interpreter",
      "document translation",
      "language access",
      "limited english proficiency",
    ],
    weak: [
      "spanish",
      "cantonese",
      "mandarin",
      "vietnamese",
      "tagalog",
      "multilingual",
      "bilingual",
      "languages",
    ],
    negative: ["translate data", "translates to"],
  },
  "design-print": {
    strong: [
      "graphic design",
      "printing services",
      "print production",
      "branding",
      "brochure",
      "collateral",
      "illustration",
      "typesetting",
      "offset printing",
      "digital printing",
      "mailers",
      "layout design",
      "outreach materials",
    ],
    weak: ["design", "print", "marketing materials", "flyers", "logo", "posters"],
    negative: [
      "design-build",
      "design build",
      "engineering design",
      "landscape design",
      "printer toner",
      "fingerprint",
      "blueprint",
    ],
  },
  security: {
    strong: [
      "security guard",
      "security services",
      "unarmed guard",
      "armed guard",
      "patrol services",
      "ppo license",
      "bsis",
      "access control",
      "cctv",
      "alarm monitoring",
      "security officer",
    ],
    weak: ["security", "surveillance", "guards"],
    negative: [
      "cybersecurity",
      "information security",
      "security deposit",
      "social security",
      "network security",
      "security clearance",
    ],
  },
  hauling: {
    strong: [
      "hauling",
      "debris removal",
      "waste hauling",
      "dump truck",
      "trucking",
      "disposal services",
      "recycling collection",
      "e-waste",
      "junk removal",
      "roll-off",
    ],
    weak: ["trucks", "removal", "disposal", "haul"],
    negative: [],
  },
  "consulting-training": {
    strong: [
      "consulting services",
      "consultant",
      "training services",
      "facilitation",
      "strategic planning",
      "curriculum",
      "workshops",
      "technical assistance",
      "evaluation services",
      "grant writing",
      "program evaluation",
      "coaching",
      "needs assessment",
    ],
    weak: ["training", "consulting", "assessment", "study", "planning", "facilitator"],
    negative: [],
  },
  engineering: {
    strong: [
      "engineering services",
      "condition assessment",
      "professional engineer",
      "structural engineer",
      "mechanical engineer",
      "elevator consultant",
      "elevator inspector",
      "qei",
      "modernization plan",
      "construction documents",
      "specifications",
    ],
    weak: ["engineering", "assessment", "inspection", "design review"],
    negative: [],
  },
  "vehicle-maintenance": {
    strong: [
      "fleet maintenance",
      "vehicle repair",
      "auto repair",
      "smog",
      "tire",
      "brake",
      "oil change",
      "body shop",
      "collision repair",
      "towing",
      "fleet services",
      "ase certified",
    ],
    weak: ["vehicles", "fleet", "automotive", "trucks"],
    negative: ["vehicle purchase", "vehicle lease", "vehicle acquisition"],
  },
  moving: {
    strong: [
      "moving services",
      "relocation services",
      "movers",
      "office relocation",
      "furniture installation",
      "moving and storage",
    ],
    weak: ["relocation", "furniture", "storage", "packing"],
    negative: ["moving forward", "moving violation"],
  },
  "pest-control": {
    strong: [
      "pest control",
      "pest management",
      "integrated pest management",
      "exterminator",
      "rodent",
      "termite",
      "bed bug",
      "structural pest",
      "fumigation",
      "vector control",
    ],
    weak: ["pests", "insects", "wildlife", "traps"],
    negative: [],
  },
  staffing: {
    strong: [
      "temporary staffing",
      "staffing services",
      "temp agency",
      "temporary personnel",
      "payroll services",
      "employer of record",
      "temporary employees",
      "staff augmentation",
    ],
    weak: ["staffing", "personnel", "temporary"],
    negative: ["staff report", "staff will", "county staff"],
  },
  signage: {
    strong: [
      "signage",
      "sign fabrication",
      "sign installation",
      "wayfinding",
      "banners",
      "vehicle wraps",
      "ada signs",
      "c-45",
      "electric signs",
      "monument sign",
    ],
    weak: ["signs", "decals", "placards"],
    negative: ["sign-in", "signature", "signed", "signing"],
  },
  "facility-maintenance": {
    strong: [
      "facility maintenance",
      "facilities maintenance",
      "building maintenance",
      "handyman",
      "general maintenance",
      "on-call maintenance",
      "multi-trade",
      "repair and maintenance services",
    ],
    weak: ["maintenance", "repairs", "on call"],
    negative: [],
  },
  "health-services": {
    strong: [
      "behavioral health",
      "mental health",
      "treatment services",
      "clinical services",
      "counseling",
      "substance use",
      "medi-cal",
      "licensed clinician",
      "lmft",
      "lcsw",
      "psychologist",
      "therapy",
      "outpatient",
      "residential treatment",
      "nursing",
    ],
    weak: ["health", "clinical", "patients", "clients", "wellness"],
    negative: ["health permit", "health inspection"],
  },
  "social-services": {
    strong: [
      "case management",
      "housing support",
      "supportive services",
      "community based organization",
      "violence intervention",
      "outreach services",
      "peer support",
      "wraparound",
      "reentry services",
      "homeless services",
      "youth services",
    ],
    weak: ["community", "nonprofit", "participants", "services to residents"],
    negative: [],
  },
  "medical-supplies": {
    strong: [
      "vaccines",
      "pharmaceutical",
      "medical supplies",
      "wholesale distribution",
      "pharmacy distribution",
      "ppe",
      "medical equipment",
    ],
    weak: ["supplies", "distribution", "doses"],
    negative: [],
  },
  transportation: {
    strong: [
      "shuttle bus",
      "shuttle services",
      "bus services",
      "transportation services",
      "passenger transportation",
      "charter bus",
      "paratransit",
      "cdl",
      "dot number",
    ],
    weak: ["shuttle", "transportation", "drivers", "vehicles"],
    negative: ["vehicle purchase", "transportation planning"],
  },
  "uniform-laundry": {
    strong: [
      "uniform rental",
      "uniform services",
      "laundry services",
      "linen services",
      "linen rental",
      "garment rental",
    ],
    weak: ["uniforms", "laundry", "linens", "mats"],
    negative: [],
  },
};

/** License codes map straight to a trade; used for category inference. */
export const LICENSE_TO_CATEGORY: Record<string, Category> = {
  "C-10": "electrical",
  "C-7": "electrical",
  "C-36": "plumbing",
  "C-20": "hvac",
  "C-27": "landscaping",
  "C-33": "painting",
  "C-39": "roofing",
  "C-45": "signage",
  "C-61/D-34": "pest-control",
  B: "general-construction",
  A: "general-construction",
};

export const CERT_TO_CATEGORY: Record<string, Category> = {
  SERVSAFE: "food-services",
  HEALTH_FACILITY_PERMIT: "food-services",
  COURT_INTERPRETER: "translation",
  ATA: "translation",
  BSIS_PPO: "security",
  SPCB: "pest-control",
  ASE: "vehicle-maintenance",
  QEI: "engineering",
  MEDI_CAL_PROVIDER: "health-services",
};

/** Normalize text for phrase matching: lowercase, ascii quotes, hyphen/space tolerant. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/-\n/g, "")
    .replace(/[‐-―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize a license code: "c 10", "C10", "c-10" -> "C-10". */
export function normalizeLicenseCode(code: string): string {
  const c = code.trim().toUpperCase().replace(/\s+/g, "");
  const m = c.match(/^([A-C])-?(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2]}`;
  if (/^CLASS[A-C]$/.test(c)) return c.slice(-1);
  return c.replace(/^CLASS/, "");
}

const phraseCache = new Map<string, RegExp>();

/** Whole-phrase, hyphen-tolerant regex for a synonym. */
export function phraseRegex(phrase: string): RegExp {
  let re = phraseCache.get(phrase);
  if (!re) {
    const escaped = phrase
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/[-\s]+/g, "[-\\s]*");
    re = new RegExp(`(?<![a-z0-9])${escaped}(?:s|es|ing|ed)?(?![a-z0-9])`, "i");
    phraseCache.set(phrase, re);
  }
  return re;
}

export interface SynonymHit {
  phrase: string;
  weight: number;
  inTitle: boolean;
}

export interface SynonymScore {
  score: number;
  hits: SynonymHit[];
}

/**
 * Score a category's synonym set against a body of text. Title hits are doubled.
 * Each phrase counts once.
 */
export function scoreCategory(
  category: Category,
  body: string,
  title = "",
): SynonymScore {
  const set = SYNONYMS[category];
  const normBody = normalizeText(body);
  const normTitle = normalizeText(title);
  const hits: SynonymHit[] = [];
  let score = 0;
  const consider = (phrases: string[], weight: number) => {
    for (const phrase of phrases) {
      const re = phraseRegex(phrase);
      const inTitle = normTitle.length > 0 && re.test(normTitle);
      const inBody = re.test(normBody);
      if (inTitle || inBody) {
        const w = weight * (inTitle && weight >= 3 ? 2 : 1);
        score += w;
        hits.push({ phrase, weight: w, inTitle });
      }
    }
  };
  consider(set.strong, 3);
  consider(set.weak, 1);
  consider(set.negative, -3);
  return { score, hits };
}

/** Find the first sentence-ish snippet of `text` that contains `phrase`, for evidence quotes. */
export function findQuote(text: string, phrase: string, radius = 70): string | undefined {
  const re = phraseRegex(phrase);
  const m = re.exec(text);
  if (!m) return undefined;
  const start = Math.max(0, m.index - radius);
  const end = Math.min(text.length, m.index + m[0].length + radius);
  let snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet = snippet + "…";
  return snippet;
}
