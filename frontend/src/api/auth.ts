import api from '@/lib/axios'
import type { AuthUser } from '@/lib/types'

// Shape of what the backend returns on successful login
export type LoginResponse = {
  access_token: string
  emailVerified: boolean
}

// POST /auth/login
export const login = (data: { email: string; password: string }) =>
  api.post<LoginResponse>('/auth/login', data)

// GET /auth/me — fetch the logged-in user's profile.
// During login the store token is not set yet, so we pass the freshly received token directly.
export const getMe = (token?: string) =>
  api.get<AuthUser>('/auth/me', token ? { headers: { Authorization: `Bearer ${token}` } } : {})

// GET /auth/verify-email?token=... — email verification link handler
export const verifyEmail = (token: string) =>
  api.get<{ message: string }>(`/auth/verify-email?token=${token}`)

// PATCH /auth/password — logged-in user changes their own password
export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.patch<{ message: string }>('/auth/password', data)

// POST /auth/forgot-password — public; triggers a password-reset email if the address is found
export const forgotPassword = (data: { email: string }) =>
  api.post<{ message: string }>('/auth/forgot-password', data)

// POST /auth/reset-password — public; sets a new password using the token from the reset email
export const resetPassword = (data: { token: string; newPassword: string }) =>
  api.post<{ message: string }>('/auth/reset-password', data)
