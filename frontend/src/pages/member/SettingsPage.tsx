import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import { changePassword } from '@/api/auth'

type FormData = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

const EMPTY_FORM: FormData = { currentPassword: '', newPassword: '', confirmPassword: '' }

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.currentPassword) errors.currentPassword = 'Current password is required'
  if (!data.newPassword) {
    errors.newPassword = 'New password is required'
  } else if (data.newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters'
  }
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password'
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  return errors
}

export default function SettingsPage() {
  const [form, setForm]     = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg]   = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
        .then((r) => r.data),
    onSuccess: (data) => {
      setSuccessMsg(data.message)
      setForm(EMPTY_FORM)
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const msg: string = err.response.data?.message ?? 'Request failed.'
        // Surface field-level error for wrong current password
        if (msg.toLowerCase().includes('current password')) {
          setErrors((prev) => ({ ...prev, currentPassword: msg }))
        } else {
          setServerError(msg)
        }
      } else if (axios.isAxiosError(err) && !err.response) {
        setServerError('Unable to reach the server. Check your connection.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear errors as the user types
    if (errors[name as keyof FormData]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (serverError) setServerError(null)
    if (successMsg) setSuccessMsg(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setErrors({})
    setServerError(null)
    setSuccessMsg(null)
    mutation.mutate()
  }

  return (
    <div className="max-w-lg">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account preferences.</p>
      </div>

      {/* Change password card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-700">Change password</h2>
        <p className="mb-5 text-sm text-gray-400">
          Choose a strong password of at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <InputField
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Your current password"
            value={form.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
          />

          <InputField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
          />

          <InputField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          {/* Success banner */}
          {successMsg && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          {/* Server error banner */}
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="pt-1">
            <Button type="submit" loading={mutation.isPending}>
              Update password
            </Button>
          </div>
        </form>
      </div>

    </div>
  )
}
