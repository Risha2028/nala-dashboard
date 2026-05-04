"use client";
import Link from "next/link";
import { Session } from "@/lib/data";
import PillBadge from "./PillBadge";

const LABEL_EMOJI: Record<Session["efficiencyLabel"], string> = {
  Energetic: "🥳",
  Good:      "😊",
  Tired:     "😴",
};

export default function SessionCard({ session }: { session: Session }) {
  return (
    <Link href={`/session/${session.id}`}>
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
        style={{ background: "#ffffff", border: "1px solid #dbeafe" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "#f0f7ff" }}
          >
            {LABEL_EMOJI[session.efficiencyLabel]}
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: "#0c447c" }}>
              {session.date}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {session.totalThrows} throws &middot; {session.totalDistance}m total
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PillBadge pill={session.efficiencyLabel} />
          <svg
            className="w-4 h-4"
            style={{ color: "#94a3b8" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
