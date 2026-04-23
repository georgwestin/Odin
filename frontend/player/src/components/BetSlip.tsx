"use client";

import { useBetSlip } from "@/stores/betslip";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useWallet } from "@/stores/wallet";
import { useState } from "react";

export function BetSlip() {
  const {
    selections,
    stakes,
    accumulatorStake,
    betType,
    isOpen,
    isPlacing,
    removeSelection,
    clearSelections,
    setStake,
    setAccumulatorStake,
    setBetType,
    toggleOpen,
    setIsPlacing,
    getTotalStake,
    getAccumulatorOdds,
    getPotentialWinnings,
  } = useBetSlip();

  const { isAuthenticated } = useAuth();
  const { fetchBalance } = useWallet();
  const [placedMessage, setPlacedMessage] = useState<string | null>(null);

  const selectionCount = selections.length;
  if (selectionCount === 0 && !isOpen) return null;

  const handlePlaceBet = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/sports";
      return;
    }

    setIsPlacing(true);
    setPlacedMessage(null);

    try {
      if (betType === "accumulator") {
        await api.post("/bets/place", {
          type: "accumulator",
          selections: selections.map((s) => ({
            selectionId: s.id,
            eventId: s.eventId,
            odds: s.odds,
          })),
          stake: accumulatorStake,
        });
      } else {
        const bets = selections
          .filter((s) => (stakes[s.id] || 0) > 0)
          .map((s) => ({
            type: "single",
            selections: [
              {
                selectionId: s.id,
                eventId: s.eventId,
                odds: s.odds,
              },
            ],
            stake: stakes[s.id],
          }));

        for (const bet of bets) {
          await api.post("/bets/place", bet);
        }
      }

      setPlacedMessage("Spelet placerat!");
      clearSelections();
      fetchBalance();
      setTimeout(() => setPlacedMessage(null), 3000);
    } catch {
      setPlacedMessage("Kunde inte placera spelet. Forsok igen.");
    } finally {
      setIsPlacing(false);
    }
  };

  const totalStake = getTotalStake();
  const potentialWinnings = getPotentialWinnings();
  const accOdds = getAccumulatorOdds();

  return (
    <>
      {/* Floating Toggle Button */}
      {selectionCount > 0 && !isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-50 bg-brand-primary text-white font-bold px-5 py-3 rounded-pill shadow-lg hover:bg-brand-primary-hover transition-colors flex items-center gap-2"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Spelkupong ({selectionCount})
        </button>
      )}

      {/* Bet Slip Panel - slides in from right */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 bg-white border border-brand-border sm:rounded-2xl shadow-card-hover animate-slide-in-right max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <h3 className="font-heading font-bold text-brand-text">
              Spelkupong ({selectionCount})
            </h3>
            <div className="flex items-center gap-2">
              {selectionCount > 0 && (
                <button
                  onClick={clearSelections}
                  className="text-xs text-brand-text-muted hover:text-brand-danger transition-colors"
                >
                  Rensa
                </button>
              )}
              <button
                onClick={toggleOpen}
                className="w-7 h-7 rounded-lg bg-brand-surface-alt hover:bg-brand-border/50 flex items-center justify-center text-brand-text-muted"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bet Type Toggle */}
          {selectionCount > 1 && (
            <div className="flex gap-1 px-4 pt-3">
              <button
                onClick={() => setBetType("single")}
                className={`flex-1 text-xs font-medium py-2 rounded-pill transition-colors ${
                  betType === "single"
                    ? "bg-brand-primary text-white"
                    : "bg-brand-surface-alt text-brand-text-muted hover:text-brand-text"
                }`}
              >
                Singel
              </button>
              <button
                onClick={() => setBetType("accumulator")}
                className={`flex-1 text-xs font-medium py-2 rounded-pill transition-colors ${
                  betType === "accumulator"
                    ? "bg-brand-primary text-white"
                    : "bg-brand-surface-alt text-brand-text-muted hover:text-brand-text"
                }`}
              >
                Kombi
              </button>
            </div>
          )}

          {/* Selections */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {selections.map((sel) => (
              <div key={sel.id} className="bg-brand-surface-alt rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-text-muted truncate">
                      {sel.eventName}
                    </p>
                    <p className="text-sm font-medium text-brand-text truncate">
                      {sel.selectionName}
                    </p>
                    <p className="text-xs text-brand-text-muted">
                      {sel.marketName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-brand-primary font-bold text-sm">
                      {sel.odds.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeSelection(sel.id)}
                      className="w-5 h-5 rounded-full bg-brand-border/50 hover:bg-brand-danger/10 flex items-center justify-center text-brand-text-muted hover:text-brand-danger transition-colors"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Single Stake Input */}
                {betType === "single" && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-brand-text-muted">
                      Insats
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0 €"
                      value={stakes[sel.id] || ""}
                      onChange={(e) =>
                        setStake(sel.id, parseFloat(e.target.value) || 0)
                      }
                      className="flex-1 bg-white border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text text-right focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                    />
                    {(stakes[sel.id] || 0) > 0 && (
                      <span className="text-xs text-brand-success font-medium">
                        {(sel.odds * (stakes[sel.id] || 0)).toFixed(0)} kr
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {selectionCount === 0 && (
              <div className="text-center py-8">
                <p className="text-brand-text-muted text-sm">
                  Lagg till val i din spelkupong
                </p>
              </div>
            )}
          </div>

          {/* Accumulator Stake */}
          {betType === "accumulator" && selectionCount > 1 && (
            <div className="px-4 pb-2">
              <div className="bg-brand-surface-alt rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-brand-text-muted">
                    Kombinerat odds
                  </span>
                  <span className="text-brand-primary font-bold">
                    {accOdds.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-text-muted">Insats</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0 €"
                    value={accumulatorStake || ""}
                    onChange={(e) =>
                      setAccumulatorStake(parseFloat(e.target.value) || 0)
                    }
                    className="flex-1 bg-white border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text text-right focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {selectionCount > 0 && (
            <div className="px-4 pb-4 pt-2 border-t border-brand-border space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-text-muted">Total insats</span>
                <span className="text-brand-text font-semibold">
                  {totalStake.toFixed(0)} kr
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-text-muted">Mojlig vinst</span>
                <span className="text-brand-success font-bold">
                  {potentialWinnings.toFixed(0)} kr
                </span>
              </div>

              {placedMessage && (
                <p
                  className={`text-center text-sm font-medium ${
                    placedMessage.includes("placerat")
                      ? "text-brand-success"
                      : "text-brand-danger"
                  }`}
                >
                  {placedMessage}
                </p>
              )}

              <button
                onClick={handlePlaceBet}
                disabled={isPlacing || totalStake <= 0}
                className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-pill transition-colors text-sm"
              >
                {isPlacing
                  ? "Placerar..."
                  : !isAuthenticated
                  ? "Logga in for att spela"
                  : `Lagg spel - ${totalStake.toFixed(0)} kr`}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
