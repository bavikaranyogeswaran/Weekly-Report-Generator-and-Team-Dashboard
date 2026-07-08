import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { verifyEmail } from '@/api/auth'

type Status = 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('verifying')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    // If the URL has no token param the link is malformed — show error immediately
    if (!token) {
      setErrorMessage('Invalid verification link. Please request a new one.')
      setStatus('error')
      return
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.status === 400) {
          setErrorMessage('This link has expired or has already been used.')
        } else if (axios.isAxiosError(err) && !err.response) {
          setErrorMessage('Unable to reach the server. Check your connection.')
        } else {
          setErrorMessage('Verification failed. Please try again.')
        }
        setStatus('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount — token is read from the URL at that point

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">

        {/* ── Verifying ── */}
        {status === 'verifying' && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-700">Verifying your email…</h2>
            <p className="mt-1 text-sm text-gray-400">This only takes a moment.</p>
          </>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Email verified!</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your account is now active. You can sign in.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              Go to sign in
            </Link>
          </>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Verification failed</h2>
            <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
            <Link
              to="/register"
              className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Back to register
            </Link>
          </>
        )}

      </div>
    </div>
  )
}
