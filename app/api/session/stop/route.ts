import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { publishMqtt } from "@/lib/mqtt";
import type { EfficiencyLabel } from "@/lib/data";

export async function POST(req: NextRequest) {
  const { session_id, duration } = await req.json();
  console.log(`[session/stop] received — session_id=${session_id}, duration=${duration}min`);

  // 1. Publish stop command
  try {
    await publishMqtt("nala/commands", { command: "stop_session", session_id });
    console.log("[session/stop] MQTT stop command published");
  } catch (err) {
    console.error("[session/stop] MQTT publish failed:", err);
  }

  // 2. Fetch current session's date (needed for historical comparison)
  const { data: sessionRow, error: sessionErr } = await supabase
    .from("sessions")
    .select("date")
    .eq("id", session_id)
    .single();

  if (sessionErr || !sessionRow) {
    console.error("[session/stop] failed to fetch session date:", sessionErr);
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const sessionDate = sessionRow.date as string;
  console.log(`[session/stop] session date: ${sessionDate}`);

  // 3. Fetch all throws for this session and calculate efficiency
  const { data: throwRows, error: throwErr } = await supabase
    .from("throws")
    .select("motor_speed")
    .eq("session_id", session_id);

  if (throwErr) {
    console.error("[session/stop] throws fetch error:", throwErr);
  }

  const totalThrows = throwRows?.length ?? 0;
  const durationMinutes = Math.max(1, Math.round(duration));

  // efficiency = Σ(motor_speed × 0.05) / duration_minutes
  const totalDistance = (throwRows ?? []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum, r: any) => sum + Number(r.motor_speed) * 0.05,
    0
  );
  const currentEfficiency = parseFloat((totalDistance / durationMinutes).toFixed(1));

  console.log(`[session/stop] totalThrows=${totalThrows}, totalDistance=${totalDistance.toFixed(2)}m, durationMinutes=${durationMinutes}`);
  console.log(`[session/stop] currentEfficiency=${currentEfficiency} m/min`);

  // 4. Query sessions with a date BEFORE this session that have a stored efficiency
  const { data: historicalData, error: histErr } = await supabase
    .from("sessions")
    .select("efficiency, date")
    .lt("date", sessionDate)
    .not("efficiency", "is", null);

  if (histErr) {
    console.error("[session/stop] historical fetch error:", histErr);
  }

  const historicalEfficiencies = (historicalData ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => Number(r.efficiency))
    .filter((e: number) => e > 0);

  const historicalAvg = historicalEfficiencies.length
    ? historicalEfficiencies.reduce((a: number, b: number) => a + b, 0) / historicalEfficiencies.length
    : 0;

  console.log(`[session/stop] historical sessions found: ${historicalEfficiencies.length}`);
  console.log(`[session/stop] historical efficiencies: [${historicalEfficiencies.join(", ")}]`);
  console.log(`[session/stop] historicalAvg=${historicalAvg.toFixed(2)} m/min`);

  let label: EfficiencyLabel;
  if (historicalAvg === 0) {
    label = "Good";
    console.log(`[session/stop] no historical sessions — defaulting to Good`);
  } else {
    const ratio = currentEfficiency / historicalAvg;
    label = ratio > 1.1 ? "Energetic" : ratio >= 0.9 ? "Good" : "Tired";
    console.log(`[session/stop] ratio=${ratio.toFixed(3)} → label=${label}`);
  }

  // 5. Save to Supabase
  const { error: updateErr } = await supabase
    .from("sessions")
    .update({
      total_throws: totalThrows,
      duration: durationMinutes,
      label,
      efficiency: currentEfficiency,
    })
    .eq("id", session_id);

  if (updateErr) {
    console.error("[session/stop] Supabase update error:", updateErr);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }

  console.log(`[session/stop] ✓ saved — efficiency=${currentEfficiency}, label=${label}, throws=${totalThrows}`);

  return NextResponse.json({ session_id, label, totalThrows, efficiency: currentEfficiency });
}
