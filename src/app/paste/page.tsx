"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS, SolicitationSchema, type Solicitation } from "@/lib/data/types";
import { useProfile } from "@/state/profile";
import { SAMPLE_PASTE_TEXT } from "@/lib/engine/extract/sample";
import { Button, Callout, DeadlineChip, FitBadge, SectionHeading } from "@/components/ui";

interface Dropped {
  field: string;
  reason: string;
}
interface ExtractOk {
  solicitation: Solicitation;
  dropped: Dropped[];
  notes: string[];
  extractedBy: "claude" | "heuristic";
  warning?: string;
}

export default function PastePage() {
  const { pasted, addPasted, removePasted, todayISO, resultById } = useProfile();
  const router = useRouter();
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractOk | null>(null);
  const [mode, setMode] = useState<"claude" | "heuristic" | null>(null);

  useEffect(() => {
    fetch("/api/extract")
      .then((r) => r.json())
      .then((j) => setMode(j.mode === "claude" ? "claude" : "heuristic"))
      .catch(() => setMode("heuristic"));
  }, []);

  async function onExtract() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, sourceUrl: sourceUrl.trim() || undefined }),
      });
      const json = (await res.json()) as Partial<ExtractOk> & { error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Something went wrong.");
        return;
      }
      const parsed = SolicitationSchema.safeParse(json.solicitation);
      if (!parsed.success) {
        setError("The extraction came back in an unexpected shape.");
        return;
      }
      setResult({ solicitation: parsed.data, dropped: json.dropped ?? [], notes: json.notes ?? [], extractedBy: json.extractedBy ?? "heuristic", warning: json.warning });
    } catch {
      setError("Could not reach the extraction service.");
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => setText(t));
  }

  function onAdd() {
    if (!result) return;
    addPasted(result.solicitation);
    router.push(`/opportunities/${encodeURIComponent(result.solicitation.id)}`);
  }

  const s = result?.solicitation;
  const r = s ? resultById[s.id] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header>
        <p className="text-sm font-medium text-green mb-2">Paste a solicitation</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight">Found one we don&apos;t track? Paste it in.</h1>
        <p className="text-muted mt-3 max-w-2xl">
          Paste the text of any solicitation (a PDF&apos;s text, an email, a portal page). We turn it into the same plain-English summary, fit check
          and dated checklist as the built-in ones. Only facts we can quote back from your text are kept.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="card p-5 space-y-3">
          <label className="block text-sm font-medium text-ink" htmlFor="paste-text">
            Solicitation text
          </label>
          <textarea
            id="paste-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={18}
            placeholder="Paste the solicitation here: the calendar of events, scope, bidder qualifications, insurance, and what to submit."
            className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink font-mono leading-relaxed"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-ink">
              <span className="block text-xs text-muted mb-1">Link to the posting (optional)</span>
              <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://" className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-sm" />
            </label>
            <label className="text-sm text-ink">
              <span className="block text-xs text-muted mb-1">Or upload a .txt file</span>
              <input type="file" accept=".txt,text/plain" onChange={onFile} className="block w-full text-xs text-muted" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button onClick={onExtract} disabled={busy || text.trim().length < 80}>
              {busy ? "Reading…" : "Extract"}
            </Button>
            <Button variant="secondary" onClick={() => setText(SAMPLE_PASTE_TEXT)} disabled={busy}>
              Try a sample
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setText("");
                setResult(null);
                setError(null);
              }}
              disabled={busy}
            >
              Clear
            </Button>
            <span className="ml-auto text-xs text-muted">
              {mode === null ? "" : mode === "claude" ? "Extractor: Claude, with quote verification" : "Extractor: pattern matching (set ANTHROPIC_API_KEY to use Claude)"}
            </span>
          </div>
          {error && (
            <Callout tone="warn" title="Could not extract">
              {error}
            </Callout>
          )}
        </div>

        <div className="space-y-4">
          {!result && (
            <div className="card p-5 text-sm text-muted">
              <p className="font-medium text-ink mb-1">What happens next</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>We pull out dates, dollar figures, licenses, certifications, insurance, bonds and the document list.</li>
                <li>Every extracted fact must quote your text word for word. Anything that does not is dropped and listed, not guessed.</li>
                <li>You review the preview, then add it to your matches to get the fit check, summary and checklist.</li>
              </ol>
            </div>
          )}
          {result && s && (
            <div className="card p-5 space-y-4" aria-live="polite">
              <Callout tone="warn" title="Extracted automatically. Verify against the source.">
                Read by {result.extractedBy === "claude" ? "Claude" : "pattern matching"}. Facts without a verifiable quote were left out.
                {result.warning ? ` ${result.warning}` : ""}
              </Callout>
              <div>
                <p className="text-sm text-muted">
                  {s.number.toUpperCase().startsWith(s.type) ? s.number : `${s.type} ${s.number}`} · {s.department}
                </p>
                <h2 className="text-xl font-semibold text-ink leading-snug">{s.title}</h2>
                <p className="text-sm text-ink/85 mt-1">{s.summary}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <DeadlineChip due={s.dates.submissionDue} today={todayISO} size="sm" />
                  <span className="text-xs text-muted">{CATEGORY_LABELS[s.category]}</span>
                  {r && <FitBadge fit={r.classification.fit} verifyCount={r.classification.verify.length} size="sm" />}
                </div>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <Stat label="Licenses" n={s.requirements.licenses.length} />
                <Stat label="Certifications" n={s.requirements.certifications.length} />
                <Stat label="Insurance lines" n={s.requirements.insurance.length} />
                <Stat label="Documents" n={s.documents.length} />
                <Stat label="Meetings" n={[s.dates.preBidMeeting, s.dates.siteVisit].filter(Boolean).length} />
                <Stat label="Bonds" n={s.requirements.bonding.length} />
              </dl>
              {result.notes.length > 0 && (
                <ul className="text-xs text-muted list-disc pl-4 space-y-0.5">
                  {result.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
              {result.dropped.length > 0 && (
                <div className="rounded-lg bg-amber-soft p-3 text-sm">
                  <p className="font-medium text-amber">
                    {result.dropped.length} item{result.dropped.length === 1 ? "" : "s"} left out
                  </p>
                  <ul className="text-xs text-ink/80 list-disc pl-4 mt-1 space-y-0.5">
                    {result.dropped.map((d, i) => (
                      <li key={i}>{d.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={onAdd}>Add to my matches and open the plan</Button>
                <Button variant="ghost" onClick={() => setResult(null)}>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {pasted.length > 0 && (
        <section>
          <SectionHeading title="Already pasted" subtitle="Stored only in this browser." />
          <ul className="grid gap-3 md:grid-cols-2">
            {pasted.map((p) => (
              <li key={p.id} className="card p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/opportunities/${encodeURIComponent(p.id)}`} className="font-medium text-ink hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">
                    {p.number} · {p.department}
                  </p>
                  <div className="mt-1">
                    <DeadlineChip due={p.dates.submissionDue} today={todayISO} size="sm" />
                  </div>
                </div>
                <button type="button" className="text-xs text-muted hover:text-red shrink-0" onClick={() => removePasted(p.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, n }: { label: string; n: number }) {
  return (
    <div className="rounded-lg border border-line px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold text-ink">{n}</dd>
    </div>
  );
}
