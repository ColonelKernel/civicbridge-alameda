"use client";

import { useMemo } from "react";
import { CATEGORIES, CATEGORY_LABELS, type Category, type Fit } from "@/lib/data/types";
import { AGENCIES, GOVERNANCE_LABELS, type Governance } from "@/lib/data/agencies";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { certLabel } from "@/lib/data/certifications";
import { DEFAULT_FILTERS, type DeadlineWindow, type Filters, type SizeBucket } from "@/lib/engine/dashboard";

/** Only certifications that at least one record actually mentions. */
const MENTIONED_CERTS = Array.from(new Set(SOLICITATIONS.flatMap((s) => s.requirements.certifications.map((c) => c.code.toUpperCase())))).sort();

export function activeFilterCount(value: Filters): number {
  return (
    value.categories.length +
    value.departments.length +
    value.agencies.length +
    value.certification.length +
    value.fit.length +
    (value.deadline !== "any" ? 1 : 0) +
    (value.size !== "any" ? 1 : 0) +
    (value.includeClosed ? 1 : 0)
  );
}

export function FiltersBar({ value, onChange, departments, hideSearch = false }: { value: Filters; onChange: (f: Filters) => void; departments: string[]; hideSearch?: boolean }) {
  const sel = "rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink";
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v });
  const activeCount = activeFilterCount(value);
  const agencyGroups = useMemo(() => {
    const map = new Map<Governance, typeof AGENCIES>();
    for (const a of AGENCIES) map.set(a.governance, [...(map.get(a.governance) ?? []), a]);
    return Array.from(map.entries());
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
      {!hideSearch && (
        <input
          type="search"
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search title or department"
          aria-label="Search"
          className={`${sel} min-w-[12rem] flex-1`}
        />
      )}
      <select aria-label="Category" className={sel} value={value.categories[0] ?? ""} onChange={(e) => set("categories", e.target.value ? [e.target.value as Category] : [])}>
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <select aria-label="Buyer" className={`${sel} max-w-[14rem]`} value={value.agencies[0] ?? ""} onChange={(e) => set("agencies", e.target.value ? [e.target.value] : [])}>
        <option value="">All buyers</option>
        {agencyGroups.map(([g, list]) => (
          <optgroup key={g} label={GOVERNANCE_LABELS[g]}>
            {list.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <select aria-label="Department" className={`${sel} max-w-[14rem]`} value={value.departments[0] ?? ""} onChange={(e) => set("departments", e.target.value ? [e.target.value] : [])}>
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select aria-label="Deadline" className={sel} value={value.deadline} onChange={(e) => set("deadline", e.target.value as DeadlineWindow)}>
        <option value="any">Any deadline</option>
        <option value="7">Next 7 days</option>
        <option value="14">Next 14 days</option>
        <option value="30">Next 30 days</option>
        <option value="60">Next 60 days</option>
      </select>
      <select aria-label="Contract size" className={sel} value={value.size} onChange={(e) => set("size", e.target.value as SizeBucket)}>
        <option value="any">Any size</option>
        <option value="under50k">Under $50k</option>
        <option value="50k-250k">$50k to $250k</option>
        <option value="250k-1m">$250k to $1M</option>
        <option value="over1m">Over $1M</option>
        <option value="not-stated">Not stated</option>
      </select>
      <select aria-label="Certification mentioned" className={sel} value={value.certification[0] ?? ""} onChange={(e) => set("certification", e.target.value ? [e.target.value] : [])}>
        <option value="">Any certification</option>
        {MENTIONED_CERTS.map((c) => (
          <option key={c} value={c}>
            Mentions {certLabel(c)}
          </option>
        ))}
      </select>
      <select aria-label="Match strength" className={sel} value={value.fit[0] ?? ""} onChange={(e) => set("fit", e.target.value ? [e.target.value as Fit] : [])}>
        <option value="">Any fit</option>
        <option value="strong">Strong fit</option>
        <option value="possible">Possible fit</option>
        <option value="poor">Unlikely fit</option>
      </select>
      <label className="flex items-center gap-1.5 text-sm text-muted">
        <input type="checkbox" checked={value.includeClosed} onChange={(e) => set("includeClosed", e.target.checked)} />
        Show closed
      </label>
      {activeCount > 0 && (
        <button type="button" className="text-sm text-green font-medium hover:underline" onClick={() => onChange({ ...DEFAULT_FILTERS, search: value.search, quick: value.quick })}>
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
