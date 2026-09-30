import { NextRequest, NextResponse } from "next/server";
import { callGemini, calculateMetrics } from "@/lib/analysis";
import { supabase } from "@/lib/supabase";

interface AnalyzeRequest {
  sessionId?: string;
  totalThrows: number;
  duration: number;
  totalDistance: number;
  efficiency: number;
  avgReturnTime: number;
}

// Pulls the throw-by-throw data for this session plus Nala's recent history,
// so Gemini can spot fatigue patterns and trends instead of restating averages.
async function buildContext(sessionId: string, duration: number) {
  const { data: throwRows } = await supabase
    .from("throws")
    .select("throw_number, return_time, motor_speed")
    .eq("session_id", sessionId)
    .order("throw_number", { ascending: true });

  const throws = (throwRows ?? []).map((r) => ({
    throwNumber: Number(r.throw_number),
    returnTimeSeconds: Number(r.return_time),
    distanceFeet: Number(r.motor_speed) * 0.05,
  }));

  const { data: current } = await supabase
    .from("sessions")
    .select("date")
    .eq("id", sessionId)
    .single();

  const { data: history } = current
    ? await supabase
        .from("sessions")
        .select("date, total_throws, duration, efficiency, label")
        .lt("date", current.date)
        .not("efficiency", "is", null)
        .order("date", { ascending: false })
        .limit(5)
    : { data: [] };

  const metrics = throws.length ? calculateMetrics(throws, duration) : null;
  return { throws, metrics, history: history ?? [] };
}

export async function POST(req: NextRequest) {
  const { sessionId, totalThrows, duration, totalDistance, efficiency, avgReturnTime }: AnalyzeRequest =
    await req.json();

  let detail = "";
  if (sessionId) {
    try {
      const { throws, metrics, history } = await buildContext(sessionId, duration);
      if (throws.length) {
        const returns = throws.map((t) => `#${t.throwNumber}: ${t.returnTimeSeconds}s`).join(", ");
        detail += ` Return time for each throw, in order: ${returns}.`;
      }
      if (metrics) {
        detail += ` Fatigue ratio (avg of last 3 returns ÷ avg of first 3): ${metrics.fatigueRatio} — above 1.0 means she slowed down as the session went on.`;
      }
      if (history.length) {
        const past = history
          .map((h) => `${h.date}: ${h.total_throws} throws, ${h.duration} min, ${h.efficiency} m/min (${h.label})`)
          .join("; ");
        detail += ` Nala's previous sessions, most recent first: ${past}.`;
      }
    } catch (err) {
      console.error("[analyze] context fetch failed, using summary only:", err);
    }
  }

  const prompt = `You are an expert dog trainer analyzing a fetch session for Nala, recorded by an automatic ball launcher. Session summary: total throws: ${totalThrows}, total distance: ${totalDistance} meters, session duration: ${duration} minutes, efficiency: ${efficiency} meters per minute, avg return time: ${avgReturnTime}s.${detail}

Write 3-4 sentences analyzing the session. Mention Nala by name. Point out at least one specific pattern in the data (for example, the throw where her return times started climbing, or how today compares to her recent sessions) and cite the actual numbers. Comment on her energy and endurance. End with one specific actionable recommendation for next session (such as a throw count, session length, or rest break), grounded in the data. Be warm and data-driven. Do not invent numbers that are not in the data. No bullet points or headers.`;

  try {
    const analysis = await callGemini(prompt);
    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "RATE_LIMIT") {
      return NextResponse.json({
        analysis: "Gemini is temporarily rate-limited. Try again in a few seconds.",
      });
    }
    console.error("Gemini error:", err);
    return NextResponse.json(
      { analysis: "Analysis unavailable — check your API key or network." },
      { status: 500 }
    );
  }
}
