// src/components/ProgressBar.tsx
//
// Displays one topic's mastery score as a labeled progress bar.
// mastery_score from the backend is 0.0–1.0 (see backend/db/models.py
// TopicProgress.mastery_score) — we convert to a percentage for display.

import type { TopicProgress } from "@/lib/types";

interface ProgressBarProps {
  progress: TopicProgress;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const percentage = Math.round(progress.mastery_score * 100);

  // Color-code the bar based on mastery level — gives an instant
  // visual signal without the user needing to read the number.
  const barColor =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 50
      ? "bg-yellow-500"
      : "bg-red-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{progress.topic}</span>
        <span className="text-sm text-slate-500">{percentage}%</span>
      </div>

      {/* Track */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        {/* Fill — width is set inline since it's a dynamic, calculated value */}
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 mt-1">
        Studied {progress.times_studied}x · Quizzed {progress.times_quizzed}x
      </p>
    </div>
  );
}
