import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ThrowData {
  throwNumber: number;
  returnTimeSeconds: number;
  distanceFeet: number; // motor_speed % from DB
}

export interface Metrics {
  fatigueRatio: number;
  consistency: number;
  estimatedTotalDistance: number;
  effort: number;
}

function mean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const m = mean(vals);
  return Math.sqrt(vals.reduce((sum, v) => sum + (v - m) ** 2, 0) / vals.length);
}

export function calculateMetrics(throws: ThrowData[], durationMinutes: number): Metrics {
  const sorted = [...throws].sort((a, b) => a.throwNumber - b.throwNumber);
  const returnTimes = sorted.map((t) => t.returnTimeSeconds);

  const first3 = returnTimes.slice(0, 3);
  const last3 = returnTimes.slice(-3);
  const fatigueRatio =
    first3.length >= 3 && last3.length >= 3
      ? parseFloat((mean(last3) / mean(first3)).toFixed(2))
      : 1.0;

  const firstHalf = returnTimes.slice(0, Math.floor(returnTimes.length / 2));
  const consistency = parseFloat(stdDev(firstHalf).toFixed(2));

  const estimatedTotalDistance = parseFloat(
    (sorted.reduce((sum, t) => sum + t.distanceFeet, 0) * 0.3).toFixed(1)
  );

  const effort =
    durationMinutes > 0
      ? parseFloat((estimatedTotalDistance / durationMinutes).toFixed(1))
      : 0;

  return { fatigueRatio, consistency, estimatedTotalDistance, effort };
}

export function calculateRating(
  fatigueRatio: number,
  totalThrows: number,
  consistency: number
): number {
  let score = 7.0;
  if (fatigueRatio > 2.0) score -= 1.5;
  else if (fatigueRatio > 1.5) score -= 0.75;
  if (fatigueRatio < 1.2) score += 1.0;
  if (totalThrows > 20) score += 0.5;
  if (consistency < 0.5) score += 0.5;
  return Math.round(Math.min(10, Math.max(1, score)) * 10) / 10;
}

export function buildPrompt(
  totalThrows: number,
  duration: number,
  metrics: Metrics,
  rating: number
): string {
  const { fatigueRatio, consistency, estimatedTotalDistance, effort } = metrics;
  return `You are an expert dog trainer analyzing a ball fetch session for Nala. Here are the calculated metrics: total throws: ${totalThrows}, estimated total distance: ${estimatedTotalDistance} meters, fatigue ratio: ${fatigueRatio} (1.0 = no fatigue, 2.0 = twice as slow at end vs start), consistency score: ${consistency} seconds std dev, session duration: ${duration} minutes, effort: ${effort} meters/min, session rating: ${rating}/10. Write 3-4 sentences analyzing the session. Mention Nala by name. Explain what the fatigue ratio means in plain English. End with one specific actionable recommendation. Be warm and data-driven. No bullet points.`;
}

export async function callGemini(prompt: string, retries = 2): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") && i < retries) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      if (msg.includes("429")) throw new Error("RATE_LIMIT");
      throw err;
    }
  }
  throw new Error("RATE_LIMIT");
}
