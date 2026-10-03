"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS, INSURANCE_LABELS, INSURANCE_TYPES, type BusinessProfileInput, type Category, type InsuranceType } from "@/lib/data/types";
import { inferCategory } from "@/lib/engine/infer-category";
import { useProfile } from "@/state/profile";
import { Button } from "@/components/ui";

const CERT_OPTIONS = [
  { code: "SLEB", label: "Alameda County SLEB certified" },
  { code: "DIR", label: "DIR public works registration" },
  { code: "SERVSAFE", label: "ServSafe / food protection manager" },
  { code: "COURT_INTERPRETER", label: "Court interpreter certification" },
  { code: "ATA", label: "ATA certified translator" },
  { code: "MEDI_CAL_PROVIDER", label: "Medi-Cal certified provider" },
  { code: "EVITP", label: "EVITP (EV charger installers)" },
  { code: "ASE", label: "ASE certified technicians" },
  { code: "BSIS_PPO", label: "BSIS private patrol operator" },
  { code: "ISA_ARBORIST", label: "ISA certified arborist" },
  { code: "RID", label: "RID / BEI (ASL)" },
  { code: "QEI", label: "Qualified Elevator Inspector" },
];

const SIZE_OPTIONS: { label: string; value: { min: number; max: number } | "unknown" }[] = [
  { label: "Under $25k", value: { min: 1_000, max: 25_000 } },
  { label: "$25k to $100k", value: { min: 25_000, max: 100_000 } },
  { label: "$100k to $500k", value: { min: 100_000, max: 500_000 } },
  { label: "$500k to $2M", value: { min: 500_000, max: 2_000_000 } },
  { label: "Over $2M", value: { min: 2_000_000, max: 10_000_000 } },
  { label: "Not sure yet", value: "unknown" },
];

function splitList(s: string): string[] {
  return s
    .split(/[,\n;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function ProfileForm({ initial }: { initial?: Partial<BusinessProfileInput> }) {
  const router = useRouter();
  const { setProfile } = useProfile();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [city, setCity] = useState(initial?.city ?? "Oakland");
  const [county, setCounty] = useState<"Alameda" | "Other">(initial?.county ?? "Alameda");
  const [employees, setEmployees] = useState(initial?.employeeCount?.toString() ?? "");
  const [years, setYears] = useState(initial?.yearsInBusiness?.toString() ?? "");
  const [capabilities, setCapabilities] = useState((initial?.capabilities ?? []).join(", "));
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(", "));
  const [licenses, setLicenses] = useState(initial?.licenses && initial.licenses !== "unknown" ? initial.licenses.map((l) => l.code).join(", ") : "");
  const [licensesKnown, setLicensesKnown] = useState<boolean>(initial?.licenses !== undefined && initial.licenses !== "unknown");
  const [certs, setCerts] = useState<string[]>(initial?.certifications && initial.certifications !== "unknown" ? initial.certifications : []);
  const [insuranceKnown, setInsuranceKnown] = useState<boolean>(initial?.insurance !== undefined && initial.insurance !== "unknown");
  const [insurance, setInsurance] = useState<InsuranceType[]>(initial?.insurance && initial.insurance !== "unknown" ? initial.insurance.map((i) => i.type) : []);
  const [size, setSize] = useState<number>(() => {
    const t = initial?.typicalContractSize;
    if (!t || t === "unknown") return 5;
    const idx = SIZE_OPTIONS.findIndex((o) => o.value !== "unknown" && o.value.max >= t.max);
    return idx === -1 ? 4 : idx;
  });
  const [category, setCategory] = useState<Category | "">(initial?.primaryCategory ?? "");

  const inference = useMemo(
    () =>
      inferCategory({
        name,
        description,
        capabilities: splitList(capabilities),
        keywords: splitList(keywords),
        licenses: licensesKnown ? splitList(licenses).map((code) => ({ code })) : "unknown",
        certifications: certs,
      }),
    [name, description, capabilities, keywords, licenses, licensesKnown, certs],
  );

  const effectiveCategory = category || inference.category || "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const profile: BusinessProfileInput = {
      name: name.trim() || "My business",
      description: description.trim(),
      city: city.trim() || "Oakland",
      county,
      employeeCount: employees ? Number(employees) : undefined,
      yearsInBusiness: years ? Number(years) : undefined,
      capabilities: splitList(capabilities),
      keywords: splitList(keywords),
      primaryCategory: (effectiveCategory || undefined) as Category | undefined,
      primaryCategorySource: category ? "user" : inference.category ? inference.source : "none",
      secondaryCategories: [],
      certifications: certs,
      licenses: licensesKnown ? splitList(licenses).map((code) => ({ code })) : "unknown",
      insurance: insuranceKnown ? insurance.map((type) => ({ type })) : "unknown",
      typicalContractSize: SIZE_OPTIONS[size].value,
    };
    setProfile(profile);
    router.push("/dashboard");
  }

  const input = "w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink placeholder:text-muted/70";
  const label = "block text-sm font-medium text-ink mb-1";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="pf-name">
            Business name
          </label>
          <input id="pf-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hernández Electric" />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="pf-desc">
            What does your business do?
          </label>
          <textarea id="pf-desc" className={`${input} min-h-24`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="In your own words. e.g. Commercial electrical installation and repair for offices and clinics around Oakland." />
          {description.length > 10 && (
            <p className="mt-1.5 text-sm text-muted" aria-live="polite">
              {inference.category ? (
                <>
                  We think you are <strong className="text-ink">{CATEGORY_LABELS[inference.category].toLowerCase()}</strong>
                  {inference.confidence === "low" && " (not sure)"}. Change it below if that is wrong.
                </>
              ) : (
                "Pick your trade below so we can match you."
              )}
            </p>
          )}
        </div>
        <div>
          <label className={label} htmlFor="pf-cat">
            Your trade
          </label>
          <select id="pf-cat" className={input} value={effectiveCategory} onChange={(e) => setCategory(e.target.value as Category | "")}>
            <option value="">Choose…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="pf-size">
            Typical contract size
          </label>
          <select id="pf-size" className={input} value={size} onChange={(e) => setSize(Number(e.target.value))}>
            {SIZE_OPTIONS.map((o, i) => (
              <option key={o.label} value={i}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="pf-city">
            City
          </label>
          <input id="pf-city" className={input} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="pf-county">
            County
          </label>
          <select id="pf-county" className={input} value={county} onChange={(e) => setCounty(e.target.value as "Alameda" | "Other")}>
            <option value="Alameda">Alameda County</option>
            <option value="Other">Outside Alameda County</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="pf-emp">
            Employees (about)
          </label>
          <input id="pf-emp" className={input} inputMode="numeric" value={employees} onChange={(e) => setEmployees(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 12" />
        </div>
        <div>
          <label className={label} htmlFor="pf-years">
            Years doing this work
          </label>
          <input id="pf-years" className={input} inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 8" />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="pf-cap">
            Services you offer <span className="text-muted font-normal">(comma separated)</span>
          </label>
          <input id="pf-cap" className={input} value={capabilities} onChange={(e) => setCapabilities(e.target.value)} placeholder="e.g. lighting retrofit, panel upgrade, EV chargers" />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="pf-kw">
            Optional keywords
          </label>
          <input id="pf-kw" className={input} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. LED, public works" />
        </div>
      </div>

      <fieldset className="card p-4">
        <legend className="text-sm font-semibold px-1">Licenses</legend>
        <label className="flex items-center gap-2 text-sm mt-1">
          <input type="checkbox" checked={licensesKnown} onChange={(e) => setLicensesKnown(e.target.checked)} />I can list my licenses
        </label>
        {licensesKnown ? (
          <input className={`${input} mt-2`} value={licenses} onChange={(e) => setLicenses(e.target.value)} placeholder="e.g. C-10, or leave blank if none" aria-label="License codes" />
        ) : (
          <p className="text-sm text-muted mt-1">Leave unchecked and we will say &quot;tell us&quot; instead of guessing.</p>
        )}
      </fieldset>

      <fieldset className="card p-4">
        <legend className="text-sm font-semibold px-1">Certifications you hold</legend>
        <div className="grid gap-1.5 sm:grid-cols-2 mt-1">
          {CERT_OPTIONS.map((c) => (
            <label key={c.code} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={certs.includes(c.code)} onChange={(e) => setCerts((prev) => (e.target.checked ? [...prev, c.code] : prev.filter((x) => x !== c.code)))} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="card p-4">
        <legend className="text-sm font-semibold px-1">Insurance</legend>
        <label className="flex items-center gap-2 text-sm mt-1">
          <input type="checkbox" checked={insuranceKnown} onChange={(e) => setInsuranceKnown(e.target.checked)} />I know what coverage I carry
        </label>
        {insuranceKnown ? (
          <div className="grid gap-1.5 sm:grid-cols-2 mt-2">
            {INSURANCE_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={insurance.includes(t)} onChange={(e) => setInsurance((prev) => (e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)))} />
                {INSURANCE_LABELS[t]}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted mt-1">Not sure? Skip it. Insurance is only due before award, and we will flag it as something to check.</p>
        )}
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit">Show my matches</Button>
        <span className="text-sm text-muted">Nothing leaves your browser.</span>
      </div>
    </form>
  );
}
