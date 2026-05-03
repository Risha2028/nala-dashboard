"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "active" | "stopping" | "starting";

export default function SessionControls() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [message, setMessage] = useState("");
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startTimer() {
    startTimeRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000));
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function handleStart() {
    setStatus("starting");
    setMessage("");
    try {
      const res = await fetch("/api/session/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      setSessionId(data.session_id);
      setStatus("active");
      startTimer();
      setMessage("");
    } catch (err) {
      setStatus("idle");
      setMessage(err instanceof Error ? err.message : "Could not start session");
    }
  }

  async function handleStop() {
    if (!sessionId || !startTimeRef.current) return;
    setStatus("stopping");
    setMessage("Saving session and generating analysis…");
    stopTimer();

    const durationMinutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));

    try {
      const res = await fetch("/api/session/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, duration: durationMinutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to stop");
      setMessage(`Session saved — ${data.totalThrows} throws · ${data.rating}/10`);
      setSessionId(null);
      setStatus("idle");
      router.refresh(); // reload server data so new session appears in list
    } catch (err) {
      setStatus("active"); // revert so they can retry
      startTimer();
      setMessage(err instanceof Error ? err.message : "Could not stop session");
    }
  }

  const isStarting = status === "starting";
  const isActive = status === "active";
  const isStopping = status === "stopping";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
      {!isActive && !isStopping ? (
        <button
          onClick={handleStart}
          disabled={isStarting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: isStarting ? "#7db8d8" : "#378add",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "9px 20px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: isStarting ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(55,138,221,0.3)",
            transition: "opacity 0.15s",
          }}
        >
          {isStarting ? (
            <>
              <span
                style={{
                  width: "12px", height: "12px", borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              Starting…
            </>
          ) : (
            <>▶ Start Session</>
          )}
        </button>
      ) : (
        <button
          onClick={handleStop}
          disabled={isStopping}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: isStopping ? "#f87171" : "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "9px 20px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: isStopping ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
            transition: "opacity 0.15s",
          }}
        >
          {isStopping ? (
            <>
              <span
                style={{
                  width: "12px", height: "12px", borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              Saving…
            </>
          ) : (
            <>■ Stop Session</>
          )}
        </button>
      )}

      {/* Live timer */}
      {isActive && (
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#0c447c",
            background: "rgba(255,255,255,0.7)",
            borderRadius: "8px",
            padding: "5px 10px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatElapsed(elapsed)}
        </span>
      )}

      {/* Status message */}
      {message && (
        <span style={{ fontSize: "12px", color: "#1a5f8a" }}>{message}</span>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
