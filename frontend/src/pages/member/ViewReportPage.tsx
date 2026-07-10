import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getReport } from '@/api/reports'
import ProjectBadge from '@/components/ProjectBadge'

// Format "2026-07-06" → "06 Jul 2026" without UTC shift
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Read-only field: splits multi-line text into a bullet list; shows "—" when empty
function Field({
  label,
  value,
  warn,
}: {
  label: string
  value: string | null | undefined
  warn?: boolean
}) {
  const lines = (value ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
  const textCls = warn ? 'text-rose-700' : 'text-gray-700'

  return (
    <div>
      <p
        className={`mb-1 text-xs font-medium uppercase tracking-wide ${
          warn ? 'text-rose-500' : 'text-gray-400'
        }`}
      >
        {label}
      </p>
      {lines.length === 0 ? (
        <p className="text-sm text-gray-300">—</p>
      ) : lines.length === 1 ? (
        <p className={`text-sm ${textCls}`}>{lines[0]}</p>
      ) : (
        <ul className="list-disc space-y-0.5 pl-4">
          {lines.map((l, i) => (
            <li key={i} className={`text-sm ${textCls}`}>
              {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ViewReportPage() {
  const { id } = useParams<{ id: string }>()

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['reports', id],
    queryFn: () => getReport(id!).then((r) => r.data),
    enabled: !!id,
  })

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 h-6 w-48 rounded bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-10 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !report) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Report not found or failed to load.{' '}
          <Link to="/reports" className="font-medium underline">
            Back to reports
          </Link>
        </div>
      </div>
    )
  }

  const hasBlockers = (report.blockers ?? '').trim().length > 0

  return (
    <div className="mx-auto max-w-2xl">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
          </h1>
          <div className="mt-1.5 flex items-center gap-3">
            {report.project ? (
              <ProjectBadge name={report.project.name} color={report.project.color} />
            ) : (
              <span className="text-sm text-gray-400">No project</span>
            )}
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              {report.status}
            </span>
          </div>
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
        <Link
          to="/reports"
          className="shrink-0 text-sm text-gray-400 hover:text-gray-600 hover:underline"
        >
          ← Back to reports
        </Link>
      </div>

      {/* Fields card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Tasks completed" value={report.tasksCompleted} />
          <Field label="Tasks planned" value={report.tasksPlanned} />
          <Field label="Blockers" value={report.blockers} warn={hasBlockers} />
          <Field label="Notes" value={report.notes} />
        </div>

        {report.hoursWorked != null && (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
              Hours worked
            </p>
            <p className="text-sm text-gray-700">{report.hoursWorked} h</p>
          </div>
        )}
      </div>

    </div>
  )
}
