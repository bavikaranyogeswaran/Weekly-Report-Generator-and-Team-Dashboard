import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import { login, getMe } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

type FormData = { email: string; password: string }
type FormErrors = Partial<Record<keyof FormData, string>>

// Simple email format check — good enough for client-side UX feedback
function validate(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address'
  }
  if (!data.password) errors.password = 'Password is required'
  return errors
}

export default function LoginPage() {
  const [form, setForm] = useState<FormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  // Clear field-level and server-level errors as the user types
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    if (serverError) setServerError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      // Step 1: exchange credentials for a JWT
      const { data: loginData } = await login({ email: form.email, password: form.password })

      // Step 2: fetch the user profile using the new token directly in the header.
      // The Zustand store is still empty at this point so the interceptor can't attach it.
      const { data: user } = await getMe(loginData.access_token)

      // Step 3: persist token + user to Zustand (and localStorage via persist middleware)
      setAuth(loginData.access_token, user)

      // Step 4: redirect to the correct landing page based on role
      const destination =
        user.role === 'ADMIN'   ? '/admin/users' :
        user.role === 'MANAGER' ? '/dashboard'   : '/reports'
      navigate(destination, { replace: true })
    } catch (err: unknown) {
      // 401 = wrong credentials — use the same message for both wrong email and wrong password
      // to prevent user enumeration (matches the backend's intentional behaviour)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setServerError('Invalid email or password.')
      } else if (axios.isAxiosError(err) && !err.response) {
        setServerError('Unable to reach the server. Check your connection.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

        {/* Brand header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">WeeklyReports</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <InputField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          {/* Server-side error banner — shown after a failed login attempt */}
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Forgot your password?
          </Link>
        </p>

      </div>
    </div>
  )
}
