"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/state/profile";

const links = [
  { href: "/dashboard", label: "My matches" },
  { href: "/paste", label: "Paste a solicitation" },
  { href: "/sources", label: "Where we look" },
] as const;

export function NavLinks() {
  const path = usePathname();
  const { profile, hydrated } = useProfile();
  return (
    <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
      {links.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`px-3 py-1.5 rounded-full transition-colors ${active ? "bg-ink text-white" : "text-muted hover:bg-slate-soft hover:text-ink"}`}
          >
            {l.label}
          </Link>
        );
      })}
      {hydrated && profile && (
        <Link href="/" className="ml-2 hidden md:inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-ink hover:bg-slate-soft">
          <span className="truncate max-w-[14rem]">{profile.name}</span>
          <span className="text-muted text-xs">change</span>
        </Link>
      )}
    </nav>
  );
}
