"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchSession, getRatingLabel, getPill, type Session } from "@/lib/data";
import StatChip from "@/components/StatChip";
import ThrowChart from "@/components/ThrowChart";
import FatigueBar from "@/components/FatigueBar";
import PillBadge from "@/components/PillBadge";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string>("");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    fetchSession(id).then((s) => {
      setSession(s);
      setSessionLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!session) return;
    setAnalysisLoading(true);
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    })
      .then((r) => r.json())
      .then((d) => setAnalysis(d.analysis))
      .catch(() => setAnalysis("Analysis could not be loaded."))
      .finally(() => setAnalysisLoading(false));
  }, [session]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f0f7ff" }}>
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#378add", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: "#0c447c" }}>
        Session not found.
      </div>
    );
  }

  const pill = getPill(session.rating);
  const label = getRatingLabel(session.rating);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: "#378add" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold" style={{ color: "#0c447c" }}>
            {session.date}
          </h1>
          <PillBadge pill={pill} />
        </div>
        <p className="text-sm" style={{ color: "#64748b" }}>
          {label}
        </p>
      </div>

      {/* Rating hero */}
      <div
        className="rounded-2xl p-6 mb-6 flex items-center justify-between shadow-sm"
        style={{ background: "linear-gradient(135deg, #378add 0%, #0c447c 100%)" }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: "#bfdbfe" }}>
            Session Rating
          </p>
          <div className="flex items-end gap-1 mt-1">
            <span className="text-5xl font-bold text-white">{session.rating}</span>
            <span className="text-2xl font-medium mb-1" style={{ color: "#93c5fd" }}>
              /10
            </span>
          </div>
        </div>
        <div className="text-6xl opacity-30">🐾</div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        <StatChip label="Total Throws" value={session.totalThrows} icon="🎾" />
        <StatChip label="Avg Return" value={`${session.avgReturnTime}s`} icon="⏱️" />
        <StatChip label="Fatigue Onset" value={`#${session.fatigueOnsetThrow}`} icon="📉" />
        <StatChip label="Avg Distance" value={`${session.avgDistance} ft`} icon="📏" />
      </div>

      {/* Throw chart */}
      <div className="mb-6">
        <ThrowChart throws={session.throws} fatigueOnsetThrow={session.fatigueOnsetThrow} />
      </div>

      {/* Fatigue bar */}
      <div className="mb-6">
        <FatigueBar percent={session.fatigueLevelPercent} />
      </div>

      {/* LLM analysis */}
      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">✨</span>
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#378add" }}>
            AI Session Analysis
          </h3>
        </div>
        {analysisLoading ? (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#378add", borderTopColor: "transparent" }}
            />
            <span className="text-sm" style={{ color: "#94a3b8" }}>
              Generating analysis…
            </span>
          </div>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: "#1e3a5f" }}>
            {analysis}
          </p>
        )}
      </div>
    </main>
  );
}
