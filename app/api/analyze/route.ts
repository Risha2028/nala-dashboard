import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function callGemini(prompt: string, retries = 2): Promise<string> {
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
      if (msg.includes("429")) {
        throw new Error("RATE_LIMIT");
      }
      throw err;
    }
  }
  throw new Error("RATE_LIMIT");
}

export async function POST(req: NextRequest) {
  const session = await req.json();

  const prompt = `You are an expert dog trainer analyzing a ball launcher training session for Nala, a high-energy retriever mix.

Session data:
- Date: ${session.date}
- Rating: ${session.rating}/10
- Total throws: ${session.totalThrows}
- Average return time: ${session.avgReturnTime}s
- Fatigue onset at throw #${session.fatigueOnsetThrow}
- Average throw distance: ${session.avgDistance} feet
- Fatigue level: ${session.fatigueLevelPercent}%

Write a single concise paragraph (3–4 sentences) analyzing this session. Mention Nala by name. Comment on her energy, stamina, return speed, and when fatigue set in. End with one actionable tip for the next session. Be warm, specific, and data-driven. Do not use bullet points or headers.`;

  try {
    const text = await callGemini(prompt);
    return NextResponse.json({ analysis: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "RATE_LIMIT") {
      return NextResponse.json(
        { analysis: "Gemini is temporarily rate-limited on the free tier. Try again in a few seconds — the analysis will appear automatically on your next visit." },
        { status: 200 }
      );
    }
    console.error("Gemini error:", err);
    return NextResponse.json(
      { analysis: "Analysis unavailable — check your API key or network." },
      { status: 500 }
    );
  }
}
