import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

// Wraps routes that are only accessible to the ADMIN.
// Must be nested inside ProtectedRoute so a token is guaranteed to exist.
// Any non-admin user is redirected to their own reports page.
export default function AdminRoute() {
  const user = useAuthStore((state) => state.user)

  // Fallback: if user is somehow null inside a protected tree, send to login
  if (!user) return <Navigate to="/login" replace />

  if (user.role !== 'ADMIN') return <Navigate to="/reports" replace />

  return <Outlet />
}
