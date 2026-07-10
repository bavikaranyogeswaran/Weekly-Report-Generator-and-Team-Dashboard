import api from '@/lib/axios'
import type { AuthUser } from '@/lib/types'

// GET /admin/users — all users, newest first (admin only)
export const getAdminUsers = () =>
  api.get<AuthUser[]>('/admin/users')

// PATCH /admin/users/:id/role — assigns MEMBER or MANAGER; ADMIN cannot be assigned
export const patchUserRole = (userId: string, role: 'MEMBER' | 'MANAGER') =>
  api.patch<AuthUser>(`/admin/users/${userId}/role`, { role })

// DELETE /admin/users/:id — permanently removes a user (self-delete and ADMIN-delete blocked)
export const deleteAdminUser = (userId: string) =>
  api.delete<{ message: string }>(`/admin/users/${userId}`)

// POST /admin/users — admin creates a new user with a chosen role; sends invite email
export const createAdminUser = (dto: {
  name: string
  email: string
  role: 'MEMBER' | 'MANAGER'
}) => api.post<AuthUser>('/admin/users', dto)
