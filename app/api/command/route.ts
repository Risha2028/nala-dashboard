import { NextRequest, NextResponse } from "next/server";
import { publishMqtt } from "@/lib/mqtt";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  try {
    await publishMqtt("nala/commands", payload);
    console.log("[api/command] published:", JSON.stringify(payload));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/command] MQTT publish failed:", err);
    return NextResponse.json({ error: "MQTT publish failed" }, { status: 500 });
  }
}
