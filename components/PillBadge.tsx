type Pill = "Great" | "Good" | "Tired";

const styles: Record<Pill, { bg: string; text: string }> = {
  Great: { bg: "#dbeafe", text: "#1d4ed8" },
  Good:  { bg: "#dcfce7", text: "#15803d" },
  Tired: { bg: "#fef3c7", text: "#b45309" },
};

export default function PillBadge({ pill }: { pill: Pill }) {
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
