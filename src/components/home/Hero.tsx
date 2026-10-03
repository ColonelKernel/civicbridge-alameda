"use client";

import { useLanguage } from "@/state/language";
import { BRAND } from "@/lib/data/brand";
import { Eyebrow } from "@/components/ui";

export function Hero({ open, portal, buyers }: { open: number; portal: number; buyers: number }) {
  const { t } = useLanguage();
  return (
    <div>
      <Eyebrow className="mb-3">For {BRAND.audience}</Eyebrow>
      <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-ink leading-[1.02]">{t("home.hero")}</h1>
      <p className="mt-5 text-lg text-muted max-w-xl">
        Tell {BRAND.product} what your business does. It shows which contracts from Alameda County, its cities and East Bay agencies actually fit,
        why they fit, what you would need, and exactly what to do before each deadline.
      </p>
      <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Open opportunities</dt>
          <dd className="font-display text-3xl font-semibold text-ink">{open}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">From real postings</dt>
          <dd className="font-display text-3xl font-semibold text-ink">{portal}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Buyers in the registry</dt>
          <dd className="font-display text-3xl font-semibold text-ink">{buyers}</dd>
        </div>
      </dl>
    </div>
  );
}
