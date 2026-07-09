import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReport, updateReport, submitReport, deleteReport } from '@/api/reports'
import ReportForm, { type ReportFormValues } from '@/components/ReportForm'
import Button from '@/components/ui/Button'

export default function EditReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  // Fetch the existing report
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['reports', id],
    queryFn: () => getReport(id!).then((r) => r.data),
    enabled: !!id,
  })

  const saveMutation = useMutation({
    mutationFn: (values: ReportFormValues) =>
      updateReport(id!, {
        weekStart: values.weekStart,
        weekEnd: values.weekEnd,
        tasksCompleted: values.tasksCompleted,
        tasksPlanned: values.tasksPlanned,
        blockers: values.blockers,
        hoursWorked: values.hoursWorked !== '' ? Number(values.hoursWorked) : undefined,
        notes: values.notes || undefined,
        projectId: values.projectId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      navigate('/reports')
    },
    onError: () => setServerError('Failed to save report. Please try again.'),
  })

  const submitMutation = useMutation({
    mutationFn: () => submitReport(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      navigate('/reports')
    },
    onError: () => setServerError('Failed to submit report. Please try again.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteReport(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      navigate('/reports')
    },
    onError: () => setServerError('Failed to delete report. Please try again.'),
  })

  // ── Loading / error states ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 h-6 w-40 rounded bg-gray-200" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-100" />
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

  // Guard: SUBMITTED reports cannot be edited
  if (report.status !== 'DRAFT') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="font-semibold text-gray-700">This report has been submitted</p>
          <p className="mt-1 text-sm text-gray-400">Submitted reports cannot be edited.</p>
          <Link
            to="/reports"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to reports
          </Link>
        </div>
      </div>
    )
  }

  // Pre-populate form with existing values
  const initialValues: Partial<ReportFormValues> = {
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    tasksCompleted: report.tasksCompleted,
    tasksPlanned: report.tasksPlanned,
    blockers: report.blockers,
    hoursWorked: report.hoursWorked != null ? String(report.hoursWorked) : '',
    notes: report.notes ?? '',
    projectId: report.projectId ?? '',
  }

  const isBusy = saveMutation.isPending || submitMutation.isPending || deleteMutation.isPending

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Report</h1>
          <p className="mt-1 text-sm text-gray-500">Update your weekly progress</p>
        </div>
        <Link to="/reports" className="text-sm text-gray-400 hover:text-gray-600 hover:underline">
          ← Cancel
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ReportForm
          initialValues={initialValues}
          onSubmit={(values) => {
            setServerError(null)
            saveMutation.mutate(values)
          }}
          loading={saveMutation.isPending}
          submitLabel="Save changes"
          serverError={serverError}
        />

        {/* Danger zone: Submit + Delete — below the save form */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            Other actions
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              loading={submitMutation.isPending}
              disabled={isBusy}
              onClick={() => {
                if (window.confirm('Submit this report? You will no longer be able to edit it.')) {
                  setServerError(null)
                  submitMutation.mutate()
                }
              }}
            >
              Submit report
            </Button>
            <Button
              variant="secondary"
              loading={deleteMutation.isPending}
              disabled={isBusy}
              onClick={() => {
                if (window.confirm('Delete this report? This cannot be undone.')) {
                  setServerError(null)
                  deleteMutation.mutate()
                }
              }}
              className="!text-red-500 hover:!border-red-300"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
