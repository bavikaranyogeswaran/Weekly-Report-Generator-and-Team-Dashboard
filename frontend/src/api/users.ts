import api from '@/lib/axios'
import type { AuthUser } from '@/lib/types'

// GET /users — manager-only; returns all registered users sorted newest first
export const getUsers = () =>
  api.get<AuthUser[]>('/users')
