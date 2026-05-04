import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ThrowData {
  throwNumber: number;
  returnTimeSeconds: number;
  distanceFeet: number; // already calibrated: motor_speed × 0.3 metres
}

export interface Metrics {
  fatigueRatio: number;
  estimatedTotalDistance: number;
  avgReturnTime: number;
}

function mean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function calculateMetrics(throws: ThrowData[], durationMinutes: number): Metrics {
  const sorted = [...throws].sort((a, b) => a.throwNumber - b.throwNumber);
  const returnTimes = sorted.map((t) => t.returnTimeSeconds);

  const first3 = returnTimes.slice(0, 3);
  const last3 = returnTimes.slice(-3);
  const fatigueRatio =
    first3.length >= 3 && last3.length >= 3
      ? parseFloat((mean(last3) / mean(first3)).toFixed(2))
      : returnTimes.length >= 2
      ? parseFloat((returnTimes[returnTimes.length - 1] / returnTimes[0]).toFixed(2))
      : 1.0;

  // distanceFeet is already calibrated (motor_speed × 0.3) so sum directly
  const estimatedTotalDistance = parseFloat(
    sorted.reduce((sum, t) => sum + t.distanceFeet, 0).toFixed(1)
  );

  const avgReturnTime = parseFloat(mean(returnTimes).toFixed(1));

  return { fatigueRatio, estimatedTotalDistance, avgReturnTime };
}

export function calculateRating(fatigueRatio: number, totalThrows: number): number {
  let score = 7.0;
  if (fatigueRatio > 2.0) score -= 1.5;
  else if (fatigueRatio > 1.5) score -= 0.75;
  if (fatigueRatio < 1.2) score += 1.0;
  if (totalThrows > 20) score += 0.5;
  return Math.round(Math.min(10.0, Math.max(1.0, score)) * 10) / 10;
}

export function buildPrompt(
  totalThrows: number,
  duration: number,
  metrics: Metrics,
): string {
  const { estimatedTotalDistance, avgReturnTime } = metrics;
  const efficiency = duration > 0
    ? parseFloat((estimatedTotalDistance / duration).toFixed(1))
    : 0;
  return `You are an expert dog trainer analyzing a fetch session for Nala. Session data: total throws: ${totalThrows}, total distance: ${estimatedTotalDistance} meters, session duration: ${duration} minutes, efficiency: ${efficiency} meters per minute, avg return time: ${avgReturnTime}s. Write 3-4 sentences analyzing the session. Mention Nala by name. Comment on her energy and endurance. End with one specific actionable recommendation for next session. Be warm and data-driven. No bullet points or headers.`;
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
