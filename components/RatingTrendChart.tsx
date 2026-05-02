"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Session } from "@/lib/data";

interface Props {
  sessions: Session[];
}

export default function RatingTrendChart({ sessions }: Props) {
  const data = [...sessions]
    .reverse()
    .map((s) => ({ date: s.date.split(",")[0], rating: s.rating, id: s.id }));

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "#378add" }}>
          Fitness Progress Over Time
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
          Session rating trends across the past 8 sessions
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0eeff" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #dbeafe",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#0c447c",
            }}
            formatter={(v) => [`${v}/10`, "Rating"]}
          />
          <ReferenceLine y={7} stroke="#dbeafe" strokeDasharray="4 2" />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#378add"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#378add", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#0c447c" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
