import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getReports } from '@/api/reports'
import type { Report } from '@/lib/types'

// Format "2026-07-06" → "06 Jul 2026" without UTC shift
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const statusBadgeClass: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-green-100 text-green-700',
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="mb-3 h-4 w-48 rounded bg-gray-200" />
          <div className="mb-2 h-3 w-28 rounded bg-gray-100" />
          <div className="h-3 w-20 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

// ── Single report card ────────────────────────────────────────────────────────
function ReportCard({ report }: { report: Report }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">

        {/* Left: week range, project, submitted timestamp */}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800">
            {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {report.project?.name ?? 'No project'}
          </p>
          {report.submittedAt && (
            <p className="mt-1 text-xs text-gray-400">
              Submitted{' '}
              {new Date(report.submittedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Right: status badge + edit link */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass[report.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {report.status}
          </span>

          {/* Submit / Delete actions added in 11.3 */}

          {report.status === 'DRAFT' && (
            <Link
              to={`/reports/${report.id}/edit`}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Edit
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyReportsPage() {
  const {
    data: reports,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['reports'],
    queryFn: () => getReports().then((r) => r.data),
  })

  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Track your weekly progress</p>
        </div>
        <Link
          to="/reports/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          + New Report
        </Link>
      </div>

      {/* Loading */}
      {isLoading && <ReportSkeleton />}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load reports. Please refresh the page.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && reports?.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No reports yet.</p>
          <Link
            to="/reports/new"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Create your first report →
          </Link>
        </div>
      )}

      {/* Report list */}
      {reports && reports.length > 0 && (
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
