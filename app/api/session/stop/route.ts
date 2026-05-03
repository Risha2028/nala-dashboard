import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { publishMqtt } from "@/lib/mqtt";
import {
  calculateMetrics,
  calculateRating,
  callGemini,
  buildPrompt,
  type ThrowData,
} from "@/lib/analysis";

export async function POST(req: NextRequest) {
  const { session_id, duration } = await req.json();

  // 1. Publish stop command
  try {
    await publishMqtt("nala/commands", { command: "stop_session", session_id });
    console.log("[session/stop] MQTT stop published for session:", session_id);
  } catch (err) {
    console.error("[session/stop] MQTT publish failed:", err);
  }

  // 2. Fetch all throws for this session
  const { data: throwRows, error: throwErr } = await supabase
    .from("throws")
    .select("throw_number, return_time, motor_speed")
    .eq("session_id", session_id)
    .order("throw_number", { ascending: true });

  if (throwErr) {
    console.error("[session/stop] throws fetch error:", throwErr);
  }

  const throws: ThrowData[] = (throwRows ?? []).map((r) => ({
    throwNumber: Number(r.throw_number),
    returnTimeSeconds: Number(r.return_time),
    distanceFeet: Number(r.motor_speed) * 0.3, // calibration: speed% × 0.3 = metres
  }));

  const totalThrows = throws.length;
  const durationMinutes = Math.max(1, Math.round(duration));
  const metrics = calculateMetrics(throws, durationMinutes);
  const rating = calculateRating(metrics.fatigueRatio, totalThrows);
  const label = rating >= 8 ? "Great" : rating >= 6 ? "Good" : "Tired";

  // 3. Generate Gemini analysis
  let analysis = "";
  try {
    analysis = await callGemini(buildPrompt(totalThrows, metrics, rating));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    analysis =
      msg === "RATE_LIMIT"
        ? "Analysis rate-limited — check back shortly."
        : "Analysis unavailable.";
    console.error("[session/stop] Gemini error:", err);
  }

  // 4. Update the session row
  const { error: updateErr } = await supabase
    .from("sessions")
    .update({
      rating,
      analysis,
      total_throws: totalThrows,
      duration: durationMinutes,
      label,
    })
    .eq("id", session_id);

  if (updateErr) {
    console.error("[session/stop] Supabase update error:", updateErr);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }

  console.log(
    `[session/stop] Session ${session_id} saved — ${totalThrows} throws, rating ${rating}, label ${label}`
  );

  return NextResponse.json({ session_id, rating, analysis, label, totalThrows });
}
