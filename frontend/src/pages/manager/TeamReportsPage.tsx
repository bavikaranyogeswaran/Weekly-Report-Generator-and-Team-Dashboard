import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReports } from '@/api/reports'
import { getUsers } from '@/api/users'
import { getProjects } from '@/api/projects'
import ProjectBadge from '@/components/ProjectBadge'
import type { Report, ReportStatus } from '@/lib/types'

// Format "2026-07-07" → "07 Jul 2026" without UTC shift
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_BADGE: Record<ReportStatus, string> = {
  DRAFT:     'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-green-100 text-green-700',
}

// ── Filter state ──────────────────────────────────────────────────────────────
interface Filters {
  userId: string
  projectId: string
  status: ReportStatus | ''
  weekStartFrom: string   // inclusive lower bound (YYYY-MM-DD)
  weekStartTo: string     // inclusive upper bound (YYYY-MM-DD)
}

const EMPTY_FILTERS: Filters = { userId: '', projectId: '', status: '', weekStartFrom: '', weekStartTo: '' }

// ── Loading skeleton ──────────────────────────────────────────────────────────
function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
              <div className="h-3 w-32 rounded bg-gray-100" />
            </div>
            <div className="h-5 w-20 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Single report card (read-only — managers cannot edit members' reports) ────
function ReportCard({ report }: { report: Report }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0 flex-1">
          {/* Member name + email */}
          <p className="font-semibold text-gray-800">
            {report.user?.name ?? 'Unknown member'}
          </p>
          <p className="text-xs text-gray-400">{report.user?.email}</p>

          {/* Week range */}
          <p className="mt-1.5 text-sm text-gray-600">
            {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
          </p>

          {/* Project + hours */}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
            {report.project ? (
              <ProjectBadge name={report.project.name} color={report.project.color} />
            ) : (
              <span>No project</span>
            )}
            {report.hoursWorked != null && (
              <span>{report.hoursWorked} h logged</span>
            )}
          </div>

          {/* Submitted timestamp */}
          {report.submittedAt && (
            <p className="mt-1 text-xs text-gray-400">
              Submitted {formatDate(report.submittedAt.slice(0, 10))}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[report.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {report.status}
        </span>

      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TeamReportsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  // Populate member and project dropdowns — stale-time keeps them from refetching on every mount
  const { data: users }    = useQuery({ queryKey: ['users'],    queryFn: () => getUsers().then((r) => r.data),    staleTime: 60_000 })
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => getProjects().then((r) => r.data), staleTime: 60_000 })

  const { data: reports, isLoading, isError } = useQuery({
    // Key includes all filters so the query refetches whenever any filter changes
    queryKey: ['team-reports', filters],
    queryFn: () =>
      getReports({
        userId:        filters.userId        || undefined,
        projectId:     filters.projectId     || undefined,
        status:        filters.status        || undefined,
        weekStartFrom: filters.weekStartFrom || undefined,
        weekStartTo:   filters.weekStartTo   || undefined,
      }).then((r) => r.data),
  })

  const hasActiveFilters =
    filters.userId !== '' || filters.projectId !== '' ||
    filters.status !== '' || filters.weekStartFrom !== '' || filters.weekStartTo !== ''

  function handleClear() {
    setFilters(EMPTY_FILTERS)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            All reports submitted by your team
          </p>
        </div>
        {/* Live count badge */}
        {!isLoading && reports && (
          <span className="mt-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
            {reports.length} result{reports.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-end gap-3">

        {/* Member filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Member</label>
          <select
            value={filters.userId}
            onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All members</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Project filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Project</label>
          <select
            value={filters.projectId}
            onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All projects</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value as ReportStatus | '' }))
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
          </select>
        </div>

        {/* Date range — "Week from … to …" grouped under one label */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Week from</label>
          <input
            type="date"
            value={filters.weekStartFrom}
            max={filters.weekStartTo || undefined}
            onChange={(e) => setFilters((f) => ({ ...f, weekStartFrom: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Week to</label>
          <input
            type="date"
            value={filters.weekStartTo}
            min={filters.weekStartFrom || undefined}
            onChange={(e) => setFilters((f) => ({ ...f, weekStartTo: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Clear — only visible when any filter is active */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && <ReportsSkeleton />}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load reports. Please refresh the page.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && reports?.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            {hasActiveFilters
              ? 'No reports match your filters.'
              : 'No reports yet.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="mt-3 text-sm font-medium text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Report list */}
      {reports && reports.length > 0 && (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
