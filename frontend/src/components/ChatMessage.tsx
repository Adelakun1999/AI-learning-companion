

import type { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
}

// Each agent gets a distinct accent from our token system:
//   Tutor    -> mint/teal (the primary accent — calm, instructive)
//   Quiz     -> warm amber (energy, scoring, challenge)
//   Feedback -> soft violet (a third distinct voice — reflective coach)
const AGENT_STYLES: Record<string, { label: string; textColor: string; bgColor: string }> = {
  tutor_agent: { label: "Tutor", textColor: "text-accent", bgColor: "bg-accent-soft" },
  quiz_agent: { label: "Quiz", textColor: "text-warm", bgColor: "bg-warm-soft" },
  feedback_agent: { label: "Coach", textColor: "text-violet", bgColor: "bg-violet-soft" },
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const agentStyle = message.agent ? AGENT_STYLES[message.agent] : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {!isUser && agentStyle && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full mb-1.5 ${agentStyle.bgColor} ${agentStyle.textColor}`}
          >
            {agentStyle.label}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 whitespace-pre-wrap leading-relaxed ${
            isUser
              ? "bg-accent text-accent-text rounded-br-sm"
              : "bg-surface border border-border text-text rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
