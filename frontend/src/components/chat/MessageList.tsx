import { useEffect, useRef } from 'react'
import { UserBubble, AssistantBubble, TypingIndicator } from './MessageBubble'

export type ChatMessage = {
  id: string                      // stable key for React list rendering
  role: 'user' | 'assistant'
  content: string
}

interface MessageListProps {
  messages: ChatMessage[]
  isTyping: boolean               // show the TypingIndicator when true
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  // A sentinel div at the bottom — scrollIntoView keeps the latest message visible
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever a message is added or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    // flex-1 lets this fill the available vertical space between the header and input bar
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserBubble key={msg.id} content={msg.content} />
        ) : (
          <AssistantBubble key={msg.id} content={msg.content} />
        ),
      )}

      {/* Typing indicator appears below the last message while waiting for a reply */}
      {isTyping && <TypingIndicator />}

      {/* Invisible sentinel — always scrolled into view on update */}
      <div ref={bottomRef} />
    </div>
  )
}
