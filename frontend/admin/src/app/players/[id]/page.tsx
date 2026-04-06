"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";

const playerData: Record<string, {
  id: string; username: string; email: string; fullName: string; phone: string;
  brand: string; country: string; dob: string; balance: number; bonusBalance: number;
  kycStatus: string; kycDocuments: { type: string; status: string; uploadedAt: string }[];
  registrationDate: string; lastLogin: string; blocked: boolean;
  responsibleGambling: { depositLimit: string; lossLimit: string; selfExcludedUntil: string | null };
}> = {
  p1: {
    id: "p1", username: "viking_king", email: "viking@mail.com", fullName: "Erik Johansson", phone: "+46 70 123 4567",
    brand: "Odin Casino", country: "SE", dob: "1990-03-15", balance: 2450.00, bonusBalance: 150.00,
    kycStatus: "verified",
    kycDocuments: [
      { type: "ID Card", status: "approved", uploadedAt: "2025-11-05" },
      { type: "Proof of Address", status: "approved", uploadedAt: "2025-11-06" },
    ],
    registrationDate: "2025-11-02", lastLogin: "2026-04-06 14:23", blocked: false,
    responsibleGambling: { depositLimit: "$1,000/week", lossLimit: "$500/week", selfExcludedUntil: null },
  },
  p3: {
    id: "p3", username: "jp_whale_99", email: "whale99@mail.com", fullName: "Ole Nordmann", phone: "+47 91 234 567",
    brand: "Odin Casino", country: "NO", dob: "1985-07-22", balance: 54200.00, bonusBalance: 0.00,
    kycStatus: "verified",
    kycDocuments: [
      { type: "Passport", status: "approved", uploadedAt: "2025-08-22" },
      { type: "Bank Statement", status: "approved", uploadedAt: "2025-08-23" },
      { type: "Source of Funds", status: "approved", uploadedAt: "2025-09-01" },
    ],
    registrationDate: "2025-08-20", lastLogin: "2026-04-06 09:45", blocked: false,
    responsibleGambling: { depositLimit: "No limit", lossLimit: "No limit", selfExcludedUntil: null },
  },
};

const defaultPlayer = {
  id: "p2", username: "slot_master22", email: "slots22@mail.com", fullName: "Matti Virtanen", phone: "+358 40 123 4567",
  brand: "Freya Slots", country: "FI", dob: "1992-11-08", balance: 890.50, bonusBalance: 200.00,
  kycStatus: "pending",
  kycDocuments: [
    { type: "ID Card", status: "pending", uploadedAt: "2026-04-04" },
    { type: "Proof of Address", status: "pending", uploadedAt: "2026-04-04" },
  ],
  registrationDate: "2026-01-15", lastLogin: "2026-04-06 12:10", blocked: false,
  responsibleGambling: { depositLimit: "$500/week", lossLimit: "$200/week", selfExcludedUntil: null },
};

const transactions = [
  { id: "t1", type: "deposit", amount: 500.00, method: "Visa", status: "completed", date: "2026-04-06 10:00" },
  { id: "t2", type: "bet", amount: -50.00, method: "Casino", status: "settled", date: "2026-04-06 10:15" },
  { id: "t3", type: "win", amount: 120.00, method: "Casino", status: "settled", date: "2026-04-06 10:15" },
  { id: "t4", type: "bet", amount: -25.00, method: "Sportsbook", status: "settled", date: "2026-04-06 11:00" },
  { id: "t5", type: "withdrawal", amount: -200.00, method: "Bank Transfer", status: "pending", date: "2026-04-06 12:00" },
  { id: "t6", type: "bonus", amount: 100.00, method: "Welcome Bonus", status: "credited", date: "2026-01-15 09:00" },
];

const betHistory = [
  { id: "b1", game: "Book of Dead", type: "Casino", stake: 5.00, payout: 12.50, date: "2026-04-06 14:10" },
  { id: "b2", game: "Liverpool vs Arsenal", type: "Sports", stake: 25.00, payout: 0, date: "2026-04-06 11:00" },
  { id: "b3", game: "Starburst", type: "Casino", stake: 2.00, payout: 0, date: "2026-04-06 10:30" },
  { id: "b4", game: "Gonzo's Quest", type: "Casino", stake: 10.00, payout: 45.00, date: "2026-04-05 22:15" },
  { id: "b5", game: "Man City vs Chelsea", type: "Sports", stake: 50.00, payout: 95.00, date: "2026-04-05 15:00" },
];

const sessions = [
  { ip: "192.168.1.42", device: "Chrome / macOS", started: "2026-04-06 14:00", duration: "23 min", country: "SE" },
  { ip: "192.168.1.42", device: "Chrome / macOS", started: "2026-04-06 10:00", duration: "1h 45min", country: "SE" },
  { ip: "10.0.0.5", device: "Safari / iPhone", started: "2026-04-05 22:00", duration: "35 min", country: "SE" },
  { ip: "10.0.0.5", device: "Safari / iPhone", started: "2026-04-04 19:30", duration: "2h 10min", country: "SE" },
];

type Tab = "profile" | "kyc" | "transactions" | "bets" | "bonuses" | "responsible" | "sessions";

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showBonusModal, setShowBonusModal] = useState(false);

  const player = playerData[params.id as string] || defaultPlayer;

  const kycDocStatus: Record<string, string> = {
    approved: "badge-green",
    pending: "badge-yellow",
    rejected: "badge-red",
  };

  const txTypeColor: Record<string, string> = {
    deposit: "text-emerald-600",
    win: "text-emerald-600",
    bonus: "text-blue-600",
    bet: "text-red-600",
    withdrawal: "text-red-600",
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "kyc", label: "KYC" },
    { key: "transactions", label: "Transactions" },
    { key: "bets", label: "Bet History" },
    { key: "bonuses", label: "Bonuses" },
    { key: "responsible", label: "Responsible Gambling" },
    { key: "sessions", label: "Sessions" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/players")} className="btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">{player.username}</h2>
          <p className="text-sm text-slate-500">{player.fullName} &middot; {player.email} &middot; {player.brand}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBonusModal(true)} className="btn-primary">Issue Bonus</button>
          <button className="btn-secondary">Update KYC</button>
          <button className={player.blocked ? "btn-success" : "btn-danger"}>
            {player.blocked ? "Unblock" : "Block Player"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-sm text-slate-500">Cash Balance</p>
          <p className="text-xl font-bold text-slate-900 mt-1">${player.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Bonus Balance</p>
          <p className="text-xl font-bold text-blue-600 mt-1">${player.bonusBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">KYC Status</p>
          <p className="mt-2"><span className={kycDocStatus[player.kycStatus] || "badge-gray"}>{player.kycStatus}</span></p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Account Status</p>
          <p className="mt-2"><span className={player.blocked ? "badge-red" : "badge-green"}>{player.blocked ? "Blocked" : "Active"}</span></p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-accent text-accent"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "profile" && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Player Information</h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {[
              ["Username", player.username],
              ["Full Name", player.fullName],
              ["Email", player.email],
              ["Phone", player.phone],
              ["Date of Birth", player.dob],
              ["Country", player.country],
              ["Brand", player.brand],
              ["Registration Date", player.registrationDate],
              ["Last Login", player.lastLogin],
              ["Player ID", player.id],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "kyc" && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">KYC Documents</h3>
            <div className="space-y-3">
              {player.kycDocuments.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{doc.type}</p>
                    <p className="text-xs text-slate-400">Uploaded: {doc.uploadedAt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={kycDocStatus[doc.status] || "badge-gray"}>{doc.status}</span>
                    {doc.status === "pending" && (
                      <div className="flex gap-2">
                        <button className="btn-success text-xs px-3 py-1">Approve</button>
                        <button className="btn-danger text-xs px-3 py-1">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Request Additional Documents</h3>
            <div className="flex gap-2">
              {["ID Card", "Passport", "Proof of Address", "Bank Statement", "Source of Funds"].map((docType) => (
                <button key={docType} className="btn-secondary text-xs">{docType}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Wallet Transactions</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-600 font-semibold">Type</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Amount</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Method</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Status</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-50">
                  <td className="py-2.5 capitalize">{tx.type}</td>
                  <td className={clsx("py-2.5 font-mono font-medium", txTypeColor[tx.type])}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-slate-600">{tx.method}</td>
                  <td className="py-2.5"><span className={tx.status === "completed" || tx.status === "settled" || tx.status === "credited" ? "badge-green" : "badge-yellow"}>{tx.status}</span></td>
                  <td className="py-2.5 text-slate-500">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "bets" && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Bet History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-600 font-semibold">Game / Event</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Type</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Stake</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Payout</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Result</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {betHistory.map((bet) => (
                <tr key={bet.id} className="border-b border-slate-50">
                  <td className="py-2.5 font-medium">{bet.game}</td>
                  <td className="py-2.5"><span className={bet.type === "Casino" ? "badge-blue" : "badge-green"}>{bet.type}</span></td>
                  <td className="py-2.5 font-mono">${bet.stake.toFixed(2)}</td>
                  <td className="py-2.5 font-mono">{bet.payout > 0 ? `$${bet.payout.toFixed(2)}` : "-"}</td>
                  <td className="py-2.5"><span className={bet.payout > 0 ? "badge-green" : "badge-red"}>{bet.payout > 0 ? "Won" : "Lost"}</span></td>
                  <td className="py-2.5 text-slate-500">{bet.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "bonuses" && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Bonus History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-600 font-semibold">Campaign</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Type</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Amount</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Wagering</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Status</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50">
                <td className="py-2.5 font-medium">Welcome Bonus 100%</td>
                <td className="py-2.5">Deposit Match</td>
                <td className="py-2.5 font-mono">$100.00</td>
                <td className="py-2.5">$2,400 / $3,000</td>
                <td className="py-2.5"><span className="badge-yellow">Active</span></td>
                <td className="py-2.5 text-slate-500">2026-01-15</td>
              </tr>
              <tr className="border-b border-slate-50">
                <td className="py-2.5 font-medium">Friday Free Spins</td>
                <td className="py-2.5">Free Spins</td>
                <td className="py-2.5 font-mono">50 spins</td>
                <td className="py-2.5">Completed</td>
                <td className="py-2.5"><span className="badge-green">Completed</span></td>
                <td className="py-2.5 text-slate-500">2026-03-29</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "responsible" && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Responsible Gambling Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">Deposit Limit</p>
                <p className="text-lg font-semibold mt-1">{player.responsibleGambling.depositLimit}</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">Loss Limit</p>
                <p className="text-lg font-semibold mt-1">{player.responsibleGambling.lossLimit}</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">Self-Exclusion</p>
                <p className="text-lg font-semibold mt-1">{player.responsibleGambling.selfExcludedUntil || "None"}</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">Reality Check</p>
                <p className="text-lg font-semibold mt-1">Every 60 minutes</p>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">Admin Actions</h3>
            <div className="flex gap-3">
              <button className="btn-secondary">Set Cooling-Off Period</button>
              <button className="btn-danger">Force Self-Exclusion</button>
              <button className="btn-secondary">Adjust Limits</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Session History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-slate-600 font-semibold">IP Address</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Device</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Country</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Started</th>
                <th className="text-left py-2 text-slate-600 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2.5 font-mono text-xs">{s.ip}</td>
                  <td className="py-2.5">{s.device}</td>
                  <td className="py-2.5">{s.country}</td>
                  <td className="py-2.5 text-slate-500">{s.started}</td>
                  <td className="py-2.5">{s.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBonusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Issue Manual Bonus</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bonus Type</label>
                <select className="input">
                  <option>Cash Bonus</option>
                  <option>Free Spins</option>
                  <option>Free Bet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input type="number" className="input" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wagering Requirement (x)</label>
                <input type="number" className="input" placeholder="30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea className="input" rows={2} placeholder="Reason for issuing bonus..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowBonusModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => setShowBonusModal(false)} className="btn-primary">Issue Bonus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
