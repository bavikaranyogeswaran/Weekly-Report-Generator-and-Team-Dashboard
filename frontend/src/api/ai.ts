import api from '@/lib/axios'

// POST /ai/chat — manager-only; backend grounds the reply in live team report data
export const sendChatMessage = (message: string) =>
  api.post<{ reply: string }>('/ai/chat', { message })
