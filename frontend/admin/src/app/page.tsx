"use client";

import KPICard from "@/components/KPICard";
import Chart from "@/components/Chart";

const revenueData = [
  { date: "Mar 1", ggr: 42000, ngr: 35000 },
  { date: "Mar 5", ggr: 48000, ngr: 39500 },
  { date: "Mar 10", ggr: 51000, ngr: 42000 },
  { date: "Mar 15", ggr: 45000, ngr: 37000 },
  { date: "Mar 20", ggr: 58000, ngr: 48000 },
  { date: "Mar 25", ggr: 62000, ngr: 51000 },
  { date: "Mar 30", ggr: 55000, ngr: 45000 },
  { date: "Apr 1", ggr: 67000, ngr: 55000 },
  { date: "Apr 5", ggr: 71000, ngr: 58500 },
];

const playerActivityData = [
  { date: "Mon", active: 4200, new: 320, returning: 3880 },
  { date: "Tue", active: 3800, new: 280, returning: 3520 },
  { date: "Wed", active: 4500, new: 410, returning: 4090 },
  { date: "Thu", active: 4100, new: 350, returning: 3750 },
  { date: "Fri", active: 5200, new: 520, returning: 4680 },
  { date: "Sat", active: 6800, new: 680, returning: 6120 },
  { date: "Sun", active: 7100, new: 710, returning: 6390 },
];

const alerts = [
  { id: 1, type: "warning", message: "Player jp_whale_99 triggered AML threshold - 3 deposits >$10,000 in 24h", time: "12 min ago" },
  { id: 2, type: "info", message: 'Campaign "Welcome 200%" reaching budget limit (87% utilized)', time: "1 hour ago" },
  { id: 3, type: "error", message: "Payment provider Stripe reporting elevated error rates (4.2%)", time: "2 hours ago" },
  { id: 4, type: "warning", message: "14 pending KYC verifications older than 48 hours", time: "3 hours ago" },
  { id: 5, type: "info", message: "Scheduled maintenance for Valhalla Bet: April 8, 03:00-05:00 UTC", time: "5 hours ago" },
];

const alertColors: Record<string, string> = {
  warning: "border-l-amber-500 bg-amber-50",
  error: "border-l-red-500 bg-red-50",
  info: "border-l-blue-500 bg-blue-50",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <KPICard
          title="Gross Gaming Revenue"
          value="$71,240"
          change="12.3%"
          changeType="positive"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="Net Gaming Revenue"
          value="$58,510"
          change="8.7%"
          changeType="positive"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <KPICard
          title="Active Players"
          value="7,142"
          change="5.2%"
          changeType="positive"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KPICard
          title="Deposits Today"
          value="$124,800"
          change="3.1%"
          changeType="negative"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
        <KPICard
          title="Registrations"
          value="342"
          change="18.6%"
          changeType="positive"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Chart
          type="area"
          title="Revenue Over Time"
          data={revenueData}
          xKey="date"
          series={[
            { dataKey: "ggr", color: "#2563eb", name: "GGR" },
            { dataKey: "ngr", color: "#10b981", name: "NGR" },
          ]}
        />
        <Chart
          type="bar"
          title="Player Activity (This Week)"
          data={playerActivityData}
          xKey="date"
          series={[
            { dataKey: "new", color: "#2563eb", name: "New Players" },
            { dataKey: "returning", color: "#94a3b8", name: "Returning" },
          ]}
        />
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Recent Alerts</h3>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-r-lg px-4 py-3 flex items-start justify-between ${alertColors[alert.type]}`}
            >
              <p className="text-sm text-slate-700">{alert.message}</p>
              <span className="text-xs text-slate-400 whitespace-nowrap ml-4">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
