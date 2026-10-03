"use client";

/**
 * Language toggle state. UI chrome comes from the hand-written dictionary in
 * src/lib/i18n/strings.ts; engine-generated body text is translated on demand
 * through /api/translate (Claude, server key required) and cached per language
 * in localStorage. English never needs a request.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, EN_STRINGS, isLocale, localeMeta, STRING_KEYS, translate, type Locale, type StringKey } from "@/lib/i18n/strings";

const KEY_LANG = "procurefit:lang:v1";
const KEY_TX = "procurefit:tx:v1:";
const TX_CAP = 2000;

type TxStatus = "idle" | "loading" | "done" | "unavailable" | "error";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  /** For locales without a dictionary: whether the interface strings came back from live translation. */
  chromeStatus: TxStatus;
}

const Ctx = createContext<LanguageContextValue | null>(null);
const LocaleOnlyCtx = createContext<{ locale: Locale } | null>(null);

function readLang(): Locale {
  try {
    const raw = window.localStorage.getItem(KEY_LANG);
    return raw && isLocale(raw) ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const localeOnly = useMemo(() => ({ locale }), [locale]);
  return (
    <LocaleOnlyCtx.Provider value={localeOnly}>
      <LanguageProviderInner locale={locale} setLocaleState={setLocaleState}>
        {children}
      </LanguageProviderInner>
    </LocaleOnlyCtx.Provider>
  );
}

function LanguageProviderInner({ locale, setLocaleState, children }: { locale: Locale; setLocaleState: (l: Locale) => void; children: ReactNode }) {
  // Hydrate the saved language after mount (the server cannot know it).
  useEffect(() => {
    setLocaleState(readLang());
  }, [setLocaleState]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeMeta(locale).dir;
  }, [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      try {
        window.localStorage.setItem(KEY_LANG, l);
      } catch {
        /* storage unavailable */
      }
    },
    [setLocaleState],
  );

  // Interface strings for locales without a hand-written dictionary.
  const chromeTexts = useMemo(() => (localeMeta(locale).dictionary ? [] : STRING_KEYS.map((k) => EN_STRINGS[k])), [locale]);
  const { status: chromeStatus, map: liveMap } = useTranslatedMap(chromeTexts);

  const t = useCallback((key: StringKey, vars?: Record<string, string | number>) => translate(locale, key, vars, liveMap), [locale, liveMap]);
  const value = useMemo(() => ({ locale, setLocale, t, chromeStatus }), [locale, setLocale, t, chromeStatus]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLanguage must be used inside LanguageProvider");
  return v;
}

function readTx(locale: Locale): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(KEY_TX + locale);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeTx(locale: Locale, map: Record<string, string>) {
  try {
    const entries = Object.entries(map);
    const trimmed = entries.length > TX_CAP ? Object.fromEntries(entries.slice(entries.length - TX_CAP)) : map;
    window.localStorage.setItem(KEY_TX + locale, JSON.stringify(trimmed));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Translate a batch of engine-generated strings into the current language.
 * Returns a lookup that falls back to the English text, plus a status for the
 * "machine translation" note.
 */
export function useTranslated(texts: string[]): { tr: (s: string) => string; status: TxStatus } {
  const { tr, status } = useTranslatedMap(texts);
  return { tr, status };
}

function useTranslatedMap(texts: string[]): { tr: (s: string) => string; status: TxStatus; map: Record<string, string> } {
  const { locale } = useContext(LocaleOnlyCtx) ?? { locale: DEFAULT_LOCALE };
  const [map, setMap] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<TxStatus>("idle");
  const inflight = useRef<string | null>(null);
  const key = useMemo(() => `${locale}|${texts.join("\u0001")}`, [locale, texts]);

  useEffect(() => {
    if (locale === "en" || texts.length === 0) return;
    const cached = readTx(locale);
    const missing = Array.from(new Set(texts.filter((t) => t.trim() && !cached[t])));
    if (missing.length === 0) {
      // Everything is cached; publish it on the next tick to keep render pure.
      const id = window.setTimeout(() => {
        setMap(cached);
        setStatus("done");
      }, 0);
      return () => window.clearTimeout(id);
    }
    if (inflight.current === key) return;
    inflight.current = key;
    const ctrl = new AbortController();
    const start = window.setTimeout(() => setStatus("loading"), 0);
    fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale, texts: missing }), signal: ctrl.signal })
      .then(async (r) => {
        const data = (await r.json()) as { available?: boolean; translations?: (string | null)[] | null; error?: string };
        if (!r.ok) throw new Error(data.error ?? "failed");
        if (!data.available || !data.translations) {
          setStatus("unavailable");
          return;
        }
        const next = { ...cached };
        missing.forEach((m, i) => {
          const v = data.translations?.[i];
          if (v) next[m] = v;
        });
        writeTx(locale, next);
        setMap(next);
        setStatus("done");
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name === "AbortError") return;
        setStatus("error");
      })
      .finally(() => {
        if (inflight.current === key) inflight.current = null;
      });
    return () => {
      window.clearTimeout(start);
      ctrl.abort();
    };
  }, [locale, texts, key]);

  const tr = useCallback((s: string) => (locale === "en" ? s : (map[s] ?? s)), [locale, map]);
  return { tr, status: locale === "en" ? "idle" : status, map };
}
