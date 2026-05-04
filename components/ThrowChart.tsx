"use client";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ThrowData } from "@/lib/data";

interface Props {
  throws: ThrowData[];
}

export default function ThrowChart({ throws }: Props) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "#0c447c" }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.95)" }}>
          Throw-by-Throw Performance
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
          Return time (s) &amp; estimated distance (m) per throw
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={throws} margin={{ top: 5, right: 20, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />

          <XAxis
            dataKey="throwNumber"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.9)" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Throw #", position: "insideBottom", offset: -2, fontSize: 11, fill: "rgba(255,255,255,0.85)" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.9)" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Return (s)", angle: -90, position: "insideLeft", offset: 18, fontSize: 10, fill: "rgba(255,255,255,0.85)" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "rgba(255,255,255,0.9)" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Distance (m)", angle: 90, position: "insideRight", offset: 18, fontSize: 10, fill: "rgba(255,255,255,0.85)" }}
          />
          <Tooltip
            contentStyle={{
              background: "#0c3d6b",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#ffffff",
            }}
            formatter={(value, name) =>
              name === "returnTimeSeconds"
                ? [`${value}s`, "Return Time"]
                : [`${value}m`, "Distance"]
            }
          />
          <Legend
            formatter={(value) =>
              value === "returnTimeSeconds" ? "Return Time (s)" : "Distance (m)"
            }
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px", color: "rgba(255,255,255,0.95)" }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="returnTimeSeconds"
            stroke="#ffffff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="distanceFeet"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
