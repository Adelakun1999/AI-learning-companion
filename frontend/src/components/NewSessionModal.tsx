// src/components/NewSessionModal.tsx
//
// A simple modal (overlay dialog) for entering a topic and starting
// a new session. We keep this as its own component because:
//   1. It has its own internal state (the topic input)
//   2. Modals are a common reusable UI pattern worth isolating

import { useState, type FormEvent } from "react";

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Called with the typed topic when the user submits.
  // The PARENT (dashboard page) owns the actual API call — this
  // component only collects input and reports back. This keeps
  // the modal "dumb" and reusable.
  onCreate: (topic: string) => Promise<void>;
}

export default function NewSessionModal({ isOpen, onClose, onCreate }: NewSessionModalProps) {
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Returning null renders nothing — this is the standard React
  // pattern for conditionally showing/hiding a component.
  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return; // guard against empty/whitespace-only topics

    setIsSubmitting(true);
    try {
      await onCreate(topic.trim());
      setTopic(""); // reset for next time
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // Backdrop — clicking outside the card closes the modal
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      {/* stopPropagation prevents clicks INSIDE the card from
          bubbling up to the backdrop's onClick and closing it */}
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Start a new session</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1">
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
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSubmitting ? "Starting..." : "Start"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
