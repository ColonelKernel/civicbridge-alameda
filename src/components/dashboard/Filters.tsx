"use client";

import { CATEGORIES, CATEGORY_LABELS, type Category, type Fit } from "@/lib/data/types";
import { AGENCIES } from "@/lib/data/agencies";
import type { DeadlineWindow, Filters, SizeBucket } from "@/lib/engine/dashboard";

const CERTS = [
  { code: "SLEB", label: "SLEB" },
  { code: "SERVSAFE", label: "ServSafe" },
  { code: "COURT_INTERPRETER", label: "Court interpreter" },
  { code: "MEDI_CAL_PROVIDER", label: "Medi-Cal" },
  { code: "QEI", label: "QEI" },
  { code: "ASE", label: "ASE" },
];

export function FiltersBar({ value, onChange, departments }: { value: Filters; onChange: (f: Filters) => void; departments: string[] }) {
  const sel = "rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink";
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v });
  const activeCount =
    value.categories.length + value.departments.length + value.agencies.length + value.certification.length + value.fit.length + (value.deadline !== "any" ? 1 : 0) + (value.size !== "any" ? 1 : 0) + (value.includeClosed ? 1 : 0);
  return (
    <div className="card p-3 sm:p-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
      <input
        type="search"
        value={value.search}
        onChange={(e) => set("search", e.target.value)}
        placeholder="Search title or department"
        aria-label="Search"
        className={`${sel} min-w-[12rem] flex-1`}
      />
      <select aria-label="Category" className={sel} value={value.categories[0] ?? ""} onChange={(e) => set("categories", e.target.value ? [e.target.value as Category] : [])}>
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <select aria-label="Agency" className={sel} value={value.agencies[0] ?? ""} onChange={(e) => set("agencies", e.target.value ? [e.target.value] : [])}>
        <option value="">All agencies</option>
        {AGENCIES.map((a) => (
          <option key={a.id} value={a.id}>
            {a.shortName}
          </option>
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
        {CERTS.map((c) => (
          <option key={c.code} value={c.code}>
            Mentions {c.label}
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
        <button type="button" className="text-sm text-green font-medium hover:underline" onClick={() => onChange({ ...value, categories: [], departments: [], agencies: [], deadline: "any", size: "any", certification: [], fit: [], includeClosed: false, search: "" })}>
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
