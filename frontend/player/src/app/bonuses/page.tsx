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
    name: "Welcome Bonus",
    description: "100% up to 200 EUR on your first deposit",
    type: "deposit",
    status: "active",
    amount: 100,
    currency: "EUR",
    wageringRequirement: 35,
    wageringProgress: 1250,
    wageringTarget: 3500,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    claimedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "b2",
    name: "Free Spins Friday",
    description: "50 free spins on Starburst",
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
    name: "Weekend Reload",
    description: "50% reload bonus up to 100 EUR",
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
    description: "10% weekly cashback on losses",
    type: "cashback",
    status: "completed",
    amount: 25,
    currency: "EUR",
    wageringRequirement: 1,
    wageringProgress: 25,
    wageringTarget: 25,
    expiresAt: new Date(Date.now() - 86400000).toISOString(),
    claimedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export default function BonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>(PLACEHOLDER_BONUSES);
  const [filter, setFilter] = useState<"all" | "active" | "claimable" | "completed">("all");
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
      case "deposit": return "Deposit Bonus";
      case "free_spins": return "Free Spins";
      case "cashback": return "Cashback";
      case "reload": return "Reload Bonus";
      default: return type;
    }
  };

  const typeBadgeColor = (type: string) => {
    switch (type) {
      case "deposit": return "bg-brand-primary/20 text-brand-primary";
      case "free_spins": return "bg-purple-500/20 text-purple-400";
      case "cashback": return "bg-brand-success/20 text-brand-success";
      case "reload": return "bg-blue-500/20 text-blue-400";
      default: return "bg-white/10 text-white";
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-success/20 text-brand-success">
            Active
          </span>
        );
      case "claimable":
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary animate-pulse">
            Claimable
          </span>
        );
      case "completed":
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-brand-text-muted">
            Completed
          </span>
        );
      case "expired":
        return (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-danger/20 text-brand-danger">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const daysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.ceil(diff / 86400000);
    return days === 1 ? "1 day left" : `${days} days left`;
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-white mb-2">
        Bonuses
      </h1>
      <p className="text-brand-text-muted mb-8">
        View your active bonuses and claim new offers.
      </p>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-brand-surface rounded-lg p-1 mb-8 max-w-md">
        {(["all", "claimable", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-brand-primary text-black"
                : "text-brand-text-muted hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bonus Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-brand-text-muted text-lg">No bonuses found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((bonus) => (
            <div
              key={bonus.id}
              className={`bg-brand-surface rounded-xl p-5 border transition-colors ${
                bonus.status === "claimable"
                  ? "border-brand-primary/30 hover:border-brand-primary/50"
                  : "border-white/5"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColor(
                        bonus.type
                      )}`}
                    >
                      {typeLabel(bonus.type)}
                    </span>
                    {statusBadge(bonus.status)}
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-1">
                    {bonus.name}
                  </h3>
                  <p className="text-sm text-brand-text-muted mb-3">
                    {bonus.description}
                  </p>

                  {/* Wagering Progress */}
                  {bonus.status === "active" && bonus.wageringTarget > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-brand-text-muted mb-1">
                        <span>Wagering Progress</span>
                        <span>
                          {bonus.wageringProgress.toFixed(0)} /{" "}
                          {bonus.wageringTarget.toFixed(0)} {bonus.currency}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (bonus.wageringProgress / bonus.wageringTarget) *
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
                        % complete ({bonus.wageringRequirement}x wagering
                        requirement)
                      </p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-brand-text-muted">
                    {bonus.amount > 0 && (
                      <span>
                        {bonus.currency === "spins"
                          ? `${bonus.amount} Free Spins`
                          : `${bonus.amount} ${bonus.currency}`}
                      </span>
                    )}
                    <span>{bonus.wageringRequirement}x wagering</span>
                    <span>{daysLeft(bonus.expiresAt)}</span>
                  </div>
                </div>

                {/* Claim Button */}
                {bonus.status === "claimable" && (
                  <button
                    onClick={() => handleClaim(bonus.id)}
                    disabled={claiming === bonus.id}
                    className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-black font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                  >
                    {claiming === bonus.id ? "Claiming..." : "Claim"}
                  </button>
                )}

                {/* Amount Badge for completed */}
                {bonus.status === "completed" && bonus.amount > 0 && (
                  <div className="shrink-0 text-center">
                    <p className="text-xs text-brand-text-muted">Received</p>
                    <p className="text-lg font-bold text-brand-success">
                      {bonus.currency === "spins"
                        ? `${bonus.amount} FS`
                        : `${bonus.amount} ${bonus.currency}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
