"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Session } from "@/lib/data";

interface Props {
  sessions: Session[];
}

export default function RatingTrendChart({ sessions }: Props) {
  const data = [...sessions]
    .reverse()
    .map((s) => ({ date: s.date.split(",")[0], efficiency: s.efficiency }));

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "#0c447c" }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
          Fitness Progress Over Time
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          Efficiency (m/min) across the past sessions
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="whiteAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ffffff" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0c3d6b",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#ffffff",
            }}
            formatter={(v) => [`${v} m/min`, "Efficiency"]}
          />
          <Area
            type="monotone"
            dataKey="efficiency"
            stroke="#ffffff"
            strokeWidth={2.5}
            fill="url(#whiteAreaGradient)"
            dot={{ r: 3, fill: "#ffffff", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#ffffff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
