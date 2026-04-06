"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/stores/wallet";

const PAYMENT_METHODS = [
  { id: "card", name: "Credit/Debit Card", icon: "card" },
  { id: "bank", name: "Bank Transfer", icon: "bank" },
  { id: "ewallet", name: "E-Wallet", icon: "wallet" },
  { id: "crypto", name: "Cryptocurrency", icon: "crypto" },
];

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function WalletPage() {
  const {
    balance,
    bonusBalance,
    currency,
    transactions,
    totalTransactions,
    isLoading,
    error,
    fetchBalance,
    fetchTransactions,
    deposit,
    withdraw,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "history">("deposit");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBalance();
    fetchTransactions(1, 20);
  }, [fetchBalance, fetchTransactions]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
    }).format(val);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setMessage({ type: "error", text: "Enter a valid amount." });
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      await deposit(num, method);
      setMessage({ type: "success", text: `Deposited ${formatCurrency(num)} successfully!` });
      setAmount("");
      fetchTransactions(1, 20);
    } catch {
      setMessage({ type: "error", text: "Deposit failed. Please try again." });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setMessage({ type: "error", text: "Enter a valid amount." });
      return;
    }
    if (num > balance) {
      setMessage({ type: "error", text: "Insufficient balance." });
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      await withdraw(num, method);
      setMessage({ type: "success", text: `Withdrawal of ${formatCurrency(num)} requested!` });
      setAmount("");
      fetchTransactions(1, 20);
    } catch {
      setMessage({ type: "error", text: "Withdrawal failed. Please try again." });
    } finally {
      setProcessing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTransactions(newPage, 20);
  };

  const totalPages = Math.ceil(totalTransactions / 20);

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-brand-success";
      case "pending": return "text-brand-warning";
      case "failed": return "text-brand-danger";
      case "cancelled": return "text-brand-text-muted";
      default: return "text-brand-text-muted";
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "deposit": case "win": case "bonus": return "text-brand-success";
      case "withdrawal": case "bet": return "text-brand-danger";
      default: return "text-brand-text";
    }
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-white mb-8">Wallet</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-brand-surface rounded-xl p-5 border border-white/5">
          <p className="text-xs text-brand-text-muted mb-1">Cash Balance</p>
          <p className="font-heading text-2xl font-bold text-brand-primary">
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="bg-brand-surface rounded-xl p-5 border border-white/5">
          <p className="text-xs text-brand-text-muted mb-1">Bonus Balance</p>
          <p className="font-heading text-2xl font-bold text-brand-accent">
            {formatCurrency(bonusBalance)}
          </p>
        </div>
        <div className="bg-brand-surface rounded-xl p-5 border border-white/5">
          <p className="text-xs text-brand-text-muted mb-1">Total</p>
          <p className="font-heading text-2xl font-bold text-white">
            {formatCurrency(balance + bonusBalance)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface rounded-lg p-1 mb-6">
        {(["deposit", "withdraw", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setMessage(null);
              setAmount("");
            }}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-brand-primary text-black"
                : "text-brand-text-muted hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm">
          {error}
        </div>
      )}

      {/* Deposit / Withdraw Form */}
      {(activeTab === "deposit" || activeTab === "withdraw") && (
        <form
          onSubmit={activeTab === "deposit" ? handleDeposit : handleWithdraw}
          className="bg-brand-surface rounded-xl p-6 border border-white/5"
        >
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-brand-success/10 border border-brand-success/20 text-brand-success"
                  : "bg-brand-danger/10 border border-brand-danger/20 text-brand-danger"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-text-muted mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setMethod(pm.id)}
                  className={`p-3 rounded-lg text-center text-sm font-medium transition-all ${
                    method === pm.id
                      ? "bg-brand-primary/20 border-2 border-brand-primary text-brand-primary"
                      : "bg-white/5 border-2 border-transparent text-brand-text-muted hover:text-white hover:bg-white/10"
                  }`}
                >
                  {pm.name}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-text-muted mb-2">
              Amount ({currency})
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-brand-background border border-white/10 rounded-lg px-4 py-3 text-lg text-white text-center font-bold placeholder:text-brand-text-muted/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>

          {/* Quick Amounts */}
          <div className="flex flex-wrap gap-2 mb-6">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                key={qa}
                type="button"
                onClick={() => setAmount(qa.toString())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  amount === qa.toString()
                    ? "bg-brand-primary text-black"
                    : "bg-white/5 text-brand-text-muted hover:text-white hover:bg-white/10"
                }`}
              >
                {formatCurrency(qa)}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={processing || !amount}
            className="w-full bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-colors"
          >
            {processing
              ? "Processing..."
              : activeTab === "deposit"
              ? `Deposit ${amount ? formatCurrency(parseFloat(amount)) : ""}`
              : `Withdraw ${amount ? formatCurrency(parseFloat(amount)) : ""}`}
          </button>
        </form>
      )}

      {/* Transaction History */}
      {activeTab === "history" && (
        <div className="bg-brand-surface rounded-xl border border-white/5 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 mx-auto border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-brand-text-muted">
              No transactions yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-xs font-medium text-brand-text-muted">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-brand-text-muted">
                        Type
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-brand-text-muted">
                        Amount
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-brand-text-muted">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-4 py-3 text-brand-text-muted whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString()}{" "}
                          {new Date(tx.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 capitalize text-white">
                          {tx.type}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${typeColor(tx.type)}`}>
                          {tx.type === "deposit" || tx.type === "win" || tx.type === "bonus"
                            ? "+"
                            : "-"}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className={`px-4 py-3 text-right capitalize text-xs font-medium ${statusColor(tx.status)}`}>
                          {tx.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/5">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded text-xs text-brand-text-muted hover:text-white disabled:opacity-30"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded text-xs font-medium ${
                          p === page
                            ? "bg-brand-primary text-black"
                            : "text-brand-text-muted hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 rounded text-xs text-brand-text-muted hover:text-white disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
