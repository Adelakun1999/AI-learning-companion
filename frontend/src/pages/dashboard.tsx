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

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    async function loadDashboardData() {
      try {
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  async function handleCreateSession(topic: string) {
    const newSession = await createSession(topic);
    setIsModalOpen(false);
    router.push(`/session/${newSession.id}`);
  }

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-base text-text-muted">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold text-text">AI Learning Companion</h1>
          <p className="text-sm text-text-muted">Welcome back, {user.name}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-text-muted hover:text-text transition-colors"
        >
          Log out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-danger-soft border border-danger/30 text-danger text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-accent text-accent-text font-medium py-3 rounded-xl hover:bg-accent-hover transition-colors mb-8"
        >
          + Start a new session
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">
              Your sessions
            </h2>

            {isLoadingData ? (
              <p className="text-text-muted">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-text-muted bg-surface border border-dashed border-border rounded-xl p-6 text-center">
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

          <div>
            <h2 className="text-xs font-semibold text-text-faint uppercase tracking-wider mb-3">
              Your progress
            </h2>

            {isLoadingData ? (
              <p className="text-text-muted">Loading progress...</p>
            ) : progress.length === 0 ? (
              <p className="text-text-muted bg-surface border border-dashed border-border rounded-xl p-4 text-sm text-center">
                Complete a quiz to see your progress here.
              </p>
            ) : (
              <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
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
