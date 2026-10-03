/**
 * Claude translation of engine-generated text (server only). The input strings
 * are summaries and evidence lines the deterministic engine wrote from the
 * solicitation; Claude only renders them in another language. The UI always
 * says "machine translation, the English posting governs".
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const TRANSLATION_MODEL = process.env.TRANSLATION_MODEL ?? "claude-opus-5-5";

const TARGET_NAMES: Record<string, string> = {
  es: "Spanish (Latin American, as used in California)",
  "zh-Hant": "Traditional Chinese",
  "zh-Hans": "Simplified Chinese",
  vi: "Vietnamese",
  tl: "Tagalog (Filipino)",
  ko: "Korean",
  fa: "Persian (Farsi, readable by Dari speakers)",
  pa: "Punjabi (Gurmukhi script)",
  ar: "Arabic (Modern Standard)",
  hi: "Hindi",
  km: "Khmer",
  ti: "Tigrinya",
  am: "Amharic",
  ja: "Japanese",
  ru: "Russian",
  pt: "Portuguese (Brazilian)",
  th: "Thai",
  lo: "Lao",
  my: "Burmese",
  mn: "Mongolian (Cyrillic)",
};

const Output = z.object({ translations: z.array(z.string()) });

export async function translateWithClaude(locale: string, texts: string[]): Promise<string[]> {
  const target = TARGET_NAMES[locale];
  if (!target) throw new Error(`Unsupported locale ${locale}`);
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: TRANSLATION_MODEL,
    max_tokens: 16000,
    system: `You translate short procurement-guidance strings from English into ${target} for small-business owners.
Rules:
- Return exactly one translation per input string, in the same order, same count.
- Keep numbers, dates, dollar amounts, times, license codes (C-10, Class B), program names (SLEB, DIR, DBE), agency names and URLs unchanged.
- Plain, everyday register. Do not add, remove or soften facts. Do not add commentary.
- If a string is already in the target language or is a code, return it unchanged.`,
    messages: [{ role: "user", content: JSON.stringify({ strings: texts }) }],
    output_config: { format: zodOutputFormat(Output) },
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to translate this text.");
  if (!response.parsed_output) throw new Error("Claude returned no structured output.");
  const out = response.parsed_output.translations;
  if (out.length !== texts.length) throw new Error(`Expected ${texts.length} translations, got ${out.length}.`);
  return out;
}
