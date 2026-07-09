// Starter questions grounded in what the AI actually has context for.
// Clicking one immediately sends it — no intermediate step needed.
const PROMPTS = [
  "Who hasn't submitted a report this week?",
  "Summarise the blockers mentioned across all recent reports.",
  "Who logged the most hours across all submitted reports?",
  "Which projects are currently active?",
]

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export default function SuggestedPrompts({ onSelect, disabled = false }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
      <div>
        <p className="text-sm font-semibold text-gray-700">Ask anything about your team</p>
        <p className="mt-0.5 text-xs text-gray-400">
          Answers are grounded in your team's submitted reports
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
