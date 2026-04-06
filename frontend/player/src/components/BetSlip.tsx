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
    addSelection: _add,
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

      setPlacedMessage("Bet placed successfully!");
      clearSelections();
      fetchBalance();
      setTimeout(() => setPlacedMessage(null), 3000);
    } catch {
      setPlacedMessage("Failed to place bet. Please try again.");
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
          className="fixed bottom-6 right-6 z-50 bg-brand-primary text-black font-bold px-5 py-3 rounded-full shadow-lg hover:bg-brand-primary-hover transition-colors flex items-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Bet Slip ({selectionCount})
        </button>
      )}

      {/* Bet Slip Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 bg-brand-surface border border-white/10 sm:rounded-2xl shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="font-heading font-bold text-white">
              Bet Slip ({selectionCount})
            </h3>
            <div className="flex items-center gap-2">
              {selectionCount > 0 && (
                <button
                  onClick={clearSelections}
                  className="text-xs text-brand-text-muted hover:text-brand-danger transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={toggleOpen}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-brand-text-muted"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
                  betType === "single"
                    ? "bg-brand-primary text-black"
                    : "bg-white/5 text-brand-text-muted hover:text-white"
                }`}
              >
                Singles
              </button>
              <button
                onClick={() => setBetType("accumulator")}
                className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
                  betType === "accumulator"
                    ? "bg-brand-primary text-black"
                    : "bg-white/5 text-brand-text-muted hover:text-white"
                }`}
              >
                Accumulator
              </button>
            </div>
          )}

          {/* Selections */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {selections.map((sel) => (
              <div
                key={sel.id}
                className="bg-white/5 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-text-muted truncate">
                      {sel.eventName}
                    </p>
                    <p className="text-sm font-medium text-white truncate">
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
                      className="w-5 h-5 rounded-full bg-white/10 hover:bg-brand-danger/20 flex items-center justify-center text-brand-text-muted hover:text-brand-danger transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Single Stake Input */}
                {betType === "single" && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-brand-text-muted">Stake</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={stakes[sel.id] || ""}
                      onChange={(e) =>
                        setStake(sel.id, parseFloat(e.target.value) || 0)
                      }
                      className="flex-1 bg-brand-background border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    {(stakes[sel.id] || 0) > 0 && (
                      <span className="text-xs text-brand-success">
                        Win: {(sel.odds * (stakes[sel.id] || 0)).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {selectionCount === 0 && (
              <div className="text-center py-8">
                <p className="text-brand-text-muted text-sm">
                  Add selections to your bet slip
                </p>
              </div>
            )}
          </div>

          {/* Accumulator Stake */}
          {betType === "accumulator" && selectionCount > 1 && (
            <div className="px-4 pb-2">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-brand-text-muted">
                    Combined Odds
                  </span>
                  <span className="text-brand-primary font-bold">
                    {accOdds.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-text-muted">Stake</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={accumulatorStake || ""}
                    onChange={(e) =>
                      setAccumulatorStake(parseFloat(e.target.value) || 0)
                    }
                    className="flex-1 bg-brand-background border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          {selectionCount > 0 && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-text-muted">Total Stake</span>
                <span className="text-white font-semibold">
                  {totalStake.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-text-muted">
                  Potential Winnings
                </span>
                <span className="text-brand-success font-bold">
                  {potentialWinnings.toFixed(2)}
                </span>
              </div>

              {placedMessage && (
                <p
                  className={`text-center text-sm font-medium ${
                    placedMessage.includes("success")
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
                className="w-full bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-colors text-sm"
              >
                {isPlacing
                  ? "Placing..."
                  : !isAuthenticated
                  ? "Log In to Place Bet"
                  : `Place Bet - ${totalStake.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
