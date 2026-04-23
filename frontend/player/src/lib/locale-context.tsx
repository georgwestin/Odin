"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isValidLocale, type Locale } from "@/lib/i18n-config";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  // Read locale from URL path first, then cookie
  useEffect(() => {
    const pathSegment = window.location.pathname.split("/")[1];
    if (pathSegment === "sv") {
      setLocaleState("sv");
    } else if (pathSegment === "fi") {
      setLocaleState("fi");
    } else if (pathSegment === "no") {
      setLocaleState("no");
    } else {
      // Default: English for / and all other paths
      setLocaleState("en");
    }
    setMounted(true);
  }, []);

  function setLocale(newLocale: Locale) {
    document.cookie = `odin_locale=${newLocale};path=/;max-age=31536000`;
    setLocaleState(newLocale);
  }

  // Always render "en" on server to match initial client render
  const value = {
    locale: mounted ? locale : "en",
    setLocale,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
