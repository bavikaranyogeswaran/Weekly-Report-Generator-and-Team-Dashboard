// Shared TypeScript types used across the frontend

// Mirrors the Role enum from the backend
export type Role = 'MEMBER' | 'MANAGER'

// Shape of the authenticated user returned by GET /auth/me
export type AuthUser = {
  id: string
  name: string
  email: string
  role: Role
  isVerified: boolean
  createdAt: string
}
