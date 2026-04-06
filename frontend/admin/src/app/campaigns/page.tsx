"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  depositMatch: number | null;
  freeSpins: number | null;
  wageringReq: number;
  minDeposit: number;
  maxBonus: number;
  validFrom: string;
  validTo: string;
  brands: string[];
  claims: number;
  cost: number;
}

const mockCampaigns: Campaign[] = [
  { id: "c1", name: "Welcome Bonus 100%", type: "Deposit Match", status: "active", depositMatch: 100, freeSpins: null, wageringReq: 30, minDeposit: 20, maxBonus: 500, validFrom: "2026-01-01", validTo: "2026-12-31", brands: ["Odin Casino", "Thor Gaming"], claims: 1842, cost: 245000 },
  { id: "c2", name: "Friday Free Spins", type: "Free Spins", status: "active", depositMatch: null, freeSpins: 50, wageringReq: 25, minDeposit: 10, maxBonus: 100, validFrom: "2026-01-01", validTo: "2026-12-31", brands: ["Freya Slots"], claims: 3210, cost: 48000 },
  { id: "c3", name: "VIP Reload 50%", type: "Deposit Match", status: "active", depositMatch: 50, freeSpins: null, wageringReq: 20, minDeposit: 50, maxBonus: 1000, validFrom: "2026-03-01", validTo: "2026-06-30", brands: ["Odin Casino"], claims: 456, cost: 182000 },
  { id: "c4", name: "Sports Welcome Offer", type: "Free Bet", status: "active", depositMatch: null, freeSpins: null, wageringReq: 5, minDeposit: 10, maxBonus: 50, validFrom: "2026-01-01", validTo: "2026-12-31", brands: ["Valhalla Bet"], claims: 890, cost: 32000 },
  { id: "c5", name: "Summer Slots Fest", type: "Free Spins", status: "scheduled", depositMatch: null, freeSpins: 200, wageringReq: 35, minDeposit: 25, maxBonus: 200, validFrom: "2026-06-01", validTo: "2026-08-31", brands: ["Freya Slots", "Odin Casino"], claims: 0, cost: 0 },
  { id: "c6", name: "Easter Cashback", type: "Cashback", status: "ended", depositMatch: null, freeSpins: null, wageringReq: 1, minDeposit: 0, maxBonus: 250, validFrom: "2026-03-20", validTo: "2026-04-01", brands: ["Odin Casino", "Freya Slots", "Thor Gaming", "Valhalla Bet"], claims: 2100, cost: 156000 },
];

const statusColors: Record<string, string> = {
  active: "badge-green",
  scheduled: "badge-blue",
  ended: "badge-gray",
  paused: "badge-yellow",
};

export default function CampaignsPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "Deposit Match", depositMatch: "", freeSpins: "", wageringReq: "30",
    minDeposit: "20", maxBonus: "500", validFrom: "", validTo: "", brands: [] as string[],
  });

  const toggleBrand = (brand: string) => {
    setForm((f) => ({
      ...f,
      brands: f.brands.includes(brand)
        ? f.brands.filter((b) => b !== brand)
        : [...f.brands, brand],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Campaign Management</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Campaign
        </button>
      </div>

      <div className="grid gap-4">
        {mockCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            onClick={() => router.push(`/campaigns/${campaign.id}`)}
            className="card cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                  <span className={statusColors[campaign.status]}>{campaign.status}</span>
                  <span className="badge-blue">{campaign.type}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <span>{campaign.validFrom} to {campaign.validTo}</span>
                  <span className="text-slate-300">|</span>
                  <span>Brands: {campaign.brands.join(", ")}</span>
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-xs text-slate-500">Claims</p>
                  <p className="font-semibold text-slate-900">{campaign.claims.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Cost</p>
                  <p className="font-semibold text-slate-900">${campaign.cost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Wagering</p>
                  <p className="font-semibold text-slate-900">{campaign.wageringReq}x</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Min Deposit</p>
                  <p className="font-semibold text-slate-900">${campaign.minDeposit}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Create Campaign</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Summer Reload 75%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>Deposit Match</option>
                  <option>Free Spins</option>
                  <option>Free Bet</option>
                  <option>Cashback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {form.type === "Free Spins" ? "Free Spins Count" : "Deposit Match %"}
                </label>
                <input
                  type="number"
                  className="input"
                  value={form.type === "Free Spins" ? form.freeSpins : form.depositMatch}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ...(form.type === "Free Spins"
                        ? { freeSpins: e.target.value }
                        : { depositMatch: e.target.value }),
                    })
                  }
                  placeholder={form.type === "Free Spins" ? "50" : "100"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wagering Requirement (x)</label>
                <input type="number" className="input" value={form.wageringReq} onChange={(e) => setForm({ ...form, wageringReq: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Min Deposit ($)</label>
                <input type="number" className="input" value={form.minDeposit} onChange={(e) => setForm({ ...form, minDeposit: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Bonus ($)</label>
                <input type="number" className="input" value={form.maxBonus} onChange={(e) => setForm({ ...form, maxBonus: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
                <input type="date" className="input" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valid To</label>
                <input type="date" className="input" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Brands</label>
                <div className="flex gap-2">
                  {["Odin Casino", "Valhalla Bet", "Thor Gaming", "Freya Slots"].map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                        form.brands.includes(brand)
                          ? "bg-accent text-white border-accent"
                          : "bg-white text-slate-600 border-slate-300 hover:border-accent"
                      )}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => setShowCreate(false)} className="btn-primary">Create Campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
