import { heuristicExtract, materialize, type ExtractionDraft } from "@/lib/engine/extract/validate";
import { extractWithClaude } from "@/lib/engine/extract/claude";
import { today } from "@/lib/engine/dates";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_CHARS = 80;
const MAX_CHARS = 300_000;

/** Tells the paste page which extractor is active. */
export async function GET() {
  return Response.json({ mode: process.env.ANTHROPIC_API_KEY ? "claude" : "heuristic" });
}

export async function POST(request: Request) {
  let body: { text?: unknown; sourceUrl?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const text = typeof body?.text === "string" ? body.text.replace(/\r\n/g, "\n").trim() : "";
  const sourceUrl = typeof body?.sourceUrl === "string" && /^https?:\/\//i.test(body.sourceUrl.trim()) ? body.sourceUrl.trim() : undefined;

  if (text.length < MIN_CHARS) {
    return Response.json({ error: "Paste more of the solicitation. A few paragraphs with the due date and the requirements work best." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return Response.json({ error: "That is more text than we can handle at once. Paste the key sections: calendar, requirements, and what to submit." }, { status: 413 });
  }

  let draft: ExtractionDraft;
  let extractedBy: "claude" | "heuristic";
  let warning: string | undefined;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      draft = await extractWithClaude(text);
      extractedBy = "claude";
    } catch (err) {
      console.error("[extract] Claude failed, using the heuristic parser:", err instanceof Error ? err.message : err);
      draft = heuristicExtract(text);
      extractedBy = "heuristic";
      warning = "Claude could not process this text, so a simpler pattern-based extraction was used.";
    }
  } else {
    draft = heuristicExtract(text);
    extractedBy = "heuristic";
  }

  try {
    const { solicitation, dropped, notes } = materialize(draft, text, { extractedBy, today: today(), sourceUrl });
    return Response.json({ solicitation, dropped, notes, extractedBy, warning });
  } catch (err) {
    console.error("[extract] materialize failed:", err);
    return Response.json({ error: "We could not turn that text into a record. Try pasting the calendar and requirements sections." }, { status: 422 });
  }
}
