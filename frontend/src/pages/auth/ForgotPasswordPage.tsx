import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import { forgotPassword } from '@/api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [emailError, setEmailError] = useState<string | undefined>(undefined)
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
    if (emailError) setEmailError(undefined)
    if (serverError) setServerError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setEmailError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await forgotPassword({ email })
      setSubmitted(true)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        setServerError('Unable to reach the server. Check your connection.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Success state — show a generic confirmation so we don't leak whether the email exists
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          {/* Check-mark icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Check your email</h2>
          <p className="mt-2 text-sm text-gray-500">
            If <strong>{email}</strong> is registered, you will receive a reset link shortly.
            Check your spam folder if it doesn't arrive within a few minutes.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to sign in
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
          <p className="mt-1 text-sm font-medium text-gray-700">Forgot your password?</p>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <InputField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={handleChange}
            error={emailError}
          />

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Send reset link
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
