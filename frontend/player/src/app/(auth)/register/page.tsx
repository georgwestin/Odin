"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useBrand } from "@/components/BrandProvider";
import type { ApiError } from "@/lib/api";

const COUNTRIES = [
  "United Kingdom",
  "Germany",
  "Sweden",
  "Finland",
  "Norway",
  "Denmark",
  "Netherlands",
  "Malta",
  "Ireland",
  "Canada",
  "Australia",
  "New Zealand",
  "Austria",
  "Switzerland",
  "Portugal",
  "Spain",
  "Italy",
  "France",
  "Belgium",
  "Brazil",
  "Japan",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const brand = useBrand();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    country: "",
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
      errs.email = "Please enter a valid email address.";
    }

    if (!form.username || form.username.length < 3) {
      errs.username = "Username must be at least 3 characters.";
    }

    if (!form.password || form.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (!form.dateOfBirth) {
      errs.dateOfBirth = "Date of birth is required.";
    } else {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        errs.dateOfBirth = "You must be at least 18 years old to register.";
      }
    }

    if (!form.country) {
      errs.country = "Please select your country.";
    }

    if (!form.acceptTerms) {
      errs.acceptTerms = "You must accept the terms and conditions.";
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
        country: form.country,
        acceptTerms: form.acceptTerms,
      });
      router.push("/");
    } catch (err) {
      const apiErr = err as ApiError;
      setApiError(apiErr.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-brand-background border rounded-lg px-4 py-3 text-sm text-white placeholder:text-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors ${
      errors[field]
        ? "border-brand-danger/50"
        : "border-white/10 focus:border-brand-primary/50"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-primary flex items-center justify-center font-heading font-extrabold text-black text-2xl">
            {brand.name.charAt(0)}
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">
            Create Account
          </h1>
          <p className="text-brand-text-muted text-sm mt-1">
            Join {brand.name} and start playing
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-brand-surface rounded-2xl p-6 sm:p-8 border border-white/5"
        >
          {apiError && (
            <div className="mb-4 p-3 rounded-lg bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                className={inputClass("email")}
              />
              {errors.email && (
                <p className="text-xs text-brand-danger mt-1">{errors.email}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                placeholder="Choose a username"
                className={inputClass("username")}
              />
              {errors.username && (
                <p className="text-xs text-brand-danger mt-1">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Min 8 characters"
                  className={inputClass("password")}
                />
                {errors.password && (
                  <p className="text-xs text-brand-danger mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="Repeat password"
                  className={inputClass("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-brand-danger mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Date of Birth
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
                <p className="text-xs text-brand-danger mt-1">{errors.dateOfBirth}</p>
              )}
              <p className="text-xs text-brand-text-muted mt-1">
                You must be 18 or older to register.
              </p>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Country
              </label>
              <select
                id="country"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className={inputClass("country")}
              >
                <option value="">Select your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="text-xs text-brand-danger mt-1">{errors.country}</p>
              )}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={(e) => updateField("acceptTerms", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-brand-background text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-xs text-brand-text-muted leading-relaxed">
                  I confirm I am at least 18 years old and I accept the{" "}
                  <Link href="#" className="text-brand-primary hover:underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-brand-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-brand-danger mt-1">{errors.acceptTerms}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-brand-text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-primary hover:text-brand-accent font-medium"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
