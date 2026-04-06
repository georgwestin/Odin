"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/stores/wallet";

const casinoCategories = [
  { href: "/casino", label: "Utforska", isHighlight: true },
  { href: "/casino?cat=jackpots", label: "Alla Jackpottar" },
  { href: "/casino?cat=multipotten", label: "Multipotten" },
  { href: "/casino?cat=jackpot-jakt", label: "SwedBet Jackpot Jakt" },
  { href: "/casino?cat=miljonchansen", label: "Miljonchansen" },
  { href: "/casino?cat=nya", label: "Nya Spel" },
  { href: "/casino?cat=exklusiva", label: "Exklusiva Spel" },
  { href: "/casino?cat=klassiker", label: "Klassiker" },
  { href: "/casino?cat=bonuskop", label: "Bonusköp" },
  { href: "/casino?cat=bordsspel", label: "Bordsspel" },
];

const liveCasinoCategories = [
  { href: "/live-casino", label: "Alla spel", isHighlight: true },
  { href: "/live-casino?cat=roulette", label: "Roulette" },
  { href: "/live-casino?cat=blackjack", label: "Blackjack" },
  { href: "/live-casino?cat=baccarat", label: "Baccarat" },
  { href: "/live-casino?cat=game-shows", label: "Game Shows" },
  { href: "/live-casino?cat=poker", label: "Poker" },
  { href: "/live-casino?cat=dice", label: "Dice" },
  { href: "/live-casino?cat=swedish", label: "Svenska bord" },
];

const sportCategories = [
  { href: "/sports", label: "Översikt", isHighlight: true },
  { href: "/sports?sport=football", label: "Fotboll" },
  { href: "/sports?sport=ice-hockey", label: "Ishockey" },
  { href: "/sports?sport=tennis", label: "Tennis" },
  { href: "/sports?sport=basketball", label: "Basket" },
  { href: "/sports?sport=handball", label: "Handboll" },
  { href: "/sports?sport=esports", label: "Esport" },
  { href: "/sports?sport=mma", label: "MMA" },
  { href: "/sports?live=true", label: "🔴 Live" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { balance, currency, fetchBalance } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated, fetchBalance]);

  const navLinks = [
    { href: "/casino", label: "Casino" },
    { href: "/live-casino", label: "Live Casino" },
    { href: "/sports", label: "Betting" },
    { href: "/casino?category=virtual", label: "Virtuellt" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " kr";
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Row 1: Responsible Gambling Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 h-11 flex items-center justify-between">
          {/* Left spacer for centering */}
          <div className="hidden md:block w-48" />

          {/* Center: RG Badges */}
          <div className="flex items-center gap-2">
            <a
              href="https://www.spelpaus.se"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium text-white"
              style={{ backgroundColor: "#3bb78f" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l2.5 2.5L16 9" />
              </svg>
              Spelpaus
            </a>
            <a
              href="/account#spelgranser"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium text-white"
              style={{ backgroundColor: "#3bb78f" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l2.5 2.5L16 9" />
              </svg>
              Spelgränser
            </a>
            <a
              href="/account#sjalvtest"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium text-white"
              style={{ backgroundColor: "#3bb78f" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l2.5 2.5L16 9" />
              </svg>
              Självtest
            </a>
          </div>

          {/* Right: CTA + Balance */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/wallet"
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 hidden sm:block"
                >
                  Hämta saldo
                </Link>
                <Link
                  href="/wallet"
                  className="inline-flex items-center px-5 py-1.5 rounded-pill text-sm font-bold text-white"
                  style={{ backgroundColor: "#44c868" }}
                >
                  Sätt in och spela
                </Link>
              </>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center px-5 py-1.5 rounded-pill text-sm font-bold text-white"
                style={{ backgroundColor: "#44c868" }}
              >
                Sätt in och spela
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Main Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 mr-8">
            <span
              className="text-2xl tracking-tight"
              style={{
                fontFamily: "'Asap', sans-serif",
                fontWeight: 700,
                fontStyle: "italic",
                color: "#272b33",
              }}
            >
              <span style={{ color: "#272b33" }}>$</span>wedBet.com
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
                  isActive(link.href)
                    ? "text-[#272b33] border-b-2 border-[#272b33]"
                    : "text-[#272b33] hover:text-[#0066ff]"
                }`}
                style={{ fontFamily: "'Asap', sans-serif" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side links */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/bonuses"
              className="text-sm font-medium text-[#272b33] hover:text-[#0066ff] transition-colors"
              style={{ fontFamily: "'Asap', sans-serif" }}
            >
              Erbjudanden
            </Link>
            <Link
              href="/support"
              className="text-sm font-medium text-[#272b33] hover:text-[#0066ff] transition-colors"
              style={{ fontFamily: "'Asap', sans-serif" }}
            >
              Kundtjänst
            </Link>
          </div>

          {/* Auth / User */}
          <div className="flex items-center gap-3 ml-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#272b33] hover:bg-gray-200 transition-colors"
                >
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-[#272b33]">{user?.username}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Saldo</p>
                        <p className="text-sm font-bold text-[#272b33]">{formatBalance(balance)}</p>
                      </div>
                      <Link href="/wallet" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#272b33] hover:bg-gray-50">
                        Sätt in
                      </Link>
                      <Link href="/account" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#272b33] hover:bg-gray-50">
                        Kontoinställningar
                      </Link>
                      <Link href="/bonuses" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#272b33] hover:bg-gray-50">
                        Erbjudanden
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                        >
                          Logga ut
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-[#272b33] hover:text-[#0066ff] transition-colors"
                style={{ fontFamily: "'Asap', sans-serif" }}
              >
                Redan medlem? Logga in
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 ml-2"
            aria-label="Visa meny"
          >
            <span className={`block w-5 h-0.5 bg-[#272b33] transition-transform ${mobileOpen ? "rotate-45 translate-y-1" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#272b33] transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#272b33] transition-transform ${mobileOpen ? "-rotate-45 -translate-y-1" : ""}`} />
          </button>
        </div>
      </div>

      {/* Row 3: Category Bar (blue gradient) — contextual per section */}
      <CategoryBar pathname={pathname} />

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-3 px-4 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-semibold ${
                isActive(link.href)
                  ? "bg-blue-50 text-[#0066ff]"
                  : "text-[#272b33] hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2">
            <Link href="/bonuses" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-[#272b33] hover:bg-gray-50">
              Erbjudanden
            </Link>
            <Link href="/support" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm text-[#272b33] hover:bg-gray-50">
              Kundtjänst
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// Contextual category bar — shows different categories based on current section
function CategoryBar({ pathname }: { pathname: string }) {
  let categories: { href: string; label: string; isHighlight?: boolean }[];
  let searchPlaceholder: string;
  let gradient: string;

  if (pathname.startsWith("/live-casino")) {
    categories = liveCasinoCategories;
    searchPlaceholder = "Sök live spel...";
    gradient = "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #4a1942 100%)";
  } else if (pathname.startsWith("/sports")) {
    categories = sportCategories;
    searchPlaceholder = "Sök lag eller liga...";
    gradient = "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)";
  } else {
    // Casino (default — also shown on homepage)
    categories = casinoCategories;
    searchPlaceholder = "Sök spel...";
    gradient = "linear-gradient(135deg, #4a8bc7 0%, #6ba3d9 50%, #7db0e2 100%)";
  }

  return (
    <div className="overflow-hidden" style={{ background: gradient }}>
      <div className="max-w-[1400px] mx-auto px-4 h-10 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {categories.map((cat) =>
          cat.isHighlight ? (
            <Link
              key={cat.href}
              href={cat.href}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1 rounded-pill text-xs font-bold text-white"
              style={{ backgroundColor: "#44c868" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              {cat.label}
            </Link>
          ) : (
            <Link
              key={cat.href}
              href={cat.href}
              className="shrink-0 px-3 py-1 text-xs font-medium text-white/90 hover:text-white transition-colors whitespace-nowrap"
              style={{ fontFamily: "'Asap', sans-serif" }}
            >
              {cat.label}
            </Link>
          )
        )}
        {/* Search */}
        <div className="shrink-0 ml-auto flex items-center gap-1.5 bg-white/15 rounded-pill px-3 py-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="bg-transparent text-xs text-white placeholder-white/50 border-none outline-none w-20 focus:w-32 transition-all"
            style={{ fontFamily: "'Asap', sans-serif" }}
          />
        </div>
      </div>
    </div>
  );
}
