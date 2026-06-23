
import Link from "next/link";
import type { SessionSummary } from "@/lib/types";

interface SessionCardProps {
  session: SessionSummary;
}

export default function SessionCard({ session }: SessionCardProps) {
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
      className="block bg-surface border border-border rounded-xl p-4 hover:border-border-hover hover:bg-surface-raised transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-text">{session.topic}</h3>
          <p className="text-sm text-text-muted mt-0.5">{startedDate}</p>
        </div>

        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isActive
              ? "bg-accent-soft text-accent"
              : "bg-surface-raised text-text-faint"
          }`}
        >
          {isActive ? "Active" : "Completed"}
        </span>
      </div>
    </Link>
  );
}
