import { useState } from 'react'
import { Link } from 'react-router-dom'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'

type FormData = { name: string; email: string; password: string }
type FormErrors = Partial<Record<keyof FormData, string>>

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {}
  if (!data.name.trim()) errors.name = 'Name is required'
  if (!data.email) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address'
  }
  if (!data.password) {
    errors.password = 'Password is required'
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }
  return errors
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  // Clear the field's error as the user types
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
    // API call + success/error handling wired in 10.6
    setLoading(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">

        {/* Brand header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">WeeklyReports</h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <InputField
            label="Full name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />

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
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
