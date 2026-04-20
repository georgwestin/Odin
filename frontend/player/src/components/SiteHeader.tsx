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
    { href: "/sports", label: "SPORT" },
    { href: "/casino", label: "SLOTS" },
    { href: "/casino?category=table", label: "BLACKJACK" },
    { href: "/casino?category=roulette", label: "ROULETTE" },
    { href: "/live-casino", label: "LIVE" },
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

          {/* Desktop nav with Relume animated dropdown for "More" */}
          <div className="hidden lg:flex items-center">
            {navLinks.map((link, i) => (
              <span key={link.href} className="flex items-center">
                <Link
                  href={link.href}
                  className={`px-3 py-1.5 text-xl tracking-wide transition-colors ${
                    isActive(link.href)
                      ? "text-[#fdf04d]"
                      : "text-[#fdf04d] hover:text-white"
                  }`}
                  style={{ fontFamily: "'Agdasima', sans-serif", fontWeight: 700 }}
                >
                  {link.label}
                </Link>
                {i < navLinks.length - 1 && (
                  <span className="text-[#fdf04d]/60 text-xs select-none">&#x25CF;</span>
                )}
              </span>
            ))}

            {/* More dropdown (Relume pattern) */}
            <div
              className="relative"
              onMouseEnter={() => !isMobile && setMoreOpen(true)}
              onMouseLeave={() => !isMobile && setMoreOpen(false)}
            >
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xl tracking-wide text-[#fdf04d] hover:text-white transition-colors"
                style={{ fontFamily: "'Agdasima', sans-serif", fontWeight: 700 }}
                onClick={() => setMoreOpen((v) => !v)}
              >
                <span className="text-[#fdf04d]/60 text-xs select-none mr-2">&#x25CF;</span>
                MORE
                <motion.span
                  variants={{ rotated: { rotate: 180 }, initial: { rotate: 0 } }}
                  animate={animateMoreIcon}
                  transition={{ duration: 0.3 }}
                  className="inline-flex"
                >
                  <RxChevronDown className="text-[#fdf04d]" />
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
                  className="hidden sm:inline-flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full text-sm font-semibold bg-white text-[#272b33] hover:bg-gray-50 transition-colors"
                >
                  <span>Satt in och spela</span>
                  <span className="w-8 h-8 rounded-full bg-[#2c5aa0] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" fill="white" />
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                    </svg>
                  </span>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-8 h-8 rounded-full bg-[#2c5aa0] flex items-center justify-center text-xs font-bold text-white hover:bg-[#1e4a8a] transition-colors"
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
                        <Link href="/wallet" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#272b33] hover:bg-gray-50">Satt in</Link>
                        <Link href="/account" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#272b33] hover:bg-gray-50">Kontoinstellningar</Link>
                        <Link href="/bonuses" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-[#272b33] hover:bg-gray-50">Erbjudanden</Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">Logga ut</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex items-center gap-3 pl-5 pr-1.5 py-1.5 rounded-full text-sm font-semibold bg-white text-[#272b33] hover:bg-gray-50 transition-colors"
                >
                  <span>Satt in och spela</span>
                  <span className="w-8 h-8 rounded-full bg-[#2c5aa0] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" fill="white" />
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#2c5aa0] hover:underline transition-colors hidden sm:block"
                  style={{ fontFamily: "'Asap', sans-serif" }}
                >
                  Logga in
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger with Relume framer-motion animation */}
          <button
            className="lg:hidden -mr-2 flex size-12 flex-col items-center justify-center ml-3"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            <motion.span
              className="my-[3px] h-0.5 w-6 bg-[#2c5aa0]"
              animate={animateMenuButton}
              variants={{
                open: { translateY: 8, transition: { delay: 0.1 } },
                rotatePhase: { rotate: -45, transition: { delay: 0.2 } },
                closed: { translateY: 0, rotate: 0, transition: { duration: 0.2 } },
              }}
            />
            <motion.span
              className="my-[3px] h-0.5 w-6 bg-[#2c5aa0]"
              animate={animateMobileMenu}
              variants={{
                open: { width: 0, transition: { duration: 0.1 } },
                close: { width: "1.5rem", transition: { delay: 0.3, duration: 0.2 } },
              }}
            />
            <motion.span
              className="my-[3px] h-0.5 w-6 bg-[#2c5aa0]"
              animate={animateMenuButton}
              variants={{
                open: { translateY: -8, transition: { delay: 0.1 } },
                rotatePhase: { rotate: 45, transition: { delay: 0.2 } },
                closed: { translateY: 0, rotate: 0, transition: { duration: 0.2 } },
              }}
            />
          </button>
        </div>

        {/* Mobile slide-down menu (Relume pattern with framer-motion) */}
        <motion.div
          variants={{
            open: { height: "var(--height-open, 100dvh)" },
            close: { height: "var(--height-closed, 0)" },
          }}
          initial="close"
          animate={animateMobileMenu}
          transition={{ duration: 0.4 }}
          className="overflow-hidden lg:hidden lg:[--height-closed:auto] lg:[--height-open:auto]"
          style={{ backgroundColor: "#fdf04d" }}
        >
          <div className="px-[5%] pb-6">
            {/* Main nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-3 text-lg font-bold first:pt-7 ${
                  isActive(link.href)
                    ? "text-[#2c5aa0]"
                    : "text-[#272b33]"
                }`}
                style={{ fontFamily: "'Agdasima', sans-serif" }}
              >
                {link.label}
              </Link>
            ))}

            {/* More dropdown in mobile */}
            <div>
              <button
                className="flex w-full items-center justify-between gap-2 py-3 text-left text-lg font-bold text-[#272b33]"
                style={{ fontFamily: "'Agdasima', sans-serif" }}
                onClick={() => setMoreOpen((v) => !v)}
              >
                <span>MORE</span>
                <motion.span
                  variants={{ rotated: { rotate: 180 }, initial: { rotate: 0 } }}
                  animate={animateMoreIcon}
                  transition={{ duration: 0.3 }}
                >
                  <RxChevronDown />
                </motion.span>
              </button>
              <AnimatePresence>
                <motion.nav
                  variants={{
                    open: { visibility: "visible" as const, opacity: 1, height: "auto" },
                    close: { visibility: "hidden" as const, opacity: 0, height: 0 },
                  }}
                  animate={animateMoreMenu}
                  initial="close"
                  exit="close"
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3 pl-[5%] text-base text-[#272b33]/80 hover:text-[#272b33]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.nav>
              </AnimatePresence>
            </div>

            {/* Quick links for current section */}
            <div className="mt-4 pt-4 border-t border-[#272b33]/10">
              <p className="text-[10px] font-bold text-[#272b33]/40 uppercase tracking-wider mb-2">Quick Links</p>
              {(pathname.startsWith("/sports") ? sportCategories :
                pathname.startsWith("/live-casino") ? liveCategories :
                pathname.startsWith("/casino") && pathname.includes("roulette") ? rouletteCategories :
                pathname.startsWith("/casino") && pathname.includes("table") ? blackjackCategories :
                pathname.startsWith("/casino") ? slotCategories :
                homeCategories
              ).map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm text-[#272b33]/70 hover:text-[#272b33]"
                >
                  <MenuIcon name={(cat as any).icon} color="#272b33" />
                  {cat.label}
                </Link>
              ))}
            </div>

            {/* CTA button */}
            <div className="mt-6">
              <Link
                href={isAuthenticated ? "/wallet" : "/register"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: "#2c5aa0" }}
              >
                Satt in och spela
              </Link>
            </div>

            {/* Account links */}
            <div className="mt-4 pt-4 border-t border-[#272b33]/10">
              {isAuthenticated ? (
                <>
                  <Link href="/wallet" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[#272b33]/70 hover:text-[#272b33]">
                    Wallet
                  </Link>
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[#272b33]/70 hover:text-[#272b33]">
                    Account Settings
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="w-full text-left py-2 text-sm text-red-600"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[#272b33]/70 hover:text-[#272b33]">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[#272b33]/70 hover:text-[#272b33]">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Category Bar (blue gradient) */}
      <CategoryBar pathname={pathname} />
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
    gradient = "linear-gradient(to right, #2c5aa0 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else if (pathname.startsWith("/sports")) {
    categories = sportCategories;
    searchPlaceholder = "Search teams or leagues...";
    gradient = "linear-gradient(to right, #2c5aa0 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else if (pathname.startsWith("/casino") && pathname.includes("roulette")) {
    categories = rouletteCategories;
    searchPlaceholder = "Search roulette...";
    gradient = "linear-gradient(to right, #2c5aa0 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else if (pathname.startsWith("/casino") && pathname.includes("table")) {
    categories = blackjackCategories;
    searchPlaceholder = "Search blackjack...";
    gradient = "linear-gradient(to right, #2c5aa0 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else if (pathname.startsWith("/casino")) {
    categories = slotCategories;
    searchPlaceholder = "Search slots...";
    gradient = "linear-gradient(to right, #2c5aa0 0%, #4a8bc7 60%, #6ba3d9 100%)";
  } else {
    categories = homeCategories;
    searchPlaceholder = "Search...";
    gradient = "linear-gradient(to right, #2c5aa0 0%, #4a8bc7 60%, #6ba3d9 100%)";
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
