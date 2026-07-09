import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, patchUserRole } from '@/api/admin'
import type { AuthUser, Role } from '@/lib/types'

// Role badge colour map
const ROLE_BADGE: Record<Role, string> = {
  MEMBER:  'bg-gray-100 text-gray-600',
  MANAGER: 'bg-blue-100 text-blue-700',
  ADMIN:   'bg-purple-100 text-purple-700',
}

// Stable avatar colour derived from the user's name
const AVATAR_COLOURS = [
  'bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-teal-500', 'bg-violet-500',
]

function avatarColour(name: string): string {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length]
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// Format ISO date without UTC shift
function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {['User', 'Role', 'Joined', 'Change role'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-32 rounded bg-gray-200" />
                    <div className="h-2.5 w-24 rounded bg-gray-100" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><div className="h-5 w-16 rounded-full bg-gray-200" /></td>
              <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-gray-100" /></td>
              <td className="px-4 py-3"><div className="h-7 w-28 rounded-lg bg-gray-200" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Single user row ───────────────────────────────────────────────────────────

function UserRow({
  user,
  onRoleChange,
  isUpdating,
}: {
  user: AuthUser
  onRoleChange: (userId: string, role: 'MEMBER' | 'MANAGER') => void
  isUpdating: boolean
}) {
  const isAdmin = user.role === 'ADMIN'

  return (
    <tr className="transition hover:bg-gray-50/60">

      {/* Avatar + name + email */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColour(user.name)}`}
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-800">{user.name}</p>
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role badge */}
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[user.role]}`}>
          {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
        </span>
      </td>

      {/* Joined date */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(user.createdAt)}
      </td>

      {/* Role select — ADMIN rows are read-only */}
      <td className="px-4 py-3">
        {isAdmin ? (
          <span className="text-xs text-gray-300">—</span>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={user.role}
              onChange={(e) =>
                onRoleChange(user.id, e.target.value as 'MEMBER' | 'MANAGER')
              }
              disabled={isUpdating}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
            </select>
            {/* Spinner while this row's mutation is in flight */}
            {isUpdating && (
              <svg className="h-4 w-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </div>
        )}
      </td>

    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const queryClient = useQueryClient()

  // Track which row is mid-mutation so only that row shows a spinner
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg]   = useState<string | null>(null)

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAdminUsers().then((r) => r.data),
  })

  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'MEMBER' | 'MANAGER' }) =>
      patchUserRole(userId, role).then((r) => r.data),
    onMutate: ({ userId }) => {
      setPendingId(userId)
      setErrorMsg(null)
    },
    onSuccess: () => {
      // Refetch so the badge and select both reflect the new role
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      setErrorMsg('Failed to update role. Please try again.')
    },
    onSettled: () => {
      setPendingId(null)
    },
  })

  return (
    <div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Assign roles to team members. The admin account cannot be modified.
          </p>
        </div>
        {/* Live count badge */}
        {!isLoading && users && (
          <span className="mt-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
            {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error banner for mutation failures */}
      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && <TableSkeleton />}

      {/* Fetch error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load users. Please refresh the page.
        </div>
      )}

      {/* User table */}
      {users && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['User', 'Role', 'Joined', 'Change role'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onRoleChange={(userId, role) => mutation.mutate({ userId, role })}
                  isUpdating={pendingId === user.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
