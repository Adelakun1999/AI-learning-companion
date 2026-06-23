// src/components/SessionCard.tsx
//
// A small, reusable card that shows one session's summary info.
// Used in a list on the dashboard. Clicking it navigates to the
// chat page for that session.
//
// This is a "presentational" component — it receives data via props
// and has no idea where that data came from (API, mock, etc).

import Link from "next/link";
import type { SessionSummary } from "@/lib/types";

interface SessionCardProps {
  session: SessionSummary;
}

export default function SessionCard({ session }: SessionCardProps) {
  // Format the ISO date string into something human-readable.
  // toLocaleDateString() uses the browser's locale automatically.
  const startedDate = new Date(session.started_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isActive = session.ended_at === null;

  return (
    <Link
      href={`/session/${session.id}`}
      className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-slate-900">{session.topic}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{startedDate}</p>
        </div>

        {/* Status badge — green dot for active, gray for ended */}
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            isActive
              ? "bg-green-50 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {isActive ? "Active" : "Completed"}
        </span>
      </div>
    </Link>
  );
}
