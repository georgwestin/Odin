"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/DataTable";
import clsx from "clsx";

interface Player {
  id: string;
  username: string;
  email: string;
  brand: string;
  balance: number;
  kycStatus: string;
  country: string;
  registrationDate: string;
  lastLogin: string;
  [key: string]: unknown;
}

const kycBadge: Record<string, string> = {
  verified: "badge-green",
  pending: "badge-yellow",
  rejected: "badge-red",
  unverified: "badge-gray",
};

const mockPlayers: Player[] = [
  { id: "p1", username: "viking_king", email: "viking@mail.com", brand: "Odin Casino", balance: 2450.0, kycStatus: "verified", country: "SE", registrationDate: "2025-11-02", lastLogin: "2026-04-06 14:23" },
  { id: "p2", username: "slot_master22", email: "slots22@mail.com", brand: "Freya Slots", balance: 890.5, kycStatus: "pending", country: "FI", registrationDate: "2026-01-15", lastLogin: "2026-04-06 12:10" },
  { id: "p3", username: "jp_whale_99", email: "whale99@mail.com", brand: "Odin Casino", balance: 54200.0, kycStatus: "verified", country: "NO", registrationDate: "2025-08-20", lastLogin: "2026-04-06 09:45" },
  { id: "p4", username: "lucky_finn", email: "lfinn@mail.com", brand: "Valhalla Bet", balance: 120.0, kycStatus: "unverified", country: "FI", registrationDate: "2026-03-28", lastLogin: "2026-04-05 22:30" },
  { id: "p5", username: "bet_warrior", email: "warrior@mail.com", brand: "Thor Gaming", balance: 3100.75, kycStatus: "verified", country: "DE", registrationDate: "2025-12-10", lastLogin: "2026-04-06 08:00" },
  { id: "p6", username: "casino_pro", email: "cpro@mail.com", brand: "Odin Casino", balance: 780.0, kycStatus: "rejected", country: "UK", registrationDate: "2026-02-14", lastLogin: "2026-04-04 16:20" },
  { id: "p7", username: "spinqueen", email: "spinq@mail.com", brand: "Freya Slots", balance: 1650.25, kycStatus: "verified", country: "SE", registrationDate: "2025-09-01", lastLogin: "2026-04-06 11:55" },
  { id: "p8", username: "norse_bettor", email: "norse@mail.com", brand: "Valhalla Bet", balance: 4320.0, kycStatus: "pending", country: "NO", registrationDate: "2026-01-22", lastLogin: "2026-04-06 13:40" },
  { id: "p9", username: "reel_runner", email: "reel@mail.com", brand: "Thor Gaming", balance: 50.0, kycStatus: "unverified", country: "EE", registrationDate: "2026-04-01", lastLogin: "2026-04-06 07:15" },
  { id: "p10", username: "high_roller_dk", email: "hrdk@mail.com", brand: "Odin Casino", balance: 28750.0, kycStatus: "verified", country: "DK", registrationDate: "2025-06-18", lastLogin: "2026-04-06 15:00" },
  { id: "p11", username: "bonus_hunter", email: "bhunt@mail.com", brand: "Freya Slots", balance: 0.0, kycStatus: "verified", country: "LT", registrationDate: "2026-02-28", lastLogin: "2026-04-03 19:10" },
  { id: "p12", username: "live_ace", email: "lace@mail.com", brand: "Odin Casino", balance: 6100.0, kycStatus: "verified", country: "SE", registrationDate: "2025-10-05", lastLogin: "2026-04-06 10:30" },
];

const columns: Column<Player>[] = [
  { key: "username", header: "Username", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "brand", header: "Brand", sortable: true },
  {
    key: "balance",
    header: "Balance",
    sortable: true,
    render: (row) => (
      <span className="font-mono font-medium">
        ${row.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "kycStatus",
    header: "KYC Status",
    sortable: true,
    render: (row) => (
      <span className={kycBadge[row.kycStatus] || "badge-gray"}>{row.kycStatus}</span>
    ),
  },
  { key: "country", header: "Country", sortable: true },
  { key: "registrationDate", header: "Registered", sortable: true },
  { key: "lastLogin", header: "Last Login", sortable: true },
];

export default function PlayersPage() {
  const router = useRouter();
  const [kycFilter, setKycFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  const filtered = mockPlayers.filter((p) => {
    if (kycFilter !== "all" && p.kycStatus !== kycFilter) return false;
    if (brandFilter !== "all" && p.brand !== brandFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Players</h2>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All KYC Statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="unverified">Unverified</option>
        </select>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Brands</option>
          <option value="Odin Casino">Odin Casino</option>
          <option value="Valhalla Bet">Valhalla Bet</option>
          <option value="Thor Gaming">Thor Gaming</option>
          <option value="Freya Slots">Freya Slots</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchable
        searchKeys={["username", "email", "country"]}
        exportable
        exportFilename="players"
        onRowClick={(row) => router.push(`/players/${row.id}`)}
      />
    </div>
  );
}
