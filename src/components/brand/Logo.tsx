import { BRAND } from "@/lib/data/brand";

/**
 * The ProcureFit mark: a gradient tile (County green to Bay blue) with a
 * check that doubles as a fitted bracket. Text only for agencies; the product
 * is the only thing with a logo here.
 */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <defs>
        <linearGradient id="pf-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--green)" />
          <stop offset="1" stopColor="var(--bay)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#pf-g)" />
      <path d="M9 10h5M9 10v12h5" stroke="white" strokeOpacity="0.55" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 16.5l4 4 7.5-9" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark({ withRegion = true, size = "md" }: { withRegion?: boolean; size?: "md" | "lg" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${size === "lg" ? "text-2xl" : "text-base"}`}>
      <LogoMark size={size === "lg" ? 40 : 28} />
      <span className="font-display font-semibold tracking-tight text-ink leading-none">
        Procure<span className="text-green">Fit</span>
      </span>
      {withRegion && <span className="hidden lg:inline text-muted font-normal text-sm leading-none">· {BRAND.region}</span>}
    </span>
  );
}
