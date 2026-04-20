"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/stores/wallet";
import { useBrand } from "@/components/BrandProvider";

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
    ...(brand.features.casino ? [{ href: "/casino", label: "Casino" }] : []),
    ...(brand.features.liveCasino
      ? [{ href: "/live-casino", label: "Live Casino" }]
      : []),
    ...(brand.features.sports ? [{ href: "/sports", label: "Betting" }] : []),
    { href: "/casino?category=virtual", label: "Virtuellt" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("?")[0]);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-white shadow-nav border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <span className="font-heading font-black text-2xl tracking-tight text-brand-secondary">
            Swed
          </span>
          <span className="font-heading font-black text-2xl tracking-tight text-brand-primary">
            bet
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 ml-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-alt"
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
              {/* Balance Pill */}
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-2 bg-brand-surface-alt px-4 py-2 rounded-pill border border-brand-border hover:shadow-card transition-shadow"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-brand-primary"
                >
                  <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                  <path d="M3 5v14a2 2 0 002 2h16v-5" />
                  <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <span className="text-brand-text font-semibold text-sm">
                  {formatBalance(balance)}
                </span>
              </Link>

              {/* Deposit Button */}
              <Link
                href="/wallet"
                className="bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-sm px-5 py-2 rounded-pill transition-colors"
              >
                Satt in
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-sm font-semibold text-brand-primary hover:bg-brand-primary/20 transition-colors"
                >
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-brand-border rounded-xl shadow-card-hover z-50 py-1 animate-fade-in">
                      <div className="px-4 py-3 border-b border-brand-border">
                        <p className="text-sm font-medium text-brand-text">
                          {user?.username}
                        </p>
                        <p className="text-xs text-brand-text-muted">
                          {user?.email}
                        </p>
                      </div>
                      <div className="sm:hidden px-4 py-2 border-b border-brand-border">
                        <p className="text-xs text-brand-text-muted">Saldo</p>
                        <p className="text-sm font-semibold text-brand-primary">
                          {formatBalance(balance)}
                        </p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-brand-text hover:bg-brand-surface-alt"
                      >
                        Kontoinst&auml;llningar
                      </Link>
                      <Link
                        href="/wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-brand-text hover:bg-brand-surface-alt"
                      >
                        Pl&aring;nbok
                      </Link>
                      <Link
                        href="/bonuses"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-brand-text hover:bg-brand-surface-alt"
                      >
                        Erbjudanden
                      </Link>
                      <div className="border-t border-brand-border mt-1 pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-brand-danger hover:bg-red-50"
                        >
                          Logga ut
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
                className="text-sm font-medium text-brand-text-muted hover:text-brand-text transition-colors"
              >
                Logga in
              </Link>
              <Link
                href="/register"
                className="bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold text-sm px-5 py-2 rounded-pill transition-colors"
              >
                Registrera
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Visa meny"
          >
            <span
              className={`block w-5 h-0.5 bg-brand-text transition-transform ${
                mobileOpen ? "rotate-45 translate-y-1" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-brand-text transition-opacity ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-brand-text transition-transform ${
                mobileOpen ? "-rotate-45 -translate-y-1" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-brand-border py-3 px-4 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-medium ${
                isActive(link.href)
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-alt"
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
