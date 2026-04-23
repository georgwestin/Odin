"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Bonus {
  id: string;
  name: string;
  description: string;
  type: "deposit" | "free_spins" | "cashback" | "reload";
  status: "active" | "claimable" | "expired" | "completed";
  amount: number;
  currency: string;
  wageringRequirement: number;
  wageringProgress: number;
  wageringTarget: number;
  expiresAt: string;
  claimedAt?: string;
}

const PLACEHOLDER_BONUSES: Bonus[] = [
  {
    id: "b1",
    name: "Valkomstbonus",
    description: "100% upp till 1000 kr pa din forsta insattning",
    type: "deposit",
    status: "active",
    amount: 500,
    currency: "EUR",
    wageringRequirement: 35,
    wageringProgress: 6250,
    wageringTarget: 17500,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    claimedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "b2",
    name: "Fredags-freespins",
    description: "50 gratissnurr pa Starburst",
    type: "free_spins",
    status: "claimable",
    amount: 50,
    currency: "spins",
    wageringRequirement: 20,
    wageringProgress: 0,
    wageringTarget: 0,
    expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
  },
  {
    id: "b3",
    name: "Helgbonus",
    description: "50% omladdningsbonus upp till 500 €",
    type: "reload",
    status: "claimable",
    amount: 0,
    currency: "EUR",
    wageringRequirement: 30,
    wageringProgress: 0,
    wageringTarget: 0,
    expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  },
  {
    id: "b4",
    name: "Cashback",
    description: "10% veckovis cashback pa forluster",
    type: "cashback",
    status: "completed",
    amount: 125,
    currency: "EUR",
    wageringRequirement: 1,
    wageringProgress: 125,
    wageringTarget: 125,
    expiresAt: new Date(Date.now() - 86400000).toISOString(),
    claimedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export default function BonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>(PLACEHOLDER_BONUSES);
  const [filter, setFilter] = useState<
    "all" | "active" | "claimable" | "completed"
  >("all");
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ items: Bonus[] }>("/bonuses")
      .then((res) => setBonuses(res.items))
      .catch(() => {});
  }, []);

  const filtered = bonuses.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  const handleClaim = async (bonusId: string) => {
    setClaiming(bonusId);
    try {
      await api.post(`/bonuses/${bonusId}/claim`);
      setBonuses((prev) =>
        prev.map((b) =>
          b.id === bonusId
            ? {
                ...b,
                status: "active" as const,
                claimedAt: new Date().toISOString(),
              }
            : b
        )
      );
    } catch {
      // Claim failed
    } finally {
      setClaiming(null);
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Insattningsbonus";
      case "free_spins":
        return "Gratissnurr";
      case "cashback":
        return "Cashback";
      case "reload":
        return "Omladdning";
      default:
        return type;
    }
  };

  const typeBadgeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-brand-primary/10 text-brand-primary";
      case "free_spins":
        return "bg-purple-100 text-purple-600";
      case "cashback":
        return "bg-green-100 text-brand-success";
      case "reload":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-brand-surface-alt text-brand-text";
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-pill bg-green-100 text-brand-success">
            Aktiv
          </span>
        );
      case "claimable":
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-pill bg-brand-primary/10 text-brand-primary animate-pulse">
            Tillganglig
          </span>
        );
      case "completed":
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-pill bg-brand-surface-alt text-brand-text-muted">
            Avslutad
          </span>
        );
      case "expired":
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-pill bg-red-100 text-brand-danger">
            Utgangen
          </span>
        );
      default:
        return null;
    }
  };

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Utgangen";
    const days = Math.ceil(diff / 86400000);
    return days === 1 ? "1 dag kvar" : `${days} dagar kvar`;
  };

  return (
    <div className="min-h-screen bg-brand-surface-alt">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-brand-text mb-2">
          Erbjudanden
        </h1>
        <p className="text-brand-text-muted mb-8">
          Se dina aktiva bonusar och hamta nya erbjudanden.
        </p>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-8 max-w-md border border-brand-border">
          {(
            [
              { id: "all", label: "Alla" },
              { id: "claimable", label: "Tillgangliga" },
              { id: "active", label: "Aktiva" },
              { id: "completed", label: "Avslutade" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-brand-primary text-white"
                  : "text-brand-text-muted hover:text-brand-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bonus Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-brand-border">
            <p className="text-brand-text-muted text-lg">
              Inga erbjudanden hittades.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((bonus) => (
              <div
                key={bonus.id}
                className={`bg-white rounded-2xl p-5 shadow-card border transition-colors ${
                  bonus.status === "claimable"
                    ? "border-brand-primary/30 hover:border-brand-primary/50"
                    : "border-brand-border"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-pill ${typeBadgeColor(
                          bonus.type
                        )}`}
                      >
                        {typeLabel(bonus.type)}
                      </span>
                      {statusBadge(bonus.status)}
                    </div>

                    <h3 className="text-lg font-semibold text-brand-text mb-1">
                      {bonus.name}
                    </h3>
                    <p className="text-sm text-brand-text-muted mb-3">
                      {bonus.description}
                    </p>

                    {/* Wagering Progress */}
                    {bonus.status === "active" && bonus.wageringTarget > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-brand-text-muted mb-1">
                          <span>Omsattningskrav</span>
                          <span>
                            {bonus.wageringProgress.toFixed(0)} /{" "}
                            {bonus.wageringTarget.toFixed(0)} kr
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-brand-surface-alt overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                (bonus.wageringProgress /
                                  bonus.wageringTarget) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-brand-text-muted mt-1">
                          {(
                            (bonus.wageringProgress / bonus.wageringTarget) *
                            100
                          ).toFixed(1)}
                          % klart ({bonus.wageringRequirement}x
                          omsattningskrav)
                        </p>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-brand-text-muted">
                      {bonus.amount > 0 && (
                        <span>
                          {bonus.currency === "spins"
                            ? `${bonus.amount} gratissnurr`
                            : `${bonus.amount} kr`}
                        </span>
                      )}
                      <span>{bonus.wageringRequirement}x omsattning</span>
                      <span>{daysLeft(bonus.expiresAt)}</span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  {bonus.status === "claimable" && (
                    <button
                      onClick={() => handleClaim(bonus.id)}
                      disabled={claiming === bonus.id}
                      className="shrink-0 bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-bold px-6 py-3 rounded-pill transition-colors text-sm"
                    >
                      {claiming === bonus.id ? "Hamtar..." : "Hamta"}
                    </button>
                  )}

                  {/* Amount Badge for completed */}
                  {bonus.status === "completed" && bonus.amount > 0 && (
                    <div className="shrink-0 text-center">
                      <p className="text-xs text-brand-text-muted">Mottaget</p>
                      <p className="text-lg font-bold text-brand-success">
                        {bonus.currency === "spins"
                          ? `${bonus.amount} FS`
                          : `${bonus.amount} kr`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
