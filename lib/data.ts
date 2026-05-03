import { supabase } from "./supabase";

export interface ThrowData {
  throwNumber: number;
  returnTimeSeconds: number;
  distanceFeet: number; // mapped from motor_speed
}

export interface Session {
  id: string;
  date: string;
  rating: number;       // calculated from fatigueRatio, not from DB
  totalThrows: number;
  avgReturnTime: number;
  avgDistance: number;  // metres (motor_speed × 0.3)
  duration: number;     // minutes
  fatigueRatio: number;
  first3avg: number;    // avg return time of first 3 throws
  last3avg: number;     // avg return time of last 3 throws
  throws: ThrowData[];
}

export function getPill(rating: number): "Great" | "Good" | "Tired" {
  if (rating >= 8) return "Great";
  if (rating >= 6) return "Good";
  return "Tired";
}

export function getRatingLabel(rating: number): string {
  if (rating >= 9) return "Outstanding session — Nala was unstoppable!";
  if (rating >= 8) return "Excellent performance, lots of energy today";
  if (rating >= 7) return "Great session with strong consistency";
  if (rating >= 6) return "Good session, held up well overall";
  if (rating >= 4) return "Average session, some fatigue crept in";
  return "Tough day — Nala wore out early";
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapThrow(row: any): ThrowData {
  return {
    throwNumber: Number(row.throw_number),
    returnTimeSeconds: Number(row.return_time),
    distanceFeet: Number(row.motor_speed) * 0.3, // calibration: speed% × 0.3 = metres
  };
}

function computeStats(throws: ThrowData[], totalThrows: number) {
  if (!throws.length) {
    return { avgReturnTime: 0, avgDistance: 0, rating: 5.0, fatigueRatio: 1.0, first3avg: 0, last3avg: 0 };
  }

  const sorted = [...throws].sort((a, b) => a.throwNumber - b.throwNumber);
  const returnTimes = sorted.map((t) => t.returnTimeSeconds);

  const avgReturnTime = avg(returnTimes);
  const avgDistance = avg(sorted.map((t) => t.distanceFeet));

  // Fatigue ratio: avg of last 3 vs first 3 (fall back to single values if < 6 throws)
  const first3avg = sorted.length >= 6
    ? avg(returnTimes.slice(0, 3))
    : returnTimes[0] ?? 0;
  const last3avg = sorted.length >= 6
    ? avg(returnTimes.slice(-3))
    : returnTimes[returnTimes.length - 1] ?? 0;
  const fatigueRatio = first3avg > 0
    ? parseFloat((last3avg / first3avg).toFixed(2))
    : 1.0;

  // Algorithmic rating from fatigue ratio
  let score = 7.0;
  if (fatigueRatio > 2.0) score -= 1.5;
  else if (fatigueRatio > 1.5) score -= 0.75;
  if (fatigueRatio < 1.2) score += 1.0;
  if (totalThrows > 20) score += 0.5;
  const rating = Math.round(Math.min(10.0, Math.max(1.0, score)) * 10) / 10;

  return { avgReturnTime, avgDistance, rating, fatigueRatio, first3avg, last3avg };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDate(raw: string): string {
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function mapSession(row: any, throws: ThrowData[] = []): Session {
  const totalThrows = throws.length; // source of truth: actual rows in throws table
  const { avgReturnTime, avgDistance, rating, fatigueRatio, first3avg, last3avg } =
    computeStats(throws, totalThrows);

  return {
    id: String(row.id),
    date: formatDate(row.date),
    rating,
    totalThrows,
    avgReturnTime,
    avgDistance,
    duration: Number(row.duration) || 0,
    fatigueRatio,
    first3avg,
    last3avg,
    throws,
  };
}

export async function fetchSessions(): Promise<Session[]> {
  console.log("[fetchSessions] querying Supabase...");

  // Nested select so we can compute avgReturnTime for the session list cards
  const response = await supabase
    .from("sessions")
    .select("id, date, rating, total_throws, duration, throws(throw_number, return_time, motor_speed)")
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
      .select("id, date, rating, total_throws, duration")
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

  const avgRating = avg(sessions.map((s) => s.rating));
  const avgReturnTime = avg(sessions.map((s) => s.avgReturnTime));

  const thisWeekFitness = thisWeek.length
    ? Math.round(avg(thisWeek.map((s) => s.rating)) * 10)
    : 0;
  const lastWeekFitness = lastWeek.length
    ? Math.round(avg(lastWeek.map((s) => s.rating)) * 10)
    : 0;

  return {
    sessionsThisWeek: thisWeek.length,
    avgRating,
    avgReturnTime,
    fitnessLevel: thisWeekFitness,
    fitnessImprovement: thisWeekFitness - lastWeekFitness,
  };
}
