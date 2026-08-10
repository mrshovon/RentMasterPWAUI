"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { bn } from "./locales/bn";

// =============================================================================
// Lightweight i18n — English ⇄ Bangla.
//
// THE ENGLISH TEXT IS THE KEY. `t("Portfolio overview")` looks the string up in the Bangla map
// and RETURNS ITS OWN ARGUMENT when there is no entry. That single property is why this app can
// be translated incrementally: anything not yet in bn.ts renders correct English instead of a
// blank or a raw id like "owner.overview.title", so a half-finished locale is never broken UI.
//
// Deliberately not a library: one dictionary, two languages, no pluralisation rules or
// server-side locale routing needed. next-intl and friends would add a build-time story
// (middleware, [locale] routes) for something a context and a Record can do here.
// =============================================================================

export type Lang = "en" | "bn";

const STORAGE_KEY = "rentmaster-lang";

// The active language, mirrored outside React so the plain formatters in lib/format.ts can pick
// it up without every caller threading it down. Safe because switching language changes the
// context value at the root, which re-renders the whole tree — this is already updated by then.
// Components still MAY pass an explicit lang; this is only the default.
let currentLang: Lang = "en";
export function getCurrentLang(): Lang {
  return currentLang;
}

const DICTIONARIES: Record<Lang, Record<string, string>> = {
  en: {}, // English is the key set — an empty map means every lookup falls through to itself.
  bn,
};

/**
 * `t()` for code that is not a React component — the receipt builder and the WhatsApp caption,
 * which are plain functions that produce a document rather than a tree.
 *
 * Same lookup and the same fall-through-to-English behaviour as the hook; it just reads the
 * module-level `currentLang` mirror instead of the context, exactly as lib/format.ts already
 * does for month names. Components must still use `useT()`, which re-renders on a language
 * change; this one is a snapshot taken at the moment it is called.
 */
export function translate(text: string, lang: Lang = currentLang): string {
  return DICTIONARIES[lang][text] ?? text;
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (text) => text,
});

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * The distinction matters here and nowhere else in the app: a layout effect runs BEFORE the
 * browser paints, so the language switch happens between hydration and the first frame the user
 * sees. With a plain `useEffect` — which runs after paint — a Bangla user got a visible flash of
 * English on every single load. React warns if `useLayoutEffect` reaches the server prerender, so
 * it is swapped for the harmless one there.
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Starts at "en" so hydration matches the prerendered HTML — these pages are statically
  // exported (that is what makes the Android shell possible), so the server cannot know the
  // reader's language. Reading localStorage in the initial state instead would be a hydration
  // mismatch. The layout effect below closes the gap before anything is painted.
  const [lang, setLangState] = useState<Lang>("en");

  useIsomorphicLayoutEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
    if (stored === "bn" || stored === "en") {
      currentLang = stored;
      setLangState(stored);
    }
  }, []);

  // Keep the document language honest for screen readers, and for the hyphenation/font
  // fallback the browser picks for Bengali script.
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    currentLang = next; // keep the formatters in step before the re-render
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* choice just won't persist */ }
  }, []);

  const t = useCallback(
    (text: string) => DICTIONARIES[lang][text] ?? text,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** `const t = useT()` → `t("Save changes")`. */
export function useT(): (text: string) => string {
  return useContext(LanguageContext).t;
}

/** The active language, for the formatters in lib/format.ts that take it as an argument. */
export function useLang(): Lang {
  return useContext(LanguageContext).lang;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
