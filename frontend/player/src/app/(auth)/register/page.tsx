"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    personnummer: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Ange en giltig e-postadress.";
    }

    if (!form.username || form.username.length < 3) {
      errs.username = "Anvandarnamn maste vara minst 3 tecken.";
    }

    if (!form.password || form.password.length < 8) {
      errs.password = "Losenord maste vara minst 8 tecken.";
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Losenorden matchar inte.";
    }

    if (!form.dateOfBirth) {
      errs.dateOfBirth = "Fodelsedatum kravs.";
    } else {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }
      if (age < 18) {
        errs.dateOfBirth = "Du maste vara minst 18 ar for att registrera dig.";
      }
    }

    if (!form.personnummer || !/^\d{6,8}-?\d{4}$/.test(form.personnummer)) {
      errs.personnummer = "Ange ett giltigt personnummer (YYMMDD-XXXX).";
    }

    if (!form.acceptTerms) {
      errs.acceptTerms = "Du maste acceptera villkoren.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        username: form.username,
        dateOfBirth: form.dateOfBirth,
        country: "Sweden",
        acceptTerms: form.acceptTerms,
      });
      router.push("/");
    } catch (err) {
      const apiErr = err as ApiError;
      setApiError(
        apiErr.message || "Registreringen misslyckades. Forsok igen."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-white border rounded-xl px-4 py-3 text-sm text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-colors ${
      errors[field]
        ? "border-brand-danger/50 focus:border-brand-danger"
        : "border-brand-border focus:border-brand-primary"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brand-surface-alt">
      <div className="w-full max-w-lg">
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
            Skapa konto
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">
            Ga med i Swedbet och borja spela idag
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-brand-border"
        >
          {apiError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-brand-danger/20 text-brand-danger text-sm">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
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
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="din@email.se"
                className={inputClass("email")}
              />
              {errors.email && (
                <p className="text-xs text-brand-danger mt-1">{errors.email}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-brand-text mb-1.5"
              >
                Anvandarnamn
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                placeholder="Valj ett anvandarnamn"
                className={inputClass("username")}
              />
              {errors.username && (
                <p className="text-xs text-brand-danger mt-1">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-brand-text mb-1.5"
                >
                  Losenord
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Minst 8 tecken"
                  className={inputClass("password")}
                />
                {errors.password && (
                  <p className="text-xs text-brand-danger mt-1">
                    {errors.password}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-brand-text mb-1.5"
                >
                  Bekrafta losenord
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  placeholder="Upprepa losenord"
                  className={inputClass("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-brand-danger mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-brand-text mb-1.5"
              >
                Fodelsedatum
              </label>
              <input
                id="dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                max={
                  new Date(
                    new Date().setFullYear(new Date().getFullYear() - 18)
                  )
                    .toISOString()
                    .split("T")[0]
                }
                className={inputClass("dateOfBirth")}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-brand-danger mt-1">
                  {errors.dateOfBirth}
                </p>
              )}
              <p className="text-xs text-brand-text-muted mt-1">
                Du maste vara 18 ar eller aldre for att registrera dig.
              </p>
            </div>

            {/* Personnummer */}
            <div>
              <label
                htmlFor="personnummer"
                className="block text-sm font-medium text-brand-text mb-1.5"
              >
                Personnummer
              </label>
              <input
                id="personnummer"
                type="text"
                value={form.personnummer}
                onChange={(e) => updateField("personnummer", e.target.value)}
                placeholder="YYMMDD-XXXX"
                className={inputClass("personnummer")}
              />
              {errors.personnummer && (
                <p className="text-xs text-brand-danger mt-1">
                  {errors.personnummer}
                </p>
              )}
              <p className="text-xs text-brand-text-muted mt-1">
                Kravs for verifiering enligt svensk spellag.
              </p>
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={(e) => updateField("acceptTerms", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-xs text-brand-text-muted leading-relaxed">
                  Jag bekraftar att jag ar minst 18 ar och accepterar{" "}
                  <Link
                    href="#"
                    className="text-brand-primary hover:underline"
                  >
                    Allmanna villkor
                  </Link>{" "}
                  och{" "}
                  <Link
                    href="#"
                    className="text-brand-primary hover:underline"
                  >
                    Integritetspolicyn
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-brand-danger mt-1">
                  {errors.acceptTerms}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-bold py-3 rounded-pill transition-colors text-sm"
          >
            {loading ? "Skapar konto..." : "Skapa konto"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-brand-text-muted">
          Har du redan ett konto?{" "}
          <Link
            href="/login"
            className="text-brand-primary hover:text-brand-primary-hover font-semibold"
          >
            Logga in
          </Link>
        </p>
      </div>
    </div>
  );
}
