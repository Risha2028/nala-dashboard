export interface ThrowData {
  throwNumber: number;
  returnTimeSeconds: number;
  distanceFeet: number;
}

export interface Session {
  id: string;
  date: string;
  rating: number;
  fatigueOnsetThrow: number;
  totalThrows: number;
  avgReturnTime: number;
  avgDistance: number;
  fatigueLevelPercent: number;
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

function makeThrows(
  total: number,
  fatigueOnset: number,
  baseReturn: number,
  baseDistance: number
): ThrowData[] {
  return Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const isFatigued = n >= fatigueOnset;
    const fatigueFactor = isFatigued ? 1 + ((n - fatigueOnset) / (total - fatigueOnset + 1)) * 0.8 : 1;
    const jitter = () => (Math.random() - 0.5) * 2;
    return {
      throwNumber: n,
      returnTimeSeconds: parseFloat((baseReturn * fatigueFactor + jitter()).toFixed(1)),
      distanceFeet: parseFloat(
        Math.max(15, baseDistance * (isFatigued ? 0.92 : 1) + jitter() * 3).toFixed(1)
      ),
    };
  });
}

function avg(arr: number[]) {
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
}

function buildSession(
  id: string,
  date: string,
  rating: number,
  fatigueOnset: number,
  total: number,
  baseReturn: number,
  baseDistance: number
): Session {
  const throws = makeThrows(total, fatigueOnset, baseReturn, baseDistance);
  const fatigueLevelPercent = Math.round(
    Math.min(100, ((total - fatigueOnset + 1) / total) * 100 * 1.2)
  );
  return {
    id,
    date,
    rating,
    fatigueOnsetThrow: fatigueOnset,
    totalThrows: total,
    avgReturnTime: avg(throws.map((t) => t.returnTimeSeconds)),
    avgDistance: avg(throws.map((t) => t.distanceFeet)),
    fatigueLevelPercent,
    throws,
  };
}

export const sessions: Session[] = [
  buildSession("s1", "Apr 28, 2026", 9, 20, 24, 8.2, 38),
  buildSession("s2", "Apr 25, 2026", 7, 14, 20, 9.1, 34),
  buildSession("s3", "Apr 22, 2026", 8, 18, 25, 8.5, 40),
  buildSession("s4", "Apr 19, 2026", 4, 8,  15, 11.0, 30),
  buildSession("s5", "Apr 16, 2026", 6, 12, 19, 9.8, 33),
  buildSession("s6", "Apr 13, 2026", 8, 17, 22, 8.3, 37),
  buildSession("s7", "Apr 10, 2026", 7, 13, 18, 9.4, 35),
  buildSession("s8", "Apr 7,  2026", 3, 6,  12, 12.5, 28),
];

export function getOverviewStats() {
  const now = new Date("2026-04-29");
  const thisWeek = sessions.filter((s) => {
    const d = new Date(s.date.replace(/\s+/g, " "));
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });
  const lastWeek = sessions.filter((s) => {
    const d = new Date(s.date.replace(/\s+/g, " "));
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
  const fitnessImprovement = thisWeekFitness - lastWeekFitness;

  return {
    sessionsThisWeek: thisWeek.length,
    avgRating,
    avgReturnTime,
    fitnessLevel: thisWeekFitness,
    fitnessImprovement,
  };
}
