/**
 * Local lexical similarity between a solicitation and a vendor profile.
 *
 * TF-IDF over a fixed corpus (the built-in solicitations), cosine between
 * sparse L2-normalized vectors. Everything runs in-process and deterministically:
 * no network call, no model, no randomness. The result feeds ONLY the scope
 * component of the Bid Effort Fit score, capped at SIMILARITY_MAX points, and
 * it can never change a rule outcome or un-block a record. It is text overlap,
 * nothing more, and the UI says so.
 */
import { CATEGORY_LABELS, type BusinessProfile, type Solicitation } from "@/lib/data/types";
import { normalizeText } from "@/lib/data/synonyms";

export const SIM_FLOOR = 0.04;
export const SIM_CEIL = 0.3;
export const SIMILARITY_MAX = 10;
/** Below this many tokens the solicitation text is too thin to trust (listing-only records, stubs). */
export const SPARSE_TOKEN_MIN = 30;
const TITLE_WEIGHT = 2;

export interface SparseVector {
  /** Sorted ascending so dot products walk both arrays in one pass. */
  terms: string[];
  weights: number[];
  /** Raw token count before stopword removal, used for the sparse-text check. */
  tokenCount: number;
}

export interface CorpusIndex {
  docCount: number;
  idf: Map<string, number>;
  vectorFor(sol: Solicitation): SparseVector;
}

export interface SimilarityResult {
  cosine: number;
  sharedTerms: string[];
  solicitationTokens: number;
  vendorTokens: number;
}

const STOPWORDS = new Set(
  (
    "a an and are as at be been but by for from has have in into is it its of on or that the this to was were will with " +
    "we you your our their they them he she his her not no nor so than then there these those which who whom whose what when where why how " +
    "all any each few more most other some such only own same too very can could should would may might must shall do does did doing done " +
    "if while about above after again against before below between both during under until up down out over off further here once per via " +
    "also just like well within without among upon across including include includes included " +
    // procurement boilerplate that appears in nearly every record
    "county alameda bidder bidders bid bids proposal proposals contract contracts contractor contractors service services agency agencies " +
    "department provide provided providing provides require required requirement requirements exhibit response responses packet submit submitted " +
    "submission portal award awarded vendor vendors work project projects term terms year years http https www com org gov shall must " +
    "general information please following date dates due time days day number new one two three"
  ).split(/\s+/),
);

function stem(t: string): string {
  if (t.length <= 4) return t;
  if (t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (/(ses|xes|shes|ches)$/.test(t)) return t.slice(0, -2);
  if (t.endsWith("ing") && t.length >= 6) return t.slice(0, -3);
  if (t.endsWith("ed") && t.length >= 5) return t.slice(0, -2);
  if (t.endsWith("s") && !/(ss|us)$/.test(t)) return t.slice(0, -1);
  return t;
}

/** Tokens after normalization, filtering and stemming. Exported for tests. */
export function tokenize(text: string): { tokens: string[]; rawCount: number } {
  const raw = normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => /^[a-z][a-z0-9]{2,}$/.test(t));
  const tokens = raw.filter((t) => !STOPWORDS.has(t)).map(stem).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return { tokens, rawCount: raw.length };
}

function labelFor(c: keyof typeof CATEGORY_LABELS | undefined): string {
  return c ? CATEGORY_LABELS[c] : "";
}

export function solicitationText(sol: Solicitation): string {
  const title = Array(TITLE_WEIGHT).fill(sol.title).join(" ");
  return [title, sol.summary, sol.description, labelFor(sol.category), ...sol.secondaryCategories.map(labelFor), ...sol.scopeTags.map((t) => t.replace(/-/g, " "))].join(" ");
}

export function vendorText(profile: BusinessProfile): string {
  return [profile.description, ...profile.capabilities, ...profile.keywords, labelFor(profile.primaryCategory), ...profile.secondaryCategories.map(labelFor)].join(" ");
}

function termFrequencies(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

function vectorize(tf: Map<string, number>, idf: Map<string, number>, rawCount: number): SparseVector {
  const terms = Array.from(tf.keys())
    .filter((t) => idf.has(t))
    .sort();
  const weights = terms.map((t) => (1 + Math.log(tf.get(t)!)) * idf.get(t)!);
  const norm = Math.sqrt(weights.reduce((s, w) => s + w * w, 0));
  return { terms, weights: norm === 0 ? weights : weights.map((w) => w / norm), tokenCount: rawCount };
}

const indexCache = new WeakMap<readonly Solicitation[], CorpusIndex>();

/** Build (once per corpus array identity) the IDF table and a per-record vector cache. */
export function getCorpusIndex(corpus: readonly Solicitation[]): CorpusIndex {
  const cached = indexCache.get(corpus);
  if (cached) return cached;
  const df = new Map<string, number>();
  const tfs = new Map<Solicitation, { tf: Map<string, number>; rawCount: number }>();
  for (const sol of corpus) {
    const { tokens, rawCount } = tokenize(solicitationText(sol));
    const tf = termFrequencies(tokens);
    tfs.set(sol, { tf, rawCount });
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const n = corpus.length;
  const idf = new Map<string, number>();
  for (const [t, d] of df) idf.set(t, Math.log((n + 1) / (d + 1)) + 1);
  const vectors = new WeakMap<Solicitation, SparseVector>();
  const index: CorpusIndex = {
    docCount: n,
    idf,
    vectorFor(sol) {
      const hit = vectors.get(sol);
      if (hit) return hit;
      const pre = tfs.get(sol);
      const { tf, rawCount } = pre ?? (() => {
        const t = tokenize(solicitationText(sol));
        return { tf: termFrequencies(t.tokens), rawCount: t.rawCount };
      })();
      const v = vectorize(tf, idf, rawCount);
      vectors.set(sol, v);
      return v;
    },
  };
  indexCache.set(corpus, index);
  return index;
}

const vendorCache = new WeakMap<CorpusIndex, WeakMap<BusinessProfile, SparseVector>>();

export function vectorizeVendor(index: CorpusIndex, profile: BusinessProfile): SparseVector {
  let perIndex = vendorCache.get(index);
  if (!perIndex) {
    perIndex = new WeakMap();
    vendorCache.set(index, perIndex);
  }
  const hit = perIndex.get(profile);
  if (hit) return hit;
  const { tokens, rawCount } = tokenize(vendorText(profile));
  const v = vectorize(termFrequencies(tokens), index.idf, rawCount);
  perIndex.set(profile, v);
  return v;
}

/** Vectorize free text (a search box, a pasted paragraph) against the corpus IDF table. */
export function vectorizeText(index: CorpusIndex, text: string): SparseVector {
  const { tokens, rawCount } = tokenize(text);
  return vectorize(termFrequencies(tokens), index.idf, rawCount);
}

/** Cosine of two L2-normalized sparse vectors, plus the top shared terms by contribution. */
export function cosine(a: SparseVector, b: SparseVector): { value: number; shared: string[] } {
  let i = 0;
  let j = 0;
  let dot = 0;
  const contrib: { term: string; w: number }[] = [];
  while (i < a.terms.length && j < b.terms.length) {
    const cmp = a.terms[i] < b.terms[j] ? -1 : a.terms[i] > b.terms[j] ? 1 : 0;
    if (cmp === 0) {
      const w = a.weights[i] * b.weights[j];
      dot += w;
      contrib.push({ term: a.terms[i], w });
      i++;
      j++;
    } else if (cmp < 0) i++;
    else j++;
  }
  contrib.sort((x, y) => y.w - x.w || (x.term < y.term ? -1 : 1));
  const value = Math.min(1, Math.max(0, Math.round(dot * 10_000) / 10_000));
  return { value, shared: contrib.slice(0, 5).map((c) => c.term) };
}

export function scoreSimilarity(index: CorpusIndex, sol: Solicitation, profile: BusinessProfile, vendorVector?: SparseVector): SimilarityResult {
  const sv = index.vectorFor(sol);
  const vv = vendorVector ?? vectorizeVendor(index, profile);
  const { value, shared } = cosine(sv, vv);
  return { cosine: value, sharedTerms: shared, solicitationTokens: sv.tokenCount, vendorTokens: vv.tokenCount };
}

/** Map a cosine onto 0..SIMILARITY_MAX points with a linear ramp between the floor and the ceiling. */
export function similarityPoints(cos: number): number {
  const t = Math.min(1, Math.max(0, (cos - SIM_FLOOR) / (SIM_CEIL - SIM_FLOOR)));
  return Math.round(SIMILARITY_MAX * t);
}
