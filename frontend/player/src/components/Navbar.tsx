"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/stores/wallet";
import { useBrand } from "@/components/BrandProvider";
import { useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { balance, currency, fetchBalance } = useWallet();
  const brand = useBrand();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated, fetchBalance]);

  const navLinks = [
    { href: "/", label: "Home" },
    ...(brand.features.casino ? [{ href: "/casino", label: "Casino" }] : []),
    ...(brand.features.sports ? [{ href: "/sports", label: "Sports" }] : []),
    ...(brand.features.liveCasino
      ? [{ href: "/casino?category=live", label: "Live Casino" }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-secondary/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center font-heading font-bold text-black text-sm">
            {brand.name.charAt(0)}
          </div>
          <span className="font-heading font-bold text-lg text-white hidden sm:block">
            {brand.name}
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "text-brand-text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Balance */}
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-2 bg-brand-surface px-3 py-1.5 rounded-lg hover:bg-brand-surface-alt transition-colors"
              >
                <span className="text-brand-text-muted text-xs">Balance</span>
                <span className="text-brand-primary font-semibold text-sm">
                  {formatBalance(balance)}
                </span>
              </Link>

              {/* Deposit Button */}
              <Link
                href="/wallet"
                className="bg-brand-primary hover:bg-brand-primary-hover text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Deposit
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-9 h-9 rounded-full bg-brand-surface-alt flex items-center justify-center text-sm font-semibold text-brand-primary hover:ring-2 hover:ring-brand-primary/50 transition-all"
                >
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-brand-surface border border-white/10 rounded-xl shadow-2xl z-50 py-2">
                      <div className="px-4 py-2 border-b border-white/5">
                        <p className="text-sm font-medium text-white">
                          {user?.username}
                        </p>
                        <p className="text-xs text-brand-text-muted">
                          {user?.email}
                        </p>
                      </div>
                      <div className="sm:hidden px-4 py-2 border-b border-white/5">
                        <p className="text-xs text-brand-text-muted">Balance</p>
                        <p className="text-sm font-semibold text-brand-primary">
                          {formatBalance(balance)}
                        </p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-brand-text hover:bg-white/5"
                      >
                        Account Settings
                      </Link>
                      <Link
                        href="/wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-brand-text hover:bg-white/5"
                      >
                        Wallet
                      </Link>
                      <Link
                        href="/bonuses"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-brand-text hover:bg-white/5"
                      >
                        Bonuses
                      </Link>
                      <div className="border-t border-white/5 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-brand-danger hover:bg-white/5"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-brand-text-muted hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-brand-primary hover:bg-brand-primary-hover text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-0.5 bg-white transition-transform ${
                mobileOpen ? "rotate-45 translate-y-1" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-white transition-opacity ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-white transition-transform ${
                mobileOpen ? "-rotate-45 -translate-y-1" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-secondary border-t border-white/5 py-3 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                isActive(link.href)
                  ? "bg-brand-primary/20 text-brand-primary"
                  : "text-brand-text-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
