import type { Metadata } from "next";
import { Suspense } from "react";
import { PassportView } from "@/components/passport/PassportView";
import { BRAND } from "@/lib/data/brand";

export const metadata: Metadata = {
  title: `Regional SLEB Passport · ${BRAND.product}`,
  description: "What each Alameda County and East Bay buyer recognizes today, where a vendor's self-reported status suggests they stand, and a proposal to harmonize small-local certification across the region.",
};

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted" aria-busy="true">
          Loading your Passport…
        </div>
      }
    >
      <PassportView />
    </Suspense>
  );
}
