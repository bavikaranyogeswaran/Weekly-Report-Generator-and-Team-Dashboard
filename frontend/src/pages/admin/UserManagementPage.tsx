import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, patchUserRole, createAdminUser } from '@/api/admin'
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

// ── Create user form ──────────────────────────────────────────────────────────

type CreateForm = { name: string; email: string; password: string; role: 'MEMBER' | 'MANAGER' }
const EMPTY_CREATE: CreateForm = { name: '', email: '', password: '', role: 'MEMBER' }

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm]   = useState<CreateForm>(EMPTY_CREATE)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createAdminUser(form).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onDone()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Failed to create user.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim())  { setError('Name is required.');              return }
    if (!form.email.trim()) { setError('Email is required.');             return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null)
    mutation.mutate()
  }

  function field(key: keyof CreateForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200'

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4"
    >
      <p className="mb-3 text-sm font-semibold text-gray-700">New user</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Full name</label>
          <input
            autoFocus
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => field('name', e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Email</label>
          <input
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => field('email', e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Initial password</label>
          <input
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => field('password', e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Role</label>
          <select
            value={form.role}
            onChange={(e) => field('role', e.target.value)}
            className={inputCls}
          >
            <option value="MEMBER">Member</option>
            <option value="MANAGER">Manager</option>
          </select>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {mutation.isPending ? 'Creating…' : 'Create user'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {/* Note that credentials will be emailed */}
      <p className="mt-2 text-xs text-gray-400">
        Login credentials will be sent to the user's email address.
      </p>
    </form>
  )
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
            {/* Spinner shown only while this row's mutation is in flight */}
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

  const [showCreate, setShowCreate] = useState(false)
  const [pendingId, setPendingId]   = useState<string | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAdminUsers().then((r) => r.data),
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'MEMBER' | 'MANAGER' }) =>
      patchUserRole(userId, role).then((r) => r.data),
    onMutate: ({ userId }) => {
      setPendingId(userId)
      setErrorMsg(null)
    },
    onSuccess: () => {
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
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create accounts and assign roles. The admin account cannot be modified.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          {!isLoading && users && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
              {users.length} user{users.length !== 1 ? 's' : ''}
            </span>
          )}
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              + Create user
            </button>
          )}
        </div>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <CreateUserForm onDone={() => setShowCreate(false)} />
      )}

      {/* Error banner for role-change failures */}
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
                  onRoleChange={(userId, role) => roleMutation.mutate({ userId, role })}
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
