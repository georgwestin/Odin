"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type ChartType = "line" | "bar" | "area";

interface DataSeries {
  dataKey: string;
  color: string;
  name?: string;
}

interface ChartProps {
  type: ChartType;
  data: Record<string, unknown>[];
  xKey: string;
  series: DataSeries[];
  height?: number;
  title?: string;
}

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "8px 12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

export default function Chart({ type, data, xKey, series, height = 300, title }: ChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 20, left: 0, bottom: 5 },
    };

    const commonChildren = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
      </>
    );

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {commonChildren}
            {series.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={s.name || s.dataKey}
              />
            ))}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            {commonChildren}
            {series.map((s) => (
              <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color} radius={[4, 4, 0, 0]} name={s.name || s.dataKey} />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            {commonChildren}
            {series.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.1}
                strokeWidth={2}
                name={s.name || s.dataKey}
              />
            ))}
          </AreaChart>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
