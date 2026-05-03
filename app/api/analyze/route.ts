import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/analysis";
import type { ThrowData } from "@/lib/data";

interface AnalyzeRequest {
  totalThrows: number;
  duration: number;
  throws: ThrowData[];
  fatigueRatio: number;
  first3avg: number;
  last3avg: number;
}

function calcRating(fatigueRatio: number, totalThrows: number): number {
  let score = 7.0;
  if (fatigueRatio > 2.0) score -= 1.5;
  else if (fatigueRatio > 1.5) score -= 0.75;
  if (fatigueRatio < 1.2) score += 1.0;
  if (totalThrows > 20) score += 0.5;
  return Math.round(Math.min(10, Math.max(1, score)) * 10) / 10;
}

export async function POST(req: NextRequest) {
  const { totalThrows, duration, throws, fatigueRatio }: AnalyzeRequest = await req.json();

  const avgReturnTime =
    throws.length
      ? parseFloat((throws.reduce((s, t) => s + t.returnTimeSeconds, 0) / throws.length).toFixed(1))
      : 0;

  // distanceFeet is already calibrated (motor_speed × 0.3) — sum directly
  const estimatedTotalDistance = parseFloat(
    throws.reduce((s, t) => s + t.distanceFeet, 0).toFixed(1)
  );

  const rating = calcRating(fatigueRatio, totalThrows);

  const prompt = `You are an expert dog trainer analyzing a fetch session for Nala. Session data: total throws: ${totalThrows}, avg return time: ${avgReturnTime}s, fatigue ratio: ${fatigueRatio} (ratio of last 3 return times vs first 3 — above 1.5 means significant fatigue, below 1.2 means barely tired), session rating: ${rating}/10, estimated total distance: ${estimatedTotalDistance} meters. Write 3-4 sentences analyzing the session. Mention Nala by name. Explain in plain English whether she got tired and when. End with one specific actionable recommendation for next session. Be warm and data-driven. No bullet points or headers.`;

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
