import api from '@/lib/axios'
import type { AuthUser } from '@/lib/types'

// Shape of what the backend returns on successful login
export type LoginResponse = {
  access_token: string
  emailVerified: boolean
}

// POST /auth/register
export const register = (data: {
  name: string
  email: string
  password: string
}) => api.post<{ message: string }>('/auth/register', data)

// POST /auth/login
export const login = (data: { email: string; password: string }) =>
  api.post<LoginResponse>('/auth/login', data)

// GET /auth/me — fetch the logged-in user's profile.
// During login the store token is not set yet, so we pass the freshly received token directly.
export const getMe = (token?: string) =>
  api.get<AuthUser>('/auth/me', token ? { headers: { Authorization: `Bearer ${token}` } } : {})

// GET /auth/verify?token=... — email verification link handler
export const verifyEmail = (token: string) =>
  api.get<{ message: string }>(`/auth/verify?token=${token}`)
