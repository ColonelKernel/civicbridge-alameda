"use client";

import { LOCALES, type Locale } from "@/lib/i18n/strings";
import { useLanguage } from "@/state/language";

export function LanguageToggle({ className = "inline-flex" }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();
  return (
    <label className={`items-center gap-1.5 text-sm ${className}`}>
      <span aria-hidden className="text-muted">🌐</span>
      <span className="sr-only">{t("lang.label")}</span>
      <select
        aria-label={t("lang.label")}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="rounded-full border border-line bg-paper px-2 py-1 text-sm text-ink max-w-[9rem]"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}
