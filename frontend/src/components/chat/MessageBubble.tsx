// ── User bubble — right-aligned, indigo fill ─────────────────────────────────
export function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-sm">
        {/* Preserve line breaks from Shift+Enter */}
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  )
}

// ── Assistant bubble — left-aligned, white card ───────────────────────────────
export function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {/* AI avatar mark */}
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
        AI
      </span>
      <div className="max-w-[75%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  )
}

// ── Typing indicator — shown while waiting for the AI response ────────────────
// Three dots fade in/out with staggered delays to signal active processing
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
        AI
      </span>
      <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
