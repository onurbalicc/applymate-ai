"use client";

import { useCallback, useSyncExternalStore } from "react";
import { translations, type Lang, type TKey } from "./translations";

/* ─────────────────────────────────────────────────────────
   Lightweight i18n + theme preference stores.
   No external packages. Backed by localStorage via
   useSyncExternalStore: the server snapshot is the default
   value, so prerendered HTML hydrates cleanly and re-renders
   to the stored preference right after hydration — no
   hydration mismatches and no setState-in-effect.
   ───────────────────────────────────────────────────────── */

interface LocalStore<T extends string> {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
}

function createLocalStore<T extends string>(
  storageKey: string,
  defaultValue: T,
  isValid: (v: string) => v is T,
  onSet?: (value: T) => void
): LocalStore<T> {
  let value: T | null = null;
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null && isValid(stored) ? stored : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot() {
      if (value === null) value = read();
      return value;
    },
    getServerSnapshot: () => defaultValue,
    set(next) {
      value = next;
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* localStorage unavailable — keep in-memory value */
      }
      onSet?.(next);
      listeners.forEach((cb) => cb());
    },
  };
}

/* ── Language ────────────────────────────────────────────── */

const LANGS: Lang[] = ["en", "tr", "de"];

const langStore = createLocalStore<Lang>(
  "applymate-lang",
  "en",
  (v): v is Lang => (LANGS as string[]).includes(v),
  (lang) => {
    document.documentElement.lang = lang;
  }
);

/** Simple {placeholder} interpolation for word-order-safe strings. */
function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function useI18n() {
  const lang = useSyncExternalStore(
    langStore.subscribe,
    langStore.getSnapshot,
    langStore.getServerSnapshot
  );

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => format(translations[lang][key], vars),
    [lang]
  );

  return { lang, setLang: langStore.set, t, langs: LANGS };
}

/* ── Theme ───────────────────────────────────────────────── */

type Theme = "dark" | "light";

const themeStore = createLocalStore<Theme>(
  "applymate-theme",
  "dark",
  (v): v is Theme => v === "dark" || v === "light",
  (theme) => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }
);

export function useTheme() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  );

  const toggleTheme = useCallback(() => {
    themeStore.set(themeStore.getSnapshot() === "dark" ? "light" : "dark");
  }, []);

  return { theme, toggleTheme };
}
