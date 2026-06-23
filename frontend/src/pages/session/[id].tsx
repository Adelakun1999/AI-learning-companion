// src/pages/session/[id].tsx
//
// The core learning experience. URL: /session/abc-123
// [id].tsx is Next.js's syntax for a DYNAMIC route — the part in
// brackets becomes a URL parameter we read via useRouter().query.id
//
// DATA FLOW:
//   1. On mount, fetch the full session (topic + message history)
//   2. Render messages as a scrolling chat thread
//   3. User types -> sendChatMessage() -> backend runs the LangGraph
//      workflow -> response appended to the thread
//   4. "End session" button finalizes it and returns to dashboard

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { endSession, getSession, sendChatMessage } from "@/lib/api";
import type { Message, MessageType, SessionDetail } from "@/lib/types";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";

export default function SessionPage() {
  const router = useRouter();
  // router.query.id is "string | string[] | undefined" until Next.js
  // hydrates the route on the client — hence the type-narrowing below.
  const sessionId = typeof router.query.id === "string" ? router.query.id : null;

  const { user, isLoading: authLoading } = useAuth();

  // ── Session + messages state ────────────────────────────────
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to the bottom of the message list, used to auto-scroll
  // down every time a new message is added.
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Redirect unauthenticated users ──────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // ── Load the session once we have a valid id + logged-in user ──
  useEffect(() => {
    if (!sessionId || authLoading || !user) return;

    async function loadSession() {
      try {
        const data = await getSession(sessionId!);
        setSession(data);
        setMessages(data.messages);
      } catch (err) {
        setError("Couldn't load this session.");
        console.error(err);
      } finally {
        setIsLoadingSession(false);
      }
    }

    loadSession();
  }, [sessionId, authLoading, user]);

  // ── Auto-scroll to bottom whenever messages change ──────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  // ── Send a message ───────────────────────────────────────────
  async function handleSend(text: string, messageType: MessageType) {
    if (!sessionId) return;

    // Optimistically add the user's message to the UI immediately —
    // don't wait for the backend round-trip. This makes the chat
    // feel instant even though the agent's reply takes a few seconds.
    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`, // temporary id, just for React's key prop
      role: "user",
      content: text,
      agent: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setIsAgentTyping(true);
    setError(null);

    try {
      const response = await sendChatMessage(sessionId, {
        message: text,
        message_type: messageType,
      });

      // Add the agent's reply as a new message bubble
      const agentMessage: Message = {
        id: `temp-${Date.now()}-agent`,
        role: "assistant",
        content: response.message,
        agent: `${response.agent}_agent`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      setError("The agent couldn't respond. Please try again.");
      console.error(err);
      // Roll back the optimistic message so the UI doesn't show
      // a question that never got answered.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id));
    } finally {
      setIsAgentTyping(false);
    }
  }

  // ── End the session ──────────────────────────────────────────
  async function handleEndSession() {
    if (!sessionId) return;
    try {
      await endSession(sessionId);
      router.push("/dashboard");
    } catch (err) {
      setError("Couldn't end the session.");
      console.error(err);
    }
  }

  if (authLoading || isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Session not found.
      </div>
    );
  }

  const isEnded = session.ended_at !== null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600">
            ← Back to dashboard
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{session.topic}</h1>
        </div>

        {!isEnded && (
          <button
            onClick={handleEndSession}
            className="text-sm bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200"
          >
            End session
          </button>
        )}
      </header>

      {/* ── Message thread ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl w-full mx-auto">
        {messages.length === 0 && (
          <p className="text-center text-slate-400 mt-12">
            Say hello, ask a question, or type &quot;quiz me&quot; to get started!
          </p>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isAgentTyping && <TypingIndicator />}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 my-2">
            {error}
          </div>
        )}

        {/* Invisible anchor element — scrollIntoView targets this */}
        <div ref={bottomRef} />
      </main>

      {/* ── Input ───────────────────────────────────────────────── */}
      {isEnded ? (
        <div className="border-t border-slate-200 bg-white p-4 text-center text-slate-400 text-sm">
          This session has ended.
        </div>
      ) : (
        <div className="max-w-3xl w-full mx-auto">
          <ChatInput onSend={handleSend} disabled={isAgentTyping} />
        </div>
      )}
    </div>
  );
}
