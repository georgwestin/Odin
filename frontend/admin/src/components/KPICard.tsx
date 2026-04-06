"use client";

import clsx from "clsx";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

export default function KPICard({ title, value, change, changeType = "neutral", icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {change && (
            <p
              className={clsx(
                "mt-1 text-sm font-medium",
                changeType === "positive" && "text-emerald-600",
                changeType === "negative" && "text-red-600",
                changeType === "neutral" && "text-slate-500"
              )}
            >
              {changeType === "positive" && "+"}
              {change} vs yesterday
            </p>
          )}
        </div>
        <div className="p-3 bg-accent-light rounded-lg text-accent">{icon}</div>
      </div>
    </div>
  );
}
