"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/stores/wallet";

const PAYMENT_METHODS = [
  { id: "swish", name: "Swish" },
  { id: "trustly", name: "Trustly" },
  { id: "card", name: "Visa / Mastercard" },
  { id: "bank", name: "Bankoverfor." },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

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

  const [activeTab, setActiveTab] = useState<
    "deposit" | "withdraw" | "history"
  >("deposit");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("swish");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBalance();
    fetchTransactions(1, 20);
  }, [fetchBalance, fetchTransactions]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: currency || "SEK",
      minimumFractionDigits: 0,
    }).format(val);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setMessage({ type: "error", text: "Ange ett giltigt belopp." });
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      await deposit(num, method);
      setMessage({
        type: "success",
        text: `${formatCurrency(num)} insatt!`,
      });
      setAmount("");
      fetchTransactions(1, 20);
    } catch {
      setMessage({
        type: "error",
        text: "Insattningen misslyckades. Forsok igen.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setMessage({ type: "error", text: "Ange ett giltigt belopp." });
      return;
    }
    if (num > balance) {
      setMessage({ type: "error", text: "Otillrackligt saldo." });
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      await withdraw(num, method);
      setMessage({
        type: "success",
        text: `Uttag pa ${formatCurrency(num)} begard!`,
      });
      setAmount("");
      fetchTransactions(1, 20);
    } catch {
      setMessage({
        type: "error",
        text: "Uttaget misslyckades. Forsok igen.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTransactions(newPage, 20);
  };

  const totalPages = Math.ceil(totalTransactions / 20);

  const statusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Slutford";
      case "pending":
        return "Vantar";
      case "failed":
        return "Misslyckades";
      case "cancelled":
        return "Avbruten";
      default:
        return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-brand-success";
      case "pending":
        return "text-brand-warning";
      case "failed":
        return "text-brand-danger";
      case "cancelled":
        return "text-brand-text-muted";
      default:
        return "text-brand-text-muted";
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Insattning";
      case "withdrawal":
        return "Uttag";
      case "bet":
        return "Spel";
      case "win":
        return "Vinst";
      case "bonus":
        return "Bonus";
      case "adjustment":
        return "Justering";
      default:
        return type;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "win":
      case "bonus":
        return "text-brand-success";
      case "withdrawal":
      case "bet":
        return "text-brand-danger";
      default:
        return "text-brand-text";
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface-alt">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-brand-text mb-8">
          Planbok
        </h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-card border border-brand-border">
            <p className="text-xs text-brand-text-muted mb-1">Riktigt saldo</p>
            <p className="font-heading text-2xl font-bold text-brand-primary">
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-card border border-brand-border">
            <p className="text-xs text-brand-text-muted mb-1">Bonussaldo</p>
            <p className="font-heading text-2xl font-bold text-brand-warning">
              {formatCurrency(bonusBalance)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-card border border-brand-border">
            <p className="text-xs text-brand-text-muted mb-1">Totalt</p>
            <p className="font-heading text-2xl font-bold text-brand-text">
              {formatCurrency(balance + bonusBalance)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 border border-brand-border">
          {(
            [
              { id: "deposit", label: "Insattning" },
              { id: "withdraw", label: "Uttag" },
              { id: "history", label: "Historik" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
                setAmount("");
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-primary text-white"
                  : "text-brand-text-muted hover:text-brand-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-brand-danger/20 text-brand-danger text-sm">
            {error}
          </div>
        )}

        {/* Deposit / Withdraw Form */}
        {(activeTab === "deposit" || activeTab === "withdraw") && (
          <form
            onSubmit={activeTab === "deposit" ? handleDeposit : handleWithdraw}
            className="bg-white rounded-2xl p-6 shadow-card border border-brand-border"
          >
            {message && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm ${
                  message.type === "success"
                    ? "bg-green-50 border border-brand-success/20 text-brand-success"
                    : "bg-red-50 border border-brand-danger/20 text-brand-danger"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-brand-text mb-3">
                Betalningsmetod
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setMethod(pm.id)}
                    className={`p-3 rounded-xl text-center text-sm font-medium transition-all border-2 ${
                      method === pm.id
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                        : "border-brand-border text-brand-text-muted hover:text-brand-text hover:border-brand-text-muted"
                    }`}
                  >
                    {pm.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Belopp (kr)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-lg text-brand-text text-center font-bold placeholder:text-brand-text-muted/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>

            {/* Quick Amounts */}
            <div className="flex flex-wrap gap-2 mb-6">
              {QUICK_AMOUNTS.map((qa) => (
                <button
                  key={qa}
                  type="button"
                  onClick={() => setAmount(qa.toString())}
                  className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors border ${
                    amount === qa.toString()
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-white text-brand-text-muted border-brand-border hover:text-brand-text hover:border-brand-text-muted"
                  }`}
                >
                  {qa} kr
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={processing || !amount}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 text-white font-bold py-3 rounded-pill transition-colors"
            >
              {processing
                ? "Bearbetar..."
                : activeTab === "deposit"
                ? `Satt in ${amount ? amount + " kr" : ""}`
                : `Ta ut ${amount ? amount + " kr" : ""}`}
            </button>
          </form>
        )}

        {/* Transaction History */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow-card border border-brand-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 mx-auto border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-brand-text-muted">
                Inga transaktioner annu.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-border">
                        <th className="text-left px-4 py-3 text-xs font-medium text-brand-text-muted">
                          Datum
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-brand-text-muted">
                          Typ
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-brand-text-muted">
                          Belopp
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
                          className="border-b border-brand-border last:border-0 hover:bg-brand-surface-alt transition-colors"
                        >
                          <td className="px-4 py-3 text-brand-text-muted whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString(
                              "sv-SE"
                            )}{" "}
                            {new Date(tx.createdAt).toLocaleTimeString(
                              "sv-SE",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </td>
                          <td className="px-4 py-3 text-brand-text">
                            {typeLabel(tx.type)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${typeColor(
                              tx.type
                            )}`}
                          >
                            {tx.type === "deposit" ||
                            tx.type === "win" ||
                            tx.type === "bonus"
                              ? "+"
                              : "-"}
                            {formatCurrency(tx.amount)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-xs font-medium ${statusColor(
                              tx.status
                            )}`}
                          >
                            {statusLabel(tx.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-brand-border">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-1 rounded text-xs text-brand-text-muted hover:text-brand-text disabled:opacity-30"
                    >
                      Foregaende
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - page) <= 2)
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium ${
                            p === page
                              ? "bg-brand-primary text-white"
                              : "text-brand-text-muted hover:text-brand-text"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="px-3 py-1 rounded text-xs text-brand-text-muted hover:text-brand-text disabled:opacity-30"
                    >
                      Nasta
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
