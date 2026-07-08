import { useState } from 'react'
import { Link } from 'react-router-dom'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'

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

  // Clear a field's error as soon as the user starts correcting it
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    // API call wired in 10.3
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

          <Button type="submit" fullWidth className="mt-2">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Register
          </Link>
        </p>

      </div>
    </div>
  )
}
