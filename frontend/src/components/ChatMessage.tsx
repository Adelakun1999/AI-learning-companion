// src/components/ChatMessage.tsx
//
// Renders ONE message bubble in the chat thread.
// Student messages align right and are blue.
// Agent messages align left and are styled differently per agent
// so the student can visually tell who's "speaking".

import type { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
}

// Maps each agent name (from backend/agents/*.py) to a label + color.
// Centralising this mapping here means adding a new agent later is
// a one-line change, not a hunt through JSX.
const AGENT_STYLES: Record<string, { label: string; badgeColor: string }> = {
  tutor_agent: { label: "Tutor", badgeColor: "bg-indigo-100 text-indigo-700" },
  quiz_agent: { label: "Quiz", badgeColor: "bg-amber-100 text-amber-700" },
  feedback_agent: { label: "Coach", badgeColor: "bg-emerald-100 text-emerald-700" },
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const agentStyle = message.agent ? AGENT_STYLES[message.agent] : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Agent badge — only shown on agent messages, not user messages */}
        {!isUser && agentStyle && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${agentStyle.badgeColor}`}
          >
            {agentStyle.label}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 whitespace-pre-wrap ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
          }`}
        >
          {/* whitespace-pre-wrap above preserves newlines from the LLM's
              markdown-ish output without needing a full markdown renderer yet */}
          {message.content}
        </div>
      </div>
    </div>
  );
}
