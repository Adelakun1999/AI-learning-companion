

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
  const sessionId = typeof router.query.id === "string" ? router.query.id : null;

  const { user, isLoading: authLoading } = useAuth();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  async function handleSend(text: string, messageType: MessageType) {
    if (!sessionId) return;

    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
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
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id));
    } finally {
      setIsAgentTyping(false);
    }
  }

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
      <div className="min-h-screen flex items-center justify-center bg-base text-text-muted">
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base text-text-muted">
        Session not found.
      </div>
    );
  }

  const isEnded = session.ended_at !== null;

  return (
    <div className="min-h-screen flex flex-col bg-base">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-text-faint hover:text-text-muted transition-colors">
            ← Back to dashboard
          </Link>
          <h1 className="font-display text-lg font-semibold text-text">{session.topic}</h1>
        </div>

        {!isEnded && (
          <button
            onClick={handleEndSession}
            className="text-sm bg-surface text-text-muted px-4 py-2 rounded-lg hover:bg-surface-raised hover:text-text transition-colors"
          >
            End session
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl w-full mx-auto">
        {messages.length === 0 && (
          <p className="text-center text-text-faint mt-12">
            Say hello, ask a question, or type &quot;quiz me&quot; to get started!
          </p>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isAgentTyping && <TypingIndicator />}

        {error && (
          <div className="bg-danger-soft border border-danger/30 text-danger text-sm rounded-lg px-4 py-3 my-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {isEnded ? (
        <div className="border-t border-border bg-base p-4 text-center text-text-faint text-sm">
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
