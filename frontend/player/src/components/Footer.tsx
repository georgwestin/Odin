"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { locales, defaultLocale, localeNames, isValidLocale, type Locale } from "@/lib/i18n-config";

const FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  sv: "🇸🇪",
  fi: "🇫🇮",
  no: "🇳🇴",
};

export function Footer() {
  const { language } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = language as Locale;

  function buildLocalePath(locale: Locale): string {
    let cleanPath = pathname;
    const firstSegment = pathname.split("/")[1];
    if (firstSegment && isValidLocale(firstSegment)) {
      cleanPath = pathname.replace(`/${firstSegment}`, "") || "/";
    }
    if (locale === defaultLocale) return cleanPath;
    return `/${locale}${cleanPath === "/" ? "" : cleanPath}`;
  }

  function switchLocale(locale: Locale) {
    document.cookie = `odin_locale=${locale};path=/;max-age=31536000`;
    router.push(buildLocalePath(locale));
  }

  // Build locale-aware links
  function l(path: string): string {
    if (currentLocale === defaultLocale) return path;
    if (path === "/") return `/${currentLocale}`;
    return `/${currentLocale}${path}`;
  }

  return (
    <footer className="bg-[#0f1923] text-white/50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span
                className="text-xl tracking-tight text-white"
                style={{ fontFamily: "'Asap', sans-serif", fontWeight: 700, fontStyle: "italic" }}
              >
                $wedBet.com
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {currentLocale === "sv"
                ? "Det smarta spelbolaget för svenska spelare. Licensierat av Spelinspektionen."
                : "The smart gaming company. Licensed by Spelinspektionen."}
            </p>
          </div>

          {/* Casino */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Casino</h4>
            <div className="space-y-2">
              <Link href={l("/casino")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Alla spel" : "All games"}
              </Link>
              <Link href={l("/casino?category=slots")} className="block text-sm hover:text-white transition-colors">
                Slots
              </Link>
              <Link href={l("/live-casino")} className="block text-sm hover:text-white transition-colors">
                Live Casino
              </Link>
              <Link href={l("/casino?category=table")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Bordsspel" : "Table games"}
              </Link>
            </div>
          </div>

          {/* Betting */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Betting</h4>
            <div className="space-y-2">
              <Link href={l("/sports")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Alla sporter" : "All sports"}
              </Link>
              <Link href={l("/sports?sport=football")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Fotboll" : "Football"}
              </Link>
              <Link href={l("/sports?sport=hockey")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Ishockey" : "Ice Hockey"}
              </Link>
              <Link href={l("/sports?sport=tennis")} className="block text-sm hover:text-white transition-colors">
                Tennis
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
            <div className="space-y-2">
              <Link href={l("/help")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Hjälpcenter" : "Help center"}
              </Link>
              <Link href={l("/contact")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Kontakta oss" : "Contact us"}
              </Link>
              <Link href={l("/terms")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Villkor" : "Terms"}
              </Link>
              <Link href={l("/privacy")} className="block text-sm hover:text-white transition-colors">
                {currentLocale === "sv" ? "Integritetspolicy" : "Privacy policy"}
              </Link>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">
              {currentLocale === "sv" ? "Språk" : "Language"}
            </h4>
            <div className="space-y-1.5">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => switchLocale(locale)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    locale === currentLocale
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-base">{FLAGS[locale]}</span>
                  <span>{localeNames[locale]}</span>
                  {locale === currentLocale && (
                    <svg className="w-3.5 h-3.5 ml-auto text-[#00CC9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            {currentLocale === "sv"
              ? "SwedBet drivs under svensk spellicens utfärdad av Spelinspektionen. 18+ | Spela ansvarsfullt."
              : "SwedBet operates under a Swedish gambling license issued by Spelinspektionen. 18+ | Play responsibly."}
          </p>
          <div className="flex gap-4">
            <a href="https://www.stodlinjen.se" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              stödlinjen.se
            </a>
            <a href="https://www.spelpaus.se" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              spelpaus.se
            </a>
            <a href="mailto:support@swedbet.com" className="hover:text-white">
              support@swedbet.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
