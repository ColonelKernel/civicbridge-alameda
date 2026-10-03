/**
 * Claude extraction (server only). Returns the same ExtractionDraft the
 * heuristic parser produces; `materialize()` then verifies every quote, so
 * nothing Claude says reaches the record unless the text backs it up.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ExtractionDraftSchema, type ExtractionDraft } from "./validate";

export const EXTRACTION_MODEL = process.env.EXTRACTION_MODEL ?? "claude-opus-5-5";

const SYSTEM = `You extract structured facts from a public-agency solicitation (RFP, RFQ, RFPQ, IFB, RFI) so a small-business owner can decide whether to bid.

Rules:
- Report only what the text states. Never infer a requirement, date, dollar figure or document that is not written.
- Every fact carries "quote": a verbatim excerpt of 12+ characters copied exactly from the text (no ellipses, no paraphrase). Facts whose quote cannot be found in the text are discarded automatically, so copy carefully.
- A meeting is "mandatory" only if its quote contains the word mandatory.
- Dates as YYYY-MM-DD, times as 24-hour HH:mm, money as plain numbers (e.g. 1500000).
- "certifications" are third-party credentials (SLEB, DIR registration, ServSafe, court interpreter, BSIS, QEI, NICET). Forms the bidder signs (debarment, Iran Contracting Act, exceptions) belong in "documents".
- "required" on a certification is false when it is a preference, bonus points, or a subcontracting goal.
- Classify every small-business program by "mechanism": "set-aside" when only certified firms may bid (DGS SB/DVBE Option, UC Small Business First, a total small business set-aside under FAR 19.5, a Port VSBE-only project); "preference" for a scoring or price bonus (County SLEB up to 10%, DGS 5% SB preference, EBMUD 7% discount, Oakland bid discount); "participation-goal" when a share of the work must go to certified firms (County 20% SLEB subcontracting, 3% DVBE goal, Oakland 50% L/SLBE, DBE goals, Section 3); "directed-spend" when the agency steers purchases of a stated size to certified firms; "registration" for SAM.gov or a vendor database; "reporting" when the program only tracks spending. Put the percentage in "percent" (preference, discount or set-aside share) or "goalPercent" (participation share), and set "exceptionAllowed" when the posting allows a written exception, waiver or good-faith effort instead. Use null for a trade credential.
- "summary": one or two plain sentences on what the agency actually needs, in everyday words.
- Use null for anything not stated. Do not pad arrays with guesses.`;

export async function extractWithClaude(text: string): Promise<ExtractionDraft> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: EXTRACTION_MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Solicitation text:\n\n<solicitation>\n${text}\n</solicitation>` }],
    output_config: { format: zodOutputFormat(ExtractionDraftSchema) },
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to process this text.");
  if (response.stop_reason === "max_tokens") throw new Error("Claude's answer was cut off; the text may be too long.");
  if (!response.parsed_output) throw new Error("Claude returned no structured output.");
  return response.parsed_output;
}
