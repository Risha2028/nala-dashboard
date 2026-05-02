interface StatChipProps {
  label: string;
  value: string | number;
  icon?: string;
}

export default function StatChip({ label, value, icon }: StatChipProps) {
  return (
    <div
      className="rounded-2xl px-4 py-4 flex flex-col items-center justify-center text-center gap-1 shadow-sm"
      style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
    >
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className="text-2xl font-bold" style={{ color: "#0c447c" }}>
        {value}
      </div>
      <div className="text-xs font-medium" style={{ color: "#94a3b8" }}>
        {label}
      </div>
    </div>
  );
}
