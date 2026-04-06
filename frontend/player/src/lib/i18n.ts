"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  createElement,
} from "react";
import { usePathname } from "next/navigation";
import { getTranslations, isSanityConfigured } from "@/lib/sanity";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n-config";

// --- Default Swedish Translations ---

export const DEFAULT_TRANSLATIONS: Record<string, Record<string, string>> = {
  nav: {
    casino: "Casino",
    liveCasino: "Live Casino",
    betting: "Betting",
    virtual: "Virtuellt",
    offers: "Erbjudanden",
    support: "Support",
    login: "Logga in",
    register: "Registrera",
  },
  common: {
    play: "Spela",
    playNow: "Spela nu",
    deposit: "Insättning",
    withdraw: "Uttag",
    balance: "Saldo",
    readMore: "Läs mer",
    showAll: "Visa alla",
    showMore: "Visa mer",
    search: "Sök",
    filter: "Filtrera",
    sort: "Sortera",
  },
  casino: {
    allGames: "Alla spel",
    newGames: "Nya spel",
    popular: "Populära",
    slots: "Slots",
    tableGames: "Bordsspel",
    liveCasino: "Live Casino",
    jackpots: "Jackpottar",
    providers: "Leverantörer",
    rtp: "RTP",
    volatility: "Volatilitet",
  },
  sports: {
    allSports: "Alla sporter",
    live: "Live",
    upcoming: "Kommande",
    odds: "Odds",
    placeBet: "Placera spel",
    betSlip: "Spelkupong",
    stake: "Insats",
    potentialWin: "Möjlig vinst",
  },
  footer: {
    responsibleGambling: "Ansvarsfullt spelande",
    age18: "18+",
    support: "Support",
    terms: "Villkor",
    privacy: "Integritetspolicy",
    cookies: "Cookies",
    license: "Licens",
  },
  auth: {
    login: "Logga in",
    register: "Registrera",
    email: "E-post",
    password: "Lösenord",
    username: "Användarnamn",
    dateOfBirth: "Födelsedatum",
    forgotPassword: "Glömt lösenord?",
    logout: "Logga ut",
  },
  wallet: {
    deposit: "Insättning",
    withdraw: "Uttag",
    balance: "Saldo",
    transactions: "Transaktioner",
    history: "Historik",
    amount: "Belopp",
  },
};

// --- Context Types ---

interface TranslationContextValue {
  translations: Record<string, Record<string, string>>;
  language: string;
  loading: boolean;
}

const TranslationContext = createContext<TranslationContextValue>({
  translations: DEFAULT_TRANSLATIONS,
  language: defaultLocale,
  loading: false,
});

/** Extract locale from URL pathname, e.g. /sv/casino -> "sv", /casino -> defaultLocale */
function getLocaleFromPath(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  if (segment && isValidLocale(segment)) return segment;
  return defaultLocale;
}

// --- Provider ---

interface TranslationProviderProps {
  children: ReactNode;
  brand?: string;
}

export function TranslationProvider({
  children,
  brand = "swedbet",
}: TranslationProviderProps) {
  const pathname = usePathname();
  const language = getLocaleFromPath(pathname);

  const [translations, setTranslations] =
    useState<Record<string, Record<string, string>>>(DEFAULT_TRANSLATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSanityConfigured()) return;

    const namespaces = Object.keys(DEFAULT_TRANSLATIONS);
    setLoading(true);

    Promise.all(
      namespaces.map(async (ns) => {
        const result = await getTranslations(ns, language);
        return { ns, result };
      })
    )
      .then((results) => {
        setTranslations((prev) => {
          const next = { ...prev };
          for (const { ns, result } of results) {
            if (Object.keys(result).length > 0) {
              next[ns] = { ...prev[ns], ...result };
            }
          }
          return next;
        });
      })
      .catch(() => {
        // Keep defaults on error
      })
      .finally(() => {
        setLoading(false);
      });
  }, [language, brand]);

  // Set locale cookie for middleware to remember preference
  useEffect(() => {
    document.cookie = `odin_locale=${language};path=/;max-age=31536000`;
  }, [language]);

  return createElement(
    TranslationContext.Provider,
    { value: { translations, language, loading } },
    children
  );
}

// --- Hook ---

export function useTranslation(namespace?: string) {
  const { translations, language, loading } = useContext(TranslationContext);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      // If namespace is provided, look up directly: t("login")
      if (namespace && translations[namespace]) {
        const value = translations[namespace][key];
        if (value) return value;
      }

      // Support dotted keys: t("nav.login")
      if (key.includes(".")) {
        const [ns, ...rest] = key.split(".");
        const k = rest.join(".");
        if (translations[ns] && translations[ns][k]) {
          return translations[ns][k];
        }
      }

      // Search all namespaces for the key
      if (!namespace) {
        for (const ns of Object.keys(translations)) {
          if (translations[ns][key]) {
            return translations[ns][key];
          }
        }
      }

      return fallback || key;
    },
    [translations, namespace]
  );

  return { t, language, loading };
}

/** Build a locale-aware link. English (default) has no prefix, others get /{locale}/path */
export function useLocaleLink() {
  const { language } = useTranslation();

  return useCallback(
    (path: string): string => {
      if (language === defaultLocale) return path;
      // Avoid double prefix
      if (path.startsWith(`/${language}/`) || path === `/${language}`) return path;
      return `/${language}${path === "/" ? "" : path}`;
    },
    [language]
  );
}
