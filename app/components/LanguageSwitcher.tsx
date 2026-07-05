"use client";

import { useI18n } from "@/app/lib/i18n";

/* ─────────────────────────────────────────────────────────
   Compact EN / TR / DE pill switcher.
   Used in the landing header and the app sidebar footer.
   ───────────────────────────────────────────────────────── */

export default function LanguageSwitcher() {
  const { lang, setLang, langs } = useI18n();

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={lang === l ? "lang-switch__btn lang-switch__btn--active" : "lang-switch__btn"}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
