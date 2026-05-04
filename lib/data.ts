import { supabase } from "./supabase";

export interface ThrowData {
  throwNumber: number;
  returnTimeSeconds: number;
  distanceFeet: number; // motor_speed × 0.05 metres (calibrated)
}

export type EfficiencyLabel = "Energetic" | "Good" | "Tired";

export interface Session {
  id: string;
  date: string;
  totalThrows: number;
  avgReturnTime: number;
  totalDistance: number;  // metres (sum of calibrated throws)
  efficiency: number;     // metres per minute
  efficiencyLabel: EfficiencyLabel;
  duration: number;       // minutes
  throws: ThrowData[];
}

export function getRatingLabel(label: EfficiencyLabel): string {
  if (label === "Energetic") return "Outstanding session — Nala was above her average!";
  if (label === "Good") return "Solid session — right in Nala's typical range";
  return "Tough day — performance came in below average";
}

function avgOf(arr: number[]): number {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapThrow(row: any): ThrowData {
  return {
    throwNumber: Number(row.throw_number),
    returnTimeSeconds: Number(row.return_time),
    distanceFeet: Number(row.motor_speed) * 0.05,
  };
}

function computeStats(throws: ThrowData[], duration: number) {
  if (!throws.length) {
    return { totalThrows: 0, avgReturnTime: 0, totalDistance: 0, efficiency: 0 };
  }
  const sorted = [...throws].sort((a, b) => a.throwNumber - b.throwNumber);
  const avgReturnTime = avgOf(sorted.map((t) => t.returnTimeSeconds));
  const totalDistance = parseFloat(sorted.reduce((s, t) => s + t.distanceFeet, 0).toFixed(1));
  const efficiency = duration > 0 ? parseFloat((totalDistance / duration).toFixed(1)) : 0;
  return { totalThrows: throws.length, avgReturnTime, totalDistance, efficiency };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDate(raw: string): string {
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(row: any, throws: ThrowData[] = []): Session {
  const duration = Number(row.duration) || 0;
  const { totalThrows, avgReturnTime, totalDistance, efficiency } = computeStats(throws, duration);
  const rawLabel = row.label as string | null;
  const efficiencyLabel: EfficiencyLabel =
    rawLabel === "Energetic" || rawLabel === "Good" || rawLabel === "Tired"
      ? rawLabel
      : "Good";
  return {
    id: String(row.id),
    date: formatDate(row.date),
    totalThrows,
    avgReturnTime,
    totalDistance,
    efficiency,
    efficiencyLabel,
    duration,
    throws,
  };
}

export async function fetchSessions(): Promise<Session[]> {
  console.log("[fetchSessions] querying Supabase...");

  const response = await supabase
    .from("sessions")
    .select("id, date, total_throws, duration, label, throws(throw_number, return_time, motor_speed)")
    .order("date", { ascending: false });

  console.log("[fetchSessions] RAW RESPONSE:", JSON.stringify({
    data: response.data,
    error: response.error,
    status: response.status,
    statusText: response.statusText,
  }, null, 2));

  const { data, error } = response;
  if (error) {
    console.error("[fetchSessions] error:", JSON.stringify(error));
    return [];
  }

  console.log("[fetchSessions] rows returned:", data?.length ?? 0);

  return (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const throws = ((row as any).throws ?? []).map(mapThrow);
    return mapSession(row, throws);
  });
}

export async function fetchSession(id: string): Promise<Session | null> {
  console.log("[fetchSession] querying id:", id);

  const [sessionResponse, throwsResponse] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, date, total_throws, duration, label")
      .eq("id", id)
      .single(),
    supabase
      .from("throws")
      .select("throw_number, return_time, motor_speed")
      .eq("session_id", id)
      .order("throw_number", { ascending: true }),
  ]);

  console.log("[fetchSession] session RAW:", JSON.stringify({
    data: sessionResponse.data,
    error: sessionResponse.error,
    status: sessionResponse.status,
  }, null, 2));

  console.log("[fetchSession] throws RAW:", JSON.stringify({
    data: throwsResponse.data,
    error: throwsResponse.error,
    status: throwsResponse.status,
    count: throwsResponse.data?.length ?? 0,
  }, null, 2));

  const { data: row, error: sessionErr } = sessionResponse;
  const { data: throwRows, error: throwErr } = throwsResponse;

  if (sessionErr || !row) {
    console.error("[fetchSession] session error:", JSON.stringify(sessionErr));
    return null;
  }
  if (throwErr) {
    console.error("[fetchSession] throws error:", JSON.stringify(throwErr));
  }

  const throws = throwRows ? throwRows.map(mapThrow) : [];
  console.log("[fetchSession] mapped throws count:", throws.length);

  return mapSession(row, throws);
}

export function getOverviewStats(sessions: Session[]) {
  const now = new Date();
  const thisWeek = sessions.filter((s) => {
    const d = new Date(s.date);
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });
  const lastWeek = sessions.filter((s) => {
    const d = new Date(s.date);
    const days = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return days > 7 && days <= 14;
  });

  const avgEff = (arr: Session[]) =>
    arr.length
      ? parseFloat((arr.reduce((s, x) => s + x.efficiency, 0) / arr.length).toFixed(1))
      : 0;
  const totalDist = (arr: Session[]) =>
    parseFloat(arr.reduce((s, x) => s + x.totalDistance, 0).toFixed(1));
  const totalTime = (arr: Session[]) => arr.reduce((s, x) => s + x.duration, 0);

  return {
    sessionsThisWeek: thisWeek.length,
    avgEfficiencyThisWeek: avgEff(thisWeek),
    avgEfficiencyLastWeek: avgEff(lastWeek),
    totalDistanceThisWeek: totalDist(thisWeek),
    totalDistanceLastWeek: totalDist(lastWeek),
    totalTimeThisWeek: totalTime(thisWeek),
    totalTimeLastWeek: totalTime(lastWeek),
  };
}
