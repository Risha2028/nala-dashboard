import { NextRequest, NextResponse } from "next/server";
import {
  calculateMetrics,
  calculateRating,
  callGemini,
  buildPrompt,
  type ThrowData,
} from "@/lib/analysis";

interface AnalyzeRequest {
  totalThrows: number;
  duration: number;
  throws: ThrowData[];
}

export async function POST(req: NextRequest) {
  const { totalThrows, duration, throws }: AnalyzeRequest = await req.json();

  const metrics = calculateMetrics(throws, duration);
  const rating = calculateRating(metrics.fatigueRatio, totalThrows, metrics.consistency);
  const prompt = buildPrompt(totalThrows, duration, metrics, rating);

  try {
    const analysis = await callGemini(prompt);
    return NextResponse.json({ rating, analysis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "RATE_LIMIT") {
      return NextResponse.json({
        rating,
        analysis: "Gemini is temporarily rate-limited. Try again in a few seconds.",
      });
    }
    console.error("Gemini error:", err);
    return NextResponse.json(
      { rating, analysis: "Analysis unavailable — check your API key or network." },
      { status: 500 }
    );
  }
}
