// src/components/TypingIndicator.tsx
//
// A small "..." bouncing animation shown while we're waiting for
// the backend's LangGraph workflow to respond. Without this, the
// chat would feel frozen during the (sometimes 2-4 second) LLM call.

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
