import type { EfficiencyLabel } from "@/lib/data";

const styles: Record<EfficiencyLabel, { bg: string; text: string }> = {
  "Energetic": { bg: "#dcfce7", text: "#15803d" },
  "Good":      { bg: "#fef9c3", text: "#a16207" },
  "Tired":     { bg: "#fee2e2", text: "#dc2626" },
};

export default function PillBadge({ pill }: { pill: EfficiencyLabel }) {
  const { bg, text } = styles[pill];
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color: text }}
    >
      {pill}
    </span>
  );
}
