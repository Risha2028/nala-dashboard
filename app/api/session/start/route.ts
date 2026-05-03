import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { publishMqtt } from "@/lib/mqtt";

export async function POST() {
  const { data, error } = await supabase
    .from("sessions")
    .insert({ date: new Date().toISOString().split("T")[0] })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[session/start] Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const session_id = String(data.id);

  try {
    await publishMqtt("nala/commands", { command: "start_session", session_id });
    console.log("[session/start] MQTT published for session:", session_id);
  } catch (err) {
    console.error("[session/start] MQTT publish failed (session still created):", err);
  }

  return NextResponse.json({ session_id });
}
