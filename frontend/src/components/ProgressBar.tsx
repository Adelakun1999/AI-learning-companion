import type { TopicProgress } from "@/lib/types";

interface ProgressBarProps {
  progress: TopicProgress;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const percentage = Math.round(progress.mastery_score * 100);

  // Color-code using our token system — success green at high mastery,
  // warm amber in the middle (matches the quiz agent's accent, since
  // that's literally where these scores come from), danger red when low.
  const barColorVar =
    percentage >= 80
      ? "var(--color-success)"
      : percentage >= 50
      ? "var(--color-warm)"
      : "var(--color-danger)";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-text">{progress.topic}</span>
        <span className="text-sm font-mono text-text-muted">{percentage}%</span>
      </div>

      <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, background: barColorVar }}
        />
      </div>

      <p className="text-xs text-text-faint mt-1.5">
        Studied {progress.times_studied}x · Quizzed {progress.times_quizzed}x
      </p>
    </div>
  );
}
