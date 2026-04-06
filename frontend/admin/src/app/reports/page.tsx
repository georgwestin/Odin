"use client";

import Link from "next/link";
import Chart from "@/components/Chart";
import KPICard from "@/components/KPICard";

const ggrByBrand = [
  { brand: "Odin Casino", ggr: 320000, ngr: 264000 },
  { brand: "Freya Slots", ggr: 185000, ngr: 148000 },
  { brand: "Valhalla Bet", ggr: 142000, ngr: 118000 },
  { brand: "Thor Gaming", ggr: 95000, ngr: 76000 },
];

const playerActivity = [
  { date: "Jan", active: 12400, new: 2100, churned: 800 },
  { date: "Feb", active: 13200, new: 2400, churned: 750 },
  { date: "Mar", active: 14800, new: 2800, churned: 920 },
  { date: "Apr", active: 15200, new: 3100, churned: 680 },
];

const betsByCategory = [
  { category: "Slots", bets: 145000, ggr: 42000 },
  { category: "Live Casino", bets: 89000, ggr: 28000 },
  { category: "Sports Pre-Match", bets: 67000, ggr: 18000 },
  { category: "Sports Live", bets: 52000, ggr: 14500 },
  { category: "Table Games", bets: 34000, ggr: 9800 },
  { category: "Poker", bets: 21000, ggr: 5200 },
];

const responsibleGamblingStats = [
  { month: "Jan", selfExclusions: 45, limitChanges: 210, coolingOff: 32 },
  { month: "Feb", selfExclusions: 52, limitChanges: 235, coolingOff: 28 },
  { month: "Mar", selfExclusions: 38, limitChanges: 280, coolingOff: 41 },
  { month: "Apr", selfExclusions: 41, limitChanges: 260, coolingOff: 35 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Reports Dashboard</h2>
        <Link href="/reports/ggr" className="btn-primary">
          Detailed GGR Report
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total GGR (MTD)"
          value="$742,000"
          change="14.2%"
          changeType="positive"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KPICard
          title="Total NGR (MTD)"
          value="$606,000"
          change="11.8%"
          changeType="positive"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <KPICard
          title="Total Bets (MTD)"
          value="408,000"
          change="9.5%"
          changeType="positive"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <KPICard
          title="Active Players (MTD)"
          value="15,200"
          change="6.3%"
          changeType="positive"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Chart
          type="bar"
          title="GGR / NGR by Brand (This Month)"
          data={ggrByBrand}
          xKey="brand"
          series={[
            { dataKey: "ggr", color: "#2563eb", name: "GGR" },
            { dataKey: "ngr", color: "#10b981", name: "NGR" },
          ]}
        />
        <Chart
          type="line"
          title="Player Activity Trend"
          data={playerActivity}
          xKey="date"
          series={[
            { dataKey: "active", color: "#2563eb", name: "Active" },
            { dataKey: "new", color: "#10b981", name: "New" },
            { dataKey: "churned", color: "#ef4444", name: "Churned" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Chart
          type="bar"
          title="Bets & GGR by Category"
          data={betsByCategory}
          xKey="category"
          series={[
            { dataKey: "bets", color: "#94a3b8", name: "Total Bets" },
            { dataKey: "ggr", color: "#2563eb", name: "GGR" },
          ]}
        />
        <Chart
          type="line"
          title="Responsible Gambling Metrics"
          data={responsibleGamblingStats}
          xKey="month"
          series={[
            { dataKey: "selfExclusions", color: "#ef4444", name: "Self-Exclusions" },
            { dataKey: "limitChanges", color: "#f59e0b", name: "Limit Changes" },
            { dataKey: "coolingOff", color: "#8b5cf6", name: "Cooling Off" },
          ]}
        />
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-4">GGR Breakdown by Brand</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-slate-600 font-semibold">Brand</th>
              <th className="text-right py-2 text-slate-600 font-semibold">GGR</th>
              <th className="text-right py-2 text-slate-600 font-semibold">NGR</th>
              <th className="text-right py-2 text-slate-600 font-semibold">Margin</th>
              <th className="text-right py-2 text-slate-600 font-semibold">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {ggrByBrand.map((row) => {
              const total = ggrByBrand.reduce((s, r) => s + r.ggr, 0);
              return (
                <tr key={row.brand} className="border-b border-slate-50">
                  <td className="py-3 font-medium">{row.brand}</td>
                  <td className="py-3 text-right font-mono">${row.ggr.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono">${row.ngr.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono">{((row.ngr / row.ggr) * 100).toFixed(1)}%</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(row.ggr / total) * 100}%` }} />
                      </div>
                      <span className="font-mono text-xs">{((row.ggr / total) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
