"use client";
import { useState } from "react";

export default function TargetTimeControl() {
  const [value, setValue] = useState(10);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleSet() {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "set_target_time", value }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "#378add" }}
        >
          🎯 Target Return Time
        </span>
        <span className="text-2xl font-bold" style={{ color: "#0c447c" }}>
          {value}s
        </span>
      </div>

      <input
        type="range"
        min={5}
        max={30}
        step={1}
        value={value}
        onChange={(e) => { setValue(Number(e.target.value)); setStatus("idle"); }}
        className="w-full mb-3"
        style={{ accentColor: "#378add" }}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "#94a3b8" }}>5s &nbsp;·&nbsp; 30s</span>
        <button
          onClick={handleSet}
          disabled={loading}
          style={{
            background:
              status === "sent"  ? "#16a34a" :
              status === "error" ? "#dc2626" :
              "#378add",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "6px 16px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "background 0.2s",
          }}
        >
          {status === "sent"  ? "✓ Sent" :
           status === "error" ? "✗ Failed" :
           loading            ? "Sending…" :
           "Set"}
        </button>
      </div>
    </div>
  );
}
