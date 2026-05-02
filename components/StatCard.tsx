interface Delta {
  text: string;
  positive: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
  delta?: Delta;
}

export default function StatCard({ label, value, sub, icon, delta }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1 shadow-sm"
      style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#378add" }}>
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold mt-1" style={{ color: "#0c447c" }}>
        {value}
      </div>
      {delta && (
        <div
          className="text-xs font-medium mt-0.5"
          style={{ color: delta.positive ? "#16a34a" : "#dc2626" }}
        >
          {delta.text}
        </div>
      )}
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
