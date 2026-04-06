"use client";

import { useAuthStore } from "@/lib/auth";

const BRANDS = [
  { id: "all", name: "All Brands" },
  { id: "odin-casino", name: "Odin Casino" },
  { id: "valhalla-bet", name: "Valhalla Bet" },
  { id: "thor-gaming", name: "Thor Gaming" },
  { id: "freya-slots", name: "Freya Slots" },
];

export default function BrandSelector() {
  const activeBrand = useAuthStore((s) => s.activeBrand);
  const setActiveBrand = useAuthStore((s) => s.setActiveBrand);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="brand-select" className="text-sm text-slate-500 font-medium">
        Brand:
      </label>
      <select
        id="brand-select"
        value={activeBrand}
        onChange={(e) => setActiveBrand(e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
      >
        {BRANDS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
