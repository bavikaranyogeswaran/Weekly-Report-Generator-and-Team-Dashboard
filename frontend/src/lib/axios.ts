import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Single Axios instance shared by all API calls — baseURL comes from .env, never hardcoded
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — read the current token from Zustand and attach it to every request.
// useAuthStore.getState() works outside React components (Zustand's vanilla getter).
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — on 401, clear local auth state and send the user to login.
// Exception: skip the redirect for /auth/login itself — a 401 there just means wrong
// credentials, and the LoginPage's own catch block handles that error display.
// window.location.href is intentional: a full reload is fine for an expired session,
// and we cannot use React Router's navigate() outside of a component.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const url = error.config?.url ?? ''
      if (status === 401 && !url.includes('/auth/login')) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
