import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/lib/types'

// Shape of the auth slice stored in Zustand (and persisted to localStorage)
type AuthState = {
  token: string | null
  user: AuthUser | null

  // Called after a successful login or register — saves token + user profile
  setAuth: (token: string, user: AuthUser) => void

  // Clears all auth state — called on logout or 401 response
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),

      logout: () => set({ token: null, user: null }),
    }),
    {
      // Key used in localStorage — changing this logs out all existing sessions
      name: 'auth',
    },
  ),
)
