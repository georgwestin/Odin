"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

interface ResponsibleGamblingLimits {
  dailyDeposit: number | null;
  weeklyDeposit: number | null;
  monthlyDeposit: number | null;
  sessionTimeMinutes: number | null;
  coolingOffUntil: string | null;
  selfExcludedUntil: string | null;
}

export default function AccountPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<"profile" | "kyc" | "responsible">("profile");

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    dateOfBirth: "",
    country: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // KYC state
  const [kycStatus, setKycStatus] = useState<string>("pending");
  const [kycUploading, setKycUploading] = useState(false);

  // Responsible gambling state
  const [limits, setLimits] = useState<ResponsibleGamblingLimits>({
    dailyDeposit: null,
    weeklyDeposit: null,
    monthlyDeposit: null,
    sessionTimeMinutes: null,
    coolingOffUntil: null,
    selfExcludedUntil: null,
  });
  const [limitsSaving, setLimitsSaving] = useState(false);
  const [limitsMessage, setLimitsMessage] = useState<string | null>(null);
  const [coolingOffDays, setCoolingOffDays] = useState("");
  const [selfExclusionMonths, setSelfExclusionMonths] = useState("");

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        username: user.username,
        dateOfBirth: user.dateOfBirth,
        country: user.country,
      });
      setKycStatus(user.kycStatus);
    }

    api
      .get<ResponsibleGamblingLimits>("/account/responsible-gambling")
      .then((data) => setLimits(data))
      .catch(() => {});
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await api.patch("/account/profile", {
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      setProfileMessage("Profile updated successfully.");
    } catch {
      setProfileMessage("Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleKycUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setKycUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/account/kyc/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("odin_access_token")}`,
          },
          body: formData,
        }
      );
      setKycStatus("pending");
    } catch {
      // Upload failed
    } finally {
      setKycUploading(false);
    }
  };

  const handleLimitsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLimitsSaving(true);
    setLimitsMessage(null);
    try {
      await api.put("/account/responsible-gambling", {
        dailyDeposit: limits.dailyDeposit,
        weeklyDeposit: limits.weeklyDeposit,
        monthlyDeposit: limits.monthlyDeposit,
        sessionTimeMinutes: limits.sessionTimeMinutes,
      });
      setLimitsMessage("Limits updated successfully.");
    } catch {
      setLimitsMessage("Failed to update limits.");
    } finally {
      setLimitsSaving(false);
    }
  };

  const handleCoolingOff = async () => {
    const days = parseInt(coolingOffDays);
    if (!days || days <= 0) return;
    try {
      await api.post("/account/responsible-gambling/cooling-off", { days });
      const until = new Date();
      until.setDate(until.getDate() + days);
      setLimits((prev) => ({ ...prev, coolingOffUntil: until.toISOString() }));
      setCoolingOffDays("");
      setLimitsMessage(`Cooling-off period activated for ${days} days.`);
    } catch {
      setLimitsMessage("Failed to activate cooling-off.");
    }
  };

  const handleSelfExclusion = async () => {
    const months = parseInt(selfExclusionMonths);
    if (!months || months <= 0) return;
    if (
      !window.confirm(
        `Are you sure you want to self-exclude for ${months} month(s)? This action cannot be reversed early.`
      )
    )
      return;
    try {
      await api.post("/account/responsible-gambling/self-exclusion", { months });
      const until = new Date();
      until.setMonth(until.getMonth() + months);
      setLimits((prev) => ({
        ...prev,
        selfExcludedUntil: until.toISOString(),
      }));
      setSelfExclusionMonths("");
      setLimitsMessage(`Self-exclusion activated for ${months} month(s).`);
    } catch {
      setLimitsMessage("Failed to activate self-exclusion.");
    }
  };

  const sections = [
    { id: "profile" as const, label: "Profile" },
    { id: "kyc" as const, label: "KYC Verification" },
    { id: "responsible" as const, label: "Responsible Gambling" },
  ];

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-white mb-8">
        Account Settings
      </h1>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-brand-surface rounded-lg p-1 mb-8 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 shrink-0 py-2.5 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeSection === s.id
                ? "bg-brand-primary text-black"
                : "text-brand-text-muted hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Profile Section */}
      {activeSection === "profile" && (
        <form
          onSubmit={handleProfileSave}
          className="bg-brand-surface rounded-xl p-6 border border-white/5"
        >
          {profileMessage && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                profileMessage.includes("success")
                  ? "bg-brand-success/10 text-brand-success"
                  : "bg-brand-danger/10 text-brand-danger"
              }`}
            >
              {profileMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, firstName: e.target.value }))
                }
                className="w-full bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, lastName: e.target.value }))
                }
                className="w-full bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-brand-background/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-brand-text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full bg-brand-background/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-brand-text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Date of Birth
              </label>
              <input
                type="text"
                value={profile.dateOfBirth}
                disabled
                className="w-full bg-brand-background/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-brand-text-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={profile.country}
                disabled
                className="w-full bg-brand-background/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-brand-text-muted cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileSaving}
            className="mt-6 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-black font-bold px-8 py-3 rounded-lg transition-colors text-sm"
          >
            {profileSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* KYC Section */}
      {activeSection === "kyc" && (
        <div className="bg-brand-surface rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                kycStatus === "verified"
                  ? "bg-brand-success/20"
                  : kycStatus === "rejected"
                  ? "bg-brand-danger/20"
                  : "bg-brand-warning/20"
              }`}
            >
              {kycStatus === "verified" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-success">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : kycStatus === "rejected" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-danger">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-warning">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white capitalize">
                {kycStatus}
              </h3>
              <p className="text-sm text-brand-text-muted">
                {kycStatus === "verified"
                  ? "Your identity has been verified."
                  : kycStatus === "rejected"
                  ? "Verification was rejected. Please upload new documents."
                  : "Verification pending. Upload your ID document."}
              </p>
            </div>
          </div>

          {kycStatus !== "verified" && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">
                  Upload ID Document
                </h4>
                <p className="text-xs text-brand-text-muted mb-3">
                  Accepted: Passport, Driver&apos;s License, National ID Card. Max
                  file size: 5MB. Formats: JPG, PNG, PDF.
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleKycUpload}
                    disabled={kycUploading}
                    className="block w-full text-sm text-brand-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-black hover:file:bg-brand-primary-hover file:cursor-pointer file:transition-colors"
                  />
                </label>
                {kycUploading && (
                  <p className="text-xs text-brand-primary mt-2">Uploading...</p>
                )}
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">
                  Proof of Address
                </h4>
                <p className="text-xs text-brand-text-muted mb-3">
                  Utility bill, bank statement, or official letter dated within
                  the last 3 months.
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleKycUpload}
                    disabled={kycUploading}
                    className="block w-full text-sm text-brand-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-black hover:file:bg-brand-primary-hover file:cursor-pointer file:transition-colors"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Responsible Gambling Section */}
      {activeSection === "responsible" && (
        <div className="space-y-6">
          {limitsMessage && (
            <div
              className={`p-3 rounded-lg text-sm ${
                limitsMessage.includes("success") || limitsMessage.includes("activated")
                  ? "bg-brand-success/10 text-brand-success"
                  : "bg-brand-danger/10 text-brand-danger"
              }`}
            >
              {limitsMessage}
            </div>
          )}

          {/* Deposit Limits */}
          <form
            onSubmit={handleLimitsSave}
            className="bg-brand-surface rounded-xl p-6 border border-white/5"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Deposit Limits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  Daily Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={limits.dailyDeposit ?? ""}
                  onChange={(e) =>
                    setLimits((l) => ({
                      ...l,
                      dailyDeposit: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="No limit"
                  className="w-full bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  Weekly Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={limits.weeklyDeposit ?? ""}
                  onChange={(e) =>
                    setLimits((l) => ({
                      ...l,
                      weeklyDeposit: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="No limit"
                  className="w-full bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                  Monthly Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={limits.monthlyDeposit ?? ""}
                  onChange={(e) =>
                    setLimits((l) => ({
                      ...l,
                      monthlyDeposit: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="No limit"
                  className="w-full bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
            </div>

            {/* Session Time Limit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text-muted mb-1.5">
                Session Time Limit (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={limits.sessionTimeMinutes ?? ""}
                onChange={(e) =>
                  setLimits((l) => ({
                    ...l,
                    sessionTimeMinutes: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="No limit"
                className="w-full sm:max-w-xs bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>

            <button
              type="submit"
              disabled={limitsSaving}
              className="bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-black font-bold px-8 py-3 rounded-lg transition-colors text-sm"
            >
              {limitsSaving ? "Saving..." : "Save Limits"}
            </button>
          </form>

          {/* Cooling-Off */}
          <div className="bg-brand-surface rounded-xl p-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-2">
              Cooling-Off Period
            </h3>
            <p className="text-sm text-brand-text-muted mb-4">
              Take a break from gambling. During the cooling-off period, you
              cannot place bets or make deposits.
            </p>
            {limits.coolingOffUntil &&
            new Date(limits.coolingOffUntil) > new Date() ? (
              <div className="bg-brand-warning/10 border border-brand-warning/20 rounded-lg p-4">
                <p className="text-sm text-brand-warning font-medium">
                  Cooling-off active until{" "}
                  {new Date(limits.coolingOffUntil).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <select
                  value={coolingOffDays}
                  onChange={(e) => setCoolingOffDays(e.target.value)}
                  className="bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                >
                  <option value="">Select duration</option>
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
                <button
                  onClick={handleCoolingOff}
                  disabled={!coolingOffDays}
                  className="bg-brand-warning hover:bg-brand-warning/80 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Activate
                </button>
              </div>
            )}
          </div>

          {/* Self-Exclusion */}
          <div className="bg-brand-surface rounded-xl p-6 border border-brand-danger/20">
            <h3 className="text-lg font-semibold text-brand-danger mb-2">
              Self-Exclusion
            </h3>
            <p className="text-sm text-brand-text-muted mb-4">
              Self-exclusion completely blocks your account for the chosen
              period. This action cannot be reversed early. Use this if you feel
              you need a longer break.
            </p>
            {limits.selfExcludedUntil &&
            new Date(limits.selfExcludedUntil) > new Date() ? (
              <div className="bg-brand-danger/10 border border-brand-danger/20 rounded-lg p-4">
                <p className="text-sm text-brand-danger font-medium">
                  Self-excluded until{" "}
                  {new Date(limits.selfExcludedUntil).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <select
                  value={selfExclusionMonths}
                  onChange={(e) => setSelfExclusionMonths(e.target.value)}
                  className="bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                >
                  <option value="">Select duration</option>
                  <option value="6">6 months</option>
                  <option value="12">1 year</option>
                  <option value="24">2 years</option>
                  <option value="60">5 years</option>
                </select>
                <button
                  onClick={handleSelfExclusion}
                  disabled={!selfExclusionMonths}
                  className="bg-brand-danger hover:bg-brand-danger/80 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  Self-Exclude
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
