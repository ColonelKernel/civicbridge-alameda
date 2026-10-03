"use client";

/**
 * Client-side state: the business profile, solicitations the user pasted in,
 * and checklist ticks. Everything persists to localStorage (wrapped in
 * try/catch so private windows and blocked storage still work).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BusinessProfileSchema, SolicitationSchema, type BusinessProfile, type BusinessProfileInput, type MatchResult, type Solicitation } from "@/lib/data/types";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { evaluateAll, prepareProfile } from "@/lib/engine/evaluate";
import { today } from "@/lib/engine/dates";

const KEY_PROFILE = "bidpath:profile:v1";
const KEY_PASTED = "bidpath:pasted:v1";
const KEY_TICKS = "bidpath:ticks:v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

interface ProfileContextValue {
  hydrated: boolean;
  profile: BusinessProfile | null;
  setProfile: (p: BusinessProfileInput | null) => void;
  pasted: Solicitation[];
  addPasted: (s: Solicitation) => void;
  removePasted: (id: string) => void;
  allSolicitations: Solicitation[];
  results: MatchResult[];
  resultById: Record<string, MatchResult>;
  todayISO: string;
  ticks: Record<string, boolean>;
  toggleTick: (key: string) => void;
}

const Ctx = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfileState] = useState<BusinessProfile | null>(null);
  const [pasted, setPasted] = useState<Solicitation[]>([]);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});

  // Hydrating from localStorage after mount is the one legitimate reason to set
  // state inside an effect: the server render cannot know what the browser holds.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const rawProfile = read<unknown>(KEY_PROFILE, null);
    if (rawProfile) {
      const parsed = BusinessProfileSchema.safeParse(rawProfile);
      if (parsed.success) setProfileState(prepareProfile(parsed.data));
    }
    const rawPasted = read<unknown[]>(KEY_PASTED, []);
    setPasted(rawPasted.map((r) => SolicitationSchema.safeParse(r)).filter((r) => r.success).map((r) => r.data));
    setTicks(read<Record<string, boolean>>(KEY_TICKS, {}));
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setProfile = useCallback((p: BusinessProfileInput | null) => {
    if (!p) {
      setProfileState(null);
      write(KEY_PROFILE, null);
      return;
    }
    const prepared = prepareProfile(p);
    setProfileState(prepared);
    write(KEY_PROFILE, prepared);
  }, []);

  const addPasted = useCallback((s: Solicitation) => {
    setPasted((prev) => {
      const next = [s, ...prev.filter((p) => p.id !== s.id)];
      write(KEY_PASTED, next);
      return next;
    });
  }, []);

  const removePasted = useCallback((id: string) => {
    setPasted((prev) => {
      const next = prev.filter((p) => p.id !== id);
      write(KEY_PASTED, next);
      return next;
    });
  }, []);

  const toggleTick = useCallback((key: string) => {
    setTicks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      write(KEY_TICKS, next);
      return next;
    });
  }, []);

  const todayISO = useMemo(() => today(), []);
  const allSolicitations = useMemo(() => [...pasted, ...SOLICITATIONS], [pasted]);
  const results = useMemo(() => (profile ? evaluateAll(allSolicitations, profile, todayISO) : []), [profile, allSolicitations, todayISO]);
  const resultById = useMemo(() => Object.fromEntries(results.map((r) => [r.solicitation.id, r])), [results]);

  const value: ProfileContextValue = {
    hydrated,
    profile,
    setProfile,
    pasted,
    addPasted,
    removePasted,
    allSolicitations,
    results,
    resultById,
    todayISO,
    ticks,
    toggleTick,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProfile must be used inside ProfileProvider");
  return v;
}
