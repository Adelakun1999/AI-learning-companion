

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
      setText("");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-base p-4">
      <div className="flex gap-2 mb-2.5">
        {(["auto", "tutor", "quiz", "feedback"] as MessageType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setMessageType(type)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              messageType === type
                ? "bg-accent text-accent-text border-accent"
                : "bg-surface text-text-muted border-border hover:border-border-hover"
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
          className="flex-1 resize-none px-4 py-2.5 bg-surface border border-border rounded-lg text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={disabled || isSending || !text.trim()}
          className="bg-accent text-accent-text font-medium px-5 py-2.5 rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>
    </form>
  );
}
