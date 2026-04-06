"use client";

import { useParams, useRouter } from "next/navigation";
import KPICard from "@/components/KPICard";
import Chart from "@/components/Chart";
import DataTable, { Column } from "@/components/DataTable";

const campaignData: Record<string, { name: string; type: string; status: string; claims: number; cost: number; conversion: number; depositMatch: number | null; freeSpins: number | null; wageringReq: number; minDeposit: number; maxBonus: number; validFrom: string; validTo: string; brands: string[] }> = {
  c1: { name: "Welcome Bonus 100%", type: "Deposit Match", status: "active", claims: 1842, cost: 245000, conversion: 34.5, depositMatch: 100, freeSpins: null, wageringReq: 30, minDeposit: 20, maxBonus: 500, validFrom: "2026-01-01", validTo: "2026-12-31", brands: ["Odin Casino", "Thor Gaming"] },
  c2: { name: "Friday Free Spins", type: "Free Spins", status: "active", claims: 3210, cost: 48000, conversion: 62.1, depositMatch: null, freeSpins: 50, wageringReq: 25, minDeposit: 10, maxBonus: 100, validFrom: "2026-01-01", validTo: "2026-12-31", brands: ["Freya Slots"] },
};

const defaultCampaign = { name: "Campaign", type: "Deposit Match", status: "active", claims: 500, cost: 75000, conversion: 28.3, depositMatch: 50, freeSpins: null, wageringReq: 20, minDeposit: 25, maxBonus: 300, validFrom: "2026-01-01", validTo: "2026-12-31", brands: ["Odin Casino"] };

const claimsOverTime = [
  { date: "Week 1", claims: 120, cost: 18000 },
  { date: "Week 2", claims: 145, cost: 21000 },
  { date: "Week 3", claims: 135, cost: 19500 },
  { date: "Week 4", claims: 190, cost: 28000 },
  { date: "Week 5", claims: 210, cost: 31000 },
  { date: "Week 6", claims: 178, cost: 26000 },
  { date: "Week 7", claims: 225, cost: 33000 },
  { date: "Week 8", claims: 195, cost: 29000 },
];

interface Claimant {
  username: string;
  email: string;
  claimedAt: string;
  bonusAmount: number;
  wageringProgress: string;
  status: string;
  [key: string]: unknown;
}

const claimants: Claimant[] = [
  { username: "viking_king", email: "viking@mail.com", claimedAt: "2026-04-05", bonusAmount: 200, wageringProgress: "80%", status: "active" },
  { username: "slot_master22", email: "slots22@mail.com", claimedAt: "2026-04-04", bonusAmount: 100, wageringProgress: "45%", status: "active" },
  { username: "spinqueen", email: "spinq@mail.com", claimedAt: "2026-04-03", bonusAmount: 500, wageringProgress: "100%", status: "completed" },
  { username: "high_roller_dk", email: "hrdk@mail.com", claimedAt: "2026-04-02", bonusAmount: 500, wageringProgress: "92%", status: "active" },
  { username: "live_ace", email: "lace@mail.com", claimedAt: "2026-04-01", bonusAmount: 300, wageringProgress: "100%", status: "completed" },
  { username: "norse_bettor", email: "norse@mail.com", claimedAt: "2026-03-30", bonusAmount: 150, wageringProgress: "60%", status: "active" },
  { username: "bonus_hunter", email: "bhunt@mail.com", claimedAt: "2026-03-28", bonusAmount: 100, wageringProgress: "100%", status: "forfeited" },
  { username: "reel_runner", email: "reel@mail.com", claimedAt: "2026-03-25", bonusAmount: 50, wageringProgress: "25%", status: "expired" },
];

const claimantColumns: Column<Claimant>[] = [
  { key: "username", header: "Username", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "claimedAt", header: "Claimed At", sortable: true },
  {
    key: "bonusAmount",
    header: "Bonus",
    sortable: true,
    render: (row) => <span className="font-mono">${row.bonusAmount}</span>,
  },
  { key: "wageringProgress", header: "Wagering", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => {
      const colors: Record<string, string> = { active: "badge-blue", completed: "badge-green", forfeited: "badge-red", expired: "badge-gray" };
      return <span className={colors[row.status] || "badge-gray"}>{row.status}</span>;
    },
  },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaign = campaignData[params.id as string] || defaultCampaign;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/campaigns")} className="btn-secondary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{campaign.name}</h2>
            <span className={campaign.status === "active" ? "badge-green" : "badge-gray"}>{campaign.status}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {campaign.type} &middot; {campaign.validFrom} to {campaign.validTo} &middot; {campaign.brands.join(", ")}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">Edit</button>
          <button className="btn-danger">Pause Campaign</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Claims"
          value={campaign.claims.toLocaleString()}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <KPICard
          title="Total Cost"
          value={`$${campaign.cost.toLocaleString()}`}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KPICard
          title="Conversion Rate"
          value={`${campaign.conversion}%`}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <KPICard
          title="Avg Cost/Claim"
          value={`$${campaign.claims > 0 ? Math.round(campaign.cost / campaign.claims) : 0}`}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Chart
          type="bar"
          title="Claims Over Time"
          data={claimsOverTime}
          xKey="date"
          series={[{ dataKey: "claims", color: "#2563eb", name: "Claims" }]}
        />
        <Chart
          type="area"
          title="Cost Over Time"
          data={claimsOverTime}
          xKey="date"
          series={[{ dataKey: "cost", color: "#f59e0b", name: "Cost ($)" }]}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Players Who Claimed</h3>
        <DataTable
          columns={claimantColumns}
          data={claimants}
          searchable
          searchKeys={["username", "email"]}
          exportable
          exportFilename={`campaign-${params.id}-claims`}
        />
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">Campaign Rules</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["Type", campaign.type],
            ["Deposit Match", campaign.depositMatch ? `${campaign.depositMatch}%` : "N/A"],
            ["Free Spins", campaign.freeSpins ? `${campaign.freeSpins}` : "N/A"],
            ["Wagering Req", `${campaign.wageringReq}x`],
            ["Min Deposit", `$${campaign.minDeposit}`],
            ["Max Bonus", `$${campaign.maxBonus}`],
            ["Valid From", campaign.validFrom],
            ["Valid To", campaign.validTo],
          ].map(([label, value]) => (
            <div key={label} className="p-3 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-semibold text-slate-900 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
