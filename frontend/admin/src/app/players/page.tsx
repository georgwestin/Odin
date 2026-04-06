"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DataTable, { Column } from "@/components/DataTable";
import clsx from "clsx";

// --- Types ---

interface Player {
  id: string;
  username: string;
  email: string;
  brand: string;
  balance: number;
  bonusBalance: number;
  playerCurrency: string;
  kycStatus: string;
  country: string;
  registrationDate: string;
  lastLogin: string;
  totalDeposits: number;
  totalBets: number;
  [key: string]: unknown;
}

interface LoginEntry {
  id: string;
  playerId: string;
  username: string;
  email: string;
  ip: string;
  country: string;
  loginAt: string;
  isActive: boolean;
}

interface BetLeader {
  playerId: string;
  username: string;
  email: string;
  betsToday: number;
  stakeToday: number;
  currency: string;
}

// --- Mock Data ---

const mockPlayers: Player[] = [
  { id: "p1", username: "emma_sthlm", email: "emma@mail.se", brand: "SwedBet", balance: 4250.00, bonusBalance: 500, playerCurrency: "SEK", kycStatus: "verified", country: "SE", registrationDate: "2026-04-07 09:12", lastLogin: "2026-04-07 09:15", totalDeposits: 15000, totalBets: 342 },
  { id: "p2", username: "andreas_gbg", email: "andreas.g@mail.se", brand: "SwedBet", balance: 1890.50, bonusBalance: 0, playerCurrency: "SEK", kycStatus: "verified", country: "SE", registrationDate: "2026-04-07 08:45", lastLogin: "2026-04-07 08:50", totalDeposits: 8000, totalBets: 156 },
  { id: "p3", username: "mikael_fin", email: "mikael@mail.fi", brand: "SwedBet", balance: 12400.00, bonusBalance: 1000, playerCurrency: "EUR", kycStatus: "verified", country: "FI", registrationDate: "2026-04-07 07:30", lastLogin: "2026-04-07 10:20", totalDeposits: 45000, totalBets: 890 },
  { id: "p4", username: "lisa_malmo", email: "lisa.m@mail.se", brand: "SwedBet", balance: 320.00, bonusBalance: 200, playerCurrency: "SEK", kycStatus: "pending", country: "SE", registrationDate: "2026-04-07 06:55", lastLogin: "2026-04-07 07:00", totalDeposits: 1000, totalBets: 28 },
  { id: "p5", username: "olof_oslo", email: "olof@mail.no", brand: "SwedBet", balance: 7800.75, bonusBalance: 0, playerCurrency: "NOK", kycStatus: "verified", country: "NO", registrationDate: "2026-04-06 22:10", lastLogin: "2026-04-07 11:30", totalDeposits: 25000, totalBets: 512 },
  { id: "p6", username: "sara_uppsala", email: "sara.u@mail.se", brand: "SwedBet", balance: 0, bonusBalance: 0, playerCurrency: "SEK", kycStatus: "unverified", country: "SE", registrationDate: "2026-04-06 20:30", lastLogin: "2026-04-06 20:35", totalDeposits: 0, totalBets: 0 },
  { id: "p7", username: "karl_berlin", email: "karl.b@mail.de", brand: "SwedBet", balance: 2100.00, bonusBalance: 350, playerCurrency: "EUR", kycStatus: "verified", country: "DE", registrationDate: "2026-04-06 18:45", lastLogin: "2026-04-07 08:15", totalDeposits: 6000, totalBets: 210 },
  { id: "p8", username: "jenny_sthlm", email: "jenny@mail.se", brand: "SwedBet", balance: 15600.00, bonusBalance: 0, playerCurrency: "SEK", kycStatus: "verified", country: "SE", registrationDate: "2026-04-06 15:20", lastLogin: "2026-04-07 12:00", totalDeposits: 52000, totalBets: 1245 },
  { id: "p9", username: "tomas_cph", email: "tomas@mail.dk", brand: "SwedBet", balance: 450.00, bonusBalance: 100, playerCurrency: "DKK", kycStatus: "pending", country: "DK", registrationDate: "2026-04-06 12:00", lastLogin: "2026-04-06 14:30", totalDeposits: 2000, totalBets: 67 },
  { id: "p10", username: "maria_helsingfors", email: "maria@mail.fi", brand: "SwedBet", balance: 8900.00, bonusBalance: 750, playerCurrency: "EUR", kycStatus: "verified", country: "FI", registrationDate: "2026-04-06 10:00", lastLogin: "2026-04-07 09:45", totalDeposits: 30000, totalBets: 678 },
  { id: "p11", username: "erik_lulea", email: "erik.l@mail.se", brand: "SwedBet", balance: 125.00, bonusBalance: 0, playerCurrency: "SEK", kycStatus: "verified", country: "SE", registrationDate: "2026-04-05 14:30", lastLogin: "2026-04-07 07:55", totalDeposits: 3500, totalBets: 95 },
  { id: "p12", username: "ingrid_bergen", email: "ingrid@mail.no", brand: "SwedBet", balance: 3200.00, bonusBalance: 0, playerCurrency: "NOK", kycStatus: "verified", country: "NO", registrationDate: "2026-04-04 09:00", lastLogin: "2026-04-07 10:10", totalDeposits: 18000, totalBets: 430 },
];

const mockLogins: LoginEntry[] = [
  { id: "ls1", playerId: "p3", username: "mikael_fin", email: "mikael@mail.fi", ip: "85.76.12.45", country: "FI", loginAt: "2026-04-07 10:20", isActive: true },
  { id: "ls2", playerId: "p8", username: "jenny_sthlm", email: "jenny@mail.se", ip: "192.168.1.22", country: "SE", loginAt: "2026-04-07 12:00", isActive: true },
  { id: "ls3", playerId: "p5", username: "olof_oslo", email: "olof@mail.no", ip: "77.110.200.5", country: "NO", loginAt: "2026-04-07 11:30", isActive: true },
  { id: "ls4", playerId: "p10", username: "maria_helsingfors", email: "maria@mail.fi", ip: "91.152.30.88", country: "FI", loginAt: "2026-04-07 09:45", isActive: true },
  { id: "ls5", playerId: "p1", username: "emma_sthlm", email: "emma@mail.se", ip: "83.233.44.12", country: "SE", loginAt: "2026-04-07 09:15", isActive: true },
  { id: "ls6", playerId: "p2", username: "andreas_gbg", email: "andreas.g@mail.se", ip: "83.233.78.200", country: "SE", loginAt: "2026-04-07 08:50", isActive: false },
  { id: "ls7", playerId: "p7", username: "karl_berlin", email: "karl.b@mail.de", ip: "45.12.90.150", country: "DE", loginAt: "2026-04-07 08:15", isActive: false },
  { id: "ls8", playerId: "p11", username: "erik_lulea", email: "erik.l@mail.se", ip: "83.233.22.10", country: "SE", loginAt: "2026-04-07 07:55", isActive: false },
  { id: "ls9", playerId: "p4", username: "lisa_malmo", email: "lisa.m@mail.se", ip: "90.231.15.66", country: "SE", loginAt: "2026-04-07 07:00", isActive: false },
  { id: "ls10", playerId: "p12", username: "ingrid_bergen", email: "ingrid@mail.no", ip: "77.110.45.33", country: "NO", loginAt: "2026-04-07 10:10", isActive: true },
];

const mockBetLeaders: BetLeader[] = [
  { playerId: "p8", username: "jenny_sthlm", email: "jenny@mail.se", betsToday: 87, stakeToday: 14500, currency: "SEK" },
  { playerId: "p3", username: "mikael_fin", email: "mikael@mail.fi", betsToday: 64, stakeToday: 3200, currency: "EUR" },
  { playerId: "p10", username: "maria_helsingfors", email: "maria@mail.fi", betsToday: 52, stakeToday: 2100, currency: "EUR" },
  { playerId: "p5", username: "olof_oslo", email: "olof@mail.no", betsToday: 41, stakeToday: 8900, currency: "NOK" },
  { playerId: "p12", username: "ingrid_bergen", email: "ingrid@mail.no", betsToday: 38, stakeToday: 6200, currency: "NOK" },
  { playerId: "p1", username: "emma_sthlm", email: "emma@mail.se", betsToday: 33, stakeToday: 5500, currency: "SEK" },
  { playerId: "p7", username: "karl_berlin", email: "karl.b@mail.de", betsToday: 27, stakeToday: 1350, currency: "EUR" },
  { playerId: "p2", username: "andreas_gbg", email: "andreas.g@mail.se", betsToday: 22, stakeToday: 3800, currency: "SEK" },
  { playerId: "p11", username: "erik_lulea", email: "erik.l@mail.se", betsToday: 15, stakeToday: 2200, currency: "SEK" },
  { playerId: "p9", username: "tomas_cph", email: "tomas@mail.dk", betsToday: 8, stakeToday: 900, currency: "DKK" },
];

// --- Badge helpers ---

const kycBadge: Record<string, string> = {
  verified: "badge-green",
  pending: "badge-yellow",
  rejected: "badge-red",
  unverified: "badge-gray",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

// --- Table columns for the full player list ---

const columns: Column<Player>[] = [
  { key: "username", header: "Användarnamn", sortable: true },
  { key: "email", header: "E-post", sortable: true },
  {
    key: "balance",
    header: "Saldo",
    sortable: true,
    render: (row) => (
      <span className="font-mono font-medium">{formatCurrency(row.balance, row.playerCurrency)}</span>
    ),
  },
  {
    key: "bonusBalance",
    header: "Bonus",
    sortable: true,
    render: (row) => (
      <span className={clsx("font-mono", row.bonusBalance > 0 ? "text-purple-600" : "text-slate-300")}>
        {row.bonusBalance > 0 ? formatCurrency(row.bonusBalance, row.playerCurrency) : "—"}
      </span>
    ),
  },
  { key: "playerCurrency", header: "Valuta", sortable: true },
  {
    key: "kycStatus",
    header: "KYC",
    sortable: true,
    render: (row) => <span className={kycBadge[row.kycStatus] || "badge-gray"}>{row.kycStatus}</span>,
  },
  { key: "country", header: "Land", sortable: true },
  { key: "registrationDate", header: "Registrerad", sortable: true },
  { key: "lastLogin", header: "Senast inloggad", sortable: true },
];

// --- Page ---

export default function PlayersPage() {
  const router = useRouter();
  const [kycFilter, setKycFilter] = useState("all");

  const newestPlayers = [...mockPlayers].sort((a, b) => b.registrationDate.localeCompare(a.registrationDate)).slice(0, 10);
  const latestLogins = [...mockLogins].sort((a, b) => b.loginAt.localeCompare(a.loginAt)).slice(0, 10);
  const topBettors = [...mockBetLeaders].sort((a, b) => b.betsToday - a.betsToday).slice(0, 10);

  const filteredPlayers = mockPlayers.filter((p) => {
    if (kycFilter !== "all" && p.kycStatus !== kycFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Spelarhantering</h1>
        <p className="text-sm text-slate-500 mt-1">Översikt över spelaraktivitet och kontohantering</p>
      </div>

      {/* Three dashboard sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Section 1: Latest 10 registrations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Senaste registreringar
            </h3>
            <span className="text-xs text-slate-400">Senaste 10</span>
          </div>
          <div className="space-y-0 -mx-4">
            {newestPlayers.map((p, i) => (
              <Link
                key={p.id}
                href={`/players/${p.id}`}
                className={clsx(
                  "flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors",
                  i < newestPlayers.length - 1 && "border-b border-slate-50"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.username}</p>
                  <p className="text-xs text-slate-400 truncate">{p.email}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs text-slate-500">{p.registrationDate.split(" ")[0]}</p>
                  <p className="text-xs text-slate-400">{p.country} · {p.playerCurrency}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Section 2: Latest 10 logins */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Senaste inloggningar
            </h3>
            <span className="text-xs text-slate-400">Senaste 10</span>
          </div>
          <div className="space-y-0 -mx-4">
            {latestLogins.map((l, i) => (
              <Link
                key={l.id}
                href={`/players/${l.playerId}`}
                className={clsx(
                  "flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors",
                  i < latestLogins.length - 1 && "border-b border-slate-50"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">{l.username}</p>
                    {l.isActive && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-green-600 font-medium">Online</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{l.ip} · {l.country}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs text-slate-500">{l.loginAt.split(" ")[1]}</p>
                  <p className="text-xs text-slate-400">{l.loginAt.split(" ")[0]}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Section 3: Top 10 bettors today */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Mest aktiva idag
            </h3>
            <span className="text-xs text-slate-400">Flest spel idag</span>
          </div>
          <div className="space-y-0 -mx-4">
            {topBettors.map((b, i) => (
              <Link
                key={b.playerId}
                href={`/players/${b.playerId}`}
                className={clsx(
                  "flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors",
                  i < topBettors.length - 1 && "border-b border-slate-50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-yellow-100 text-yellow-700" :
                    i === 1 ? "bg-slate-100 text-slate-600" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-slate-50 text-slate-400"
                  )}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{b.username}</p>
                    <p className="text-xs text-slate-400 truncate">{b.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-slate-900">{b.betsToday} <span className="text-xs font-normal text-slate-400">spel</span></p>
                  <p className="text-xs text-slate-400 font-mono">{formatCurrency(b.stakeToday, b.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Full player list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Alla spelare</h3>
          <div className="flex items-center gap-3">
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="input w-auto text-sm"
            >
              <option value="all">Alla KYC-statusar</option>
              <option value="verified">Verifierad</option>
              <option value="pending">Väntande</option>
              <option value="rejected">Avvisad</option>
              <option value="unverified">Overifierad</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPlayers}
          searchable
          searchKeys={["username", "email", "country"]}
          exportable
          exportFilename="players"
          onRowClick={(row) => router.push(`/players/${row.id}`)}
        />
      </div>
    </div>
  );
}
