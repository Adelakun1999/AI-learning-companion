

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-text-faint rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-text-faint rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-text-faint rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
