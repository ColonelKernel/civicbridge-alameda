/**
 * Claude profile extraction (server only). Same draft shape as the heuristic
 * parser; `verifyDraft` then drops any fact whose quote is not in the text.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ProfileDraftSchema, type ProfileDraft } from "./extract";
import { CERTIFICATIONS } from "@/lib/data/certifications";
import { CATEGORIES, INSURANCE_TYPES } from "@/lib/data/types";

export const PROFILE_MODEL = process.env.EXTRACTION_MODEL ?? "claude-opus-5-5";

const SYSTEM = `You read a small business's website text or capability statement and fill in a vendor profile for public-contract matching.

Rules:
- Report only what the text states. Every non-empty field gets an "evidence" entry {field, quote} where quote is a verbatim excerpt (12+ characters, copied exactly). Facts without a verbatim quote are discarded automatically.
- "description": one or two sentences in the owner's own words about what the business does (quote the sentence you used).
- "city": the city of the main office. "county": "Alameda" only if the city is in Alameda County, California; "Other" if the text names a city elsewhere; null if unknown.
- "employeeCount" and "yearsInBusiness" as plain integers (years from "since 2012" is fine, today is 2026).
- "capabilities": 3 to 12 short service phrases. "keywords": NAICS codes as "NAICS 238210" and other short search terms.
- "licenses": CSLB classes only, normalized like "C-10", "B".
- "certifications": codes from this list only: ${CERTIFICATIONS.map((c) => `${c.code} (${c.label})`).join("; ")}.
- "insurance": types from this list only: ${INSURANCE_TYPES.join(", ")}.
- "primaryCategory": one of ${CATEGORIES.join(", ")} or null.
- Use null or [] for anything not stated. Never guess.`;

export async function extractProfileWithClaude(text: string): Promise<ProfileDraft> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: PROFILE_MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Business text:\n\n<business>\n${text}\n</business>` }],
    output_config: { format: zodOutputFormat(ProfileDraftSchema) },
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to process this text.");
  if (!response.parsed_output) throw new Error("Claude returned no structured output.");
  return response.parsed_output;
}
