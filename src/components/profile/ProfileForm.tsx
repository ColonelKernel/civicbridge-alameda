"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS, INSURANCE_LABELS, INSURANCE_TYPES, type BusinessProfileInput, type Category, type InsuranceType } from "@/lib/data/types";
import { CERT_GROUP_LABELS, CERTIFICATIONS, type CertGroup } from "@/lib/data/certifications";
import { inferCategory } from "@/lib/engine/infer-category";
import type { ProfileDraft } from "@/lib/engine/profile/extract";
import { useProfile } from "@/state/profile";
import { Button, Callout } from "@/components/ui";

const CERT_GROUPS: CertGroup[] = ["county-regional", "state", "federal", "trade"];

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

  // Autofill from a website or capability statement.
  const [autoUrl, setAutoUrl] = useState("");
  const [autoText, setAutoText] = useState("");
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [autoResult, setAutoResult] = useState<{ filled: string[]; dropped: string[]; extractedBy: string; warning?: string; fetchedFrom?: string } | null>(null);

  function applyDraft(d: ProfileDraft): string[] {
    const filled: string[] = [];
    if (d.name) {
      setName(d.name);
      filled.push("name");
    }
    if (d.description) {
      setDescription(d.description);
      filled.push("description");
    }
    if (d.city) {
      setCity(d.city);
      filled.push("city");
    }
    if (d.county) {
      setCounty(d.county);
      filled.push("county");
    }
    if (d.employeeCount !== null) {
      setEmployees(String(d.employeeCount));
      filled.push("employees");
    }
    if (d.yearsInBusiness !== null) {
      setYears(String(d.yearsInBusiness));
      filled.push("years");
    }
    if (d.capabilities.length) {
      setCapabilities(d.capabilities.join(", "));
      filled.push("services");
    }
    if (d.keywords.length) {
      setKeywords(d.keywords.join(", "));
      filled.push("keywords");
    }
    if (d.licenses.length) {
      setLicenses(d.licenses.join(", "));
      setLicensesKnown(true);
      filled.push("licenses");
    }
    if (d.certifications.length) {
      setCerts(Array.from(new Set(d.certifications)));
      filled.push("certifications");
    }
    if (d.insurance.length) {
      setInsurance(d.insurance.filter((i): i is InsuranceType => (INSURANCE_TYPES as readonly string[]).includes(i)));
      setInsuranceKnown(true);
      filled.push("insurance");
    }
    if (d.primaryCategory) {
      setCategory(d.primaryCategory);
      filled.push("trade");
    }
    return filled;
  }

  async function autofill() {
    setAutoBusy(true);
    setAutoError(null);
    setAutoResult(null);
    try {
      const res = await fetch("/api/profile-extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: autoUrl.trim() || undefined, text: autoText }) });
      const data = (await res.json()) as { draft?: ProfileDraft; dropped?: string[]; extractedBy?: string; warning?: string; fetchedFrom?: string; error?: string };
      if (!res.ok || !data.draft) throw new Error(data.error ?? "Autofill failed.");
      const filled = applyDraft(data.draft);
      setAutoResult({ filled, dropped: data.dropped ?? [], extractedBy: data.extractedBy ?? "heuristic", warning: data.warning, fetchedFrom: data.fetchedFrom });
    } catch (e) {
      setAutoError(e instanceof Error ? e.message : "Autofill failed.");
    } finally {
      setAutoBusy(false);
    }
  }

  function onAutoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => setAutoText(t));
  }

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
      <fieldset className="rounded-xl border border-dashed border-green/40 bg-green-soft/30 p-4">
        <legend className="text-sm font-semibold px-1 text-green">Autofill from your website or capability statement</legend>
        <p className="text-xs text-muted mb-2">
          Give us a link, or paste the text of your capability statement. We pull out your trade, licenses, certifications, size and services, with a quote for each,
          and you check every field before saving. Only this text is sent to the server.
        </p>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input className={input} value={autoUrl} onChange={(e) => setAutoUrl(e.target.value)} placeholder="https://your-business.com/about" aria-label="Website address" inputMode="url" />
          <label className="inline-flex items-center justify-center rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink cursor-pointer hover:bg-slate-soft">
            Upload .txt
            <input type="file" accept=".txt,.md,text/plain" className="sr-only" onChange={onAutoFile} />
          </label>
        </div>
        <textarea className={`${input} min-h-20 mt-2`} value={autoText} onChange={(e) => setAutoText(e.target.value)} placeholder="…or paste your capability statement, LinkedIn summary, or the About page here." aria-label="Capability statement text" />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={autofill} disabled={autoBusy || (!autoUrl.trim() && autoText.trim().length < 40)}>
            {autoBusy ? "Reading…" : "Autofill the form"}
          </Button>
          <span className="text-xs text-muted">Runs through the same quote-verified extraction as pasted solicitations.</span>
        </div>
        {autoError && (
          <p className="text-sm text-red mt-2" role="alert">
            {autoError}
          </p>
        )}
        {autoResult && (
          <div className="mt-2">
            <Callout tone={autoResult.filled.length ? "good" : "warn"} title={autoResult.filled.length ? `Filled ${autoResult.filled.length} field${autoResult.filled.length === 1 ? "" : "s"}: ${autoResult.filled.join(", ")}` : "Nothing we could verify"}>
              <span className="text-xs">
                {autoResult.extractedBy === "claude" ? "Read by Claude" : "Read by pattern matching"}
                {autoResult.fetchedFrom ? ` from ${autoResult.fetchedFrom}` : ""}. Check each field below; anything without a verifiable quote was left out
                {autoResult.dropped.length ? ` (${autoResult.dropped.join(", ")})` : ""}.{autoResult.warning ? ` ${autoResult.warning}` : ""}
              </span>
            </Callout>
          </div>
        )}
      </fieldset>

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
        <p className="text-xs text-muted mt-1">Tick only what you currently hold. We show it as self-reported; the Passport page maps it onto each buyer&apos;s program.</p>
        {CERT_GROUPS.map((g) => (
          <div key={g} className="mt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{CERT_GROUP_LABELS[g]}</h4>
            <div className="grid gap-1.5 sm:grid-cols-2 mt-1">
              {CERTIFICATIONS.filter((c) => c.group === g).map((c) => (
                <label key={c.code} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={certs.includes(c.code)} onChange={(e) => setCerts((prev) => (e.target.checked ? [...prev, c.code] : prev.filter((x) => x !== c.code)))} />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
        ))}
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
