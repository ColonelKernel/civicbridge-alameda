"use client";

import { useRouter } from "next/navigation";
import { DEMO_PROFILES } from "@/lib/data/profiles";
import { useProfile } from "@/state/profile";

export function DemoProfilePicker({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { setProfile, profile } = useProfile();
  return (
    <ul className={`grid gap-2 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`} aria-label="Demo businesses">
      {DEMO_PROFILES.map((d) => {
        const active = profile?.name === d.name;
        return (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => {
                setProfile(d);
                router.push("/dashboard");
              }}
              aria-pressed={active}
              className={`w-full text-left card px-4 py-3 hover:border-green/50 hover:shadow transition ${active ? "border-green ring-2 ring-green/20" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span aria-hidden className="text-2xl leading-none">
                  {d.emoji}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-ink leading-tight">{d.name}</div>
                  <div className="text-sm text-muted">{d.tagline}</div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
