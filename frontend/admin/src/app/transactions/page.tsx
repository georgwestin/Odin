"use client";

import { useState } from "react";
import DataTable, { Column } from "@/components/DataTable";

interface Transaction {
  id: string;
  playerId: string;
  username: string;
  type: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  brand: string;
  date: string;
  [key: string]: unknown;
}

const typeColors: Record<string, string> = {
  deposit: "badge-green",
  withdrawal: "badge-red",
  bet: "badge-blue",
  win: "badge-green",
  bonus: "badge-yellow",
  adjustment: "badge-gray",
};

const statusColors: Record<string, string> = {
  completed: "badge-green",
  pending: "badge-yellow",
  failed: "badge-red",
  cancelled: "badge-gray",
  processing: "badge-blue",
};

const mockTransactions: Transaction[] = [
  { id: "tx001", playerId: "p1", username: "viking_king", type: "deposit", amount: 500.00, currency: "EUR", method: "Visa *4242", status: "completed", brand: "Odin Casino", date: "2026-04-06 14:30" },
  { id: "tx002", playerId: "p3", username: "jp_whale_99", type: "deposit", amount: 10000.00, currency: "EUR", method: "Bank Transfer", status: "completed", brand: "Odin Casino", date: "2026-04-06 14:15" },
  { id: "tx003", playerId: "p2", username: "slot_master22", type: "bet", amount: 25.00, currency: "EUR", method: "Casino - Book of Dead", status: "completed", brand: "Freya Slots", date: "2026-04-06 14:10" },
  { id: "tx004", playerId: "p2", username: "slot_master22", type: "win", amount: 62.50, currency: "EUR", method: "Casino - Book of Dead", status: "completed", brand: "Freya Slots", date: "2026-04-06 14:10" },
  { id: "tx005", playerId: "p5", username: "bet_warrior", type: "withdrawal", amount: 1500.00, currency: "EUR", method: "Bank Transfer", status: "processing", brand: "Thor Gaming", date: "2026-04-06 13:45" },
  { id: "tx006", playerId: "p8", username: "norse_bettor", type: "bet", amount: 100.00, currency: "EUR", method: "Sports - Liverpool vs Arsenal", status: "completed", brand: "Valhalla Bet", date: "2026-04-06 13:30" },
  { id: "tx007", playerId: "p10", username: "high_roller_dk", type: "deposit", amount: 5000.00, currency: "EUR", method: "Trustly", status: "completed", brand: "Odin Casino", date: "2026-04-06 13:00" },
  { id: "tx008", playerId: "p7", username: "spinqueen", type: "bonus", amount: 50.00, currency: "EUR", method: "Friday Free Spins", status: "completed", brand: "Freya Slots", date: "2026-04-06 12:00" },
  { id: "tx009", playerId: "p4", username: "lucky_finn", type: "deposit", amount: 100.00, currency: "EUR", method: "Skrill", status: "completed", brand: "Valhalla Bet", date: "2026-04-06 11:30" },
  { id: "tx010", playerId: "p6", username: "casino_pro", type: "withdrawal", amount: 2000.00, currency: "EUR", method: "Visa *1234", status: "failed", brand: "Odin Casino", date: "2026-04-06 11:00" },
  { id: "tx011", playerId: "p12", username: "live_ace", type: "bet", amount: 250.00, currency: "EUR", method: "Live Casino - Roulette", status: "completed", brand: "Odin Casino", date: "2026-04-06 10:45" },
  { id: "tx012", playerId: "p12", username: "live_ace", type: "win", amount: 500.00, currency: "EUR", method: "Live Casino - Roulette", status: "completed", brand: "Odin Casino", date: "2026-04-06 10:45" },
  { id: "tx013", playerId: "p9", username: "reel_runner", type: "deposit", amount: 50.00, currency: "EUR", method: "MuchBetter", status: "completed", brand: "Thor Gaming", date: "2026-04-06 10:00" },
  { id: "tx014", playerId: "p1", username: "viking_king", type: "bet", amount: 10.00, currency: "EUR", method: "Casino - Starburst", status: "completed", brand: "Odin Casino", date: "2026-04-06 09:30" },
  { id: "tx015", playerId: "p3", username: "jp_whale_99", type: "withdrawal", amount: 25000.00, currency: "EUR", method: "Bank Transfer", status: "pending", brand: "Odin Casino", date: "2026-04-06 09:00" },
];

const columns: Column<Transaction>[] = [
  { key: "id", header: "TX ID", sortable: true, className: "font-mono text-xs" },
  { key: "username", header: "Player", sortable: true },
  {
    key: "type",
    header: "Type",
    sortable: true,
    render: (row) => <span className={typeColors[row.type] || "badge-gray"}>{row.type}</span>,
  },
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    render: (row) => (
      <span className="font-mono font-medium">
        {row.currency} {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  { key: "method", header: "Method", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <span className={statusColors[row.status] || "badge-gray"}>{row.status}</span>,
  },
  { key: "brand", header: "Brand", sortable: true },
  { key: "date", header: "Date", sortable: true },
];

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = mockTransactions.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (dateFrom && tx.date < dateFrom) return false;
    if (dateTo && tx.date > dateTo + " 23:59") return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Transaction Ledger</h2>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto">
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="bet">Bets</option>
          <option value="win">Wins</option>
          <option value="bonus">Bonuses</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto" placeholder="From" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto" placeholder="To" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchable
        searchKeys={["username", "id", "method"]}
        exportable
        exportFilename="transactions"
      />
    </div>
  );
}
