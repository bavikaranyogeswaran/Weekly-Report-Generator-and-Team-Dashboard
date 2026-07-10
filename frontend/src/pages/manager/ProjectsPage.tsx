import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjects, createProject, updateProject, deleteProject,
  getProject, addProjectMember, removeProjectMember,
} from '@/api/projects'
import { getUsers } from '@/api/users'
import type { Project, AuthUser, Role } from '@/lib/types'

// Role badge colours — mirrors the map used on the admin User management page
const ROLE_BADGE: Record<Role, string> = {
  MEMBER:  'bg-gray-100 text-gray-600',
  MANAGER: 'bg-blue-100 text-blue-700',
  ADMIN:   'bg-purple-100 text-purple-700',
}

// Preset palette — managers pick one instead of typing raw hex
const COLOUR_PRESETS = [
  '#6366f1', // indigo (default)
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#22c55e', // green
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#a855f7', // purple
  '#64748b', // slate
]

// ── Colour swatch picker ──────────────────────────────────────────────────────

function ColourPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOUR_PRESETS.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => onChange(hex)}
          title={hex}
          className={`h-6 w-6 rounded-full border-2 transition ${
            value === hex ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  )
}

// ── Add-project form (shown above the list) ───────────────────────────────────

function AddProjectForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [colour, setColour]     = useState(COLOUR_PRESETS[0])
  const [error, setError]       = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createProject({ name: name.trim(), description: desc.trim() || undefined, color: colour })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      onDone()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Failed to create project.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Project name is required.'); return }
    setError(null)
    mutation.mutate()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4"
    >
      <p className="mb-3 text-sm font-semibold text-gray-700">New project</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* Name */}
        <div className="flex-1">
          <input
            autoFocus
            placeholder="Project name *"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Description */}
        <div className="flex-1">
          <input
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Colour picker */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs text-gray-400">Colour</p>
        <ColourPicker value={colour} onChange={setColour} />
      </div>

      {/* Error */}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {mutation.isPending ? 'Adding…' : 'Add project'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Members panel (shown when a row is expanded) ───────────────────────────────

function ProjectMembers({ projectId, allUsers }: { projectId: string; allUsers: AuthUser[] }) {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId).then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', projectId] })

  const addMutation = useMutation({
    mutationFn: (userId: string) => addProjectMember(projectId, userId).then((r) => r.data),
    onSuccess: () => { invalidate(); setSelectedUserId('') },
    onError: () => setError('Failed to add member.'),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeProjectMember(projectId, userId).then((r) => r.data),
    onSuccess: invalidate,
    onError: () => setError('Failed to remove member.'),
  })

  if (isLoading) {
    return <p className="px-4 py-3 text-xs text-gray-400">Loading members…</p>
  }

  const members = project?.members ?? []
  const memberIds = new Set(members.map((m) => m.id))
  const available = allUsers.filter((u) => !memberIds.has(u.id))

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      {/* Current members */}
      {members.length === 0 ? (
        <p className="text-xs text-gray-400">No members assigned yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <span
              key={m.id}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-2.5 pr-1.5 text-xs"
            >
              <span className="text-gray-700">{m.name}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[m.role]}`}>
                {m.role.charAt(0) + m.role.slice(1).toLowerCase()}
              </span>
              <button
                onClick={() => { setError(null); removeMutation.mutate(m.id) }}
                disabled={removeMutation.isPending}
                title={`Remove ${m.name}`}
                className="ml-0.5 text-gray-400 transition hover:text-red-600 disabled:opacity-50"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add member */}
      <div className="mt-3 flex items-center gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">
            {available.length === 0 ? 'Everyone is already assigned' : 'Select a user…'}
          </option>
          {available.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>
        <button
          onClick={() => { setError(null); addMutation.mutate(selectedUserId) }}
          disabled={!selectedUserId || addMutation.isPending}
          className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {addMutation.isPending ? 'Adding…' : 'Add'}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── Project row (view / edit / delete-confirm modes) ──────────────────────────

type RowMode = 'view' | 'edit' | 'confirm-delete'

function ProjectRow({ project, allUsers }: { project: Project; allUsers: AuthUser[] }) {
  const queryClient = useQueryClient()
  const [mode, setMode]         = useState<RowMode>('view')
  const [name, setName]         = useState(project.name)
  const [desc, setDesc]         = useState(project.description ?? '')
  const [colour, setColour]     = useState(project.color)
  const [error, setError]       = useState<string | null>(null)
  const [showMembers, setShowMembers] = useState(false)

  // Reset edit fields if the project data changes (e.g. after save)
  function startEdit() {
    setName(project.name)
    setDesc(project.description ?? '')
    setColour(project.color)
    setError(null)
    setMode('edit')
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProject(project.id, {
        name: name.trim(),
        description: desc.trim() || undefined,
        color: colour,
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setMode('view')
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Failed to save changes.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project.id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => {
      setMode('view')
      setError('Failed to delete project.')
    },
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Project name is required.'); return }
    setError(null)
    saveMutation.mutate()
  }

  // ── View mode ──────────────────────────────────────────────────────────────
  if (mode === 'view') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Colour dot */}
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
          />

          {/* Name + description */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-800">{project.name}</p>
            {project.description && (
              <p className="truncate text-xs text-gray-400">{project.description}</p>
            )}
          </div>

          {/* Error from a failed delete */}
          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setShowMembers((v) => !v)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                showMembers
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              Members
            </button>
            <button
              onClick={startEdit}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              Edit
            </button>
            <button
              onClick={() => setMode('confirm-delete')}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-red-300 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        </div>

        {showMembers && <ProjectMembers projectId={project.id} allUsers={allUsers} />}
      </div>
    )
  }

  // ── Delete-confirm mode ────────────────────────────────────────────────────
  if (mode === 'confirm-delete') {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <p className="min-w-0 flex-1 text-sm text-red-700">
          Delete <span className="font-semibold">{project.name}</span>? This cannot be undone.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button
            onClick={() => setMode('view')}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSave}
      className="rounded-xl border border-indigo-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* Colour dot (preview of selected colour) */}
        <span
          className="mt-2 hidden h-3 w-3 shrink-0 rounded-full sm:block"
          style={{ backgroundColor: colour }}
        />

        {/* Name */}
        <div className="flex-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Description */}
        <div className="flex-1">
          <input
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Colour picker */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs text-gray-400">Colour</p>
        <ColourPicker value={colour} onChange={setColour} />
      </div>

      {/* Error */}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setMode('view')}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <div className="h-3 w-3 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded bg-gray-200" />
            <div className="h-2.5 w-48 rounded bg-gray-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-10 rounded-lg bg-gray-200" />
            <div className="h-6 w-14 rounded-lg bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [showAdd, setShowAdd] = useState(false)

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects().then((r) => r.data),
  })

  // Fetched once here (not per-row) to power each row's "add member" picker
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then((r) => r.data),
  })

  return (
    <div>

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the projects that team members tag in their weekly reports.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          {!isLoading && projects && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          )}
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              + New project
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && <AddProjectForm onDone={() => setShowAdd(false)} />}

      {/* Loading */}
      {isLoading && <ListSkeleton />}

      {/* Fetch error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load projects. Please refresh the page.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && projects?.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No projects yet.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
          >
            Add your first project →
          </button>
        </div>
      )}

      {/* Project list */}
      {projects && projects.length > 0 && (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} allUsers={allUsers ?? []} />
          ))}
        </div>
      )}

    </div>
  )
}
