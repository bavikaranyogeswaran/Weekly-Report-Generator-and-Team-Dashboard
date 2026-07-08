import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

// Wraps routes that are only accessible to MANAGERs.
// Must be nested inside ProtectedRoute so a token is guaranteed to exist.
// A MEMBER who lands on a manager URL is redirected to their own reports page.
export default function ManagerRoute() {
  const user = useAuthStore((state) => state.user)

  // Fallback: if user is somehow null inside a protected tree, send to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'MANAGER') {
    return <Navigate to="/reports" replace />
  }

  return <Outlet />
}
