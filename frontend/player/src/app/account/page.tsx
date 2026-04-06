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
  const [activeSection, setActiveSection] = useState<
    "profile" | "kyc" | "limits" | "history" | "exclusion"
  >("profile");

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
      setProfileMessage("Profilen uppdaterad.");
    } catch {
      setProfileMessage("Kunde inte uppdatera profilen.");
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
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
        }/account/kyc/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "odin_access_token"
            )}`,
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
      setLimitsMessage("Granser uppdaterade.");
    } catch {
      setLimitsMessage("Kunde inte uppdatera granser.");
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
      setLimits((prev) => ({
        ...prev,
        coolingOffUntil: until.toISOString(),
      }));
      setCoolingOffDays("");
      setLimitsMessage(`Avkylningsperiod aktiverad i ${days} dagar.`);
    } catch {
      setLimitsMessage("Kunde inte aktivera avkylningsperiod.");
    }
  };

  const handleSelfExclusion = async () => {
    const months = parseInt(selfExclusionMonths);
    if (!months || months <= 0) return;
    if (
      !window.confirm(
        `Ar du saker pa att du vill sjalvavstanga dig i ${months} manad(er)? Detta kan inte angras.`
      )
    )
      return;
    try {
      await api.post("/account/responsible-gambling/self-exclusion", {
        months,
      });
      const until = new Date();
      until.setMonth(until.getMonth() + months);
      setLimits((prev) => ({
        ...prev,
        selfExcludedUntil: until.toISOString(),
      }));
      setSelfExclusionMonths("");
      setLimitsMessage(
        `Sjalvavstangning aktiverad i ${months} manad(er).`
      );
    } catch {
      setLimitsMessage("Kunde inte aktivera sjalvavstangning.");
    }
  };

  const sections = [
    { id: "profile" as const, label: "Profil" },
    { id: "kyc" as const, label: "Verifiering" },
    { id: "limits" as const, label: "Spelgranser" },
    { id: "history" as const, label: "Spelhistorik" },
    { id: "exclusion" as const, label: "Sjalvavstangning" },
  ];

  const inputClass =
    "w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary";
  const disabledInputClass =
    "w-full bg-brand-surface-alt border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-text-muted cursor-not-allowed";

  return (
    <div className="min-h-screen bg-brand-surface-alt">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-brand-text mb-8">
          Kontoinst&auml;llningar
        </h1>

        {/* Section Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-8 overflow-x-auto border border-brand-border scrollbar-none">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-1 shrink-0 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? "bg-brand-primary text-white"
                  : "text-brand-text-muted hover:text-brand-text"
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
            className="bg-white rounded-2xl p-6 shadow-card border border-brand-border"
          >
            {profileMessage && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm ${
                  profileMessage.includes("uppdaterad")
                    ? "bg-green-50 text-brand-success border border-brand-success/20"
                    : "bg-red-50 text-brand-danger border border-brand-danger/20"
                }`}
              >
                {profileMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  Fornamn
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  Efternamn
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  E-post
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className={disabledInputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  Anvandarnamn
                </label>
                <input
                  type="text"
                  value={profile.username}
                  disabled
                  className={disabledInputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  Fodelsedatum
                </label>
                <input
                  type="text"
                  value={profile.dateOfBirth}
                  disabled
                  className={disabledInputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  Land
                </label>
                <input
                  type="text"
                  value={profile.country}
                  disabled
                  className={disabledInputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="mt-6 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white font-bold px-8 py-3 rounded-pill transition-colors text-sm"
            >
              {profileSaving ? "Sparar..." : "Spara andr."}
            </button>
          </form>
        )}

        {/* KYC Section */}
        {activeSection === "kyc" && (
          <div className="bg-white rounded-2xl p-6 shadow-card border border-brand-border">
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  kycStatus === "verified"
                    ? "bg-green-50"
                    : kycStatus === "rejected"
                    ? "bg-red-50"
                    : "bg-amber-50"
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
                <h3 className="text-lg font-semibold text-brand-text">
                  {kycStatus === "verified"
                    ? "Verifierad"
                    : kycStatus === "rejected"
                    ? "Avvisad"
                    : "Vantar pa verifiering"}
                </h3>
                <p className="text-sm text-brand-text-muted">
                  {kycStatus === "verified"
                    ? "Din identitet har verifierats."
                    : kycStatus === "rejected"
                    ? "Verifieringen avvisades. Ladda upp nya dokument."
                    : "Verifiering vantar. Ladda upp ditt ID-dokument."}
                </p>
              </div>
            </div>

            {kycStatus !== "verified" && (
              <div className="space-y-4">
                <div className="bg-brand-surface-alt rounded-xl p-4 border border-brand-border">
                  <h4 className="text-sm font-medium text-brand-text mb-2">
                    Ladda upp ID-handling
                  </h4>
                  <p className="text-xs text-brand-text-muted mb-3">
                    Accepterat: Pass, korkort, nationellt ID-kort. Max
                    filstorlek: 5MB. Format: JPG, PNG, PDF.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleKycUpload}
                      disabled={kycUploading}
                      className="block w-full text-sm text-brand-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-pill file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary-hover file:cursor-pointer file:transition-colors"
                    />
                  </label>
                  {kycUploading && (
                    <p className="text-xs text-brand-primary mt-2">
                      Laddar upp...
                    </p>
                  )}
                </div>

                <div className="bg-brand-surface-alt rounded-xl p-4 border border-brand-border">
                  <h4 className="text-sm font-medium text-brand-text mb-2">
                    Adressbevis
                  </h4>
                  <p className="text-xs text-brand-text-muted mb-3">
                    Elrakning, kontoutdrag eller officiellt brev daterat inom de
                    senaste 3 manaderna.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleKycUpload}
                      disabled={kycUploading}
                      className="block w-full text-sm text-brand-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-pill file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary-hover file:cursor-pointer file:transition-colors"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deposit/Loss/Session Limits Section */}
        {activeSection === "limits" && (
          <div className="space-y-6">
            {limitsMessage && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  limitsMessage.includes("uppdaterade") ||
                  limitsMessage.includes("aktiverad")
                    ? "bg-green-50 text-brand-success border border-brand-success/20"
                    : "bg-red-50 text-brand-danger border border-brand-danger/20"
                }`}
              >
                {limitsMessage}
              </div>
            )}

            {/* Deposit Limits */}
            <form
              onSubmit={handleLimitsSave}
              className="bg-white rounded-2xl p-6 shadow-card border border-brand-border"
            >
              <h3 className="text-lg font-semibold text-brand-text mb-4">
                Insattningsgranser
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Daglig grans (kr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={limits.dailyDeposit ?? ""}
                    onChange={(e) =>
                      setLimits((l) => ({
                        ...l,
                        dailyDeposit: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="Ingen grans"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Veckovis grans (kr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={limits.weeklyDeposit ?? ""}
                    onChange={(e) =>
                      setLimits((l) => ({
                        ...l,
                        weeklyDeposit: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="Ingen grans"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Manadsvis grans (kr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={limits.monthlyDeposit ?? ""}
                    onChange={(e) =>
                      setLimits((l) => ({
                        ...l,
                        monthlyDeposit: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    placeholder="Ingen grans"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Session Time Limit */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  Sessionsgrans (minuter)
                </label>
                <input
                  type="number"
                  min="0"
                  value={limits.sessionTimeMinutes ?? ""}
                  onChange={(e) =>
                    setLimits((l) => ({
                      ...l,
                      sessionTimeMinutes: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  placeholder="Ingen grans"
                  className={`${inputClass} sm:max-w-xs`}
                />
              </div>

              <button
                type="submit"
                disabled={limitsSaving}
                className="bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white font-bold px-8 py-3 rounded-pill transition-colors text-sm"
              >
                {limitsSaving ? "Sparar..." : "Spara granser"}
              </button>
            </form>
          </div>
        )}

        {/* Spelhistorik placeholder */}
        {activeSection === "history" && (
          <div className="bg-white rounded-2xl p-8 shadow-card border border-brand-border text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-surface-alt flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-brand-text-muted"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-brand-text mb-2">
              Spelhistorik
            </h3>
            <p className="text-sm text-brand-text-muted max-w-sm mx-auto">
              Har hittar du en oversikt over alla dina spel. Casino, betting och
              live casino - allt samlat pa ett stalle.
            </p>
          </div>
        )}

        {/* Self-exclusion Section */}
        {activeSection === "exclusion" && (
          <div className="space-y-6">
            {limitsMessage && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  limitsMessage.includes("aktiverad")
                    ? "bg-green-50 text-brand-success border border-brand-success/20"
                    : "bg-red-50 text-brand-danger border border-brand-danger/20"
                }`}
              >
                {limitsMessage}
              </div>
            )}

            {/* Cooling-Off */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-brand-border">
              <h3 className="text-lg font-semibold text-brand-text mb-2">
                Avkylningsperiod
              </h3>
              <p className="text-sm text-brand-text-muted mb-4">
                Ta en paus fran spel. Under avkylningsperioden kan du inte
                placera spel eller gora insattningar.
              </p>
              {limits.coolingOffUntil &&
              new Date(limits.coolingOffUntil) > new Date() ? (
                <div className="bg-amber-50 border border-brand-warning/20 rounded-xl p-4">
                  <p className="text-sm text-brand-warning font-medium">
                    Avkylning aktiv till{" "}
                    {new Date(limits.coolingOffUntil).toLocaleDateString(
                      "sv-SE"
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <select
                    value={coolingOffDays}
                    onChange={(e) => setCoolingOffDays(e.target.value)}
                    className={inputClass + " sm:max-w-xs"}
                  >
                    <option value="">Valj varaktighet</option>
                    <option value="1">1 dag</option>
                    <option value="3">3 dagar</option>
                    <option value="7">7 dagar</option>
                    <option value="14">14 dagar</option>
                    <option value="30">30 dagar</option>
                  </select>
                  <button
                    onClick={handleCoolingOff}
                    disabled={!coolingOffDays}
                    className="bg-brand-warning hover:bg-brand-warning/80 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-pill transition-colors text-sm"
                  >
                    Aktivera
                  </button>
                </div>
              )}
            </div>

            {/* Self-Exclusion */}
            <div className="bg-white rounded-2xl p-6 shadow-card border-2 border-brand-danger/20">
              <h3 className="text-lg font-semibold text-brand-danger mb-2">
                Sjalvavstangning
              </h3>
              <p className="text-sm text-brand-text-muted mb-4">
                Sjalvavstangning blockerar ditt konto helt under den valda
                perioden. Denna atgard kan inte angras i fortid. Du kan aven
                stanga av dig via{" "}
                <a
                  href="https://www.spelpaus.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:underline"
                >
                  spelpaus.se
                </a>
                .
              </p>
              {limits.selfExcludedUntil &&
              new Date(limits.selfExcludedUntil) > new Date() ? (
                <div className="bg-red-50 border border-brand-danger/20 rounded-xl p-4">
                  <p className="text-sm text-brand-danger font-medium">
                    Sjalvavstangd till{" "}
                    {new Date(limits.selfExcludedUntil).toLocaleDateString(
                      "sv-SE"
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <select
                    value={selfExclusionMonths}
                    onChange={(e) => setSelfExclusionMonths(e.target.value)}
                    className={inputClass + " sm:max-w-xs"}
                  >
                    <option value="">Valj varaktighet</option>
                    <option value="6">6 manader</option>
                    <option value="12">1 ar</option>
                    <option value="24">2 ar</option>
                    <option value="60">5 ar</option>
                  </select>
                  <button
                    onClick={handleSelfExclusion}
                    disabled={!selfExclusionMonths}
                    className="bg-brand-danger hover:bg-brand-danger/80 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-pill transition-colors text-sm"
                  >
                    Sjalvavstang
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
