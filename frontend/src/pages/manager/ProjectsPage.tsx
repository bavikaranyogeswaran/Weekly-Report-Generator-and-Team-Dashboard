import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, createProject, updateProject, deleteProject } from '@/api/projects'
import type { Project } from '@/lib/types'

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

// ── Project row (view / edit / delete-confirm modes) ──────────────────────────

type RowMode = 'view' | 'edit' | 'confirm-delete'

function ProjectRow({ project }: { project: Project }) {
  const queryClient = useQueryClient()
  const [mode, setMode]         = useState<RowMode>('view')
  const [name, setName]         = useState(project.name)
  const [desc, setDesc]         = useState(project.description ?? '')
  const [colour, setColour]     = useState(project.color)
  const [error, setError]       = useState<string | null>(null)

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
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
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
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}

    </div>
  )
}
