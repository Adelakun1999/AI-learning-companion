// src/components/ChatInput.tsx
//
// The text box at the bottom of the chat. Includes a small selector
// so the student can optionally force a specific agent (matches
// backend's message_type: "auto" | "tutor" | "quiz" | "feedback" —
// see backend/schemas/session.py ChatRequest).

import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { MessageType } from "@/lib/types";

interface ChatInputProps {
  onSend: (message: string, messageType: MessageType) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("auto");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      await onSend(trimmed, messageType);
      setText(""); // clear input only after a successful send
    } finally {
      setIsSending(false);
    }
  }

  // Pressing Enter submits, but Shift+Enter adds a newline —
  // standard chat-app convention (Slack, ChatGPT, etc. all do this).
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
      {/* Quick-action buttons for explicit routing */}
      <div className="flex gap-2 mb-2">
        {(["auto", "tutor", "quiz", "feedback"] as MessageType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setMessageType(type)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              messageType === type
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}
          >
            {type === "auto" ? "Auto" : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          placeholder="Ask a question, say 'quiz me', or 'how am I doing?'..."
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={disabled || isSending || !text.trim()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>
    </form>
  );
}
