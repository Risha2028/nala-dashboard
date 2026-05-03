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
      style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: "#378add" }}>
          Throw-by-Throw Performance
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
          Return time (s) &amp; estimated distance (m) per throw
        </p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={throws} margin={{ top: 5, right: 20, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0eeff" />

          <XAxis
            dataKey="throwNumber"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Throw #", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#378add" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Return (s)", angle: -90, position: "insideLeft", offset: 18, fontSize: 10, fill: "#378add" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#0c447c" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Distance (m)", angle: 90, position: "insideRight", offset: 18, fontSize: 10, fill: "#0c447c" }}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #dbeafe",
              borderRadius: "12px",
              fontSize: "12px",
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
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="returnTimeSeconds"
            stroke="#378add"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="distanceFeet"
            stroke="#0c447c"
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
