"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BiLogoFacebookCircle,
  BiLogoInstagram,
  BiLogoLinkedinSquare,
  BiLogoYoutube,
} from "react-icons/bi";
import { FaXTwitter } from "react-icons/fa6";
import { useBrand } from "@/components/BrandProvider";
import { useLocale } from "@/lib/locale-context";
import { localeNames, isValidLocale, type Locale } from "@/lib/i18n-config";

const FLAGS: Record<Locale, string> = {
  en: "\u{1F1EC}\u{1F1E7}",
  sv: "\u{1F1F8}\u{1F1EA}",
  fi: "\u{1F1EB}\u{1F1EE}",
  no: "\u{1F1F3}\u{1F1F4}",
};

export function Footer() {
  const brand = useBrand();
  const { locale: currentLocale, setLocale } = useLocale();
  const [email, setEmail] = useState("");

  const availableLocales = (brand.supportedLanguages || ["sv", "en"]).filter(
    (l): l is Locale => isValidLocale(l)
  );

  const isSv = currentLocale === "sv";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email });
    setEmail("");
  };

  return (
    <footer className="bg-[#0f1923] text-white/50 px-[5%] py-12 md:py-18 lg:py-20">
      <div className="container mx-auto">
        {/* Top grid: brand + newsletter | link columns */}
        <div className="grid grid-cols-1 gap-x-[8vw] gap-y-12 pb-12 md:gap-y-16 md:pb-18 lg:grid-cols-[0.75fr_1fr] lg:gap-y-4 lg:pb-20">
          {/* Brand + Newsletter */}
          <div className="flex flex-col">
            <Link href="/" className="mb-5 md:mb-6 inline-block">
              <div
                className="flex items-center justify-center rounded-lg overflow-hidden"
                style={{ backgroundColor: "#fdf04d", height: 32, padding: "0 6px" }}
              >
                <img src="/logo-swedbet.png" alt="SwedBet" style={{ height: 24 }} />
              </div>
            </Link>
            <p className="mb-5 text-sm leading-relaxed md:mb-6">
              {isSv
                ? "Det smarta spelbolaget for svenska spelare. Licensierat av Spelinspektionen. Fa de senaste nyheterna och exklusiva erbjudanden direkt till din inkorg varje vecka."
                : "The smart gaming company. Licensed by Spelinspektionen. Get the latest news and exclusive offers delivered straight to your inbox each week."}
            </p>
            <div className="w-full max-w-md">
              <form
                className="mb-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[1fr_max-content] md:gap-y-4"
                onSubmit={handleSubmit}
              >
                <input
                  id="footer-email"
                  type="email"
                  placeholder={isSv ? "Ange e-post" : "Enter email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  {isSv ? "Prenumerera" : "Join"}
                </button>
              </form>
              <p className="text-xs text-white/40">
                {isSv
                  ? "Du godkanner var integritetspolicy och samtycker till att ta emot uppdateringar."
                  : "You agree to our Privacy Policy and consent to receive company updates."}
              </p>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-1 items-start gap-y-10 sm:grid-cols-4 sm:gap-x-6 md:gap-x-8 md:gap-y-4">
            {/* Casino */}
            <div className="flex flex-col items-start justify-start">
              <h2 className="mb-3 font-semibold text-white md:mb-4">Casino</h2>
              <ul>
                <li className="py-2 text-sm">
                  <Link href="/casino" className="hover:text-white transition-colors">
                    {isSv ? "Alla spel" : "All games"}
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/casino?category=slots" className="hover:text-white transition-colors">
                    Slots
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/live-casino" className="hover:text-white transition-colors">
                    Live Casino
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/casino?category=table" className="hover:text-white transition-colors">
                    {isSv ? "Bordsspel" : "Table games"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Betting */}
            <div className="flex flex-col items-start justify-start">
              <h2 className="mb-3 font-semibold text-white md:mb-4">Betting</h2>
              <ul>
                <li className="py-2 text-sm">
                  <Link href="/sports" className="hover:text-white transition-colors">
                    {isSv ? "Alla sporter" : "All sports"}
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/sports?sport=football" className="hover:text-white transition-colors">
                    {isSv ? "Fotboll" : "Football"}
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/sports?sport=hockey" className="hover:text-white transition-colors">
                    {isSv ? "Ishockey" : "Ice Hockey"}
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/sports?sport=tennis" className="hover:text-white transition-colors">
                    Tennis
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="flex flex-col items-start justify-start">
              <h2 className="mb-3 font-semibold text-white md:mb-4">Support</h2>
              <ul>
                <li className="py-2 text-sm">
                  <Link href="/help" className="hover:text-white transition-colors">
                    {isSv ? "Hjalpcenter" : "Help center"}
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/contact" className="hover:text-white transition-colors">
                    {isSv ? "Kontakta oss" : "Contact us"}
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/terms" className="hover:text-white transition-colors">
                    {isSv ? "Villkor" : "Terms"}
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    {isSv ? "Integritetspolicy" : "Privacy policy"}
                  </Link>
                </li>
                <li className="py-2 text-sm">
                  <a href="https://www.stodlinjen.se" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    {isSv ? "Ansvarsfullt spelande" : "Responsible Gaming"}
                  </a>
                </li>
              </ul>
            </div>

            {/* Social + Language */}
            <div className="flex flex-col items-start justify-start">
              <h2 className="mb-3 font-semibold text-white md:mb-4">
                {isSv ? "Folj oss" : "Follow us"}
              </h2>
              <ul className="flex flex-col items-start mb-6">
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3 hover:text-white transition-colors">
                    <BiLogoFacebookCircle className="size-5" />
                    <span>Facebook</span>
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3 hover:text-white transition-colors">
                    <BiLogoInstagram className="size-5" />
                    <span>Instagram</span>
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3 hover:text-white transition-colors">
                    <FaXTwitter className="size-5 p-0.5" />
                    <span>X</span>
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3 hover:text-white transition-colors">
                    <BiLogoLinkedinSquare className="size-5" />
                    <span>LinkedIn</span>
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3 hover:text-white transition-colors">
                    <BiLogoYoutube className="size-5" />
                    <span>Youtube</span>
                  </a>
                </li>
              </ul>

              {/* Language selector */}
              <h2 className="mb-3 font-semibold text-white md:mb-4">
                {isSv ? "Sprak" : "Language"}
              </h2>
              <div className="space-y-1.5">
                {availableLocales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocale(loc)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      loc === currentLocale
                        ? "bg-white/10 text-white font-medium"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="text-base">{FLAGS[loc]}</span>
                    <span>{localeNames[loc]}</span>
                    {loc === currentLocale && (
                      <svg className="w-3.5 h-3.5 ml-auto text-[#00CC9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/10" />

        {/* Bottom bar */}
        <div className="flex flex-col-reverse items-start justify-between pb-4 pt-6 text-xs md:flex-row md:items-center md:pb-0 md:pt-8">
          <p className="mt-6 md:mt-0">
            {isSv
              ? "SwedBet drivs under svensk spellicens utfardad av Spelinspektionen. 18+ | Spela ansvarsfullt."
              : "SwedBet operates under a Swedish gambling license issued by Spelinspektionen. 18+ | Play responsibly."}
          </p>
          <ul className="grid grid-flow-row grid-cols-[max-content] justify-center gap-y-4 text-sm md:grid-flow-col md:gap-x-6 md:gap-y-0">
            <li className="underline">
              <Link href="/privacy">{isSv ? "Integritetspolicy" : "Privacy Policy"}</Link>
            </li>
            <li className="underline">
              <Link href="/terms">{isSv ? "Villkor" : "Terms of Service"}</Link>
            </li>
            <li>
              <a href="https://www.stodlinjen.se" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                stodlinjen.se
              </a>
            </li>
            <li>
              <a href="https://www.spelpaus.se" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                spelpaus.se
              </a>
            </li>
            <li>
              <a href="mailto:support@swedbet.com" className="hover:text-white">
                support@swedbet.com
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
