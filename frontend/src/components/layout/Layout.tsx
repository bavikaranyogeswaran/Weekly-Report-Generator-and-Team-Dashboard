import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

// Role badge colours — MANAGER gets indigo, MEMBER gets slate
const roleBadgeClass: Record<string, string> = {
  MANAGER: 'bg-indigo-100 text-indigo-700',
  MEMBER: 'bg-slate-100 text-slate-600',
}

export default function Layout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top navigation bar ─────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Brand + nav links */}
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold text-indigo-600 tracking-tight">
              WeeklyReports
            </span>

            {/* Navigation links — active link gets an underline */}
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
              {user?.role === 'MANAGER' && (
                <>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-indigo-600 border-b-2 border-indigo-600 pb-0.5'
                        : 'text-gray-500 hover:text-gray-800'
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/team-reports"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-indigo-600 border-b-2 border-indigo-600 pb-0.5'
                        : 'text-gray-500 hover:text-gray-800'
                    }
                  >
                    Team Reports
                  </NavLink>
                  <NavLink
                    to="/ai-chat"
                    className={({ isActive }) =>
                      isActive
                        ? 'text-indigo-600 border-b-2 border-indigo-600 pb-0.5'
                        : 'text-gray-500 hover:text-gray-800'
                    }
                  >
                    AI Chat
                  </NavLink>
                </>
              )}
              {user?.role === 'MEMBER' && (
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    isActive
                      ? 'text-indigo-600 border-b-2 border-indigo-600 pb-0.5'
                      : 'text-gray-500 hover:text-gray-800'
                  }
                >
                  My Reports
                </NavLink>
              )}
            </nav>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-gray-700 font-medium hidden sm:block">
                  {user.name}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadgeClass[user.role] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {user.role}
                </span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors ml-2"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

    </div>
  )
}
