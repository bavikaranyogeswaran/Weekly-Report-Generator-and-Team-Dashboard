import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createReport } from '@/api/reports'
import ReportForm, { type ReportFormValues } from '@/components/ReportForm'

export default function CreateReportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: ReportFormValues) =>
      createReport({
        weekStart: values.weekStart,
        weekEnd: values.weekEnd,
        tasksCompleted: values.tasksCompleted,
        tasksPlanned: values.tasksPlanned,
        blockers: values.blockers,
        // Convert empty string to undefined so the API omits the field
        hoursWorked: values.hoursWorked !== '' ? Number(values.hoursWorked) : undefined,
        notes: values.notes || undefined,
        projectId: values.projectId || undefined,
      }),
    onSuccess: () => {
      // Refresh the reports list so the new card appears immediately
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      navigate('/reports')
    },
    onError: (err: any) => {
      setServerError(err?.response?.data?.message ?? 'Failed to create report. Please try again.')
    },
  })

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">New Report</h1>
        <p className="mt-1 text-sm text-gray-500">Fill in your weekly progress below</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ReportForm
          onSubmit={(values) => {
            setServerError(null)
            mutation.mutate(values)
          }}
          loading={mutation.isPending}
          submitLabel="Create report"
          serverError={serverError}
        />
      </div>
    </div>
  )
}
