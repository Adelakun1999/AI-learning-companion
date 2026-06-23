import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4 relative overflow-hidden">
      {/* Ambient accent glow — single soft radial blob, low opacity.
          This is the one decorative risk; everything else stays quiet. */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full opacity-[0.07] blur-3xl pointer-events-none"
        style={{ background: "var(--color-accent)" }}
      />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-semibold text-text">
            AI Learning Companion
          </h1>
          <p className="text-text-muted mt-1.5 text-sm">{subtitle}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-8 shadow-2xl shadow-black/40">
          <h2 className="font-display text-lg font-medium text-text mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
