import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyProjects } from '@/api/projects'
import InputField from '@/components/ui/InputField'
import TextareaField from '@/components/ui/TextareaField'
import Button from '@/components/ui/Button'

// All values are strings because HTML inputs always return strings.
// The parent page converts hoursWorked to a number before calling the API.
export type ReportFormValues = {
  weekStart: string    // YYYY-MM-DD
  weekEnd: string      // YYYY-MM-DD
  tasksCompleted: string
  tasksPlanned: string
  blockers: string
  hoursWorked: string  // '' | numeric string
  notes: string
  projectId: string    // '' means no project
}

type FormErrors = Partial<Record<keyof ReportFormValues, string>>

function validate(v: ReportFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!v.weekStart) errors.weekStart = 'Week start is required'
  if (!v.weekEnd) {
    errors.weekEnd = 'Week end is required'
  } else if (v.weekStart && v.weekEnd < v.weekStart) {
    errors.weekEnd = 'Week end must be on or after week start'
  }
  if (!v.tasksCompleted.trim()) errors.tasksCompleted = 'Tasks completed is required'
  if (!v.tasksPlanned.trim()) errors.tasksPlanned = 'Tasks planned is required'
  if (!v.blockers.trim()) errors.blockers = 'Blockers is required — write "None" if there are none'
  if (v.hoursWorked !== '') {
    const h = Number(v.hoursWorked)
    if (isNaN(h) || h < 0 || h > 168) {
      errors.hoursWorked = 'Hours must be between 0 and 168'
    }
  }
  return errors
}

const EMPTY: ReportFormValues = {
  weekStart: '',
  weekEnd: '',
  tasksCompleted: '',
  tasksPlanned: '',
  blockers: '',
  hoursWorked: '',
  notes: '',
  projectId: '',
}

export interface ReportFormProps {
  initialValues?: Partial<ReportFormValues>
  onSubmit: (values: ReportFormValues) => void
  loading?: boolean
  submitLabel?: string
  serverError?: string | null
}

export default function ReportForm({
  initialValues,
  onSubmit,
  loading = false,
  submitLabel = 'Save',
  serverError,
}: ReportFormProps) {
  const [values, setValues] = useState<ReportFormValues>({
    ...EMPTY,
    ...initialValues,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Fetch only the projects this user is assigned to — a distinct cache key from
  // the manager's full project list (['projects']) since the two are different scopes
  const { data: projects } = useQuery({
    queryKey: ['projects', 'mine'],
    queryFn: () => getMyProjects().then((r) => r.data),
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear the field error as the user edits
    if (errors[name as keyof ReportFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      {/* Week range — side by side on wider screens */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="Week start"
          name="weekStart"
          type="date"
          value={values.weekStart}
          onChange={handleChange}
          error={errors.weekStart}
        />
        <InputField
          label="Week end"
          name="weekEnd"
          type="date"
          value={values.weekEnd}
          onChange={handleChange}
          error={errors.weekEnd}
        />
      </div>

      {/* Project select */}
      <div className="flex flex-col gap-1">
        <label htmlFor="projectId" className="text-sm font-medium text-gray-700">
          Project <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <select
          id="projectId"
          name="projectId"
          value={values.projectId}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">No project</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {/* Only shown once the fetch has resolved and come back empty — avoids a flash during loading */}
        {projects?.length === 0 && (
          <p className="text-xs text-gray-400">
            You're not assigned to any projects yet. Ask your manager to add you to one.
          </p>
        )}
      </div>

      <TextareaField
        label="Tasks completed"
        name="tasksCompleted"
        placeholder="What did you finish this week?"
        value={values.tasksCompleted}
        onChange={handleChange}
        error={errors.tasksCompleted}
      />

      <TextareaField
        label="Tasks planned"
        name="tasksPlanned"
        placeholder="What will you work on next week?"
        value={values.tasksPlanned}
        onChange={handleChange}
        error={errors.tasksPlanned}
      />

      <TextareaField
        label="Blockers"
        name="blockers"
        placeholder='Any blockers? Write "None" if there are none.'
        value={values.blockers}
        onChange={handleChange}
        error={errors.blockers}
      />

      {/* Optional fields — side by side */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="Hours worked"
          name="hoursWorked"
          type="number"
          min={0}
          max={168}
          hint="optional"
          placeholder="e.g. 40"
          value={values.hoursWorked}
          onChange={handleChange}
          error={errors.hoursWorked}
        />
        <div /> {/* spacer to keep the grid balanced */}
      </div>

      <TextareaField
        label="Notes"
        name="notes"
        hint="optional"
        placeholder="Anything else to share with your manager?"
        value={values.notes}
        onChange={handleChange}
        error={errors.notes}
      />

      {/* Server-side error */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <Button type="submit" fullWidth loading={loading}>
        {submitLabel}
      </Button>

    </form>
  )
}
