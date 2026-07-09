import { useState, useRef, useEffect } from 'react'

const MAX_CHARS = 1000

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean               // true while waiting for the AI reply
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize the textarea up to 4 rows as the user types
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    // Cap at 4 rows (4 × 24px line-height + 2×8px padding = ~112px)
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }, [value])

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled || trimmed.length > MAX_CHARS) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter alone submits; Shift+Enter inserts a newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const remaining = MAX_CHARS - value.length
  const overLimit = remaining < 0
  const isEmpty = value.trim().length === 0
  const canSend = !disabled && !isEmpty && !overLimit

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div
        className={[
          'flex items-end gap-2 rounded-xl border bg-gray-50 px-3 py-2 transition',
          overLimit
            ? 'border-red-300 ring-1 ring-red-200'
            : 'border-gray-300 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200',
        ].join(' ')}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a question about your team…"
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 disabled:opacity-50"
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label="Send message"
          className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40"
        >
          {disabled ? (
            // Spinner while waiting for reply
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            // Send arrow icon
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M2.293 1.293a1 1 0 011.32-.083l10 7a1 1 0 010 1.58l-10 7A1 1 0 012 16V1a1 1 0 01.293-.707z" />
            </svg>
          )}
        </button>
      </div>

      {/* Character counter — shown only when the user has started typing */}
      {value.length > 0 && (
        <p
          className={`mt-1 text-right text-xs ${
            overLimit ? 'text-red-500' : remaining <= 100 ? 'text-amber-500' : 'text-gray-400'
          }`}
        >
          {value.length} / {MAX_CHARS}
        </p>
      )}

      <p className="mt-1 text-center text-xs text-gray-400">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
