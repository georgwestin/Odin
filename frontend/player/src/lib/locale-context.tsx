"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isValidLocale, type Locale } from "@/lib/i18n-config";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "sv",
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("sv");
  const [mounted, setMounted] = useState(false);

  // Read locale from cookie on mount
  useEffect(() => {
    const cookieMatch = document.cookie.match(/odin_locale=(\w+)/);
    const cookieLang = cookieMatch ? cookieMatch[1] : null;
    if (cookieLang && isValidLocale(cookieLang)) {
      setLocaleState(cookieLang);
    }
    setMounted(true);
  }, []);

  function setLocale(newLocale: Locale) {
    document.cookie = `odin_locale=${newLocale};path=/;max-age=31536000`;
    setLocaleState(newLocale);
  }

  // Always render "sv" on server to match initial client render
  const value = {
    locale: mounted ? locale : "sv",
    setLocale,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
