"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useWallet } from "@/stores/wallet";
import Link from "next/link";

const QUICK_AMOUNTS = [200, 500, 1000];

export function QuickDeposit() {
  const { isAuthenticated } = useAuth();
  const { deposit } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [processing, setProcessing] = useState(false);

  const activeAmount = isCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount;

  const handleDeposit = async () => {
    if (!isAuthenticated) return;
    if (activeAmount <= 0) return;

    setProcessing(true);
    try {
      await deposit(activeAmount, "swish");
    } catch {
      // Deposit failed silently - wallet store handles error
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4">
      {/* Amount buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              setSelectedAmount(amount);
              setIsCustom(false);
            }}
            className={`px-5 py-2.5 rounded-pill text-sm font-bold transition-all ${
              !isCustom && selectedAmount === amount
                ? "bg-white text-brand-secondary shadow-card"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {amount} kr
          </button>
        ))}
        <button
          onClick={() => setIsCustom(true)}
          className={`px-5 py-2.5 rounded-pill text-sm font-bold transition-all ${
            isCustom
              ? "bg-white text-brand-secondary shadow-card"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          Annat
        </button>
      </div>

      {/* Custom input */}
      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="50"
            step="50"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Ange belopp"
            className="bg-white/10 border border-white/20 rounded-pill px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 w-36"
          />
          <span className="text-white/60 text-sm font-medium">kr</span>
        </div>
      )}

      {/* CTA */}
      {isAuthenticated ? (
        <button
          onClick={handleDeposit}
          disabled={processing || activeAmount <= 0}
          className="bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-bold text-base px-8 py-3.5 rounded-pill transition-colors shadow-lg"
        >
          {processing
            ? "Bearbetar..."
            : `Satt in & Spela - ${activeAmount} kr`}
        </button>
      ) : (
        <Link
          href="/register"
          className="inline-block bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-base px-8 py-3.5 rounded-pill transition-colors shadow-lg"
        >
          Satt in & Spela
        </Link>
      )}
    </div>
  );
}
