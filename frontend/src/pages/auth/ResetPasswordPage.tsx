import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import { resetPassword } from '@/api/auth'

type FormData = { newPassword: string; confirmPassword: string }
type FormErrors = Partial<Record<keyof FormData, string>>

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.newPassword) {
    errors.newPassword = 'New password is required'
  } else if (data.newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters'
  }
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password'
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  return errors
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [form, setForm]         = useState<FormData>({ newPassword: '', confirmPassword: '' })
  const [errors, setErrors]     = useState<FormErrors>({})
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  // True when the error is a bad/expired token — shows "Request a new link" prompt
  const [isTokenError, setIsTokenError] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (serverError) { setServerError(null); setIsTokenError(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }

    setLoading(true)
    try {
      await resetPassword({ token, newPassword: form.newPassword })
      setSuccess(true)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        // NestJS can return message as string[] for validation errors — normalise to string
        const raw = err.response.data?.message
        const msg = Array.isArray(raw) ? raw[0] : raw
        setServerError(msg ?? 'Reset link is invalid or has expired.')
        // Any 400 from this endpoint means the token is unusable — offer a new link
        setIsTokenError(true)
      } else if (axios.isAxiosError(err) && !err.response) {
        setServerError('Unable to reach the server. Check your connection.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // No token in the URL — the user probably navigated here directly
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Invalid reset link</h2>
          <p className="mt-2 text-sm text-gray-500">
            This reset link is missing or malformed. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Password reset!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">WeeklyReports</h1>
          <p className="mt-1 text-sm font-medium text-gray-700">Set a new password</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}{' '}
              {isTokenError && (
                <Link to="/forgot-password" className="underline font-medium">
                  Request a new link
                </Link>
              )}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Reset password
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Back to sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
