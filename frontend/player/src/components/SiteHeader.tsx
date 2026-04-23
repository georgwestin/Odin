"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RxChevronDown } from "react-icons/rx";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/stores/wallet";
import { useLocale } from "@/lib/locale-context";

const homeCategories = [
  { href: "/casino?cat=popular", label: "Popular Slots", icon: "thumbsup" },
  { href: "/sports?live=true", label: "Today's Matches", icon: "football" },
  { href: "/casino?cat=jackpots", label: "Largest Jackpots", icon: "euro" },
  { href: "/about", label: "About Swedbet", icon: "info" },
  { href: "/support", label: "Support", icon: "chat" },
];

const sportCategories = [
  { href: "/sports?sport=football", label: "Football" },
  { href: "/sports?sport=ice-hockey", label: "Hockey" },
  { href: "/sports?sport=tennis", label: "Tennis" },
  { href: "/sports?sport=basketball", label: "Basket" },
  { href: "/sports?sport=golf", label: "Golf" },
  { href: "/sports?sport=other", label: "Other" },
];

const slotCategories = [
  { href: "/casino?cat=popular", label: "Popular" },
  { href: "/casino?cat=highest-payout", label: "Highest Payout" },
  { href: "/casino?cat=jackpots", label: "Largest Jackpots" },
  { href: "/casino?cat=bonus-buy", label: "Bonus Buy" },
];

const blackjackCategories = [
  { href: "/casino?cat=bj-sidebets", label: "With Sidebets" },
  { href: "/casino?cat=bj-fast", label: "Fast Play" },
];

const rouletteCategories = [
  { href: "/casino?cat=roulette-eu", label: "European" },
  { href: "/casino?cat=roulette-us", label: "American" },
];

const liveCategories = [
  { href: "/live-casino?cat=blackjack", label: "BlackJack" },
  { href: "/live-casino?cat=roulette", label: "Roulette" },
  { href: "/live-casino?cat=game-shows", label: "Game Shows" },
];

/** Simple hook to replace useMediaQuery from relume */
function useIsMobile(breakpoint = 991) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { balance, currency, fetchBalance } = useWallet();
  const { locale } = useLocale();
  const isMobile = useIsMobile();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated, fetchBalance]);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/sports", label: "Sports Betting" },
    { href: "/casino", label: "Slots" },
    { href: "/casino?category=instant", label: "Originals" },
    { href: "/blackjack", label: "BlackJack" },
    { href: "/roulette", label: "Roulette" },
    { href: "/live-casino", label: "Live" },
  ];

  const moreLinks = [
    { href: "/support", label: locale === "sv" ? "Support" : "Support" },
    { href: "/about", label: locale === "sv" ? "Hur det fungerar" : "How it works" },
    { href: "/contact", label: locale === "sv" ? "Kontakta oss" : "Contact us" },
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

  const animateMobileMenu = mobileOpen ? "open" : "close";
  const animateMenuButton = mobileOpen ? ["open", "rotatePhase"] : "closed";
  const animateMoreMenu = moreOpen ? "open" : "close";
  const animateMoreIcon = moreOpen ? "rotated" : "initial";

  return (
    <header className="sticky top-0 z-50">
      {/* Main header bar */}
      <div className="header-gradient">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center min-h-16 md:min-h-[4.5rem]">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/logo-swedbet.png"
              alt="SwedBet"
              style={{ height: 42 }}
            />
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-base transition-colors ${
                  isActive(link.href)
                    ? "text-[#004B9A] font-semibold"
                    : "text-[#1a1a2e] hover:text-[#004B9A]"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* More dropdown (Relume pattern) */}
            <div
              className="relative"
              onMouseEnter={() => !isMobile && setMoreOpen(true)}
              onMouseLeave={() => !isMobile && setMoreOpen(false)}
            >
              <button
                className="flex items-center gap-1 px-4 py-2 text-base text-[#1a1a2e] hover:text-[#004B9A] transition-colors"
                onClick={() => setMoreOpen((v) => !v)}
              >
                More
                <motion.span
                  variants={{ rotated: { rotate: 180 }, initial: { rotate: 0 } }}
                  animate={animateMoreIcon}
                  transition={{ duration: 0.3 }}
                  className="inline-flex"
                >
                  <RxChevronDown className="text-[#1a1a2e]" />
                </motion.span>
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.nav
                    variants={{
                      open: { opacity: 1, y: 0, display: "block" },
                      close: { opacity: 0, y: "10%", display: "none" },
                    }}
                    initial="close"
                    animate="open"
                    exit="close"
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 z-50 mt-1 min-w-[180px] rounded-xl border border-white/10 bg-[#1a2634] p-2 shadow-xl"
                  >
                    {moreLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block rounded-lg px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => setMoreOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.nav>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CTA / Auth */}
          <div className="flex items-center gap-3 ml-4 lg:ml-8">
            {isAuthenticated ? (
              <>
                <Link
                  href="/wallet"
                  className="hidden sm:inline-flex items-center px-6 py-2.5 bg-[#004B9A] text-white text-sm font-semibold hover:bg-[#003d7a] transition-colors"
                >
                  Play Now
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full bg-[#004B9A] flex items-center justify-center text-xs font-bold text-white hover:bg-[#003d7a] transition-colors"
                  >
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-black">{user?.username}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500">Balance</p>
                          <p className="text-sm font-bold text-black">{formatBalance(balance)}</p>
                        </div>
                        <Link href="/wallet" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-black hover:bg-gray-50">Deposit</Link>
                        <Link href="/account" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-black hover:bg-gray-50">Account</Link>
                        <Link href="/bonuses" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-black hover:bg-gray-50">Bonuses</Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">Log out</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center px-6 py-2.5 bg-[#004B9A] text-white text-sm font-semibold hover:bg-[#003d7a] transition-colors"
              >
                Play Now
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex w-12 h-12 flex-col items-center justify-center gap-1.5 ml-3"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span className={`block w-6 h-0.5 bg-[#004B9A] transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-[#004B9A] transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-[#004B9A] transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

      </div>

      {/* Mobile slide-in menu from right */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-72 z-50 lg:hidden overflow-y-auto shadow-xl transition-transform duration-300 flex flex-col ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#FFD100" }}
      >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 h-16">
                <img src="/logo-swedbet.png" alt="SwedBet" style={{ height: 28 }} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-black/5"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004B9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* CTA */}
              <div className="px-5 py-3">
                <Link
                  href={isAuthenticated ? "/wallet" : "/register"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-full py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#004B9A" }}
                >
                  Play Now
                </Link>
              </div>

              {/* White section below Play Now */}
              <div className="bg-white flex-1">
              {/* Nav links */}
              <div className="px-5 pt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block py-3 text-base font-semibold border-b border-gray-100 ${
                      isActive(link.href) ? "text-[#004B9A]" : "text-[#1a1a2e]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {/* More links */}
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-base font-semibold text-[#1a1a2e] border-b border-gray-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Account */}
              <div className="px-5 mt-4 pt-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <>
                    <Link href="/wallet" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[#1a1a2e]/70 hover:text-[#1a1a2e]">Wallet</Link>
                    <Link href="/account" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[#1a1a2e]/70 hover:text-[#1a1a2e]">Account</Link>
                    <button onClick={() => { setMobileOpen(false); logout(); }} className="w-full text-left py-2 text-sm text-red-600">Log out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[#1a1a2e]/70 hover:text-[#1a1a2e]">Log in</Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[#1a1a2e]/70 hover:text-[#1a1a2e]">Register</Link>
                  </>
                )}
              </div>
              </div>{/* end white section */}
      </div>

      {/* Category Bar (blue gradient) */}
      {/* CategoryBar hidden for now */}
    </header>
  );
}

function MenuIcon({ name, color = "white" }: { name?: string; color?: string }) {
  if (!name) return null;
  const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "thumbsup":
      return <svg {...props}><path d="M7 10v12" /><path d="M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg>;
    case "football":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" /></svg>;
    case "euro":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M7 12h8" /><path d="M7 9h5" /><path d="M16 6a6 6 0 0 0-5-2c-3.3 0-6 3.1-6 7s2.7 7 6 7a6 6 0 0 0 5-2" /></svg>;
    case "info":
      return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>;
    case "chat":
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    default:
      return null;
  }
}

function CategoryBar({ pathname }: { pathname: string }) {
  let categories: { href: string; label: string; isHighlight?: boolean }[];
  let searchPlaceholder: string;
  let gradient: string;

  if (pathname.startsWith("/live-casino")) {
    categories = liveCategories;
    searchPlaceholder = "Search live games...";
    gradient = "linear-gradient(to right, #004B9A 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else if (pathname.startsWith("/sports")) {
    categories = sportCategories;
    searchPlaceholder = "Search teams or leagues...";
    gradient = "linear-gradient(to right, #004B9A 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else if (pathname.startsWith("/casino") && pathname.includes("roulette")) {
    categories = rouletteCategories;
    searchPlaceholder = "Search roulette...";
    gradient = "linear-gradient(to right, #004B9A 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else if (pathname.startsWith("/casino") && pathname.includes("table")) {
    categories = blackjackCategories;
    searchPlaceholder = "Search blackjack...";
    gradient = "linear-gradient(to right, #004B9A 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else if (pathname.startsWith("/casino")) {
    categories = slotCategories;
    searchPlaceholder = "Search slots...";
    gradient = "linear-gradient(to right, #004B9A 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else {
    categories = homeCategories;
    searchPlaceholder = "Search...";
    gradient = "linear-gradient(to right, #004B9A 0%, #4a8bc7 60%, #6ba3d9 100%)";
  }

  return (
    <div className="overflow-hidden" style={{ background: gradient }}>
      <div className="max-w-[1400px] mx-auto px-4 h-10 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {categories.map((cat) =>
          cat.isHighlight ? (
            <Link
              key={cat.href}
              href={cat.href}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold text-white"
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
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-white/90 hover:text-white transition-colors whitespace-nowrap"
              style={{ fontFamily: "'Asap', sans-serif" }}
            >
              <MenuIcon name={(cat as any).icon} />
              {cat.label}
            </Link>
          )
        )}
        {/* Search */}
        <div className="shrink-0 ml-auto flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
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
