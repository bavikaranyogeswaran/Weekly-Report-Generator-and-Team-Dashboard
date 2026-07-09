import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import ProtectedRoute from '@/components/ProtectedRoute'
import ManagerRoute from '@/components/ManagerRoute'
import AdminRoute from '@/components/AdminRoute'
import Layout from '@/components/layout/Layout'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// Member pages
import MyReportsPage from '@/pages/member/MyReportsPage'
import CreateReportPage from '@/pages/member/CreateReportPage'
import EditReportPage from '@/pages/member/EditReportPage'

// Manager pages
import DashboardPage from '@/pages/manager/DashboardPage'
import TeamReportsPage from '@/pages/manager/TeamReportsPage'
import AiChatPage from '@/pages/manager/AiChatPage'
import ProjectsPage from '@/pages/manager/ProjectsPage'

// Admin pages
import UserManagementPage from '@/pages/admin/UserManagementPage'

// Settings (all logged-in users)
import SettingsPage from '@/pages/member/SettingsPage'

// Redirects the root path to the correct landing page based on role
function RootRedirect() {
  const user = useAuthStore((state) => state.user)
  if (user?.role === 'ADMIN')   return <Navigate to="/admin/users" replace />
  if (user?.role === 'MANAGER') return <Navigate to="/dashboard" replace />
  return <Navigate to="/reports" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes ─────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ── Protected routes (token required) ─────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* Root: redirect to role-appropriate landing page */}
            <Route path="/" element={<RootRedirect />} />

            {/* Member routes — accessible to all logged-in roles */}
            <Route path="/reports" element={<MyReportsPage />} />
            <Route path="/reports/new" element={<CreateReportPage />} />
            <Route path="/reports/:id/edit" element={<EditReportPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Manager-only routes (ADMIN also passes ManagerRoute) */}
            <Route element={<ManagerRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/team-reports" element={<TeamReportsPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/ai-chat" element={<AiChatPage />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<UserManagementPage />} />
            </Route>

          </Route>
        </Route>

        {/* ── Catch-all: redirect unknown paths to root ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
