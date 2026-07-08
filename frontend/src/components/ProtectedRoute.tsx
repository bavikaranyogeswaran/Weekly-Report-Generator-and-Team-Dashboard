import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

// Wraps any route that requires authentication.
// Place this as the parent element in the router — unauthenticated users are
// redirected to /login. The `replace` flag prevents the protected URL from
// being added to the browser history (so the back button doesn't loop back).
export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Render the matched child route
  return <Outlet />
}
