"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, defaultLocale, localeNames, isValidLocale, type Locale } from "@/lib/i18n-config";
import { useTranslation } from "@/lib/i18n";

const FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  sv: "🇸🇪",
  fi: "🇫🇮",
  no: "🇳🇴",
};

export function LanguageSwitcher() {
  const { language } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const currentLocale = language as Locale;

  function switchLocale(newLocale: Locale) {
    setOpen(false);

    // Strip current locale prefix from pathname
    let cleanPath = pathname;
    const firstSegment = pathname.split("/")[1];
    if (firstSegment && isValidLocale(firstSegment)) {
      cleanPath = pathname.replace(`/${firstSegment}`, "") || "/";
    }

    // Build new path
    const newPath = newLocale === defaultLocale
      ? cleanPath
      : `/${newLocale}${cleanPath === "/" ? "" : cleanPath}`;

    // Set cookie so middleware remembers
    document.cookie = `odin_locale=${newLocale};path=/;max-age=31536000`;

    router.push(newPath);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
        style={{ color: "#272b33" }}
      >
        <span>{FLAG[currentLocale]}</span>
        <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                  locale === currentLocale ? "font-semibold text-[#0066FF]" : "text-[#272b33]"
                }`}
              >
                <span>{FLAG[locale]}</span>
                <span>{localeNames[locale]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
