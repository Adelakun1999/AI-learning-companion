// src/pages/dashboard.tsx
//
// The main hub after login. Shows:
//   1. A list of the user's study sessions (active + completed)
//   2. A progress overview across all topics they've studied
//   3. A button to start a new session
//
// DATA FLOW:
//   On mount -> fetch sessions + progress in parallel ->
//   render lists -> "New session" button opens a modal ->
//   submitting the modal calls createSession() -> navigate to
//   the new session's chat page.

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { createSession, listSessions, getProgress } from "@/lib/api";
import type { SessionSummary, TopicProgress } from "@/lib/types";
import SessionCard from "@/components/SessionCard";
import ProgressBar from "@/components/ProgressBar";
import NewSessionModal from "@/components/NewSessionModal";

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  // ── Data state ─────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Modal state ────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Fetch dashboard data once the user is confirmed logged in ──
  useEffect(() => {
    // Don't fetch until we know auth has finished loading AND
    // we have a confirmed user — otherwise we'd fire requests
    // with no token attached (or a stale one).
    if (authLoading || !user) return;

    async function loadDashboardData() {
      try {
        // Fetch both in parallel — they're independent of each other,
        // no reason to wait for one before starting the other.
        const [sessionsData, progressData] = await Promise.all([
          listSessions(),
          getProgress(),
        ]);
        setSessions(sessionsData);
        setProgress(progressData);
      } catch (err) {
        setError("Couldn't load your dashboard. Please refresh.");
        console.error(err);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadDashboardData();
  }, [authLoading, user]);

  // ── Redirect to login if not authenticated ──────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // ── Handle creating a new session ───────────────────────────
  async function handleCreateSession(topic: string) {
    const newSession = await createSession(topic);
    setIsModalOpen(false);
    // Jump straight into the chat for the new session
    router.push(`/session/${newSession.id}`);
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">AI Learning Companion</h1>
          <p className="text-sm text-slate-500">Welcome back, {user.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Log out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* ── New session button ─────────────────────────────── */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 mb-8"
        >
          + Start a new session
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* ── Sessions list ─────────────────────────────────── */}
          <div className="md:col-span-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Your sessions
            </h2>

            {isLoadingData ? (
              <p className="text-slate-400">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg p-6 text-center">
                No sessions yet. Start one above to begin learning!
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>

          {/* ── Progress overview ──────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Your progress
            </h2>

            {isLoadingData ? (
              <p className="text-slate-400">Loading progress...</p>
            ) : progress.length === 0 ? (
              <p className="text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg p-4 text-sm text-center">
                Complete a quiz to see your progress here.
              </p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                {progress.map((p) => (
                  <ProgressBar key={p.topic} progress={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <NewSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateSession}
      />
    </div>
  );
}
