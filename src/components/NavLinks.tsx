"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/state/profile";

const links = [
  { href: "/dashboard", label: "My matches", short: "Matches" },
  { href: "/paste", label: "Paste a solicitation", short: "Paste" },
  { href: "/sources", label: "Where we look", short: "Sources" },
] as const;

/** Static single-file prototype served from /public; a plain anchor, not a Next route. */
const WORKSPACE = { href: "/civicbridge.html", label: "County workspace", short: "Workspace" };

export function NavLinks() {
  const path = usePathname();
  const { profile, hydrated } = useProfile();
  return (
    <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1 text-sm whitespace-nowrap min-w-0">
      {links.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full transition-colors ${active ? "bg-ink text-white" : "text-muted hover:bg-slate-soft hover:text-ink"}`}
          >
            <span className="sm:hidden">{l.short}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </Link>
        );
      })}
      <a href={WORKSPACE.href} className="px-2.5 sm:px-3 py-1.5 rounded-full text-muted hover:bg-slate-soft hover:text-ink transition-colors">
        <span className="sm:hidden">{WORKSPACE.short}</span>
        <span className="hidden sm:inline">{WORKSPACE.label}</span>
      </a>
      {hydrated && profile && (
        <Link href="/" className="ml-2 hidden lg:inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-ink hover:bg-slate-soft">
          <span className="truncate max-w-[14rem]">{profile.name}</span>
          <span className="text-muted text-xs">change</span>
        </Link>
      )}
    </nav>
  );
}
