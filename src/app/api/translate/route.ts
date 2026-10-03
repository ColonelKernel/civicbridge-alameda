import { isLocale } from "@/lib/i18n/strings";
import { translateWithClaude } from "@/lib/engine/translate/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ITEMS = 150;
const MAX_CHARS = 800;

/** Small in-memory cache so repeated page views do not re-translate the same lines. */
const cache = new Map<string, string>();
const CACHE_MAX = 5000;

export async function GET() {
  return Response.json({ available: !!process.env.ANTHROPIC_API_KEY });
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ available: false, translations: null });
  let body: { locale?: unknown; texts?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const locale = typeof body?.locale === "string" ? body.locale : "";
  if (!isLocale(locale) || locale === "en") return Response.json({ error: "Unsupported language." }, { status: 400 });
  const texts = Array.isArray(body?.texts) ? body.texts.filter((t): t is string => typeof t === "string").map((t) => t.slice(0, MAX_CHARS)) : [];
  if (texts.length === 0 || texts.length > MAX_ITEMS) return Response.json({ error: "Send between 1 and 150 strings." }, { status: 400 });

  const result: (string | null)[] = texts.map((t) => cache.get(`${locale}\u0000${t}`) ?? null);
  const missingIdx = result.map((r, i) => (r === null ? i : -1)).filter((i) => i >= 0);
  if (missingIdx.length) {
    try {
      const translated = await translateWithClaude(locale, missingIdx.map((i) => texts[i]));
      missingIdx.forEach((i, k) => {
        result[i] = translated[k];
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
        cache.set(`${locale}\u0000${texts[i]}`, translated[k]);
      });
    } catch (err) {
      console.error("[translate] failed:", err instanceof Error ? err.message : err);
      return Response.json({ error: "Translation failed. The English text is shown instead." }, { status: 502 });
    }
  }
  return Response.json({ available: true, translations: result });
}
