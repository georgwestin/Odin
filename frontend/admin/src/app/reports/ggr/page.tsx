"use client";

import { useState } from "react";
import Chart from "@/components/Chart";
import DataTable, { Column } from "@/components/DataTable";

interface GgrRow {
  date: string;
  brand: string;
  bets: number;
  wins: number;
  ggr: number;
  ngr: number;
  bonusCost: number;
  margin: number;
  [key: string]: unknown;
}

const ggrData: GgrRow[] = [
  { date: "2026-04-06", brand: "Odin Casino", bets: 185000, wins: 168000, ggr: 17000, ngr: 14200, bonusCost: 2800, margin: 9.2 },
  { date: "2026-04-06", brand: "Freya Slots", bets: 95000, wins: 86000, ggr: 9000, ngr: 7200, bonusCost: 1800, margin: 9.5 },
  { date: "2026-04-06", brand: "Valhalla Bet", bets: 72000, wins: 65000, ggr: 7000, ngr: 5800, bonusCost: 1200, margin: 9.7 },
  { date: "2026-04-06", brand: "Thor Gaming", bets: 48000, wins: 44000, ggr: 4000, ngr: 3200, bonusCost: 800, margin: 8.3 },
  { date: "2026-04-05", brand: "Odin Casino", bets: 192000, wins: 174000, ggr: 18000, ngr: 15100, bonusCost: 2900, margin: 9.4 },
  { date: "2026-04-05", brand: "Freya Slots", bets: 102000, wins: 92000, ggr: 10000, ngr: 8100, bonusCost: 1900, margin: 9.8 },
  { date: "2026-04-05", brand: "Valhalla Bet", bets: 68000, wins: 61500, ggr: 6500, ngr: 5400, bonusCost: 1100, margin: 9.6 },
  { date: "2026-04-05", brand: "Thor Gaming", bets: 51000, wins: 46500, ggr: 4500, ngr: 3600, bonusCost: 900, margin: 8.8 },
  { date: "2026-04-04", brand: "Odin Casino", bets: 178000, wins: 162000, ggr: 16000, ngr: 13500, bonusCost: 2500, margin: 9.0 },
  { date: "2026-04-04", brand: "Freya Slots", bets: 88000, wins: 79800, ggr: 8200, ngr: 6600, bonusCost: 1600, margin: 9.3 },
  { date: "2026-04-04", brand: "Valhalla Bet", bets: 75000, wins: 67800, ggr: 7200, ngr: 6000, bonusCost: 1200, margin: 9.6 },
  { date: "2026-04-04", brand: "Thor Gaming", bets: 45000, wins: 41200, ggr: 3800, ngr: 3000, bonusCost: 800, margin: 8.4 },
  { date: "2026-04-03", brand: "Odin Casino", bets: 169000, wins: 154000, ggr: 15000, ngr: 12600, bonusCost: 2400, margin: 8.9 },
  { date: "2026-04-03", brand: "Freya Slots", bets: 91000, wins: 82500, ggr: 8500, ngr: 6900, bonusCost: 1600, margin: 9.3 },
  { date: "2026-04-03", brand: "Valhalla Bet", bets: 62000, wins: 56200, ggr: 5800, ngr: 4800, bonusCost: 1000, margin: 9.4 },
  { date: "2026-04-03", brand: "Thor Gaming", bets: 42000, wins: 38500, ggr: 3500, ngr: 2800, bonusCost: 700, margin: 8.3 },
];

const chartData = [
  { date: "Apr 1", ggr: 35000, ngr: 29000 },
  { date: "Apr 2", ggr: 38000, ngr: 31500 },
  { date: "Apr 3", ggr: 32800, ngr: 27100 },
  { date: "Apr 4", ggr: 35200, ngr: 29100 },
  { date: "Apr 5", ggr: 39000, ngr: 32200 },
  { date: "Apr 6", ggr: 37000, ngr: 30400 },
];

const columns: Column<GgrRow>[] = [
  { key: "date", header: "Date", sortable: true },
  { key: "brand", header: "Brand", sortable: true },
  {
    key: "bets",
    header: "Total Bets",
    sortable: true,
    render: (row) => <span className="font-mono">${row.bets.toLocaleString()}</span>,
  },
  {
    key: "wins",
    header: "Player Wins",
    sortable: true,
    render: (row) => <span className="font-mono">${row.wins.toLocaleString()}</span>,
  },
  {
    key: "ggr",
    header: "GGR",
    sortable: true,
    render: (row) => <span className="font-mono font-medium text-emerald-600">${row.ggr.toLocaleString()}</span>,
  },
  {
    key: "bonusCost",
    header: "Bonus Cost",
    sortable: true,
    render: (row) => <span className="font-mono text-red-600">${row.bonusCost.toLocaleString()}</span>,
  },
  {
    key: "ngr",
    header: "NGR",
    sortable: true,
    render: (row) => <span className="font-mono font-medium text-blue-600">${row.ngr.toLocaleString()}</span>,
  },
  {
    key: "margin",
    header: "Margin %",
    sortable: true,
    render: (row) => <span className="font-mono">{row.margin}%</span>,
  },
];

export default function GgrReportPage() {
  const [dateFrom, setDateFrom] = useState("2026-04-01");
  const [dateTo, setDateTo] = useState("2026-04-06");
  const [brandFilter, setBrandFilter] = useState("all");

  const filtered = ggrData.filter((row) => {
    if (brandFilter !== "all" && row.brand !== brandFilter) return false;
    if (dateFrom && row.date < dateFrom) return false;
    if (dateTo && row.date > dateTo) return false;
    return true;
  });

  const totals = filtered.reduce(
    (acc, row) => ({
      bets: acc.bets + row.bets,
      wins: acc.wins + row.wins,
      ggr: acc.ggr + row.ggr,
      ngr: acc.ngr + row.ngr,
      bonusCost: acc.bonusCost + row.bonusCost,
    }),
    { bets: 0, wins: 0, ggr: 0, ngr: 0, bonusCost: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">GGR Report</h2>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Brand</label>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="input w-auto">
            <option value="all">All Brands</option>
            <option value="Odin Casino">Odin Casino</option>
            <option value="Valhalla Bet">Valhalla Bet</option>
            <option value="Thor Gaming">Thor Gaming</option>
            <option value="Freya Slots">Freya Slots</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-xs text-slate-500">Total Bets</p>
          <p className="text-lg font-bold text-slate-900 mt-1">${totals.bets.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500">Player Wins</p>
          <p className="text-lg font-bold text-slate-900 mt-1">${totals.wins.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500">Total GGR</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">${totals.ggr.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500">Bonus Cost</p>
          <p className="text-lg font-bold text-red-600 mt-1">${totals.bonusCost.toLocaleString()}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500">Total NGR</p>
          <p className="text-lg font-bold text-blue-600 mt-1">${totals.ngr.toLocaleString()}</p>
        </div>
      </div>

      <Chart
        type="area"
        title="GGR / NGR Trend"
        data={chartData}
        xKey="date"
        series={[
          { dataKey: "ggr", color: "#10b981", name: "GGR" },
          { dataKey: "ngr", color: "#2563eb", name: "NGR" },
        ]}
        height={350}
      />

      <DataTable
        columns={columns}
        data={filtered}
        searchable
        searchKeys={["brand", "date"]}
        exportable
        exportFilename="ggr-report"
      />
    </div>
  );
}
