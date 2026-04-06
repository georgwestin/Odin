"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Ange din e-post och ditt losenord.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Felaktig e-post eller losenord.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brand-surface-alt">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-6">
            <span className="font-heading font-black text-3xl text-brand-secondary">
              Swed
            </span>
            <span className="font-heading font-black text-3xl text-brand-primary">
              bet
            </span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-brand-text">
            Valkommen tillbaka
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">
            Logga in pa ditt Swedbet-konto
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-brand-border"
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-brand-danger/20 text-brand-danger text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-brand-text mb-1.5"
              >
                E-post
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-brand-text mb-1.5"
              >
                Losenord
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ange ditt losenord"
                  className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 pr-10 text-sm text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-xs text-brand-text-muted">Kom ihag mig</span>
            </label>
            <Link
              href="#"
              className="text-xs text-brand-primary hover:text-brand-primary-hover font-medium"
            >
              Glomt losenord?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white font-bold py-3 rounded-pill transition-colors text-sm"
          >
            {loading ? "Loggar in..." : "Logga in"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-brand-text-muted">
          Har du inget konto?{" "}
          <Link
            href="/register"
            className="text-brand-primary hover:text-brand-primary-hover font-semibold"
          >
            Skapa konto
          </Link>
        </p>
      </div>
    </div>
  );
}
