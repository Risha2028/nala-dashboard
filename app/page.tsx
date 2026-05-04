import { fetchSessions, getOverviewStats, type Session } from "@/lib/data";
import StatCard from "@/components/StatCard";
import SessionCard from "@/components/SessionCard";
import RatingTrendChart from "@/components/RatingTrendChart";
import SessionControls from "@/components/SessionControls";

export const dynamic = "force-dynamic";


function PawPrint({ size, rotation, opacity = 0.12 }: { size: number; rotation: number; opacity?: number }) {
  const pad = { w: Math.round(size * 0.54), h: Math.round(size * 0.48) };
  const innerToe = Math.round(size * 0.26);
  const outerToe = Math.round(size * 0.21);
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        opacity,
        flexShrink: 0,
      }}
    >
      {/* Main pad — bottom center */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: pad.w,
          height: pad.h,
          background: "white",
          borderRadius: "50%",
        }}
      />
      {/* Left outer toe */}
      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.12),
          left: Math.round(size * 0.03),
          width: outerToe,
          height: outerToe,
          background: "white",
          borderRadius: "50%",
        }}
      />
      {/* Left inner toe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: Math.round(size * 0.27),
          width: innerToe,
          height: innerToe,
          background: "white",
          borderRadius: "50%",
        }}
      />
      {/* Right inner toe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: Math.round(size * 0.27),
          width: innerToe,
          height: innerToe,
          background: "white",
          borderRadius: "50%",
        }}
      />
      {/* Right outer toe */}
      <div
        style={{
          position: "absolute",
          top: Math.round(size * 0.12),
          right: Math.round(size * 0.03),
          width: outerToe,
          height: outerToe,
          background: "white",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

const TRAIL_PAWS = [
  { left: "5%",  bottom: "60px", rotation: -8,  size: 21, pawOpacity: 0.55 },
  { left: "15%", bottom: "48px", rotation:  8,  size: 20, pawOpacity: 0.49 },
  { left: "25%", bottom: "60px", rotation: -8,  size: 20, pawOpacity: 0.42 },
  { left: "35%", bottom: "48px", rotation:  8,  size: 19, pawOpacity: 0.35 },
  { left: "44%", bottom: "60px", rotation: -8,  size: 19, pawOpacity: 0.27 },
  { left: "53%", bottom: "48px", rotation:  8,  size: 18, pawOpacity: 0.20 },
  { left: "62%", bottom: "60px", rotation: -8,  size: 18, pawOpacity: 0.13 },
  { left: "71%", bottom: "48px", rotation:  8,  size: 17, pawOpacity: 0.08 },
  { left: "80%", bottom: "60px", rotation: -8,  size: 17, pawOpacity: 0.04 },
];

function CloudDivider() {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        height: "90px",
        background: "linear-gradient(to bottom, #f0f7ff 0%, #a8d4ec 45%, #f0f7ff 100%)",
        margin: "8px -16px",
      }}
    >
      {/* Solid base strip */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "28px", background: "#f0f7ff" }} />
      {/* Cloud puffs */}
      <div style={{ position: "absolute", bottom: "16px", left: "-1%",  width: 182, height: 38, borderRadius: "50%", background: "#f0f7ff" }} />
      <div style={{ position: "absolute", bottom: "22px", left: "11%",  width: 166, height: 46, borderRadius: "50%", background: "#f0f7ff" }} />
      <div style={{ position: "absolute", bottom: "14px", left: "24%",  width: 188, height: 40, borderRadius: "50%", background: "#f0f7ff" }} />
      <div style={{ position: "absolute", bottom: "24px", left: "37%",  width: 172, height: 48, borderRadius: "50%", background: "#f0f7ff" }} />
      <div style={{ position: "absolute", bottom: "16px", left: "50%",  width: 184, height: 38, borderRadius: "50%", background: "#f0f7ff" }} />
      <div style={{ position: "absolute", bottom: "22px", left: "63%",  width: 170, height: 44, borderRadius: "50%", background: "#f0f7ff" }} />
      <div style={{ position: "absolute", bottom: "14px", left: "76%",  width: 182, height: 38, borderRadius: "50%", background: "#f0f7ff" }} />
      <div style={{ position: "absolute", bottom: "22px", left: "89%",  width: 168, height: 46, borderRadius: "50%", background: "#f0f7ff" }} />
    </div>
  );
}

function getRecommendation(session: Session): { isPlayDay: boolean; body: string } {
  const { efficiencyLabel, efficiency, totalThrows, duration } = session;
  if (efficiencyLabel === "Energetic") {
    return {
      isPlayDay: true,
      body: `Nala is performing above average — ${efficiency}m/min efficiency over ${totalThrows} throws in ${duration} minutes. She's in great shape. Keep the momentum going tomorrow with another full session.`,
    };
  }
  if (efficiencyLabel === "Good") {
    return {
      isPlayDay: true,
      body: `Solid ${efficiency}m/min efficiency today — right in Nala's typical range. A lighter play session tomorrow (around 15 throws) will keep her sharp without overdoing it.`,
    };
  }
  return {
    isPlayDay: false,
    body: `Nala's efficiency came in below average at ${efficiency}m/min today. A rest day tomorrow will help her recover and come back stronger for the next session.`,
  };
}

export default async function Home() {
  const sessions = await fetchSessions();
  console.log("[page/Home] sessions count:", sessions.length);
  console.log("[page/Home] first session:", JSON.stringify(sessions[0] ?? null));
  const {
    sessionsThisWeek,
    avgEfficiencyThisWeek, avgEfficiencyLastWeek,
    totalDistanceThisWeek, totalDistanceLastWeek,
    totalTimeThisWeek, totalTimeLastWeek,
  } = getOverviewStats(sessions);
  const effDelta = parseFloat((avgEfficiencyThisWeek - avgEfficiencyLastWeek).toFixed(1));
  const distDelta = parseFloat((totalDistanceThisWeek - totalDistanceLastWeek).toFixed(1));
  const timeDelta = totalTimeThisWeek - totalTimeLastWeek;
  const { isPlayDay, body: recBody } = sessions.length
    ? getRecommendation(sessions[0])
    : { isPlayDay: true, body: "No sessions recorded yet. Go fetch!" };

  return (
    <>
      {/* ── Hero ── */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, #7ec8e3 0%, #a8d8ee 35%, #cce9f7 65%, #eef6ff 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Paw prints scattered across the sky */}
        <div style={{ position: "absolute", top: "12px", left: "6%" }}>
          <PawPrint size={22} rotation={-20} />
        </div>
        <div style={{ position: "absolute", top: "8px", left: "27%" }}>
          <PawPrint size={26} rotation={15} />
        </div>
        <div style={{ position: "absolute", top: "16px", right: "9%" }}>
          <PawPrint size={30} rotation={-10} />
        </div>
        <div style={{ position: "absolute", top: "52%", left: "2%" }}>
          <PawPrint size={20} rotation={30} />
        </div>
        <div style={{ position: "absolute", top: "38%", right: "16%" }}>
          <PawPrint size={34} rotation={-25} />
        </div>
        <div style={{ position: "absolute", top: "24%", left: "61%" }}>
          <PawPrint size={28} rotation={8} />
        </div>

        {/* Two-column hero content — aligns with stat card grid below */}
        <div
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            padding: "0 16px",
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          {/* Left column — text + button */}
          <div style={{ flex: "0 0 50%", paddingTop: "40px", paddingBottom: "88px", textAlign: "left" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#1a5f8a", marginBottom: "4px" }}>
              Good morning 🐾
            </p>
            <h1 style={{ fontSize: "36px", fontWeight: 700, color: "#0c447c", margin: 0 }}>
              Let&apos;s play, Nala
            </h1>
            <p style={{ fontSize: "14px", color: "#3a7aa8", marginTop: "4px" }}>
              Labradoodle · 6 yrs · San Francisco
            </p>
            <SessionControls />
          </div>

          {/* Right column — illustration, bottom-aligned */}
          <div style={{ flex: "0 0 50%", display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dog-walking-3.svg"
              alt=""
              style={{ width: "100%", display: "block", pointerEvents: "none" }}
            />
          </div>
        </div>

        {/* Animated paw trail */}
        {TRAIL_PAWS.map(({ left, bottom, rotation, size, pawOpacity }, i) => (
          <div
            key={`trail-${i}`}
            style={{
              position: "absolute",
              left,
              bottom,
              pointerEvents: "none",
              animation: `paw-trail-${i} 5s linear infinite`,
              "--paw-opacity": String(pawOpacity),
            } as React.CSSProperties}
          >
            <PawPrint size={size} rotation={rotation} opacity={1} />
          </div>
        ))}

        {/* Soft fade into page background */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "48px", background: "linear-gradient(to bottom, transparent, #f0f7ff)", pointerEvents: "none" }} />
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: "48rem", margin: "0 auto", padding: "28px 16px 48px" }}>
        {/* Overview stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            label="Sessions This Week"
            value={sessionsThisWeek}
            icon="📅"
            sub="in the last 7 days"
          />
          <StatCard
            label="Avg Efficiency"
            value={`${avgEfficiencyThisWeek}m/min`}
            icon="⚡"
            delta={{
              text: effDelta >= 0
                ? `↑ +${effDelta} m/min vs last week`
                : `↓ ${Math.abs(effDelta)} m/min vs last week`,
              positive: effDelta >= 0,
            }}
            sub="this week"
          />
          <StatCard
            label="Total Distance This Week"
            value={`${totalDistanceThisWeek}m`}
            icon="📏"
            delta={{
              text: distDelta >= 0
                ? `↑ +${distDelta}m vs last week`
                : `↓ ${Math.abs(distDelta)}m vs last week`,
              positive: distDelta >= 0,
            }}
            sub="this week"
          />
          <StatCard
            label="Total Time This Week"
            value={`${totalTimeThisWeek} min`}
            icon="⏱️"
            delta={{
              text: timeDelta >= 0
                ? `↑ +${timeDelta} min vs last week`
                : `↓ ${Math.abs(timeDelta)} min vs last week`,
              positive: timeDelta >= 0,
            }}
            sub="this week"
          />
        </div>

        {/* Trend chart */}
        <div className="mb-8">
          <RatingTrendChart sessions={sessions} />
        </div>

        {/* Cloud divider — separates summary from individual session data */}
        <CloudDivider />

        {/* Session list */}
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-3" style={{ color: "#0c447c" }}>
            Past Sessions
          </h2>
          <div className="flex flex-col gap-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* Recommendation card */}
        <div
          style={{
            background: "#0c3d6b",
            borderRadius: "20px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            {isPlayDay ? "🎾" : "🌙"}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "13px",
                letterSpacing: "0.01em",
                marginBottom: "4px",
              }}
            >
              Tomorrow&apos;s recommendation
            </div>
            <div
              style={{
                color: "#7db8d8",
                fontSize: "12.5px",
                lineHeight: "1.55",
              }}
            >
              {recBody}
            </div>
          </div>

          {/* Pill */}
          <div
            style={{
              background: isPlayDay ? "#16a34a" : "#15803d",
              color: "#ffffff",
              borderRadius: "999px",
              padding: "5px 14px",
              fontSize: "11.5px",
              fontWeight: 600,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {isPlayDay ? "Play day" : "Rest day"}
          </div>
        </div>
      </main>
    </>
  );
}
