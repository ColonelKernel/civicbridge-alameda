import { heuristicProfileExtract, htmlToText, verifyDraft, type ProfileDraft } from "@/lib/engine/profile/extract";
import { extractProfileWithClaude } from "@/lib/engine/profile/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_CHARS = 40;
const MAX_CHARS = 200_000;
const FETCH_LIMIT = 2_000_000;

function isPublicHttpUrl(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h === "[::1]" || /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return null;
  return u;
}

async function fetchPage(u: URL): Promise<{ text: string; kind: "html" | "text" | "pdf" | "other" }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(u, { signal: ctrl.signal, redirect: "follow", headers: { "user-agent": "ProcureFit/1.0 (+profile autofill; reads the public page you gave it)", accept: "text/html,text/plain;q=0.9,*/*;q=0.5" } });
    if (!res.ok) throw new Error(`The site answered ${res.status}.`);
    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    const buf = await res.arrayBuffer();
    if (buf.byteLength > FETCH_LIMIT) throw new Error("That page is too large to read.");
    if (type.includes("pdf")) return { text: "", kind: "pdf" };
    const body = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    if (type.includes("html") || /<html/i.test(body.slice(0, 2000))) return { text: htmlToText(body), kind: "html" };
    if (type.includes("text")) return { text: body, kind: "text" };
    return { text: "", kind: "other" };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  return Response.json({ mode: process.env.ANTHROPIC_API_KEY ? "claude" : "heuristic" });
}

export async function POST(request: Request) {
  let body: { text?: unknown; url?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  let text = typeof body?.text === "string" ? body.text.replace(/\r\n/g, "\n").trim() : "";
  const urlRaw = typeof body?.url === "string" ? body.url.trim() : "";
  let fetchedFrom: string | undefined;

  if (urlRaw) {
    const u = isPublicHttpUrl(urlRaw.startsWith("http") ? urlRaw : `https://${urlRaw}`);
    if (!u) return Response.json({ error: "Enter a public http(s) web address." }, { status: 400 });
    try {
      const page = await fetchPage(u);
      if (page.kind === "pdf") return Response.json({ error: "That link is a PDF. Open it, copy the text, and paste it instead." }, { status: 415 });
      if (!page.text.trim()) return Response.json({ error: "We could not read text from that page. Paste the text instead." }, { status: 415 });
      text = [text, page.text].filter(Boolean).join("\n\n");
      fetchedFrom = u.toString();
    } catch (err) {
      return Response.json({ error: `We could not fetch that page (${err instanceof Error ? err.message : "network error"}). Paste the text instead.` }, { status: 502 });
    }
  }

  if (text.length < MIN_CHARS) return Response.json({ error: "Paste a few sentences about your business, or give us your website address." }, { status: 400 });
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  let draft: ProfileDraft;
  let extractedBy: "claude" | "heuristic";
  let warning: string | undefined;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      draft = await extractProfileWithClaude(text);
      extractedBy = "claude";
    } catch (err) {
      console.error("[profile-extract] Claude failed, using heuristics:", err instanceof Error ? err.message : err);
      draft = heuristicProfileExtract(text, { url: fetchedFrom });
      extractedBy = "heuristic";
      warning = "Claude could not process this text, so a simpler pattern-based extraction was used.";
    }
  } else {
    draft = heuristicProfileExtract(text, { url: fetchedFrom });
    extractedBy = "heuristic";
  }
  const { draft: verified, dropped } = verifyDraft(draft, text);
  return Response.json({ draft: verified, dropped, extractedBy, warning, fetchedFrom, chars: text.length });
}
