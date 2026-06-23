// src/components/AuthLayout.tsx
//
// WHY THIS FILE EXISTS:
//   Login and register pages share the same visual shell — a
//   centered card on a plain background. Rather than duplicating
//   that markup in both page files, we extract it once here.
//
// This is a plain "presentational" component — it takes children
// and just arranges them. No state, no logic.

import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">AI Learning Companion</h1>
          <p className="text-slate-500 mt-1">{subtitle}</p>
        </div>

        {/* Card containing the form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
