/**
 * Data layer: the shapes every other layer works with.
 *
 * Solicitations are validated with zod so a real County feed (scraper, CSV,
 * portal export, pasted text) can be normalized into the same schema and the
 * matching / explanation / checklist engines keep working unchanged.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Controlled vocabulary
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  "electrical",
  "general-construction",
  "plumbing",
  "hvac",
  "painting",
  "roofing",
  "landscaping",
  "janitorial",
  "food-services",
  "it-services",
  "telecom",
  "translation",
  "design-print",
  "security",
  "hauling",
  "consulting-training",
  "engineering",
  "vehicle-maintenance",
  "moving",
  "pest-control",
  "staffing",
  "signage",
  "facility-maintenance",
  "health-services",
  "social-services",
  "medical-supplies",
  "transportation",
  "uniform-laundry",
] as const;

export type Category = (typeof CATEGORIES)[number];
export const CategorySchema = z.enum(CATEGORIES);

export const CATEGORY_LABELS: Record<Category, string> = {
  electrical: "Electrical",
  "general-construction": "General construction",
  plumbing: "Plumbing",
  hvac: "HVAC / mechanical",
  painting: "Painting",
  roofing: "Roofing",
  landscaping: "Landscaping & grounds",
  janitorial: "Janitorial & custodial",
  "food-services": "Food & catering",
  "it-services": "IT & software",
  telecom: "Telecom & phone systems",
  translation: "Translation & interpretation",
  "design-print": "Graphic design & printing",
  security: "Security services",
  hauling: "Hauling & disposal",
  "consulting-training": "Consulting & training",
  engineering: "Engineering & technical consulting",
  "vehicle-maintenance": "Vehicle & fleet maintenance",
  moving: "Moving & relocation",
  "pest-control": "Pest control",
  staffing: "Staffing",
  signage: "Signage",
  "facility-maintenance": "Facility maintenance (multi-trade)",
  "health-services": "Health & behavioral health services",
  "social-services": "Social & community services",
  "medical-supplies": "Medical supplies & pharmaceuticals",
  transportation: "Transportation & shuttle services",
  "uniform-laundry": "Uniform rental & laundry",
};

/** Umbrella categories expand to the trades they cover when matching. */
export const UMBRELLA: Partial<Record<Category, Category[]>> = {
  "facility-maintenance": [
    "electrical",
    "plumbing",
    "hvac",
    "painting",
    "general-construction",
    "janitorial",
  ],
};

export const CONSTRUCTION_TRADES: Category[] = [
  "electrical",
  "general-construction",
  "plumbing",
  "hvac",
  "painting",
  "roofing",
  "landscaping",
  "signage",
  "facility-maintenance",
];

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Calendar date + optional wall-clock time in America/Los_Angeles. */
export const CivicDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "HH:mm").optional(),
  note: z.string().optional(),
});
export type CivicDate = z.infer<typeof CivicDateSchema>;

export const MoneyRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  basis: z.enum(["total", "annual", "per-order", "nte-pool"]),
  termYears: z.number().optional(),
  quote: z.string().optional(),
});
export type MoneyRange = z.infer<typeof MoneyRangeSchema>;

export const INSURANCE_TYPES = [
  "general-liability",
  "auto",
  "workers-comp",
  "professional",
  "cyber",
  "pollution",
  "umbrella",
  "abuse-molestation",
] as const;
export type InsuranceType = (typeof INSURANCE_TYPES)[number];

export const INSURANCE_LABELS: Record<InsuranceType, string> = {
  "general-liability": "Commercial general liability",
  auto: "Business auto liability",
  "workers-comp": "Workers' compensation & employer's liability",
  professional: "Professional liability (E&O)",
  cyber: "Cyber liability",
  pollution: "Pollution liability",
  umbrella: "Umbrella / excess liability",
  "abuse-molestation": "Sexual abuse & molestation liability",
};

// ---------------------------------------------------------------------------
// Solicitation
// ---------------------------------------------------------------------------

export const LicenseReqSchema = z.object({
  code: z.string(),
  label: z.string(),
  quote: z.string().optional(),
});

export const CertReqSchema = z.object({
  code: z.string(),
  label: z.string(),
  required: z.boolean(),
  quote: z.string().optional(),
});

export const InsuranceReqSchema = z.object({
  type: z.enum(INSURANCE_TYPES),
  limit: z.union([z.number(), z.literal("statutory")]),
  aggregate: z.number().optional(),
  quote: z.string().optional(),
});

export const LocationReqSchema = z.object({
  type: z.enum(["none", "local-preference", "county-required", "radius"]),
  radiusMiles: z.number().optional(),
  note: z.string().optional(),
  quote: z.string().optional(),
});

export const MeetingSchema = z.object({
  when: CivicDateSchema,
  mandatory: z.boolean(),
  location: z.string(),
  virtual: z.boolean().optional(),
  /** e.g. a security clearance form that must be filed before you may attend */
  prerequisite: z
    .object({ label: z.string(), due: CivicDateSchema, quote: z.string().optional() })
    .optional(),
  quote: z.string().optional(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

export const DOCUMENT_KINDS = [
  "form",
  "attestation",
  "narrative",
  "pricing",
  "proof",
  "references",
] as const;

export const DocumentSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(DOCUMENT_KINDS),
  note: z.string().optional(),
  quote: z.string().optional(),
});
export type SolicitationDocument = z.infer<typeof DocumentSchema>;

export const BondSchema = z.object({
  type: z.enum(["bid", "performance", "payment"]),
  percent: z.number().optional(),
  quote: z.string().optional(),
});

export const SCOPE_TAGS = [
  "multi-trade",
  "as-needed",
  "public-works",
  "professional-services",
  "event",
  "institutional",
  "goods",
  "pool",
] as const;

export const RequirementsSchema = z.object({
  licenses: z.array(LicenseReqSchema).default([]),
  /** Third-party credentials only (SLEB, DIR, ServSafe, court interpreter, QEI...). Forms you sign live in documents[]. */
  certifications: z.array(CertReqSchema).default([]),
  insurance: z.array(InsuranceReqSchema).default([]),
  location: LocationReqSchema.default({ type: "none" }),
  experience: z
    .object({ years: z.number(), description: z.string(), quote: z.string().optional() })
    .optional(),
  bonding: z.array(BondSchema).default([]),
  prevailingWage: z.boolean().default(false),
  livingWage: z.boolean().default(false),
  dirRegistration: z.boolean().default(false),
  statedStaffingMin: z.object({ count: z.number(), quote: z.string() }).optional(),
  other: z.array(z.object({ label: z.string(), quote: z.string().optional() })).default([]),
});

export const ContactSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  email: z.string(),
  phone: z.string().optional(),
});

export const ProvenanceSchema = z.object({
  source: z.enum(["curated", "portal", "pasted"]),
  extractedBy: z.enum(["human", "claude", "heuristic"]),
  extractedAt: z.string().optional(),
  note: z.string().optional(),
});

export const SolicitationSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  department: z.string(),
  type: z.enum(["RFP", "RFQ", "RFPQ", "IRFP", "IFB", "RFI"]),
  /** Which public agency posted it; see data/agencies.ts. */
  agencyId: z.string().default("alameda-county-gsa"),
  category: CategorySchema,
  secondaryCategories: z.array(CategorySchema).default([]),
  /** One or two plain sentences: what they actually need. */
  summary: z.string(),
  description: z.string(),
  estimatedValue: MoneyRangeSchema.nullable(),
  term: z.string().optional(),
  dates: z.object({
    posted: z.string(),
    preBidMeeting: MeetingSchema.optional(),
    siteVisit: MeetingSchema.optional(),
    questionsDue: CivicDateSchema.optional(),
    submissionDue: CivicDateSchema,
    anticipatedAward: z.string().optional(),
    contractStart: z.string().optional(),
  }),
  submissionMethod: z.string(),
  requirements: RequirementsSchema,
  documents: z.array(DocumentSchema).default([]),
  /** Solicitation files pulled into the portal by scripts/fetch-attachments.mjs. */
  attachments: z
    .array(z.object({ label: z.string(), url: z.string(), localPath: z.string().optional(), bytes: z.number().optional(), contentType: z.string().optional() }))
    .default([]),
  /** The project page on the agency's bidding portal (OpenGov, Bonfire), when known. */
  portalUrl: z.string().optional(),
  scopeTags: z.array(z.enum(SCOPE_TAGS)).default([]),
  contact: ContactSchema,
  sourceUrl: z.string(),
  /** Verbatim-style text kept for verification. Every quote in this record should appear here. */
  sourceExcerpt: z.string(),
  status: z.enum(["open", "closed", "awarded"]),
  /** True when only the portal listing was captured (title, due date, link) and requirements have not been read yet. */
  listingOnly: z.boolean().default(false),
  provenance: ProvenanceSchema,
  droppedExtractions: z
    .array(z.object({ field: z.string(), reason: z.string() }))
    .optional(),
});

export type Solicitation = z.infer<typeof SolicitationSchema>;
export type SolicitationInput = z.input<typeof SolicitationSchema>;

// ---------------------------------------------------------------------------
// Business profile
// ---------------------------------------------------------------------------

/** `[]` means "I have none"; `'unknown'` means "I was not asked / did not say". */
export type Declared<T> = T[] | "unknown";

const declared = <T extends z.ZodTypeAny>(inner: T) =>
  z.union([z.array(inner), z.literal("unknown")]);

export const PROFILE_CATEGORY_SOURCES = [
  "user",
  "inferred-license",
  "inferred-cert",
  "inferred-text",
  "none",
] as const;

export const BusinessProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  city: z.string(),
  county: z.enum(["Alameda", "Other"]),
  employeeCount: z.number().optional(),
  yearsInBusiness: z.number().optional(),
  capabilities: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  primaryCategory: CategorySchema.optional(),
  secondaryCategories: z.array(CategorySchema).default([]),
  primaryCategorySource: z.enum(PROFILE_CATEGORY_SOURCES).default("none"),
  certifications: declared(z.string()).default([]),
  licenses: declared(z.object({ code: z.string(), expires: z.string().optional() })).default(
    "unknown",
  ),
  insurance: declared(
    z.object({ type: z.enum(INSURANCE_TYPES), limit: z.number().optional() }),
  ).default("unknown"),
  typicalContractSize: z
    .union([z.object({ min: z.number(), max: z.number() }), z.literal("unknown")])
    .default("unknown"),
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
export type BusinessProfileInput = z.input<typeof BusinessProfileSchema>;

// ---------------------------------------------------------------------------
// Engine output types
// ---------------------------------------------------------------------------

export type EvidenceStatus = "met" | "check" | "missing" | "unknown" | "na";
export type Confidence = "confirmed" | "inferred";
export type RuleClass = "gate" | "soft";

export type RuleId =
  | "availability"
  | "tradeFit"
  | "scopeCoverage"
  | "capabilityMatch"
  | "contractSize"
  | "location"
  | "license"
  | "certRequired"
  | "certPreferred"
  | "insurance"
  | "experience"
  | "bonding"
  | "prevailingWage"
  | "livingWage"
  | "dirRegistration"
  | "mandatoryMeeting"
  | "statedStaffing"
  | "listingOnly"
  // Derived ids used only inside FitScoreResult (never emitted by runRules).
  | "lexicalSimilarity"
  | "adminBurden"
  | "deadline";

export interface SourceRef {
  /** JSON path into the solicitation, or "standard" for general County steps. */
  field: string;
  quote?: string;
  url?: string;
}

export interface Evidence {
  ruleId: RuleId;
  ruleClass: RuleClass;
  status: EvidenceStatus;
  confidence: Confidence;
  /** Short, plain-language headline. */
  label: string;
  /** One or two sentences of detail. */
  detail: string;
  /** Canonical key used to group gaps across solicitations, e.g. "cert:SLEB". */
  requirementKey?: string;
  glossaryKey?: string;
  action?: string;
  sourceRef: SourceRef;
  profileRef?: string[];
  score?: number;
}

export type Fit = "strong" | "possible" | "poor";

export interface Classification {
  fit: Fit;
  availability: "open" | "closed";
  blockers: Evidence[];
  verify: Evidence[];
  reasons: string[];
  daysUntilDue: number;
}

export type AdminBurden = "low" | "medium" | "high";

// ---------------------------------------------------------------------------
// Bid Effort Fit (see src/lib/engine/fit-score.ts)
// ---------------------------------------------------------------------------

export type FitRecommendation = "strong" | "investigate" | "verify" | "blocked";
export type FitConfidence = "high" | "medium" | "low";

export interface FitScoreComponents {
  /** Trade, capabilities, keywords, lexical similarity. Max 35. */
  scope: number;
  /** Licenses, certifications, insurance, staffing, experience. Max 35. */
  readiness: number;
  /** Contract range and paperwork effort. Max 15. */
  commercial: number;
  /** Location rules, stated preference programs, time left. Max 15. */
  localAndTiming: number;
}

/** Audit snapshot of what went into a score. Client-side only; carries no vendor free text. */
export interface FitScoreInputs {
  today: string;
  listingOnly: boolean;
  daysUntilDue: number;
  adminBurden: AdminBurden;
  fit: Fit;
  evidence: { id: string; ruleId: RuleId; status: EvidenceStatus; confidence: Confidence; points?: number }[];
  similarity: { cosine: number; points: number; solicitationTokens: number; vendorTokens: number; sharedTerms: string[] };
  profile: {
    primaryCategorySource: BusinessProfile["primaryCategorySource"];
    licenses: "declared" | "unknown";
    certifications: "declared" | "unknown";
    insurance: "declared" | "unknown";
    typicalContractSize: "declared" | "unknown";
    yearsInBusiness: boolean;
    employeeCount: boolean;
  };
}

export interface FitScoreResult {
  status: "scored" | "blocked";
  /** 0-100, present only when status is "scored". */
  score?: number;
  recommendation: FitRecommendation;
  confidence: FitConfidence;
  components: FitScoreComponents;
  positives: Evidence[];
  risks: Evidence[];
  unknowns: Evidence[];
  blockers: Evidence[];
  inputs: FitScoreInputs;
  scoringVersion: string;
}

export interface MatchResult {
  solicitation: Solicitation;
  evidence: Evidence[];
  classification: Classification;
  adminBurden: AdminBurden;
  adminBurdenReasons: string[];
  fitScore: FitScoreResult;
}

export interface SolicitationSource {
  id: string;
  label: string;
  load(): Promise<Solicitation[]>;
}
