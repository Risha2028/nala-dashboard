import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/analysis";

interface AnalyzeRequest {
  totalThrows: number;
  duration: number;
  totalDistance: number;
  efficiency: number;
  avgReturnTime: number;
}

export async function POST(req: NextRequest) {
  const { totalThrows, duration, totalDistance, efficiency, avgReturnTime }: AnalyzeRequest =
    await req.json();

  const prompt = `You are an expert dog trainer analyzing a fetch session for Nala. Session data: total throws: ${totalThrows}, total distance: ${totalDistance} meters, session duration: ${duration} minutes, efficiency: ${efficiency} meters per minute, avg return time: ${avgReturnTime}s. Write 3-4 sentences analyzing the session. Mention Nala by name. Comment on her energy and endurance. End with one specific actionable recommendation for next session. Be warm and data-driven. No bullet points or headers.`;

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
