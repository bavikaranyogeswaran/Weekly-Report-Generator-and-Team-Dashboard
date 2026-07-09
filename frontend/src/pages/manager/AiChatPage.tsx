import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sendChatMessage } from '@/api/ai'
import MessageList, { type ChatMessage } from '@/components/chat/MessageList'
import ChatInput from '@/components/chat/ChatInput'
import SuggestedPrompts from '@/components/chat/SuggestedPrompts'

// Generates a stable unique id for each message without an external library
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [apiError, setApiError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(message).then((r) => r.data.reply),
    onSuccess: (reply) => {
      // Append the assistant's reply to the conversation
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: reply },
      ])
    },
    onError: () => {
      setApiError('Could not reach the AI. Please try again.')
      // Remove the optimistic user message so the user can retry
      setMessages((prev) => prev.slice(0, -1))
    },
  })

  const handleSend = useCallback(
    (text: string) => {
      setApiError(null)
      // Append user message immediately (optimistic)
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', content: text },
      ])
      mutation.mutate(text)
    },
    [mutation],
  )

  const isEmpty = messages.length === 0

  return (
    // Full-height column so the input bar stays pinned to the bottom of the layout area
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-gray-200 bg-gray-50 shadow-sm">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3 rounded-t-xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
          AI
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-800">Team assistant</p>
          <p className="text-xs text-gray-400">Answers grounded in your team's reports</p>
        </div>
      </div>

      {/* Message area — fills remaining space and scrolls */}
      {isEmpty ? (
        // Welcome state shown before the first message
        <div className="flex flex-1 flex-col items-center justify-center">
          <SuggestedPrompts onSelect={handleSend} disabled={mutation.isPending} />
        </div>
      ) : (
        <MessageList messages={messages} isTyping={mutation.isPending} />
      )}

      {/* Error banner — appears between message list and input */}
      {apiError && (
        <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {apiError}
        </div>
      )}

      {/* Input bar — always visible at the bottom */}
      <ChatInput onSend={handleSend} disabled={mutation.isPending} />

    </div>
  )
}
