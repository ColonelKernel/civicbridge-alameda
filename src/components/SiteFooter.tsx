"use client";

import Link from "next/link";
import { BRAND } from "@/lib/data/brand";
import { useLanguage } from "@/state/language";
import { LogoMark } from "./brand/Logo";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-line mt-16 bg-paper/60">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2 text-ink font-display font-semibold">
            <LogoMark size={22} /> {BRAND.product}
          </span>
          <Link href="/sources" className="hover:text-ink underline-offset-2 hover:underline">
            {t("nav.sources")}
          </Link>
          <Link href="/passport" className="hover:text-ink underline-offset-2 hover:underline">
            {t("nav.passport")}
          </Link>
        </div>
        <p>
          <strong className="text-ink">How to read this.</strong> {BRAND.product} compares what a solicitation says with what you told us. It never decides
          eligibility; only the agency does, after reading your full response. Figures marked as agency estimates come from the solicitation
          text; everything else links back to its source so you can check it. {t("footer.passport")}
        </p>
        <p>
          Records marked <em>sample</em> were written for this demo in the County&apos;s format and are not live postings. Records marked{" "}
          <em>from the portal</em> were entered by hand from documents downloaded on Oct 3, 2026 and may have changed since.
        </p>
        <p>
          Built for {BRAND.challenge}, convened with {BRAND.partners}, in support of the {BRAND.vision.program} 10X goal{" "}
          <a href={BRAND.vision.url} target="_blank" rel="noreferrer" className="underline hover:text-ink">
            {BRAND.vision.goal}
          </a>
          .{" "}
          <Link href="/pitch" className="underline hover:text-ink">
            For judges: the two-minute pitch and rubric
          </Link>
          .
        </p>
        <p className="text-xs">{BRAND.nonAffiliation}</p>
      </div>
    </footer>
  );
}
