"use client";

import { useState } from "react";
import Link from "next/link";
import type { GapSummary } from "@/lib/engine/dashboard";
import { LEAD_TIME_LABEL } from "@/lib/data/glossary";
import type { MatchResult } from "@/lib/data/types";

const BUCKET: Record<GapSummary["bucket"], { title: string; cls: string; icon: string; blurb: string }> = {
  missing: { title: "Missing", cls: "text-red", icon: "✕", blurb: "The solicitation requires it and your profile says you don't have it." },
  verify: { title: "Check these", cls: "text-amber", icon: "△", blurb: "Stated in the solicitation; something to confirm or arrange, not a disqualifier." },
  "tell-us": { title: "Tell us", cls: "text-blue", icon: "?", blurb: "The solicitation asks for it and you haven't told us whether you have it." },
};

export function CommonGaps({ gaps, resultById }: { gaps: GapSummary[]; resultById: Record<string, MatchResult> }) {
  const [open, setOpen] = useState<string | null>(null);
  if (gaps.length === 0) return <p className="text-sm text-muted">Nothing stands out across your matches.</p>;
  const buckets: GapSummary["bucket"][] = ["missing", "verify", "tell-us"];
  return (
    <div className="space-y-4">
      {buckets.map((b) => {
        const items = gaps.filter((g) => g.bucket === b);
        if (!items.length) return null;
        const meta = BUCKET[b];
        return (
          <div key={b}>
            <h3 className={`text-sm font-semibold ${meta.cls}`}>
              <span aria-hidden>{meta.icon}</span> {meta.title}
            </h3>
            <p className="text-xs text-muted mb-2">{meta.blurb}</p>
            <ul className="space-y-1.5">
              {items.map((g) => {
                const key = `${g.requirementKey}|${g.bucket}`;
                const isOpen = open === key;
                return (
                  <li key={key} className="card px-3 py-2">
                    <button type="button" className="w-full text-left flex items-center justify-between gap-2" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)}>
                      <span className="text-sm text-ink">{g.label}</span>
                      <span className="text-xs text-muted shrink-0">
                        {g.count} match{g.count === 1 ? "" : "es"} {isOpen ? "▾" : "▸"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="mt-2 text-sm text-ink/90 space-y-2">
                        {g.glossary && <p>{g.glossary.meaning}</p>}
                        {g.action && (
                          <p>
                            <strong>What you can do:</strong> {g.action}
                          </p>
                        )}
                        {g.glossary && g.glossary.leadTime !== "n/a" && (
                          <p className="text-muted text-xs">
                            Usually takes: {LEAD_TIME_LABEL[g.glossary.leadTime].toLowerCase()}
                            {g.glossary.link && (
                              <>
                                {" "}
                                ·{" "}
                                <a className="text-green underline" href={g.glossary.link} target="_blank" rel="noreferrer">
                                  official page
                                </a>
                              </>
                            )}
                          </p>
                        )}
                        <p className="text-xs text-muted">
                          Affects:{" "}
                          {g.solicitationIds.slice(0, 4).map((id, i) => (
                            <span key={id}>
                              {i > 0 && ", "}
                              <Link className="underline" href={`/opportunities/${encodeURIComponent(id)}`}>
                                {resultById[id]?.solicitation.title ?? id}
                              </Link>
                            </span>
                          ))}
                          {g.solicitationIds.length > 4 && ` and ${g.solicitationIds.length - 4} more`}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
