import { useState, type FormEvent } from "react";

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (topic: string) => Promise<void>;
}

export default function NewSessionModal({ isOpen, onClose, onCreate }: NewSessionModalProps) {
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate(topic.trim());
      setTopic("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/40 p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-medium text-text mb-4">Start a new session</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="topic" className="block text-sm font-medium text-text-muted mb-1.5">
            What do you want to study?
          </label>
          <input
            id="topic"
            type="text"
            autoFocus
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Python decorators, Linear algebra..."
            className="w-full px-3 py-2.5 bg-base border border-border rounded-lg text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
          />

          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-muted hover:bg-surface-raised hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent text-accent-text font-medium hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Starting..." : "Start"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
