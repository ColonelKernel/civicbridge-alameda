"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/state/profile";
import { useLanguage } from "@/state/language";
import type { StringKey } from "@/lib/i18n/strings";

const links: { href: string; label: StringKey; short: StringKey }[] = [
  { href: "/dashboard", label: "nav.matches", short: "nav.matches.short" },
  { href: "/paste", label: "nav.paste", short: "nav.paste.short" },
  { href: "/passport", label: "nav.passport", short: "nav.passport.short" },
];

export function NavLinks() {
  const path = usePathname();
  const { profile, hydrated } = useProfile();
  const { t } = useLanguage();
  return (
    <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1 text-sm whitespace-nowrap shrink-0">
      {links.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-colors ${active ? "bg-ink text-white" : "text-muted hover:bg-slate-soft hover:text-ink"}`}
          >
            <span className="md:hidden">{t(l.short)}</span>
            <span className="hidden md:inline">{t(l.label)}</span>
          </Link>
        );
      })}
      {hydrated && profile && (
        <Link href="/" className="ml-1 hidden lg:inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-ink hover:bg-slate-soft">
          <span className="truncate max-w-[12rem]">{profile.name}</span>
          <span className="text-muted text-xs">{t("nav.change")}</span>
        </Link>
      )}
    </nav>
  );
}
