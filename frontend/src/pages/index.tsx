// src/pages/index.tsx
//
// Maps to the root URL "/". Its only job is to decide where to
// send the visitor — we don't show any UI here ourselves.
//
// WHY useEffect AND NOT JUST "if (isAuthenticated) router.push(...)"
// DIRECTLY IN THE COMPONENT BODY?
//   On the very first render, useAuth() hasn't finished reading
//   localStorage yet (isLoading is true). If we redirected
//   immediately based on a still-loading state, we'd often guess
//   wrong (e.g. send a logged-in user to /login because the token
//   hadn't been read yet). useEffect lets us wait for isLoading
//   to become false before deciding.

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait until we know the real auth state

    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Brief loading state while the redirect decision is being made
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400">Loading...</p>
    </div>
  );
}
