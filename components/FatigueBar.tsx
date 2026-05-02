interface Props {
  percent: number;
}

export default function FatigueBar({ percent }: Props) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color =
    clamped >= 70 ? "#ef4444" : clamped >= 40 ? "#f59e0b" : "#22c55e";

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#378add" }}>
          Fatigue Level
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {clamped}%
        </span>
      </div>
      <div className="w-full rounded-full h-3" style={{ background: "#e0eeff" }}>
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs" style={{ color: "#94a3b8" }}>
        <span>Fresh</span>
        <span>Moderate</span>
        <span>Fatigued</span>
      </div>
    </div>
  );
}
